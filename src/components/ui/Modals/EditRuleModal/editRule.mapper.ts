import type { CreateRuleFormValues } from '@components/layout/header/createRuleForm/CreateRuleForm.schema';
import { formatCondition, type Action, type Condition, type ConditionValue, type Rule } from '@components/ui/settings/RulesList';
import {
    ATTACHMENT_SIZE_OPTIONS,
    attachmentSizeApiTypeToLabel,
    attachmentSizeLabelToApiType,
    type AttachmentSizeLabel,
} from '@constants/attachmentSizeOptions';
import { formatDate, TimeFormat } from '@utils/dateUtil';
import moment from 'moment';
import type { EditRuleFormValues } from './editRule.schema';

const KNOWN_ACTION_TYPES = new Set([
    'markAsRead',
    'moveToFolder',
    'label',
    'forwardTo',
    'deleteIt',
    'delete',
    'neverSendToSpam',
]);

const EDITABLE_CONDITION_FIELDS = new Set(['from', 'to', 'subject', 'size', 'receivedAt']);
const MB = 1024 * 1024;

const SIZE_BUCKETS: Array<{ label: AttachmentSizeLabel; apiType: string; min: number; max: number }> = [
    { label: ATTACHMENT_SIZE_OPTIONS[0].value, apiType: 'small', min: 0, max: 1 * MB },
    { label: ATTACHMENT_SIZE_OPTIONS[1].value, apiType: 'medium', min: 1 * MB, max: 5 * MB },
    { label: ATTACHMENT_SIZE_OPTIONS[2].value, apiType: 'large', min: 5 * MB, max: 25 * MB },
];

interface LabelOption {
    value: string;
    label: string;
}

export const emptyCreateRuleFormValues = (): CreateRuleFormValues => ({
    markAsRead: false,
    moveToFolder: false,
    selectedFolder: '',
    forwardIt: false,
    forwardEmails: [],
    deleteIt: false,
    applyTheLabel: false,
    neverSendToSpam: false,
});

export const emptyEditRuleFormValues = (): EditRuleFormValues => ({
    ...emptyCreateRuleFormValues(),
    from: [],
    to: [],
    subject: '',
    attachmentSize: undefined,
    dateRange: [],
});

const toStringList = (value: ConditionValue): string[] => {
    if (value === null || value === undefined) return [];
    if (Array.isArray(value)) return value.map(String).map((item) => item.trim()).filter(Boolean);
    if (typeof value === 'object') return [];
    if (typeof value === 'boolean') return [];
    return String(value)
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean);
};

const parseConditionDate = (value: string | undefined): Date | undefined => {
    if (!value) return undefined;
    const parsed = moment(value, ['YYYY-MM-DD', 'DD/MM/YYYY', 'DD-MM-YYYY', moment.ISO_8601], true);
    return parsed.isValid() ? parsed.toDate() : undefined;
};

const sizeLabelFromCondition = (condition: Condition): AttachmentSizeLabel | undefined => {
    const { value } = condition;
    if (typeof value === 'string') {
        return attachmentSizeApiTypeToLabel(value) || (ATTACHMENT_SIZE_OPTIONS.find((opt) => opt.value === value)?.value);
    }
    if (typeof value === 'number') {
        return SIZE_BUCKETS.find((bucket) => value >= bucket.min && value < bucket.max)?.label
            || SIZE_BUCKETS[SIZE_BUCKETS.length - 1].label;
    }
    if (value && typeof value === 'object' && !Array.isArray(value)) {
        const max = Number(value.max);
        if (!Number.isFinite(max)) return undefined;
        return SIZE_BUCKETS.find((bucket) => max <= bucket.max)?.label || SIZE_BUCKETS[SIZE_BUCKETS.length - 1].label;
    }
    return undefined;
};

const dateRangeFromCondition = (condition: Condition): Date[] | undefined => {
    const { value } = condition;
    if (typeof value === 'string') {
        const parts = value.split(/\s+to\s+/i).map((part) => part.trim()).filter(Boolean);
        const dates = parts.map(parseConditionDate).filter((date): date is Date => Boolean(date));
        return dates.length ? dates : undefined;
    }
    if (value && typeof value === 'object' && !Array.isArray(value)) {
        const start = parseConditionDate(value.start);
        const end = parseConditionDate(value.end);
        if (start && end) return [start, end];
        if (start) return [start];
        if (end) return [end];
    }
    return undefined;
};

export const formValuesFromConditions = (conditions: Condition[] = []): Partial<EditRuleFormValues> => {
    const from: string[] = [];
    const to: string[] = [];
    let subject = '';
    let attachmentSize: AttachmentSizeLabel | undefined;
    let dateRange: Date[] | undefined;

    for (const condition of conditions) {
        switch (condition.field) {
            case 'from':
                from.push(...toStringList(condition.value));
                break;
            case 'to':
                to.push(...toStringList(condition.value));
                break;
            case 'subject':
                if (!subject) subject = toStringList(condition.value).join(', ');
                break;
            case 'size':
                if (!attachmentSize) attachmentSize = sizeLabelFromCondition(condition);
                break;
            case 'receivedAt':
                if (!dateRange) dateRange = dateRangeFromCondition(condition);
                break;
            default:
                break;
        }
    }

    return {
        from: [...new Set(from)],
        to: [...new Set(to)],
        subject,
        attachmentSize,
        dateRange: dateRange || [],
    };
};

const buildEmailCondition = (field: 'from' | 'to', values: string[], original?: Condition): Condition => {
    if (values.length > 1) {
        return { field, operator: original?.operator === 'in' || !original ? 'in' : original.operator, value: values };
    }
    return {
        field,
        operator: original?.operator && original.operator !== 'in' ? original.operator : 'contains',
        value: values[0],
    };
};

export const conditionsFromFormValues = (
    form: EditRuleFormValues,
    originalConditions: Condition[] = [],
): Condition[] => {
    const next: Condition[] = [];
    const originalFrom = originalConditions.find((condition) => condition.field === 'from');
    const originalTo = originalConditions.find((condition) => condition.field === 'to');
    const originalSubject = originalConditions.find((condition) => condition.field === 'subject');
    const originalSize = originalConditions.find((condition) => condition.field === 'size');

    if (form.from?.length) {
        next.push(buildEmailCondition('from', form.from, originalFrom));
    }
    if (form.to?.length) {
        next.push(buildEmailCondition('to', form.to, originalTo));
    }
    if (form.subject?.trim()) {
        next.push({
            field: 'subject',
            operator: originalSubject?.operator || 'contains',
            value: form.subject.trim(),
        });
    }
    if (form.attachmentSize) {
        const bucket = SIZE_BUCKETS.find((item) => item.label === form.attachmentSize);
        if (bucket) {
            next.push({
                field: 'size',
                operator: originalSize?.operator || 'range',
                value: originalSize?.operator && originalSize.operator !== 'range'
                    ? attachmentSizeLabelToApiType(bucket.label)
                    : { min: bucket.min, max: bucket.max },
            });
        }
    }
    if (form.dateRange?.length) {
        const dates = form.dateRange.filter((date): date is Date => date instanceof Date);
        if (dates.length) {
            const start = formatDate(dates[0], TimeFormat.YYYYMMDD) as string;
            const end = formatDate(dates[dates.length - 1], TimeFormat.YYYYMMDD) as string;
            next.push({
                field: 'receivedAt',
                operator: 'range',
                value: { start, end },
            });
        }
    }

    const preserved = originalConditions.filter((condition) => !EDITABLE_CONDITION_FIELDS.has(condition.field));
    return [...next, ...preserved];
};

export const formValuesFromActions = (actions: Action[] = []): CreateRuleFormValues => {
    const values = emptyCreateRuleFormValues();
    const forwardEmails: string[] = [];

    for (const action of actions) {
        switch (action.type) {
            case 'markAsRead':
                values.markAsRead = action.value !== 'false' && Boolean(action.value ?? true);
                break;
            case 'moveToFolder':
            case 'label':
                values.moveToFolder = true;
                values.selectedFolder = action.folderKey || action.value || '';
                break;
            case 'forwardTo':
                if (action.value) {
                    forwardEmails.push(action.value);
                }
                break;
            case 'deleteIt':
            case 'delete':
                values.deleteIt = true;
                break;
            case 'neverSendToSpam':
                values.neverSendToSpam = true;
                break;
            default:
                break;
        }
    }

    if (forwardEmails.length > 0) {
        values.forwardIt = true;
        values.forwardEmails = forwardEmails;
    }

    return values;
};

export const formValuesFromRule = (rule: Rule): EditRuleFormValues => ({
    ...emptyEditRuleFormValues(),
    ...formValuesFromActions(rule.actions),
    ...formValuesFromConditions(rule.conditions),
});

export const actionsFromFormValues = (
    form: CreateRuleFormValues,
    originalActions: Action[] = [],
    folderOptions: LabelOption[] = [],
): Action[] => {
    const next: Action[] = [];
    const originalFolderType = originalActions.find(
        (action) => action.type === 'moveToFolder' || action.type === 'label',
    )?.type ?? 'moveToFolder';
    const originalDeleteType = originalActions.find(
        (action) => action.type === 'deleteIt' || action.type === 'delete',
    )?.type ?? 'deleteIt';

    if (form.markAsRead) {
        next.push({ type: 'markAsRead', value: 'true' });
    }

    if (form.moveToFolder && form.selectedFolder) {
        const folderLabel =
            folderOptions.find((option) => option.value === form.selectedFolder)?.label
            || form.selectedFolder;
        next.push({
            type: originalFolderType,
            folderKey: form.selectedFolder,
            value: folderLabel,
        });
    }

    if (form.forwardIt) {
        for (const email of form.forwardEmails) {
            next.push({ type: 'forwardTo', value: email });
        }
    }

    if (form.deleteIt) {
        next.push({ type: originalDeleteType });
    }

    if (form.neverSendToSpam) {
        next.push({ type: 'neverSendToSpam' });
    }

    const unknownActions = originalActions.filter((action) => !KNOWN_ACTION_TYPES.has(action.type));
    return [...next, ...unknownActions];
};

export const buildRuleName = (rule: Rule, conditions: Condition[] = rule.conditions): string => {
    if (rule.name?.trim()) return rule.name.trim();
    const firstCondition = conditions?.[0];
    if (firstCondition) {
        const summary = formatCondition(firstCondition);
        if (summary) return summary;
    }
    return 'Filter';
};

export const matchesSummary = (conditions: Condition[] = [], logic: Rule['logic'] = 'AND'): string => {
    if (!conditions.length) return 'No conditions';
    return conditions.map((condition) => formatCondition(condition)).join(` ${logic || 'AND'} `);
};
