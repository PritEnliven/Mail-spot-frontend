import { useEffect, useRef } from "react";

interface EmailBodyProps {
  html: string;
}

function EmailBody({ html }: EmailBodyProps) {
  const hostRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!hostRef.current) return;

    // Avoid re-attaching shadow root
    const shadowRoot =
      hostRef.current.shadowRoot ??
      hostRef.current.attachShadow({ mode: "open" });

    shadowRoot.innerHTML = html;

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
  }, [html]);

  return <div ref={hostRef} />;
}

export default EmailBody;