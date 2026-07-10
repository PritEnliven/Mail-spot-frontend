import CopyEmail from "@components/ui/email/CopyEmail";
import { HighlightText } from "@components/ui/HighlightText";
import { useEffect, useRef, useState, useCallback } from "react";

interface Recipient {
    name?: string;
    email: string;
}

interface EmailRecipientsRowProps {
    emails: Recipient[];
    searchTerm?: string;
    reserveWidth?: number; // extra px to reserve on the right (e.g. for a chevron button)
    onVisibleCountChange?: (visibleCount: number, totalCount: number) => void;
    trailingElement?: React.ReactNode;
    expanded?: boolean; // when true, show all chips wrapped instead of single-line truncation
}

function EmailRecipientsList({
    emails,
    searchTerm = "",
    reserveWidth = 0,
    onVisibleCountChange,
    trailingElement,
    expanded = false,
}: EmailRecipientsRowProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const measureRefs = useRef<(HTMLDivElement | null)[]>([]);
    const [visibleCount, setVisibleCount] = useState<number>(emails?.length || 0);

    const recalc = useCallback(() => {
        const container = containerRef.current;
        if (!container || !emails || emails.length === 0) return;

        const availableWidth = container.clientWidth - reserveWidth;
        if (availableWidth <= 0) {
            setVisibleCount(emails.length);
            return;
        }

        let usedWidth = 0;
        let fitCount = 0;

        for (let i = 0; i < emails.length; i++) {
            const chipEl = measureRefs.current[i];
            const chipWidth = chipEl ? chipEl.offsetWidth : 0;
            if (usedWidth + chipWidth <= availableWidth || i === 0) {
                // always allow at least the first chip even if it slightly overflows
                usedWidth += chipWidth;
                fitCount++;
            } else {
                break;
            }
        }

        setVisibleCount(Math.max(1, fitCount));
    }, [emails, reserveWidth]);

    useEffect(() => {
        if (expanded) {
            setVisibleCount(emails?.length || 0);
            return;
        }
        recalc();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [emails, reserveWidth, expanded]);

    useEffect(() => {
        if (expanded) return;
        const container = containerRef.current;
        if (!container) return;

        const resizeObserver = new ResizeObserver(() => {
            recalc();
        });
        resizeObserver.observe(container);

        return () => resizeObserver.disconnect();
    }, [recalc, expanded]);

    useEffect(() => {
        onVisibleCountChange?.(visibleCount, emails?.length || 0);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [visibleCount, emails]);

    if (!emails || emails.length === 0) return null;

    const renderChip = (recipient: Recipient, index: number) => {
        const emailAddr = recipient.email || "";
        const name = recipient.name || emailAddr.split("@")[0] || emailAddr;
        const initial = name.charAt(0).toUpperCase();
        const key = emailAddr || `recipient-${index}`;
        return (
            <div key={key} className="from-cc-details position-relative">
                <span className="email-address">
                    <HighlightText text={emailAddr} searchTerm={searchTerm} />
                </span>
                <CopyEmail
                    name={name}
                    email={emailAddr}
                    initial={initial}
                />
            </div>
        );
    };

    return (
        <div
            ref={containerRef}
            className={`email-recipient-list-container d-flex align-items-center ${expanded ? 'flex-wrap' : 'flex-wrap'}`}
            style={{ minWidth: 0, width: "100%", }}
        >
            {/* Hidden measuring layer: renders all chips off-screen to measure real widths */}
            <div
                aria-hidden="true"
                style={{
                    position: "absolute",
                    pointerEvents: "none",
                    height: 0,
                    overflow: "hidden",
                    display: "flex",
                }}
            >
                {emails.map((recipient, index) => (
                    <div
                        key={`measure-${recipient.email || index}`}
                        ref={(el) => { measureRefs.current[index] = el; }}
                        className="from-cc-details position-relative"
                        style={{ flexShrink: 0 }}
                    >
                        <span className="email-address">
                            {recipient.email}
                        </span>
                    </div>
                ))}
            </div>

            {/* Visible chips */}
            {emails.slice(0, visibleCount).map((recipient, index) => renderChip(recipient, index))}

            {/* Trailing chevron/button, sits right after last visible chip */}
            {trailingElement && (
                <div className="flex-shrink-0" style={{ marginLeft: 4 }}>
                    {trailingElement}
                </div>
            )}
        </div>
    );
}

export default EmailRecipientsList;