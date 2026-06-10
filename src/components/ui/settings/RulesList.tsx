import React from 'react';
import editIcon from "@images/edit2-icon.svg"
import editIconHover from "@images/edit2-icon-hover.svg"
import deleteIcon from "@images/trash-icon.svg"
import deleteIconHover from "@images/trash-icon-hover.svg"
import InteractiveIcon from '../InteractiveIcon';

interface Condition {
    field: string;
    operator: string;
    value: string | string[];
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

const formatCondition = (condition: Condition): string => {
    if (!condition) return '';
    const { field, operator, value } = condition;
    const operatorMap: Record<string, string> = {
        'equals': 'equals',
        'notEquals': 'does not equal',
        'contains': 'contains',
        'notContains': 'does not contain',
        'startsWith': 'starts with',
        'endsWith': 'ends with',
        'in': 'is in',
        'notIn': 'is not in'
    };

    const displayValue = Array.isArray(value) ? value.join(', ') : value;
    return `${field} ${operatorMap[operator] || operator} ${displayValue}`;
};

const formatAction = (action: Action): string => {
    if (!action) return '';
    const { type, value, folderKey } = action;

    switch (type) {
        case 'markAsRead':
            return value ? 'Mark as read' : 'Mark as unread';
        case 'moveToFolder':
            return `Move to ${folderKey || value || 'folder'}`;
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