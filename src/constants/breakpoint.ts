export const BREAKPOINTS = {
    mobileSmall: 425,
    mobile: 575,
    tablet: 768,
    laptop: 992,
    desktop: 1200,
} as const;
export type ScreenType = "mobileSmall" | "mobile" | "tablet" | "laptop" | "desktop";