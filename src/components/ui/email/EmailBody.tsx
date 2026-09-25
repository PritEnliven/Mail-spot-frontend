import { useEffect, useRef } from "react";
import { highlightTextInHtml } from "@utils/highlightUtil";
import { resolveExternalLinkUrl } from "@utils/emailHtmlUtil";
import { resolveCidUrlsInElement, type EmailAttachmentLike } from "@utils/emailCidUtil";
import threeDotIcon from "@images/three-dot-icon.svg";

interface EmailBodyProps {
  html: string;
  searchTerm?: string;
  attachments?: EmailAttachmentLike[] | null;
}

const HIGHLIGHT_STYLE = `
  /* Cap only — never force width:100%. Explicit pixel sizes (attrs/style) win. */
  img {
    max-width: 100%;
    height: auto;
  }

  svg {
    max-width: 100%;
    height: auto;
    overflow: visible;
  }

  /* iCloud calendar RSVP reply icons (Accept / Decline / Maybe) */
  a[href*="icloud.com"] img,
  a[href*="gateway.icloud.com"] img {
    width: 20px !important;
    height: 20px !important;
    max-width: 20px !important;
    max-height: 20px !important;
    object-fit: contain !important;
    vertical-align: middle !important;
    display: inline-block !important;
  }

  .search-term-highlight {
    background-color: #FFE799;
    color: inherit;
    padding: 0 1px;
    border-radius: 2px;
  }

    .quoted-content {
      margin-top: 8px !important;
      /* Do not force font-size/background — that breaks quoted marketing templates. */
      background-color: transparent !important;
      padding: 0 !important;
  }
 
`;

/** Pixel sizes at or below this are treated as fixed (e.g. signature icons). */
const FIXED_IMG_PX_MAX = 128;

/** Apple iCloud / calendar invite RSVP icons (Accept / Decline / Maybe). */
const RSVP_ACTION_ICON_PX = 26;
const RSVP_ACTION_HINT =
  /\b(accept|decline|maybe|tentative)\b/i;

function parseHtmlPx(value: string | null): number | null {
  if (!value) return null;
  const trimmed = value.trim();
  if (/^\d+$/.test(trimmed)) return Number(trimmed);
  const match = /^(\d+(?:\.\d+)?)px$/i.exec(trimmed);
  return match ? Number(match[1]) : null;
}

/**
 * Keep width/height/style on <img>. Promote small HTML pixel sizes into inline
 * style so signature icons honor their attrs despite the height:auto cap.
 * Large content images are left alone so max-width can scale them.
 */
function honorHtmlImgPixelSizes(root: ParentNode) {
  root.querySelectorAll("img").forEach((node) => {
    const img = node as HTMLImageElement;
    const widthAttr = img.getAttribute("width");
    const heightAttr = img.getAttribute("height");
    const w = parseHtmlPx(widthAttr);
    const h = parseHtmlPx(heightAttr);

    const isFixedIcon =
      w != null &&
      w > 0 &&
      w <= FIXED_IMG_PX_MAX &&
      (h == null || (h > 0 && h <= FIXED_IMG_PX_MAX));

    if (!isFixedIcon) return;

    if (w != null && !img.style.width) {
      img.style.width = `${w}px`;
    }
    if (h != null && !img.style.height) {
      img.style.height = `${h}px`;
    }
  });
}

function looksLikeCalendarInviteActions(root: ParentNode): boolean {
  const text = (root.textContent || "").toLowerCase();
  const hasAccept = text.includes("accept");
  const hasDecline = text.includes("decline");
  const hasMaybe = text.includes("maybe");
  return (hasAccept && hasDecline) || (hasAccept && hasMaybe) || (hasDecline && hasMaybe);
}

function lockIconBox(el: HTMLElement | SVGElement, sizePx: number) {
  el.style.setProperty("width", `${sizePx}px`, "important");
  el.style.setProperty("height", `${sizePx}px`, "important");
  el.style.setProperty("max-width", `${sizePx}px`, "important");
  el.style.setProperty("max-height", `${sizePx}px`, "important");
  el.style.setProperty("object-fit", "contain", "important");
  el.style.setProperty("vertical-align", "middle", "important");
  el.style.setProperty("display", "inline-block", "important");
  // Apple templates often set width:100% on these assets
  el.removeAttribute("width");
  el.removeAttribute("height");
}

/**
 * Find the Accept · Decline · Maybe action row/cells.
 * Icons and labels are often in separate nested spans/links, so we key off the
 * row (or the parent that holds icon + label) — not a span that only wraps the image.
 */
function findRsvpActionContainers(root: ParentNode): Element[] {
  const containers: Element[] = [];
  const seen = new Set<Element>();

  const add = (el: Element | null | undefined) => {
    if (!el || seen.has(el)) return;
    seen.add(el);
    containers.push(el);
  };

  const isActionClusterText = (text: string) => {
    const t = text.toLowerCase();
    const hasAccept = t.includes("accept");
    const hasDecline = t.includes("decline");
    const hasMaybe = t.includes("maybe");
    return (
      (hasAccept && hasDecline) ||
      (hasAccept && hasMaybe) ||
      (hasDecline && hasMaybe)
    );
  };

  // Prefer the tightest action row (avoid the outer table that wraps the whole email).
  root.querySelectorAll("tr").forEach((tr) => {
    const text = (tr.textContent || "").replace(/\s+/g, " ").trim();
    if (!text || text.length > 160) return;
    if (!isActionClusterText(text)) return;

    add(tr);

    // Icons sometimes sit in the previous/next row with little/no label text.
    for (const sibling of [tr.previousElementSibling, tr.nextElementSibling]) {
      if (!sibling || sibling.tagName !== "TR") continue;
      const siblingText = (sibling.textContent || "").replace(/\s+/g, " ").trim();
      const hasIcons = sibling.querySelector("img, svg");
      if (hasIcons && siblingText.length <= 24) {
        add(sibling);
      }
    }
  });

  if (containers.length > 0) return containers;

  // Fallback for div-based layouts: label link/cell + neighboring icon wrapper.
  root.querySelectorAll("td, th, a, span, div, p").forEach((el) => {
    const text = (el.textContent || "").replace(/\s+/g, " ").trim();
    if (!RSVP_ACTION_HINT.test(text) || text.length > 64) return;

    add(el);

    const prev = el.previousElementSibling;
    if (
      prev &&
      prev.querySelector("img, svg") &&
      (prev.textContent || "").replace(/\s+/g, "").length <= 4
    ) {
      add(prev);
    }

    const parent = el.parentElement;
    if (parent) {
      const parentText = (parent.textContent || "").replace(/\s+/g, " ").trim();
      if (parentText.length <= 160 && (isActionClusterText(parentText) || RSVP_ACTION_HINT.test(parentText))) {
        add(parent);
      }
    }
  });

  return containers;
}

/**
 * Apple iCloud calendar invites ship hi-res Accept/Decline/Maybe assets that
 * render oversized when template CSS sizing does not apply in the shadow DOM.
 */
function constrainCalendarInviteActionIcons(root: ParentNode) {
  if (!looksLikeCalendarInviteActions(root)) return;

  const containers = findRsvpActionContainers(root);
  if (containers.length === 0) return;

  containers.forEach((container) => {
    container.querySelectorAll("img").forEach((node) => {
      lockIconBox(node as HTMLImageElement, RSVP_ACTION_ICON_PX);
    });
    container.querySelectorAll("svg").forEach((node) => {
      const svg = node as SVGElement;
      lockIconBox(svg, RSVP_ACTION_ICON_PX);
      svg.setAttribute("width", String(RSVP_ACTION_ICON_PX));
      svg.setAttribute("height", String(RSVP_ACTION_ICON_PX));
    });
  });
}

function EmailBody({ html, searchTerm, attachments }: EmailBodyProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const attachmentsKey = (attachments || [])
    .map((att) => [
      att.customFileName || '',
      att.contentId || att.contentID || att.cid || att.content_id || '',
      att.filename || att.fileName || '',
      att.contentDisposition || att.disposition || '',
      att.isSchedule ? '1' : '0',
    ].join('|'))
    .join(';;');

  useEffect(() => {
    if (!hostRef.current) return;

    const shadowRoot =
      hostRef.current.shadowRoot ??
      hostRef.current.attachShadow({ mode: "open" });

    const term = searchTerm?.trim() ?? "";
    const contentHtml = term ? highlightTextInHtml(html, term) : html;

    shadowRoot.innerHTML = "";
    const style = document.createElement("style");
    style.textContent = HIGHLIGHT_STYLE;
    shadowRoot.appendChild(style);

    const container = document.createElement("div");
    container.innerHTML = contentHtml;

    // Resolve pasted/inline images that reference MIME parts via cid:
    resolveCidUrlsInElement(container, attachments);

    // Preserve width/height/style; lock small HTML pixel sizes (signature icons).
    honorHtmlImgPixelSizes(container);
    // Apple iCloud invites: keep Accept / Decline / Maybe icons at a sane size.
    constrainCalendarInviteActionIcons(container);

    container.querySelectorAll("a[href]").forEach((anchor) => {
      const resolvedHref = resolveExternalLinkUrl(anchor.getAttribute("href"));
      if (resolvedHref) {
        anchor.setAttribute("href", resolvedHref);
      }
    });

    container.querySelectorAll(".quoted-content").forEach((quotedContent) => {
      const wrapper = document.createElement("div");

      const toggle = document.createElement("button");
      toggle.type = "button";
      toggle.style.border = "none";
      toggle.style.background = "transparent";
      toggle.style.color = "#5f6368";
      toggle.style.cursor = "pointer";
      toggle.style.padding = "0";
      toggle.style.margin = "8px 0";
      toggle.style.fontSize = "14px";

      const createIcon = () => {
        const img = document.createElement("img");
        img.src = threeDotIcon;
        img.alt = "Show quoted text";
        img.style.width = "20px";
        img.style.height = "20px";
        return img;
      };

      toggle.appendChild(createIcon());

      const content = quotedContent as HTMLElement;
      content.style.display = "none";

      toggle.addEventListener("click", () => {
        const isOpen = content.style.display !== "none";
        content.style.display = isOpen ? "none" : "block";

        if (isOpen) {
          toggle.innerHTML = "";
          toggle.appendChild(createIcon());
        } else {
          toggle.textContent = "Hide quoted text";
        }
      });

      quotedContent.parentNode?.insertBefore(wrapper, quotedContent);
      wrapper.appendChild(toggle);
      wrapper.appendChild(quotedContent);
    });

    shadowRoot.appendChild(container);

    // Re-apply after layout/cid images settle — Apple assets often report size late.
    constrainCalendarInviteActionIcons(container);
    container.querySelectorAll("img").forEach((node) => {
      const img = node as HTMLImageElement;
      if (img.complete) return;
      img.addEventListener(
        "load",
        () => constrainCalendarInviteActionIcons(container),
        { once: true },
      );
    });

    const clickHandler = (e: Event) => {
      const target = e.composedPath()[0] as HTMLElement;
      if (target?.tagName === "A") {
        e.preventDefault();
        const rawHref = (target as HTMLAnchorElement).getAttribute("href");
        const href = resolveExternalLinkUrl(rawHref);
        if (!href) return;
        window.open(href, "_blank", "noopener,noreferrer");
      }
    };

    shadowRoot.addEventListener("click", clickHandler);

    return () => {
      shadowRoot.removeEventListener("click", clickHandler);
    };
  }, [html, searchTerm, attachments, attachmentsKey]);

  return <div ref={hostRef} />;
}

export default EmailBody;