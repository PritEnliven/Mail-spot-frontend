/** Max nesting depth (0-based). Depth 0 = top-level custom folder. 5 levels ⇒ depths 0–4. */
export const MAX_CUSTOM_FOLDER_DEPTH = 4;

/** Human-readable max levels (root + nested). */
export const MAX_CUSTOM_FOLDER_LEVELS = MAX_CUSTOM_FOLDER_DEPTH + 1;

export const CUSTOM_FOLDER_DEPTH_LIMIT_MESSAGE =
    `Folders can be nested up to ${MAX_CUSTOM_FOLDER_LEVELS} levels deep.`;

export const NO_PARENT_FOLDER_VALUE = 'noFolderSelect';
