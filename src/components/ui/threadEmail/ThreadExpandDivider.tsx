import chevronDownIcon from '@images/chevron-down-icon.svg';
import chevronUpIcon from '@images/chevron-up-icon.svg';

interface ThreadExpandDividerProps {
    hiddenCount: number;
    onExpand: () => void;
}

/**
 * Gmail-style control that sits between the first and last visible thread
 * messages when middle replies are collapsed. Clicking expands the full thread.
 * Default: count in a circle with lines on both sides.
 * Hover: count swaps to up/down chevrons.
 */
const ThreadExpandDivider = ({ hiddenCount, onExpand }: ThreadExpandDividerProps) => {
    if (hiddenCount <= 0) return null;

    return (
        <div className="thread-expand-divider" role="presentation">
            <span className="thread-expand-divider__line" aria-hidden="true" />
            <button
                type="button"
                className="thread-expand-divider__btn"
                onClick={onExpand}
                aria-label={`Show ${hiddenCount} more messages`}
                title={`Show ${hiddenCount} more messages`}
            >
                <span className="thread-expand-divider__count">{hiddenCount}</span>
                <span className="thread-expand-divider__arrows" aria-hidden="true">
                    <img src={chevronUpIcon} alt="" className="thread-expand-divider__arrow" />
                    <img src={chevronDownIcon} alt="" className="thread-expand-divider__arrow" />
                </span>
            </button>
            <span className="thread-expand-divider__line" aria-hidden="true" />
        </div>
    );
};

export default ThreadExpandDivider;
