// import { useEffect, useState } from "react";
// import { BREAKPOINTS, type ScreenType } from "../constants/breakpoint";

// const getScreenType = (width: number): ScreenType => {
//     if (width >= BREAKPOINTS.desktop) return "desktop";
//     if (width >= BREAKPOINTS.laptop) return "laptop";
//     if (width >= BREAKPOINTS.tablet) return "tablet";
//     if (width > BREAKPOINTS.mobile) return "mobile";
//     return "mobileSmall";
// };

// export const useResponsive = () => {
//     const [screenType, setScreenType] = useState<ScreenType>(() => {
//         if (typeof window === "undefined") return "desktop"; // SSR fallback
//         return getScreenType(window.innerWidth);
//     });

//     useEffect(() => {
//         let ticking = false;

//         const handleResize = () => {
//             if (!ticking) {
//                 window.requestAnimationFrame(() => {
//                     const newType = getScreenType(window.innerWidth);

//                     setScreenType((prev: ScreenType) => (prev !== newType ? newType : prev));

//                     ticking = false;
//                 });

//                 ticking = true;
//             }
//         };

//         window.addEventListener("resize", handleResize);
//         return () => window.removeEventListener("resize", handleResize);
//     }, []);

//     return {
//         isTrueMobile: screenType === "mobileSmall",
//         isMobile: screenType === "mobileSmall" || screenType === "mobile" || screenType === "tablet",
//         isDesktop: screenType === "laptop" || screenType === "desktop",
//         screenType
//     };
// };

import { useEffect, useState } from "react";
import { BREAKPOINTS, type ScreenType } from "../constants/breakpoint";

const getScreenType = (): ScreenType => {
    const width = window.innerWidth;

    if (width >= BREAKPOINTS.desktop || width > BREAKPOINTS.tablet) return "desktop";
    if (width >= BREAKPOINTS.mobile && width < BREAKPOINTS.tablet) return "tablet";
    if (width < BREAKPOINTS.mobile && width >= BREAKPOINTS.mobileSmall) return "mobile";
    if (width >= BREAKPOINTS.extraSmall && width < BREAKPOINTS.mobileSmall) return "mobileSmall";
    return "extraSmall";
};

export const useResponsive = () => {
    const [screenType, setScreenType] = useState<ScreenType>(() => {
        if (typeof window === "undefined") return "desktop";
        return getScreenType();
    });

    useEffect(() => {
        let ticking = false;

        const handleResize = () => {
            if (!ticking) {
                ticking = true;
                window.requestAnimationFrame(() => {
                    const newType = getScreenType();
                    setScreenType((prev) => (prev !== newType ? newType : prev));
                    ticking = false;
                });
            }
        };

        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    return {
        isTrueMobile: screenType === "extraSmall",
        isMobileSmall: screenType === "mobileSmall",
        isTablet: screenType === "tablet",
        isDesktop: screenType === "desktop",
        // ✅ only true below 575 (mobileSmall + extraSmall)
        isMobile: screenType === "mobileSmall" || screenType === "extraSmall",
        screenType,
    };
};