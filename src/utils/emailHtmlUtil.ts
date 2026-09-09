const EMAIL_TABLE_BORDER = '1px solid #BBC0C4';
const EMAIL_CELL_PADDING = '4px';

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

function hasExplicitBorderRemoval(style: string): boolean {
  return /border\s*:\s*none|border-width\s*:\s*0|border-style\s*:\s*none/i.test(style);
}

function hasBorderStyle(style: string): boolean {
  return /border(?:-top|-right|-bottom|-left)?\s*:/i.test(style) && !hasExplicitBorderRemoval(style);
}

/**
 * Ensures tables in outgoing email HTML include inline borders.
 * CKEditor shows borders via editor CSS only; email clients need inline styles.
 */
export function ensureEmailTableBorders(html: string): string {
  if (!html || !/<table[\s>]/i.test(html)) {
    return html;
  }

  const doc = new DOMParser().parseFromString(html, 'text/html');

  doc.querySelectorAll('table').forEach((table) => {
    if (!table.getAttribute('border')) {
      table.setAttribute('border', '1');
    }
    if (!table.getAttribute('cellpadding')) {
      table.setAttribute('cellpadding', '4');
    }
    if (!table.getAttribute('cellspacing')) {
      table.setAttribute('cellspacing', '0');
    }

    const tableStyle = table.getAttribute('style') || '';
    if (!/border-collapse/i.test(tableStyle)) {
      table.setAttribute('style', mergeInlineStyles(tableStyle, 'border-collapse: collapse'));
    }

    table.querySelectorAll('td, th').forEach((cell) => {
      const cellStyle = cell.getAttribute('style') || '';
      if (!hasBorderStyle(cellStyle) && !hasExplicitBorderRemoval(cellStyle)) {
        cell.setAttribute(
          'style',
          mergeInlineStyles(cellStyle, `border: ${EMAIL_TABLE_BORDER}; padding: ${EMAIL_CELL_PADDING}`)
        );
      }
    });
  });

  return doc.body.innerHTML;
}
