import React, { useState } from "react";


interface InteractiveIconProps {
    defaultIcon: string;
    hoverIcon?: string;
    activeIcon?: string;
    isActive?: boolean;
    alt?: string;
    className?: string;
    onClick?: () => void;
    renderAs?: "img" | "a";
    tooltip?: string;
    customStyle?: React.CSSProperties;
}

const InteractiveIcon = ({
    defaultIcon,
    hoverIcon,
    activeIcon,
    isActive = false,
    alt = "",
    className = "",
    onClick,
    renderAs = "img",
    tooltip = "",
    customStyle = {}
}: InteractiveIconProps) => {
    const [isHovered, setIsHovered] = useState(false);

    const resolveIcon = () => {
        if (isActive && activeIcon) return activeIcon;
        if (isHovered && hoverIcon) return hoverIcon;
        return defaultIcon;
    };

    const Component = renderAs;

    return (
        <Component
            src={resolveIcon()}
            alt={alt}
            data-hover-icon={hoverIcon}
            className={className}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            onClick={onClick}
            style={{ cursor: "pointer", ...customStyle }}
            {...(tooltip
                ? {
                    "data-tooltip-id": "my-tooltip",
                    "data-tooltip-content": tooltip,
                    "data-tooltip-place": "top"
                }
                : {})
            }
        />
    );
};

export default InteractiveIcon;
