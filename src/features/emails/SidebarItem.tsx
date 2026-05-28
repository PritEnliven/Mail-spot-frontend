import InteractiveIcon from '@components/ui/InteractiveIcon';
import SidebarSkeletonLoader from '@components/ui/SidebarSkeletonLoader';
import type { BoxCount } from '@context/MailDataContext';

type SidebarItemType = {
    id: string;
    boxName: string;
    label: string;
    icon: string;
    activeIcon: string;
    unreadCount?: number;
};

interface SidebarProps {
    items: SidebarItemType[];
    boxCounts: Record<string, BoxCount>;  // Change from BoxCount[] to Record<string, BoxCount>
    activeBoxId: string;
    onChangeBox: (boxName: string, boxId: string, label: string) => void;
    isLoading?: boolean;
    isCountLoading?: boolean;
}

const Sidebar = ({ items, boxCounts, activeBoxId, onChangeBox, isLoading = false, isCountLoading = false }: SidebarProps) => {
    return (
        <>
            {isLoading ? (
                <SidebarSkeletonLoader count={5} />
            ) : (
                items.map(item => {
                    const isActive = activeBoxId === item.id;
                    const specificBoxCount = boxCounts[item.boxName];
                    return (
                        <li
                            key={item.id}
                            className="m-item"
                            id={item.boxName}
                            onClick={() => onChangeBox(item.boxName, item.id, item.label)}
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
                                    {!isCountLoading && (() => {
                                        const displayCount = specificBoxCount?.isTotal ? specificBoxCount.totalCount : specificBoxCount?.unreadCount;
                                        return displayCount > 0 ? (
                                            <span className="badge" data-boxname={item.boxName} id={`${item.boxName}-unreadCount`}>
                                                {displayCount}
                                            </span>
                                        ) : null;
                                    })()}
                                </div>
                            </a>
                        </li>
                    )
                })
            )}
        </>
    );
};

export default Sidebar;
