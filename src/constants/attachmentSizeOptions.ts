export const ATTACHMENT_SIZE_OPTIONS = [
    { label: 'Small (0-1 MB)', value: 'Small (0-1 MB)', apiType: 'small' },
    { label: 'Medium (1-5 MB)', value: 'Medium (1-5 MB)', apiType: 'medium' },
    { label: 'Large (5-25 MB)', value: 'Large (5-25 MB)', apiType: 'large' },
] as const;

export type AttachmentSizeLabel = (typeof ATTACHMENT_SIZE_OPTIONS)[number]['value'];
export type AttachmentSizeApiType = (typeof ATTACHMENT_SIZE_OPTIONS)[number]['apiType'];

const LABEL_TO_API_TYPE = Object.fromEntries(
    ATTACHMENT_SIZE_OPTIONS.map((opt) => [opt.value, opt.apiType])
) as Record<AttachmentSizeLabel, AttachmentSizeApiType>;

const API_TYPE_TO_LABEL = Object.fromEntries(
    ATTACHMENT_SIZE_OPTIONS.map((opt) => [opt.apiType, opt.value])
) as Record<AttachmentSizeApiType, AttachmentSizeLabel>;

export const ATTACHMENT_SIZE_LABELS = ATTACHMENT_SIZE_OPTIONS.map((opt) => opt.value);

export function attachmentSizeLabelToApiType(
    label: string | undefined
): AttachmentSizeApiType | undefined {
    if (!label) return undefined;
    return LABEL_TO_API_TYPE[label as AttachmentSizeLabel];
}

export function attachmentSizeApiTypeToLabel(
    apiType: string | undefined
): AttachmentSizeLabel | undefined {
    if (!apiType) return undefined;
    return API_TYPE_TO_LABEL[apiType as AttachmentSizeApiType];
}

export function isValidAttachmentSizeLabel(label: string): label is AttachmentSizeLabel {
    return ATTACHMENT_SIZE_LABELS.includes(label as AttachmentSizeLabel);
}
