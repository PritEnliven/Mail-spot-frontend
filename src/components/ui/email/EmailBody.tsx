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

  .search-term-highlight {
    background-color: #FFE799;
    color: inherit;
    padding: 0 1px;
    border-radius: 2px;
  }

    .quoted-content {
      margin-top: 8px !important;
      font-size:18px !important;
      background-color: #F5F5F5 !important;
  }
 
`;

/** Pixel sizes at or below this are treated as fixed (e.g. signature icons). */
const FIXED_IMG_PX_MAX = 128;

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