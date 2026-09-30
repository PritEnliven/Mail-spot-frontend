import InteractiveIcon from "@components/ui/InteractiveIcon";
import {
    ARRANGE_BY,
    ARRANGE_BY_OPTIONS,
    DEFAULT_SORT_ORDER,
    getSortOptions,
    SORT_ORDER,
    type ArrangeBy,
    type SortOrder,
} from "@constants/arrangeBy";
import { useMailData, useMailUI } from "@context/index";
import checkIcon from "@images/right-check-icon.svg";
import sortAscIconHover from "@images/sort-asc-icon-hover.svg";
import sortAscIcon from "@images/sort-asc-icon.svg";
import sortDescIconHover from "@images/sort-desc-icon-hover.svg";
import sortDescIcon from "@images/sort-desc-icon.svg";
import { useCallback, useState } from "react";
import { Dropdown } from "react-bootstrap";

const ArrangeByControl = () => {
    const {
        arrangeBy,
        sortOrder,
        setArrangeSort,
        fetchEmails,
        boxName,
        readUnreadFilter,
    } = useMailData();
    const { setIsLoading } = useMailUI();
    const [menuOpen, setMenuOpen] = useState(false);

    const refetchPageOne = useCallback(async () => {
        setIsLoading(true);
        try {
            await fetchEmails(1, boxName, false, readUnreadFilter);
            const emailListRef = document.getElementById("email-list");
            if (emailListRef) {
                emailListRef.scrollTop = 0;
            }
            const scrollEl = document.querySelector(
                ".mailReceivedTableNewsSimpleBar .simplebar-content-wrapper"
            ) as HTMLElement | null;
            if (scrollEl) {
                scrollEl.scrollTop = 0;
            }
        } finally {
            setIsLoading(false);
        }
    }, [boxName, fetchEmails, readUnreadFilter, setIsLoading]);

    const handleArrangeSelect = async (next: ArrangeBy) => {
        if (arrangeBy === next) {
            setMenuOpen(false);
            return;
        }
        setArrangeSort(next, DEFAULT_SORT_ORDER[next]);
        setMenuOpen(false);
        await refetchPageOne();
    };

    const handleSortSelect = async (next: SortOrder) => {
        const field = arrangeBy ?? ARRANGE_BY.DATE;
        if (arrangeBy === field && sortOrder === next) {
            setMenuOpen(false);
            return;
        }
        setArrangeSort(field, next);
        setMenuOpen(false);
        await refetchPageOne();
    };

    const handleClear = async () => {
        if (arrangeBy == null) {
            setMenuOpen(false);
            return;
        }
        setArrangeSort(null, null);
        setMenuOpen(false);
        await refetchPageOne();
    };

    /** Sort labels follow the active arrange field; default to Date when none selected. */
    const sortField = arrangeBy ?? ARRANGE_BY.DATE;
    const activeSort = arrangeBy
        ? (sortOrder ?? DEFAULT_SORT_ORDER[arrangeBy])
        : null;
    const sortOptions = getSortOptions(sortField);
    const arrangeLabel = arrangeBy
        ? ARRANGE_BY_OPTIONS.find((o) => o.value === arrangeBy)?.label
        : null;
    const sortLabel = activeSort
        ? sortOptions.find((o) => o.value === activeSort)?.label
        : null;
    const tooltip = arrangeLabel
        ? sortLabel
            ? `Arrange by ${arrangeLabel} · ${sortLabel}`
            : `Arrange by: ${arrangeLabel}`
        : "Arrange by";

    // Icon reflects applied sort: asc ↑ / desc ↓ (default idle shows desc)
    const isAsc = activeSort === SORT_ORDER.ASC;
    const defaultIcon = isAsc ? sortAscIcon : sortDescIcon;
    const hoverIcon = isAsc ? sortAscIconHover : sortDescIconHover;

    return (
        <Dropdown
            className="more-actions-dropdown react-dropdown arrange-by-dropdown"
            show={menuOpen}
            onToggle={(next) => setMenuOpen(next)}
            align="start"
        >
            <Dropdown.Toggle
                as="a"
                href="#"
                className={`arrange-by-toggle hover-link d-flex align-items-center icon-hover-effect ${
                    arrangeBy ? "arrange-by-toggle--active" : ""
                }`}
                aria-haspopup="menu"
                aria-expanded={menuOpen}
                aria-label={tooltip}
            >
                <InteractiveIcon
                    key={isAsc ? "asc" : "desc"}
                    defaultIcon={defaultIcon}
                    hoverIcon={hoverIcon}
                    activeIcon={hoverIcon}
                    isActive={Boolean(arrangeBy) || menuOpen}
                    alt=""
                    className="interactive-icon hover-image"
                    renderAs="img"
                    tooltip={tooltip}
                />
            </Dropdown.Toggle>

            <Dropdown.Menu
                role="menu"
                aria-label="Arrange and sort"
                className="arrange-by-menu"
            >
                <div className="arrange-by-menu__section-label" role="presentation">
                    Arrange by
                </div>
                {ARRANGE_BY_OPTIONS.map((option) => {
                    const selected = arrangeBy === option.value;
                    return (
                        <Dropdown.Item
                            key={option.value}
                            as="button"
                            type="button"
                            role="menuitemradio"
                            aria-checked={selected}
                            className={`dropdown-item arrange-by-menu__item d-flex justify-content-between align-items-center ${
                                selected ? "arrange-by-menu__item--active" : ""
                            }`}
                            onClick={() => handleArrangeSelect(option.value)}
                        >
                            <span>{option.label}</span>
                            {selected && (
                                <img
                                    src={checkIcon}
                                    alt=""
                                    className="arrange-by-menu__check"
                                    width={16}
                                    height={16}
                                />
                            )}
                        </Dropdown.Item>
                    );
                })}

                <Dropdown.Divider />
                <div className="arrange-by-menu__section-label" role="presentation">
                    Sort
                </div>
                {sortOptions.map((option) => {
                    const selected = activeSort === option.value;
                    return (
                        <Dropdown.Item
                            key={option.value}
                            as="button"
                            type="button"
                            role="menuitemradio"
                            aria-checked={selected}
                            className={`dropdown-item arrange-by-menu__item d-flex justify-content-between align-items-center ${
                                selected ? "arrange-by-menu__item--active" : ""
                            }`}
                            onClick={() => handleSortSelect(option.value)}
                        >
                            <span>{option.label}</span>
                            {selected && (
                                <img
                                    src={checkIcon}
                                    alt=""
                                    className="arrange-by-menu__check"
                                    width={16}
                                    height={16}
                                />
                            )}
                        </Dropdown.Item>
                    );
                })}

                {arrangeBy && (
                    <>
                        <Dropdown.Divider />
                        <Dropdown.Item
                            as="button"
                            type="button"
                            role="menuitem"
                            className="dropdown-item arrange-by-menu__item"
                            onClick={handleClear}
                        >
                            Clear arrangement
                        </Dropdown.Item>
                    </>
                )}
            </Dropdown.Menu>
        </Dropdown>
    );
};

export default ArrangeByControl;
