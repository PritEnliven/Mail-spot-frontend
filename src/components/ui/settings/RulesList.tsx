import React from 'react';
import editIcon from "@images/edit2-icon.svg"
import editIconHover from "@images/edit2-icon-hover.svg"
import deleteIcon from "@images/trash-icon.svg"
import deleteIconHover from "@images/trash-icon-hover.svg"
import { formatDate, TimeFormat } from '@utils/dateUtil';
import InteractiveIcon from '../InteractiveIcon';

interface RangeValue {
    min?: number;
    max?: number;
    start?: string;
    end?: string;
}

type ConditionValue = string | number | boolean | string[] | RangeValue | null;

interface Condition {
    field: string;
    operator: string;
    value: ConditionValue;
}

interface Action {
    type: string;
    value?: string;
    folderKey?: string;
}

interface Rule {
    _id: string;
    conditions: Condition[];
    actions: Action[];
    logic: 'AND' | 'OR';
}

interface RulesListProps {
    rules: Rule[];
    onEdit?: (id: string) => void;
    onDelete?: (id: string) => void;
}

const fieldMap: Record<string, string> = {
    from: 'From',
    to: 'To',
    subject: 'Subject',
    size: 'Size',
    receivedAt: 'Received',
    hasAttachments: 'Attachments',
};

const operatorMap: Record<string, string> = {
    equals: 'equals',
    notEquals: 'does not equal',
    contains: 'contains',
    notContains: 'does not contain',
    startsWith: 'starts with',
    endsWith: 'ends with',
    in: 'is in',
    notIn: 'is not in',
    range: 'is',
};

const formatBytes = (bytes: number): string => {
    if (!Number.isFinite(bytes)) return '';
    const units = ['B', 'KB', 'MB', 'GB'];
    let size = bytes;
    let unitIndex = 0;
    while (size >= 1024 && unitIndex < units.length - 1) {
        size /= 1024;
        unitIndex++;
    }
    return `${Number(size.toFixed(size % 1 === 0 ? 0 : 1))} ${units[unitIndex]}`;
};

const isRangeValue = (value: ConditionValue): value is RangeValue =>
    typeof value === 'object' && value !== null && !Array.isArray(value);

const formatRange = (field: string, range: RangeValue): string => {
    const isDateRange = range.start !== undefined || range.end !== undefined;

    const format = (input: number | string | undefined): string => {
        if (input === undefined || input === null || input === '') return '';
        return isDateRange
            ? String(formatDate(String(input), TimeFormat.DD_MM_YYYY))
            : formatBytes(Number(input));
    };

    const start = format(isDateRange ? range.start : range.min);
    const end = format(isDateRange ? range.end : range.max);

    if (start && end) return `between ${start} and ${end}`;
    if (start) return isDateRange ? `on or after ${start}` : `more than ${start}`;
    if (end) return isDateRange ? `on or before ${end}` : `less than ${end}`;
    return `${fieldMap[field] || field} range`;
};

const formatConditionValue = (field: string, value: ConditionValue): string => {
    if (value === null || value === undefined) return '';
    if (Array.isArray(value)) return value.join(', ');
    if (isRangeValue(value)) return formatRange(field, value);
    if (typeof value === 'boolean') return value ? 'yes' : 'no';
    return String(value);
};

const formatCondition = (condition: Condition): string => {
    if (!condition) return '';
    const { field, operator, value } = condition;

    const label = fieldMap[field] || field;
    const displayValue = formatConditionValue(field, value);
    const operatorLabel = operatorMap[operator] || operator;

    return `${label} ${operatorLabel} ${displayValue}`.replace(/\s+/g, ' ').trim();
};

const formatFolderName = (folder: string): string => folder.replace(/^INBOX\./, '');

const formatAction = (action: Action): string => {
    if (!action) return '';
    const { type, value, folderKey } = action;

    switch (type) {
        case 'markAsRead':
            return value ? 'Mark as read' : 'Mark as unread';
        case 'moveToFolder': {
            const folder = folderKey || value;
            return `Move to ${folder ? formatFolderName(folder) : 'folder'}`;
        }
        case 'label':
            return `Add label: ${value || ''}`;
        case 'forwardTo':
            return `Forward to ${value || 'email'}`;
        default:
            return type;
    }
};

const RulesList: React.FC<RulesListProps> = ({ rules = [], onEdit, onDelete }) => {
    if (!rules || rules.length === 0) {
        return (
            <div className="w-100 text-center p-3 fs-12-commom">No rules found.</div>
        );
    }

    return (
        <div id="rulesList">
            <div className="form-group form-row">
                <label className="control-label">The following rules are applied to all incoming mail:</label>
            </div>

            {rules.map((rule) => {
                const conditionText = rule.conditions?.length
                    ? rule.conditions.map(c => formatCondition(c)).join(` ${rule.logic} `)
                    : 'No conditions';

                const actionsText = rule.actions?.length
                    ? rule.actions.map(a => formatAction(a)).join(', ')
                    : 'No actions';

                return (
                    <div key={rule._id} className="single-filter-blocked-box">
                        <div className="d-flex align-items-center justify-content-between w-100">
                            <div className="d-block">
                                <p className="m-0">
                                    <span className="fs-12-commom me-1">Matches:</span>
                                    <span className="fs-12-commom"><strong>{conditionText}</strong></span>
                                </p>
                                <span className="fs-12-commom">Do this: {actionsText}</span>
                            </div>
                            <div className="d-flex align-items-center justify-content-end">
                                <a
                                    className="hover-link d-flex align-items-center me-2 border-0 bg-transparent d-none icon-hover-effect"
                                    onClick={() => onEdit?.(rule._id)}
                                    data-bs-toggle="tooltip"
                                    data-bs-placement="top"
                                    data-bs-custom-class="custom-tooltip"
                                    title="Edit"
                                >
                                    <InteractiveIcon
                                        defaultIcon={editIcon}
                                        hoverIcon={editIconHover}
                                        activeIcon=""
                                        isActive={false}
                                        alt=""
                                        className="interactive-icon hover-image"
                                        renderAs="img"
                                        tooltip=""
                                    />
                                </a>
                                <a
                                    className="hover-link d-flex align-items-center icon-hover-effect"
                                    onClick={() => onDelete?.(rule._id)}
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
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

export default RulesList;