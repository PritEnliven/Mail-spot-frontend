import { createRoot, type Root } from "react-dom/client";
import { MonthDropdown } from "./MonthDropdown";

export function useFlatpickrMonthDropdown(startFromMonth: number) {
    return (instance: any) => {
        const container = instance.calendarContainer;
        const header = container.querySelector(".flatpickr-current-month");
        if (!header) return;

        const mountEl = document.createElement("div");
        mountEl.className = "react-month-root";
        header.prepend(mountEl);

        const root: Root = createRoot(mountEl);

        const render = () => {
            const currentYear = new Date().getFullYear();
            const allowedMonths = Array.from({ length: 12 }, (_, i) => i)
                .filter(m => instance.currentYear > currentYear || m >= startFromMonth);

            root!.render(
                <MonthDropdown
                    anchorEl={mountEl!}
                    currentMonth={instance.currentMonth}
                    allowedMonths={allowedMonths}
                    onSelect={(month) => {
                        instance.changeMonth(month - instance.currentMonth);
                    }}
                />
            );
        };

        // Initial render
        render();

        // Re-render on month/year change (NOT unmount)
        instance.config.onMonthChange.push(render);
        instance.config.onYearChange.push(render);

        // Cleanup only when Flatpickr is destroyed
        instance.config.onDestroy.push(() => {
            // Defer unmounting to avoid race condition during React render
            setTimeout(() => {
                root?.unmount();
                mountEl.remove();
            }, 0);
        });
    };
}
