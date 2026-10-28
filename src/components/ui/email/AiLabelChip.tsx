import { useState } from 'react';
import closeIcon from '@images/close-icon.svg';

interface AiLabelChipProps {
    labelName: string;
    className?: string;
    /** When provided, hover shows a remove control and click calls this. */
    onRemove?: (labelName: string) => void | Promise<void>;
}

const AiLabelChip = ({ labelName, className = '', onRemove }: AiLabelChipProps) => {
    const [removing, setRemoving] = useState(false);
    const canRemove = Boolean(onRemove) && !removing;

    const handleRemove = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (!onRemove || removing) return;
        setRemoving(true);
        try {
            await onRemove(labelName);
        } finally {
            setRemoving(false);
        }
    };

    return (
        <span
            className={`mail-received-ai-label${canRemove ? ' mail-received-ai-label--removable' : ''}${removing ? ' is-removing' : ''}${className ? ` ${className}` : ''}`}
            data-tooltip-id="my-tooltip"
            data-tooltip-content={labelName}
            data-tooltip-place="top"
            onClick={(e) => e.stopPropagation()}
        >
            <span className="mail-received-ai-label__text">{labelName}</span>
            {onRemove && (
                <button
                    type="button"
                    className="mail-received-ai-label__remove"
                    onClick={handleRemove}
                    disabled={removing}
                    aria-label={`Remove label ${labelName}`}
                    data-tooltip-id="my-tooltip"
                    data-tooltip-content="Remove label"
                    data-tooltip-place="top"
                >
                    <img src={closeIcon} alt="" width={10} height={10} aria-hidden="true" />
                </button>
            )}
        </span>
    );
};

export default AiLabelChip;
