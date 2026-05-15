import { useRef, useState } from "react";
import { buildRecurrencePayload } from "@utils/calendarUtil";

export function useRecurrence({ setValue, openModal, eventStartDate }: any) {
    const pendingEditRef = useRef<any>(null);
    const [customData, setCustomData] = useState<any>(null);

    const getSelectValue = (value: unknown) => {
        if (typeof value !== "string") return "doesNotRepeat";
        if (["daily", "weekly", "monthly", "yearly", "custom", "doesNotRepeat"].includes(value)) {
            return value;
        }
        try {
            JSON.parse(value);
            return "custom";
        } catch {
            return "doesNotRepeat";
        }
    };

    const onChange = (value: string | null) => {
        if (value === "custom") {
            setValue("recurrence", "custom", { shouldDirty: true });
            
            // Prepare initial data with default endDate from eventStartDate
            const initialData = {
                ...customData,
                // If eventStartDate exists, use it as default endDate (next day)
                ...(eventStartDate && {
                    endDate: (() => {
                        const eventDate = new Date(eventStartDate);
                        const defaultEndDate = new Date(eventDate);
                        defaultEndDate.setDate(defaultEndDate.getDate() + 1);
                        return defaultEndDate.toISOString().split('T')[0]; // Format as YYYY-MM-DD
                    })()
                })
            };
            
            openModal("customRecurrence", {
                initialData,
                onConfirm: onCustomConfirm,
            });
            return;
        }

        if (value) {
            setValue("recurrence", value, { shouldDirty: true });
        }
    };

    const onCustomConfirm = (data: any) => {
        setCustomData(data);
        setValue("recurrence", JSON.stringify(data), { shouldDirty: true });
    };
    
    const buildPayload = (value: unknown) => {
        if (typeof value !== "string" || value === "doesNotRepeat") return null;

        if (["daily", "weekly", "monthly", "yearly"].includes(value)) {
            return buildRecurrencePayload(value);
        }

        try {
            const parsed = JSON.parse(value);
            return buildRecurrencePayload(parsed.intervalUnit, {
                ...parsed,
                isCustom: true,
            });
        } catch {
            return null;
        }
    };

    return {
        getSelectValue,
        onChange,
        buildPayload,
        pendingEditRef,
    };
}
