import Dropdown from 'react-bootstrap/Dropdown';
import eclipseVerticalIcon from '@images/ellipsis-vertical-icon.svg';

interface FolderActionsDropdownProps {
    onEdit: () => void;
    onDelete: () => void;
    isOpen: boolean;
    onToggle: (nextOpen: boolean) => void;
    showDelete?: boolean;
    drop?: 'up' | 'start' | 'end' | 'down';
    align?: 'start' | 'end';
}

const FolderActionsDropdown: React.FC<FolderActionsDropdownProps> = ({
    onEdit,
    onDelete,
    isOpen,
    onToggle,
    showDelete = true,
    drop = 'end',
    align = 'start',
}) => {
    const isVertical = drop === 'down' || drop === 'up';

    return (
        <Dropdown show={isOpen} drop={drop} align={align}
            onClick={(e) => e.stopPropagation()}
            onToggle={(nextShow) => onToggle(nextShow)}
        >
            <Dropdown.Toggle as="a" className="hover-link d-flex align-items-center p-0 more-actions-dropdown-fly-btn">
                <img className="hover-image icon-hover-effect" src={eclipseVerticalIcon} alt="" />
            </Dropdown.Toggle>

            <Dropdown.Menu
                renderOnMount
                className="dropdwon-hover" style={{ minWidth: 184 }}
                onMouseLeave={() => onToggle(false)}
                popperConfig={{
                    strategy: 'fixed',
                    modifiers: [
                        { name: 'offset', options: { offset: isVertical ? [0, 4] : [8, 0] } },
                        { name: 'flip', options: { fallbackPlacements: isVertical ? ['up'] : ['start'] } },
                        { name: 'preventOverflow', options: { boundary: 'viewport', padding: 10 } },
                    ],
                }}
            >
                <Dropdown.Item
                    as="button"
                    onClick={(e) => {
                        e.stopPropagation();
                        onEdit();
                    }}
                >
                    Edit
                </Dropdown.Item>

                {showDelete && (
                    <Dropdown.Item
                        as="button"
                        onClick={(e) => {
                            e.stopPropagation();
                            onDelete();
                        }}
                    >
                        Delete
                    </Dropdown.Item>
                )}
            </Dropdown.Menu>
        </Dropdown>
    );
};

export default FolderActionsDropdown;
