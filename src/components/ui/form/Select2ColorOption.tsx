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








import Select, { components, type SingleValue } from "react-select";
import { DropdownIndicator, getSelectStyles } from "./Select2Wrapper";
import React, { useState, useEffect } from "react";

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

// ---------- helper hook ----------
const useIsMobile = (breakpoint: number = 575) => {
    const [isMobile, setIsMobile] = useState(
        typeof window !== 'undefined' ? window.innerWidth < breakpoint : false
    );

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < breakpoint);
        window.addEventListener('resize', handleResize);
        handleResize();
        return () => window.removeEventListener('resize', handleResize);
    }, [breakpoint]);

    return isMobile;
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
    const isMobile = useIsMobile();

    const defaultColor = React.useMemo(() => {
        return options?.find(option => option.default) || options?.[0] || null;
    }, [options]);

    const selectedValue = value !== undefined && value !== null ? value : defaultColor

    return (
        <Select
            isMulti={false}
            options={options}
            value={selectedValue}
            isSearchable={true}
            // menuIsOpen={true}
            onChange={(val: SingleValue<ColorOption>) => onChange(val)}
            isDisabled={isDisabled}
            placeholder={placeholder}
            menuPortalTarget={isMobile ? null : document.body}
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