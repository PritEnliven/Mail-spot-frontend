export const BREAKPOINTS = {
    mobile: 0,
    tablet: 768,
    laptop: 1024,
    desktop: 1280,
} as const;

export type ScreenType = "mobile" | "tablet" | "laptop" | "desktop";