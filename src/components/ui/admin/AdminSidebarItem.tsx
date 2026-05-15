import InteractiveIcon from '@components/ui/InteractiveIcon';
import SidebarSkeletonLoader from '@components/ui/SidebarSkeletonLoader';

type SidebarItemType = {
    id: string;
    boxName: string;
    label: string;
    icon: string;
    activeIcon: string;
};

interface SidebarProps {
    items: SidebarItemType[];
    activeBoxId: string;
    onChangeBox: (boxId: string, label: string) => void;
    isLoading?: boolean;
}

const AdminSidebarItems = ({ items, activeBoxId, onChangeBox, isLoading = false }: SidebarProps) => {
    return (
        <>
            {isLoading ? (
                <SidebarSkeletonLoader count={5} />
            ) : (
                items.map(item => {
                    const isActive = activeBoxId === item.id;
                    return (
                        <li
                            key={item.id}
                            className="m-item"
                            id={item.boxName}
                            onClick={() => onChangeBox(item.id, item.label)}
                        >
                            <a
                                href="javascript:;"
                                className={`m-link can-be-active hover-link ${isActive ? 'active' : ''}`}
                                onClick={e => e.preventDefault()} // prevent <a> default
                            >
                                <InteractiveIcon
                                    defaultIcon={item.icon}
                                    activeIcon={item.activeIcon}
                                    isActive={isActive}
                                    alt={item.label}
                                    className="interactive-icon hover-image"
                                    renderAs="img"
                                />
                                <span className="active-line-t"></span>
                                <div className="nav-link-before-collapse">
                                    <span id="boxName">{item.label}</span>
                                </div>
                            </a>
                        </li>
                    )
                })
            )}
        </>
    );
};

export default AdminSidebarItems;
