import chevronDownIcon from "@images/chevron-down-icon.svg";
import chevronRightIcon from "@images/chevron-right-icon.svg";

interface MailListGroupHeaderProps {
    label: string;
    groupKey: string;
    expanded: boolean;
    onToggle: (groupKey: string) => void;
}

const MailListGroupHeader = ({
    label,
    groupKey,
    expanded,
    onToggle,
}: MailListGroupHeaderProps) => {
    return (
        <tr className="mail-list-group-header">
            <td>
                <button
                    type="button"
                    className="mail-list-group-header__btn"
                    aria-expanded={expanded}
                    aria-label={`${expanded ? "Collapse" : "Expand"} ${label}`}
                    onClick={() => onToggle(groupKey)}
                >
                    <img
                        src={expanded ? chevronDownIcon : chevronRightIcon}
                        alt=""
                        className="mail-list-group-header__chevron"
                        width={16}
                        height={16}
                    />
                    <span className="mail-list-group-header__label">{label}</span>
                </button>
            </td>
        </tr>
    );
};

export default MailListGroupHeader;
