import Dropdown from 'react-bootstrap/Dropdown';
import eclipseVerticalIcon from '@images/ellipsis-vertical-icon.svg';

interface FolderActionsDropdownProps {
    onEdit: () => void;
    onDelete: () => void;
    isOpen: boolean;
    onToggle: (nextOpen: boolean) => void;
}

const FolderActionsDropdown: React.FC<FolderActionsDropdownProps> = ({
    onEdit,
    onDelete,
    isOpen,
    onToggle
}) => {
    return (
        <Dropdown show={isOpen} drop="end" align="start"
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
                        { name: 'offset', options: { offset: [8, 0] } },
                        { name: 'flip', options: { fallbackPlacements: ['start'] } },
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

                <Dropdown.Item
                    as="button"
                    onClick={(e) => {
                        e.stopPropagation();
                        onDelete();
                    }}
                >
                    Delete
                </Dropdown.Item>
            </Dropdown.Menu>
        </Dropdown>
    );
};

export default FolderActionsDropdown;
