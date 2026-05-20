import { useEffect, useRef } from "react";
import { highlightTextInHtml } from "@utils/highlightUtil";

interface EmailBodyProps {
  html: string;
  searchTerm?: string;
}

const HIGHLIGHT_STYLE = `
  .search-term-highlight {
    background-color: #FFE799;
    color: inherit;
    padding: 0 1px;
    border-radius: 2px;
  }
`;

function EmailBody({ html, searchTerm }: EmailBodyProps) {
  const hostRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!hostRef.current) return;

    // Avoid re-attaching shadow root
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
    shadowRoot.appendChild(container);

    // Link handling (same as your jQuery logic)
    const clickHandler = (e: Event) => {
      const target = e.composedPath()[0] as HTMLElement;
      if (target?.tagName === "A") {
        e.preventDefault();
        const href = (target as HTMLAnchorElement).href;
        window.open(href, "_blank");
      }
    };

    shadowRoot.addEventListener("click", clickHandler);

    return () => {
      shadowRoot.removeEventListener("click", clickHandler);
    };
  }, [html, searchTerm]);

  return <div ref={hostRef} />;
}

export default EmailBody;