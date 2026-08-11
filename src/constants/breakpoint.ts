export const BREAKPOINTS = {
    extraSmall: 425,
    mobileSmall: 575,
    mobile: 769,
    /** Force modal backdrop at this width and below */
    modalBackdrop: 575,
    tablet: 992,
    /** Reply/forward footer: collapse Generate/Schedule into ⋮ menu */
    composeActionsCompact: 1100,
    desktop: 1200,
} as const;
export type ScreenType = "extraSmall" |"mobileSmall" | "mobile" | "tablet" | "desktop";