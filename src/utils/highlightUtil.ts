export function escapeRegex(str: string): string {
    return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function highlightTextInHtml(html: string, searchTerm: string): string {
    const term = searchTerm.trim();
    if (!term || typeof document === "undefined") return html;

    try {
        const parser = new DOMParser();
        const doc = parser.parseFromString(`<div id="highlight-root">${html}</div>`, "text/html");
        const root = doc.getElementById("highlight-root");
        if (!root) return html;

        const regex = new RegExp(`(${escapeRegex(term)})`, "gi");
        const termLower = term.toLowerCase();

        const walker = doc.createTreeWalker(root, NodeFilter.SHOW_TEXT);
        const textNodes: Text[] = [];
        let node: Node | null;
        while ((node = walker.nextNode())) {
            const parent = node.parentElement;
            if (parent?.tagName === "SCRIPT" || parent?.tagName === "STYLE") continue;
            textNodes.push(node as Text);
        }

        for (const textNode of textNodes) {
            const text = textNode.textContent || "";
            if (!text.toLowerCase().includes(termLower)) continue;

            const parts = text.split(regex);
            if (parts.length <= 1) continue;

            const fragment = doc.createDocumentFragment();
            for (const part of parts) {
                if (!part) continue;
                if (part.toLowerCase() === termLower) {
                    const mark = doc.createElement("mark");
                    mark.className = "search-term-highlight";
                    mark.textContent = part;
                    fragment.appendChild(mark);
                } else {
                    fragment.appendChild(doc.createTextNode(part));
                }
            }
            textNode.parentNode?.replaceChild(fragment, textNode);
        }

        return root.innerHTML;
    } catch {
        return html;
    }
}
