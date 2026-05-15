import Select2Wrapper, { type SingleOption } from "@components/ui/form/Select2Wrapper";
import { useLayoutEffect, useRef } from "react";

interface MonthDropdownProps {
    anchorEl: HTMLElement;
    currentMonth: number;
    allowedMonths: number[];
    onSelect: (month: number) => void;
}

const MONTHS = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
];

export function MonthDropdown({
    anchorEl,
    currentMonth,
    allowedMonths,
    onSelect
}: MonthDropdownProps) {
    const wrapperRef = useRef<HTMLDivElement>(null);

    useLayoutEffect(() => {
        if (!wrapperRef.current || !anchorEl) return;
        wrapperRef.current.style.width = `${anchorEl.getBoundingClientRect().width}px`;
    }, [anchorEl]);

    const options: SingleOption[] = allowedMonths.map(m => ({
        value: String(m),
        label: MONTHS[m],
    }));

    return (
        <div
            ref={wrapperRef}
            style={{
                position: "relative",
                zIndex: 5000,
                minWidth: "100px",
                fontWeight: 600,
                fontSize: 14,
                color: "#000",
            }}
        >
            <Select2Wrapper
                value={String(currentMonth)}
                onChange={(val: any) => {
                    if (val === null) return;
                    onSelect(Number(val));
                }}
                options={options}
                isMulti={false}
                isModal={true}
                placeholder=""
                moduleName="datepickermodal"
            />
        </div>
    );
}