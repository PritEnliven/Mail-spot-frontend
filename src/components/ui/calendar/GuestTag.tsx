import copyIcon from "@images/copy-icon-16.svg";
import closeIcon from "@images/close-icon.svg";
import checkIcon from "@images/checkbox-check-box-blue.svg"
import { useState } from "react";
interface Guest {
    name: string;
    email: string;
    partstat?: string;
}

interface GuestTagProps {
    guest: Guest;
    mode: 'view' | 'edit';
    onRemove?: (email: string) => void;
    onCopy?: (email: string) => void | Promise<void>;
}

function GuestTag({ guest, mode, onRemove, onCopy }: GuestTagProps) {
    const [copied, setCopied] = useState(false);

    const handleCopyLogic = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        const email = typeof guest.email === 'string' ? guest.email.trim() : '';
        if (!email) return;

        try {
            if (onCopy) {
                await onCopy(email);
            } else if (navigator?.clipboard?.writeText) {
                await navigator.clipboard.writeText(email);
            }
            setCopied(true);
            setTimeout(() => setCopied(false), 1000);
        } catch {
            // Keep UI unchanged if copy fails
        }
    };

    return (
        <div className="tag-addmail-box d-flex align-items-center justify-content-between">
            <div className="d-flex align-items-center">
                <span className="name-tag d-block">
                    {guest.name}{mode === 'edit' ? ':' : ''}
                </span>
                <span className="mail-tag copy-text-common">
                    {guest.email}
                </span>
            </div>

            {/* VIEW MODE → COPY */}
            {mode === 'view' && (
                <button
                    type="button"
                    className="btn copy-text-btn copy-btn-common"
                    onClick={handleCopyLogic}
                    onMouseDown={(e) => e.stopPropagation()}
                    aria-label={`Copy ${guest.email}`}
                >
                    {copied ? (
                        <>
                            <img src={checkIcon} alt="Copied" style={{ width: "16px" }} />
                        </>
                    ) : (
                        <img className="hover-image" src={copyIcon} style={{ width: "16px" }} />
                    )}
                </button>
            )}

            {/* EDIT MODE → REMOVE */}
            {mode === 'edit' && (
                <button
                    type="button"
                    className="btn remove-tag"
                    onClick={() => onRemove?.(guest.email)}
                >
                    <img
                        className="hover-image"
                        src={closeIcon}
                        width="16"
                        height="16"
                    />
                </button>
            )}
        </div>
    );
}

export type { Guest };
export default GuestTag;
