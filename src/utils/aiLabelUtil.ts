export type AiLabelValue = string | { name?: string; _id?: string; id?: string };

export function getAiLabelName(label: AiLabelValue): string {
    if (typeof label === 'string') return label.trim();
    return String(label?.name || '').trim();
}

export function normalizeAiLabelNames(labels: AiLabelValue[] | undefined | null): string[] {
    return (labels ?? []).map(getAiLabelName).filter(Boolean);
}

/** Drop matching label entries (by display name, case-insensitive). */
export function removeAiLabelFromList(
    labels: AiLabelValue[] | undefined | null,
    labelName: string,
): AiLabelValue[] {
    const target = labelName.trim().toLowerCase();
    if (!target) return labels ? [...labels] : [];
    return (labels ?? []).filter((label) => getAiLabelName(label).toLowerCase() !== target);
}
