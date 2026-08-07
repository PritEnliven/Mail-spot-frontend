// import Select, { components, type SingleValue } from "react-select";
// import { DropdownIndicator, getSelectStyles } from "./Select2Wrapper";
// import React, { useState, useEffect } from "react";

// export interface ColorOption {
//     value: string;
//     label: string;
//     color: string;
//     default?: boolean;
// }

// interface ColorSingleSelectProps {
//     value: ColorOption | null;
//     options: ColorOption[];
//     onChange: (value: ColorOption | null) => void;
//     placeholder?: string;
//     isDisabled?: boolean;
// }

// // ---------- helper hook ----------
// const useIsMobile = (breakpoint: number = 575) => {
//     const [isMobile, setIsMobile] = useState(
//         typeof window !== 'undefined' ? window.innerWidth < breakpoint : false
//     );

//     useEffect(() => {
//         const handleResize = () => setIsMobile(window.innerWidth < breakpoint);
//         window.addEventListener('resize', handleResize);
//         handleResize();
//         return () => window.removeEventListener('resize', handleResize);
//     }, [breakpoint]);

//     return isMobile;
// };

// const ColorOptionComponent = (props: any) => {
//     const { data } = props;

//     return (
//         <components.Option {...props}>
//             <span
//                 style={{
//                     width: 16,
//                     height: 16,
//                     borderRadius: "50%",
//                     backgroundColor: data.color,
//                     display: "inline-block",
//                 }}
//             />
//         </components.Option>
//     );
// };

// const ColorSingleValue = (props: any) => {
//     const { data, children, ...rest } = props;

//     return (
//         <components.SingleValue {...rest}>
//             <div style={{
//                 display: "flex",
//                 alignItems: "center",
//                 gap: "6px",
//                 height: "100%",
//             }}>
//                 <span
//                     style={{
//                         width: 16,
//                         height: 16,
//                         borderRadius: "50%",
//                         backgroundColor: data.color,
//                         display: "inline-block"
//                     }}
//                 />
//             </div>
//         </components.SingleValue>
//     );
// };

// const ColorSingleSelect = ({
//     value,
//     options,
//     onChange,
//     placeholder = "",
//     isDisabled = false,
// }: ColorSingleSelectProps) => {
//     const isMobile = useIsMobile();

//     const defaultColor = React.useMemo(() => {
//         return options?.find(option => option.default) || options?.[0] || null;
//     }, [options]);

//     const selectedValue = value !== undefined && value !== null ? value : defaultColor

//     return (
//         <Select
//             isMulti={false}
//             options={options}
//             value={selectedValue}
//             isSearchable={true}
//             onChange={(val: SingleValue<ColorOption>) => onChange(val)}
//             isDisabled={isDisabled}
//             placeholder={placeholder}
//             menuPlacement="auto"
//             menuPortalTarget={typeof document !== "undefined" ? document.body : undefined}
//             menuPosition="fixed"
//             styles={getSelectStyles("single", "select2ColorOption", true) as any}
//             components={{
//                 Option: ColorOptionComponent,
//                 SingleValue: ColorSingleValue,
//                 DropdownIndicator,
//             }}
//         />
//     );
// };

// export default ColorSingleSelect;








// import Select, { components, type SingleValue } from "react-select";
// import { DropdownIndicator, getSelectStyles } from "./Select2Wrapper";
// import React, { useState, useEffect } from "react";

// export interface ColorOption {
//     value: string;
//     label: string;
//     color: string;
//     default?: boolean;
// }

// interface ColorSingleSelectProps {
//     value: ColorOption | null;
//     options: ColorOption[];
//     onChange: (value: ColorOption | null) => void;
//     placeholder?: string;
//     isDisabled?: boolean;
// }

// // ---------- helper hook ----------
// const useIsMobile = (breakpoint: number = 575) => {
//     const [isMobile, setIsMobile] = useState(
//         typeof window !== 'undefined' ? window.innerWidth < breakpoint : false
//     );

//     useEffect(() => {
//         const handleResize = () => setIsMobile(window.innerWidth < breakpoint);
//         window.addEventListener('resize', handleResize);
//         handleResize();
//         return () => window.removeEventListener('resize', handleResize);
//     }, [breakpoint]);

//     return isMobile;
// };

// const ColorOptionComponent = (props: any) => {
//     const { data } = props;

//     return (
//         <components.Option {...props}>
//             <span
//                 style={{
//                     width: 16,
//                     height: 16,
//                     borderRadius: "50%",
//                     backgroundColor: data.color,
//                     display: "inline-block",
//                 }}
//             />
//         </components.Option>
//     );
// };

// const ColorSingleValue = (props: any) => {
//     const { data, children, ...rest } = props;

//     return (
//         <components.SingleValue {...rest}>
//             <div style={{
//                 display: "flex",
//                 alignItems: "center",
//                 gap: "6px",
//                 height: "100%",
//             }}>
//                 <span
//                     style={{
//                         width: 16,
//                         height: 16,
//                         borderRadius: "50%",
//                         backgroundColor: data.color,
//                         display: "inline-block"
//                     }}
//                 />
//             </div>
//         </components.SingleValue>
//     );
// };

// const ColorSingleSelect = ({
//     value,
//     options,
//     onChange,
//     placeholder = "",
//     isDisabled = false,
// }: ColorSingleSelectProps) => {
//     const isMobile = useIsMobile();

//     const defaultColor = React.useMemo(() => {
//         return options?.find(option => option.default) || options?.[0] || null;
//     }, [options]);

//     const selectedValue = value !== undefined && value !== null ? value : defaultColor

//     return (
//         <Select
//             isMulti={false}
//             options={options}
//             value={selectedValue}
//             isSearchable={true}
//             // menuIsOpen={true}
//             onChange={(val: SingleValue<ColorOption>) => onChange(val)}
//             isDisabled={isDisabled}
//             placeholder={placeholder}
//             menuPortalTarget={isMobile ? null : document.body}
//             styles={getSelectStyles("single", "select2ColorOption", false) as any}
//             components={{
//                 Option: ColorOptionComponent,
//                 SingleValue: ColorSingleValue,
//                 DropdownIndicator,
//             }}
//         />
//     );
// };

// export default ColorSingleSelect;


import Select, { components, type SingleValue } from "react-select";
import { DropdownIndicator, getSelectStyles } from "./Select2Wrapper";
import React, { useMemo, useRef, useState } from "react";

export interface ColorOption {
    value: string;
    label: string;
    color: string;
    default?: boolean;
}

interface ColorSingleSelectProps {
    value: ColorOption | null;
    options: ColorOption[];
    onChange: (value: ColorOption | null) => void;
    placeholder?: string;
    isDisabled?: boolean;
}

// ---------- manual menu placement ----------
// react-select's built-in menuPlacement="auto" measures space at mount time,
// which is unreliable inside animated Bootstrap bottom-sheet modals on mobile
// (the modal is still transitioning into position, or the keyboard resizes
// the viewport). This hook measures the real control position the moment the
// menu is about to open, and flips placement to "top" if there isn't enough
// room below.
const MENU_ESTIMATED_HEIGHT = 200; // keep in sync with MenuList's maxHeight

const useMenuPlacement = () => {
    const selectRef = useRef<any>(null);
    const [menuPlacement, setMenuPlacement] = useState<"top" | "bottom">("bottom");

    const handleMenuOpen = () => {
        const instance = selectRef.current;
        const controlEl: HTMLElement | undefined =
            instance?.controlRef ??
            instance?.select?.controlRef ??
            instance?.select?.select?.controlRef;

        if (!controlEl || typeof controlEl.getBoundingClientRect !== "function") {
            setMenuPlacement("bottom");
            return;
        }

        const rect = controlEl.getBoundingClientRect();
        const viewportHeight = window.visualViewport?.height ?? window.innerHeight;
        const spaceBelow = viewportHeight - rect.bottom;
        const spaceAbove = rect.top;

        setMenuPlacement(
            spaceBelow < MENU_ESTIMATED_HEIGHT && spaceAbove > spaceBelow ? "top" : "bottom"
        );
    };

    return { selectRef, menuPlacement, handleMenuOpen };
};

const ColorOptionComponent = (props: any) => {
    const { data } = props;

    return (
        <components.Option {...props}>
            <span
                style={{
                    width: 16,
                    height: 16,
                    borderRadius: "50%",
                    backgroundColor: data.color,
                    display: "inline-block",
                }}
            />
        </components.Option>
    );
};

const ColorSingleValue = (props: any) => {
    const { data, children, ...rest } = props;

    return (
        <components.SingleValue {...rest}>
            <div style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                height: "100%",
            }}>
                <span
                    style={{
                        width: 16,
                        height: 16,
                        borderRadius: "50%",
                        backgroundColor: data.color,
                        display: "inline-block"
                    }}
                />
            </div>
        </components.SingleValue>
    );
};

const ColorSingleSelect = ({
    value,
    options,
    onChange,
    placeholder = "",
    isDisabled = false,
}: ColorSingleSelectProps) => {
    const { selectRef, menuPlacement, handleMenuOpen } = useMenuPlacement();

    const defaultColor = useMemo(() => {
        return options?.find(option => option.default) || options?.[0] || null;
    }, [options]);

    const selectedValue = value !== undefined && value !== null ? value : defaultColor;

    return (
        <Select
            ref={selectRef}
            isMulti={false}
            options={options}
            value={selectedValue}
            isSearchable={true}
            onChange={(val: SingleValue<ColorOption>) => onChange(val)}
            isDisabled={isDisabled}
            placeholder={placeholder}
            menuPortalTarget={typeof document !== "undefined" ? document.body : undefined}
            menuPosition="fixed"
            menuPlacement={menuPlacement}
            onMenuOpen={handleMenuOpen}
            styles={getSelectStyles("single", "select2ColorOption", false) as any}
            components={{
                Option: ColorOptionComponent,
                SingleValue: ColorSingleValue,
                DropdownIndicator,
            }}
        />
    );
};

export default ColorSingleSelect;