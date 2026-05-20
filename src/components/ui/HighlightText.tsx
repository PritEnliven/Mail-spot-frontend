import { Fragment } from "react";
import { escapeRegex } from "@utils/highlightUtil";

interface HighlightTextProps {
    text: string;
    searchTerm: string;
    className?: string;
}

export function HighlightText({ text, searchTerm, className }: HighlightTextProps) {
    const term = searchTerm.trim();
    if (!term) {
        return <span className={className}>{text}</span>;
    }

    const parts = text.split(new RegExp(`(${escapeRegex(term)})`, "gi"));
    const termLower = term.toLowerCase();

    return (
        <span className={className}>
            {parts.map((part, index) =>
                part.toLowerCase() === termLower ? (
                    <mark key={index} className="search-term-highlight">
                        {part}
                    </mark>
                ) : (
                    <Fragment key={index}>{part}</Fragment>
                )
            )}
        </span>
    );
}
