const ABSOLUTE_URL_PATTERN = /^(https?:|mailto:|tel:|ftp:)/i;
const DOMAIN_LIKE_URL_PATTERN = /^[a-z0-9][-a-z0-9.+]*\.[a-z]{2,}/i;

/**
 * Resolves email/calendar links without prepending the frontend origin.
 * Meeting links often omit the protocol (e.g. teams.microsoft.com/...).
 */
export function resolveExternalLinkUrl(rawHref: string | null | undefined): string | null {
  if (!rawHref) return null;

  const href = rawHref.trim();
  if (!href || href === '#') return null;

  if (ABSOLUTE_URL_PATTERN.test(href)) {
    return href;
  }

  if (href.startsWith('//')) {
    return `https:${href}`;
  }

  if (!href.startsWith('/') && DOMAIN_LIKE_URL_PATTERN.test(href)) {
    return `https://${href}`;
  }

  return href;
}

function mergeInlineStyles(existing: string, additions: string): string {
  const normalized = existing.trim().replace(/;\s*$/, '');
  return normalized ? `${normalized}; ${additions}` : additions;
}

function hasAutoHorizontalMargin(style: string): boolean {
  if (/margin-left\s*:\s*auto/i.test(style) && /margin-right\s*:\s*auto/i.test(style)) {
    return true;
  }
  // margin: 0 auto | auto | 10px auto 10px, etc.
  return /margin\s*:\s*(?:[^;]*\s)?auto(?:\s|;|$)/i.test(style);
}

function stripUselessFloatNone(style: string): string {
  return style
    .replace(/(?:^|;)\s*float\s*:\s*none\s*;?/gi, ';')
    .replace(/;{2,}/g, ';')
    .replace(/^;\s*|;$/g, '')
    .trim();
}

function parseCssPx(value: string | null): number | null {
  if (!value) return null;
  const match = /^(\d+(?:\.\d+)?)px$/i.exec(value.trim());
  return match ? Number(match[1]) : null;
}

/** True if the element has an explicit, non-percentage width (attribute or style). */
function hasFixedWidth(el: Element): boolean {
  const widthAttr = el.getAttribute('width');
  if (widthAttr && /^\d+$/.test(widthAttr.trim())) return true;

  const style = el.getAttribute('style') || '';
  const styleWidthMatch = /(?:^|;)\s*width\s*:\s*([^;]+)/i.exec(style);
  if (styleWidthMatch && parseCssPx(styleWidthMatch[1]) != null) return true;

  return false;
}

function hasMaxWidth(el: Element): boolean {
  const style = el.getAttribute('style') || '';
  return /(?:^|;)\s*max-width\s*:\s*[^;]+/i.test(style);
}

/**
 * Fixes a specific malformed-CSS pattern seen in some email templates:
 * a percentage value with a stray trailing "px" (e.g. "width:100%px").
 */
function fixMalformedPercentWidths(doc: Document): void {
  doc.querySelectorAll<HTMLElement>('[style]').forEach((el) => {
    const style = el.getAttribute('style');
    if (!style || !/%px/i.test(style)) return;

    el.setAttribute('style', style.replace(/(\d+(?:\.\d+)?%)px\b/gi, '$1'));
  });
}

/**
 * CKEditor rewrites td[align=center] → style="text-align:center".
 * Outlook/Gmail need the legacy align attribute to center nested layout tables.
 */
function restoreEmailCellAlign(doc: Document): void {
  doc.querySelectorAll('td, th').forEach((cell) => {
    const align = (cell.getAttribute('align') || '').toLowerCase();
    if (align === 'center') return;

    const style = cell.getAttribute('style') || '';
    const hasTextAlignCenter = /(?:^|;)\s*text-align\s*:\s*center\s*(;|$)/i.test(style);

    if (hasTextAlignCenter) {
      cell.setAttribute('align', 'center');
      return;
    }

    // Full-width single-cell rows are the classic email centering wrapper.
    // Do not touch multi-column rows (e.g. image | text cards).
    const row = cell.parentElement;
    if (!row || row.tagName !== 'TR') return;
    const cells = Array.from(row.children).filter(
      (el) => el.tagName === 'TD' || el.tagName === 'TH',
    );
    if (cells.length !== 1) return;
    if (!cell.querySelector('table')) return;

    cell.setAttribute('align', 'center');
    cell.setAttribute('style', mergeInlineStyles(style, 'text-align: center'));
  });
}

/**
 * Re-centers fixed-width layout tables. CKEditor often turns
 * align=center / margin:auto into float:none, which email clients ignore.
 */
function centerStandaloneTables(doc: Document): void {
  doc.querySelectorAll('table').forEach((table) => {
    if (!hasFixedWidth(table) && !hasMaxWidth(table)) return;

    let style = stripUselessFloatNone(table.getAttribute('style') || '');
    const hasAlignCenter = (table.getAttribute('align') || '').toLowerCase() === 'center';
    const hasAuto = hasAutoHorizontalMargin(style);

    if (hasAlignCenter && hasAuto) {
      if (style !== (table.getAttribute('style') || '')) {
        table.setAttribute('style', style);
      }
      return;
    }

    const parent = table.parentElement;
    if (!parent) return;

    // Allow empty <p>/<br> siblings CKEditor inserts around tables.
    const meaningful = Array.from(parent.children).filter((el) => {
      if (el === table) return true;
      if (el.tagName === 'BR') return false;
      if (
        el.tagName === 'P' &&
        !el.textContent?.trim() &&
        !el.querySelector('img,table')
      ) {
        return false;
      }
      return true;
    });
    if (meaningful.length !== 1 || meaningful[0] !== table) {
      // Still restore align/margin when parent is a centering cell.
      const parentAlign = (parent.getAttribute('align') || '').toLowerCase();
      const parentStyle = parent.getAttribute('style') || '';
      const parentCenters =
        parentAlign === 'center' ||
        /(?:^|;)\s*text-align\s*:\s*center\s*(;|$)/i.test(parentStyle);
      if (!parentCenters) return;
    }

    if (!hasAlignCenter) table.setAttribute('align', 'center');
    if (!hasAuto) {
      style = mergeInlineStyles(style, 'margin-left: auto; margin-right: auto');
    }
    table.setAttribute('style', style);
  });
}

/** Center block elements that rely on max-width + auto margins (common in modern templates). */
function centerMaxWidthBlocks(doc: Document): void {
  doc.querySelectorAll<HTMLElement>('div, section, article').forEach((el) => {
    if (!hasMaxWidth(el)) return;

    let style = el.getAttribute('style') || '';
    if (hasAutoHorizontalMargin(style)) return;

    // Only top-level-ish blocks (not every nested card).
    const parent = el.parentElement;
    if (!parent) return;
    const siblings = Array.from(parent.children).filter((child) => {
      if (child === el) return true;
      if (child.tagName === 'BR') return false;
      if (
        child.tagName === 'P' &&
        !child.textContent?.trim() &&
        !child.querySelector('img,table')
      ) {
        return false;
      }
      return true;
    });
    if (siblings.length > 3) return;

    el.setAttribute('style', mergeInlineStyles(style, 'margin-left: auto; margin-right: auto'));
  });
}

/**
 * Wrap quoted marketing HTML in an Outlook-safe full-width centering table.
 * Email clients reliably center children of td[align=center].
 */
function wrapQuotedContentInCenterTable(doc: Document): void {
  doc.querySelectorAll('.quoted-content').forEach((quoted) => {
    if (quoted.getAttribute('data-email-centered') === '1') return;
    if (!quoted.querySelector('table, [style*="max-width"]')) return;

    const wrapper = doc.createElement('table');
    wrapper.setAttribute('role', 'presentation');
    wrapper.setAttribute('width', '100%');
    wrapper.setAttribute('border', '0');
    wrapper.setAttribute('cellpadding', '0');
    wrapper.setAttribute('cellspacing', '0');
    wrapper.setAttribute(
      'style',
      'width:100%;max-width:100%;border-collapse:collapse;border-spacing:0;margin:0;padding:0;',
    );

    const tr = doc.createElement('tr');
    const td = doc.createElement('td');
    td.setAttribute('align', 'center');
    td.setAttribute('valign', 'top');
    td.setAttribute('style', 'text-align:center;width:100%;margin:0;padding:0;');

    while (quoted.firstChild) {
      td.appendChild(quoted.firstChild);
    }
    tr.appendChild(td);
    wrapper.appendChild(tr);
    quoted.appendChild(wrapper);
    quoted.setAttribute('data-email-centered', '1');
  });
}

function restoreEmailLayoutCentering(doc: Document): void {
  fixMalformedPercentWidths(doc);
  restoreEmailCellAlign(doc);
  centerStandaloneTables(doc);
  centerMaxWidthBlocks(doc);
}

/**
 * Ensures tables in outgoing email HTML render the way they were designed to.
 * Also undoes CKEditor rewrites that break centering for recipients
 * (align → float:none / text-align only).
 */
export function ensureEmailTableBorders(html: string): string {
  if (!html?.trim()) return html;

  const doc = new DOMParser().parseFromString(html, 'text/html');

  restoreEmailLayoutCentering(doc);
  wrapQuotedContentInCenterTable(doc);

  return doc.body.innerHTML;
}

/** Strip comments and at-rules; keep plain rules for inlining. */
function normalizeCssText(css: string): string {
  return css
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/@(?:media|supports|keyframes|font-face)[^{]*\{(?:[^{}]*|\{[^{}]*\})*\}/gi, '');
}

/**
 * Best-effort: copy declarations from <style> tags onto matching elements as
 * inline style, then remove the <style> tags. CKEditor (and many reply
 * pipelines) drop <style> blocks; without inlining, marketing templates lose
 * margin:auto / max-width centering and shift left.
 */
function inlineStylesFromStyleTags(doc: Document): void {
  const styleEls = Array.from(doc.querySelectorAll('style'));
  if (styleEls.length === 0) return;

  const rootDecls: string[] = [];

  for (const styleEl of styleEls) {
    const css = normalizeCssText(styleEl.textContent || '');
    const ruleRegex = /([^{}@]+)\{([^{}]+)\}/g;
    let match: RegExpExecArray | null;

    while ((match = ruleRegex.exec(css)) !== null) {
      const selectorGroup = match[1].trim();
      const decls = match[2].replace(/\s+/g, ' ').trim().replace(/;\s*$/, '');
      if (!selectorGroup || !decls) continue;

      for (const rawSelector of selectorGroup.split(',')) {
        const selector = rawSelector.trim();
        if (!selector || selector.includes(':') || selector.includes('[')) continue;

        if (selector === 'html' || selector === 'body' || selector === ':root') {
          rootDecls.push(decls);
          continue;
        }

        try {
          doc.querySelectorAll(selector).forEach((el) => {
            const existing = el.getAttribute('style') || '';
            el.setAttribute('style', mergeInlineStyles(existing, decls));
          });
        } catch {
          // Invalid selector for querySelectorAll — skip.
        }
      }
    }
  }

  styleEls.forEach((el) => el.remove());

  if (rootDecls.length > 0) {
    const marker = doc.createElement('div');
    marker.setAttribute(
      'style',
      mergeInlineStyles(
        'width:100%;max-width:100%;box-sizing:border-box;',
        rootDecls.join('; '),
      ),
    );
    while (doc.body.firstChild) {
      marker.appendChild(doc.body.firstChild);
    }
    doc.body.appendChild(marker);
  }
}

function stripDangerousEmailElements(doc: Document): void {
  doc
    .querySelectorAll('script, iframe, object, embed, form, link, meta, base')
    .forEach((el) => el.remove());
}

/**
 * Prepare original-message HTML for reply/forward quoting so centered
 * marketing templates keep their layout in the composer and for recipients.
 */
export function prepareQuotedEmailHtml(html: string): string {
  if (!html?.trim()) return html;

  const doc = new DOMParser().parseFromString(html, 'text/html');
  stripDangerousEmailElements(doc);
  inlineStylesFromStyleTags(doc);
  restoreEmailLayoutCentering(doc);

  return doc.body.innerHTML;
}
