// context/ScreenContext.tsx

import { createContext, useContext } from "react";
import { useResponsive } from "../hooks/useResponsive";

type ScreenContextType = ReturnType<typeof useResponsive>;

const ScreenContext = createContext<ScreenContextType | null>(null);

export const ScreenProvider = ({ children }: { children: React.ReactNode }) => {
    const responsive = useResponsive();
    return (
        <ScreenContext.Provider value={responsive}>
            {children}
        </ScreenContext.Provider>
    );
};

// Custom hook (clean API)
export const useScreen = () => {
    const context = useContext(ScreenContext);

    if (!context) {
        throw new Error("useScreen must be used within ScreenProvider");
    }

    return context;
};