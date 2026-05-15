import { useEffect, useState } from "react";
import { BREAKPOINTS, type ScreenType } from "../constants/breakpoint";

const getScreenType = (width: number): ScreenType => {
    if (width >= BREAKPOINTS.desktop) return "desktop";
    if (width >= BREAKPOINTS.laptop) return "laptop";
    if (width >= BREAKPOINTS.tablet) return "tablet";
    return "mobile";
};

export const useResponsive = () => {
    const [screenType, setScreenType] = useState<ScreenType>(() => {
        if (typeof window === "undefined") return "desktop"; // SSR fallback
        return getScreenType(window.innerWidth);
    });

    useEffect(() => {
        let ticking = false;

        const handleResize = () => {
            if (!ticking) {
                window.requestAnimationFrame(() => {
                    const newType = getScreenType(window.innerWidth);

                    setScreenType((prev: ScreenType) => (prev !== newType ? newType : prev));

                    ticking = false;
                });

                ticking = true;
            }
        };

        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    return {
        isMobile: screenType === "mobile" || screenType === "tablet",
        isDesktop: screenType === "laptop" || screenType === "desktop",
    };
};