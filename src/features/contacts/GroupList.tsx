import InteractiveIcon from '@components/ui/InteractiveIcon';
import { MultiValueCell } from '@features/contacts/ContactList';
import type { ContactGroup } from '@models/Contact';
import { getGroupMemberDisplayLabels } from '@models/Contact';
import editIcon from '@images/edit2-icon.svg';
import editIconHover from '@images/edit2-icon-hover.svg';
import deleteIcon from '@images/trash-icon.svg';
import deleteIconHover from '@images/trash-icon-hover.svg';

const GROUP_TABLE_COLSPAN = 5;

export function getGroupMemberNames(group: ContactGroup): string[] {
    return getGroupMemberDisplayLabels(group);
}

export function getGroupMemberCount(group: ContactGroup): number {
    if (typeof group.memberCount === 'number') return group.memberCount;
    if (Array.isArray(group.members)) return group.members.length;
    return 0;
}

interface GroupListProps {
    groups: ContactGroup[];
    isLoading: boolean;
    startIndex: number;
    onOpen: (group: ContactGroup) => void;
    onEdit: (group: ContactGroup) => void;
    onDelete: (group: ContactGroup) => void;
    layout?: 'table' | 'mobile';
    selectedIds?: Set<string>;
    onToggleSelect?: (groupId: string) => void;
}

function GroupEmptyState() {
    return (
        <div className="no-new-mail contacts-empty-state">
            <div className="d-block text-center">
                <h2 className="new-h2 mb-2">No groups yet</h2>
            </div>
        </div>
    );
}

export { GroupEmptyState };

function GroupSelectCheckbox({
    groupId,
    checked,
    onToggle,
    idPrefix = 'groupCheck',
}: {
    groupId: string;
    checked: boolean;
    onToggle?: (groupId: string) => void;
    idPrefix?: string;
}) {
    const inputId = `${idPrefix}${groupId}`;
    return (
        <div className="checkbox-custom table-check contacts-select-checkbox">
            <input
                className="list-child"
                type="checkbox"
                id={inputId}
                name="group-checkbox"
                checked={checked}
                disabled={!onToggle}
                onChange={() => onToggle?.(groupId)}
                aria-label="Select group"
            />
            <label htmlFor={inputId} className="label-text" />
        </div>
    );
}

function GroupActions({
    group,
    onEdit,
    onDelete,
}: {
    group: ContactGroup;
    onEdit: (group: ContactGroup) => void;
    onDelete: (group: ContactGroup) => void;
}) {
    return (
        <div className="d-flex align-items-center justify-content-end contact-actions">
            <a
                href="#"
                className="hover-link d-flex align-items-center me-2"
                onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onEdit(group);
                }}
                aria-label={`Edit ${group.name}`}
            >
                <InteractiveIcon
                    defaultIcon={editIcon}
                    hoverIcon={editIconHover}
                    activeIcon=""
                    isActive={false}
                    alt=""
                    className="interactive-icon hover-image"
                    renderAs="img"
                    tooltip="Edit"
                />
            </a>
            <a
                href="#"
                className="hover-link d-flex align-items-center"
                onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onDelete(group);
                }}
                aria-label={`Delete ${group.name}`}
            >
                <InteractiveIcon
                    defaultIcon={deleteIcon}
                    hoverIcon={deleteIconHover}
                    activeIcon=""
                    isActive={false}
                    alt=""
                    className="interactive-icon hover-image"
                    renderAs="img"
                    tooltip="Delete"
                />
            </a>
        </div>
    );
}

function GroupMobileList({
    groups,
    isLoading,
    startIndex,
    onOpen,
    onEdit,
    onDelete,
    selectedIds,
    onToggleSelect,
}: GroupListProps) {
    if (isLoading) {
        return (
            <div className="contacts-mobile-list">
                <div className="contacts-mobile-status text-center py-4 fs-12-commom">
                    Loading groups...
                </div>
            </div>
        );
    }

    if (groups.length === 0) {
        return (
            <div className="contacts-mobile-list">
                <div className="contacts-mobile-status text-center py-4">
                    <GroupEmptyState />
                </div>
            </div>
        );
    }

    return (
        <div className="contacts-mobile-list" role="list">
            {groups.map((group, index) => {
                const isSelected = selectedIds?.has(group._id) ?? false;
                const memberNames = getGroupMemberNames(group);

                return (
                    <article
                        key={group._id}
                        className={`contact-mobile-item${isSelected ? ' is-selected' : ''}`}
                        role="listitem"
                    >
                        <div className="contact-mobile-item__header">
                            <div className="contact-mobile-item__identity">
                                <GroupSelectCheckbox
                                    groupId={group._id}
                                    checked={isSelected}
                                    onToggle={onToggleSelect}
                                    idPrefix="groupMobileCheck"
                                />
                                <span className="contact-mobile-item__index">
                                    {startIndex + index}
                                </span>
                                <button
                                    type="button"
                                    className="contact-mobile-item__name contacts-group-open-btn"
                                    onClick={() => onOpen(group)}
                                >
                                    {group.name}
                                </button>
                            </div>
                            <GroupActions
                                group={group}
                                onEdit={onEdit}
                                onDelete={onDelete}
                            />
                        </div>
                        <div className="contact-mobile-item__fields-wrapper">
                            <dl className="contact-mobile-item__fields">
                                <div className="contact-mobile-item__field">
                                    <dt className="fs-12-commom">Members</dt>
                                    <dd>
                                        <MultiValueCell values={memberNames} label="Members" />
                                    </dd>
                                </div>
                            </dl>
                        </div>
                    </article>
                );
            })}
        </div>
    );
}

function GroupList({
    groups,
    isLoading,
    startIndex,
    onOpen,
    onEdit,
    onDelete,
    layout = 'table',
    selectedIds,
    onToggleSelect,
}: GroupListProps) {
    if (layout === 'mobile') {
        return (
            <GroupMobileList
                groups={groups}
                isLoading={isLoading}
                startIndex={startIndex}
                onOpen={onOpen}
                onEdit={onEdit}
                onDelete={onDelete}
                selectedIds={selectedIds}
                onToggleSelect={onToggleSelect}
            />
        );
    }

    if (isLoading) {
        return (
            <tr className="contacts-table-status-row">
                <td colSpan={GROUP_TABLE_COLSPAN} className="text-center py-4 fs-12-commom">
                    Loading groups...
                </td>
            </tr>
        );
    }

    if (groups.length === 0) {
        return null;
    }

    return (
        <>
            {groups.map((group, index) => {
                const isSelected = selectedIds?.has(group._id) ?? false;
                const memberNames = getGroupMemberNames(group);

                return (
                    <tr
                        className={`blue-line-aft contacts-group-row${isSelected ? ' is-selected' : ''}`}
                        key={group._id}
                        onClick={() => onOpen(group)}
                    >
                        <td
                            className="contacts-table__select"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <GroupSelectCheckbox
                                groupId={group._id}
                                checked={isSelected}
                                onToggle={onToggleSelect}
                            />
                        </td>
                        <td>{startIndex + index}</td>
                        <td className="contacts-table__name">
                            <button
                                type="button"
                                className="contacts-group-open-btn"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onOpen(group);
                                }}
                            >
                                {group.name}
                            </button>
                        </td>
                        <td onClick={(e) => e.stopPropagation()}>
                            <MultiValueCell values={memberNames} label="Members" />
                        </td>
                        <td onClick={(e) => e.stopPropagation()}>
                            <GroupActions
                                group={group}
                                onEdit={onEdit}
                                onDelete={onDelete}
                            />
                        </td>
                    </tr>
                );
            })}
        </>
    );
}

export default GroupList;
