import { useEffect, useRef } from "react";
import { highlightTextInHtml } from "@utils/highlightUtil";
import threeDotIcon from "@images/three-dot-icon.svg";

interface EmailBodyProps {
  html: string;
  searchTerm?: string;
}

// const HIGHLIGHT_STYLE = `
//   .search-term-highlight {
//     background-color: #FFE799;
//     color: inherit;
//     padding: 0 1px;
//     border-radius: 2px;
//   }
// `;

const HIGHLIGHT_STYLE = `
  .search-term-highlight {
    background-color: #FFE799;
    color: inherit;
    padding: 0 1px;
    border-radius: 2px;
  }

  .quoted-content {
    margin-top: 8px;
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

    // const container = document.createElement("div");
    // container.innerHTML = contentHtml;
    // shadowRoot.appendChild(container);

    const container = document.createElement("div");
    container.innerHTML = contentHtml;

    // Gmail-style collapsed quoted content
    container.querySelectorAll(".quoted-content").forEach((quotedContent) => {
      const wrapper = document.createElement("div");

      const toggle = document.createElement("button");
      
      toggle.type = "button";
      toggle.innerHTML = `<img src="${threeDotIcon}" alt="Show quoted text" className="input-icon-1'/>`;
      toggle.style.border = "none";
      toggle.style.background = "transparent";
      toggle.style.color = "#5f6368";
      toggle.style.cursor = "pointer";
      toggle.style.padding = "0";
      toggle.style.margin = "8px 0";
      toggle.style.fontSize = "14px";

      // const content = quotedContent as HTMLElement;
      // content.style.display = "none";

      // toggle.addEventListener("click", () => {
      //   const isOpen = content.style.display !== "none";
      //   content.style.display = isOpen ? "none" : "block";

      //   if (isOpen) {
      //     toggle.innerHTML = `<img src="${threeDotIcon}" alt="Show quoted text" />`;
      //   } else {
      //     toggle.textContent = "Hide quoted text";
      //   }
      // });

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
        } 
        else {
          toggle.textContent = "Hide quoted text";
        }
      });

      quotedContent.parentNode?.insertBefore(wrapper, quotedContent);
      wrapper.appendChild(toggle);
      wrapper.appendChild(quotedContent);
    });

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