import { useEffect, useRef } from "react";

export function useHorizontalScrollbar() {
    const contentRef = useRef<HTMLDivElement | null>(null);
    const scrollbarRef = useRef<HTMLDivElement | null>(null);
    const thumbRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        const content = contentRef.current;
        const scrollbar = scrollbarRef.current;
        const thumb = thumbRef.current;
        if (!content || !scrollbar || !thumb) return;

        let isDragging = false;
        let startX = 0;
        let initialScrollLeft = 0;

        const updateThumbSize = () => {
            const contentWidth = content.scrollWidth;
            const visibleWidth = content.clientWidth;

            if (contentWidth <= visibleWidth) {
                scrollbar.style.display = "none";
                return;
            }

            scrollbar.style.display = "block";
            const thumbWidth = Math.min(
                visibleWidth,
                (visibleWidth / contentWidth) * visibleWidth
            );
            thumb.style.width = `${thumbWidth}px`;
        };

        const syncThumb = () => {
            const contentWidth = content.scrollWidth;
            const visibleWidth = content.clientWidth;
            if (contentWidth <= visibleWidth) return;

            const scrollRatio =
                content.scrollLeft / (contentWidth - visibleWidth);

            const maxThumbX =
                scrollbar.clientWidth - thumb.clientWidth;

            thumb.style.transform = `translateX(${scrollRatio * maxThumbX}px)`;
        };

        const onMouseMove = (e: MouseEvent) => {
            if (!isDragging) return;

            const dx = e.clientX - startX;
            const scrollRatio =
                (content.scrollWidth - content.clientWidth) /
                (scrollbar.clientWidth - thumb.clientWidth);

            content.scrollLeft = initialScrollLeft + dx * scrollRatio;
        };

        const onMouseUp = () => {
            isDragging = false;
            thumb.classList.remove("dragging");
        };

        thumb.addEventListener("mousedown", (e) => {
            e.preventDefault();
            isDragging = true;
            startX = e.clientX;
            initialScrollLeft = content.scrollLeft;
            thumb.classList.add("dragging");
        });

        content.addEventListener("scroll", syncThumb);
        document.addEventListener("mousemove", onMouseMove);
        document.addEventListener("mouseup", onMouseUp);

        const resizeObserver = new ResizeObserver(() => {
            updateThumbSize();
            syncThumb();
        });
        resizeObserver.observe(content);

        updateThumbSize();
        syncThumb();

        return () => {
            content.removeEventListener("scroll", syncThumb);
            document.removeEventListener("mousemove", onMouseMove);
            document.removeEventListener("mouseup", onMouseUp);
            resizeObserver.disconnect();
        };
    }, []);

    return {
        contentRef,
        scrollbarRef,
        thumbRef,
    };
}