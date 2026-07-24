export const BREAKPOINTS = {
    extraSmall: 425,
    mobileSmall: 575,
    mobile: 768,
    /** Force modal backdrop at this width and below */
    modalBackdrop: 575,
    tablet: 992,
    desktop: 1200,
} as const;
export type ScreenType = "extraSmall" |"mobileSmall" | "mobile" | "tablet" | "desktop";