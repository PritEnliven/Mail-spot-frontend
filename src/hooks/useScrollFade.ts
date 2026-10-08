import { useCallback, useEffect, useRef } from 'react';

export type UseSidebarFadeScrollbarReturn = {
    scrollRef: React.RefObject<HTMLDivElement | null>;
    fadeTopRef: React.RefObject<HTMLDivElement | null>;
    fadeBottomRef: React.RefObject<HTMLDivElement | null>;
    sidebarSectionScrollbarRef: React.RefObject<HTMLDivElement | null>;
    handleRef: React.RefObject<HTMLDivElement | null>;
};

export function useSidebarFadeScrollbar(): UseSidebarFadeScrollbarReturn {
    const scrollRef = useRef<HTMLDivElement | null>(null);
    const fadeTopRef = useRef<HTMLDivElement | null>(null);
    const fadeBottomRef = useRef<HTMLDivElement | null>(null);
    const sidebarSectionScrollbarRef = useRef<HTMLDivElement | null>(null);
    const handleRef = useRef<HTMLDivElement | null>(null);

    const updateFades = useCallback(() => {
        const el = scrollRef.current;
        const top = fadeTopRef.current;
        const bottom = fadeBottomRef.current;
        if (!el || !top || !bottom) return;

        const maxScroll = el.scrollHeight - el.clientHeight;
        const scrollTop = el.scrollTop;

        top.style.opacity = Math.min(scrollTop / 60, 1).toString();
        bottom.style.opacity = Math.min((maxScroll - scrollTop) / 60, 1).toString();
    }, []);

    const updateHandle = useCallback(() => {
        const el = scrollRef.current;
        const bar = sidebarSectionScrollbarRef.current;
        const handle = handleRef.current;
        if (!el || !bar || !handle) return;

        const contentHeight = el.scrollHeight;
        const visibleHeight = el.clientHeight;
        const barHeight = bar.clientHeight;

        // 1px covers subpixel rounding after a section collapses.
        if (contentHeight - visibleHeight <= 1) {
            bar.classList.remove('visible');
            handle.style.height = '100%';
            handle.style.top = '0px';
            return;
        }

        bar.classList.add('visible');

        const ratio = visibleHeight / contentHeight;
        const handleHeight = Math.max(ratio * barHeight, 30);
        handle.style.height = `${handleHeight}px`;

        const maxScroll = contentHeight - visibleHeight;
        const maxTop = barHeight - handleHeight;
        const scrollRatio = el.scrollTop / maxScroll;

        handle.style.top = `${scrollRatio * maxTop}px`;
    }, []);

    const syncAll = useCallback(() => {
        updateHandle();
        updateFades();
    }, [updateHandle, updateFades]);

    useEffect(() => {
        const el = scrollRef.current;
        const bar = sidebarSectionScrollbarRef.current;
        const handle = handleRef.current;
        if (!el || !bar || !handle) return;

        let isDragging = false;
        let startY = 0;
        let startTop = 0;

        const onScroll = () => syncAll();

        const onMouseDown = (e: MouseEvent) => {
            if (!bar.classList.contains('visible')) return;
            isDragging = true;
            startY = e.clientY;
            startTop = parseInt(handle.style.top || '0', 10);
            e.preventDefault();
        };

        const onMouseMove = (e: MouseEvent) => {
            if (!isDragging) return;

            const deltaY = e.clientY - startY;
            const handleHeight = handle.offsetHeight;
            const maxTop = bar.clientHeight - handleHeight;

            const newTop = Math.max(0, Math.min(startTop + deltaY, maxTop));
            handle.style.top = `${newTop}px`;

            const ratio = newTop / maxTop;
            el.scrollTop = ratio * (el.scrollHeight - el.clientHeight);
            updateFades();
        };

        const onMouseUp = () => {
            isDragging = false;
        };

        el.addEventListener('scroll', onScroll, { passive: true });
        handle.addEventListener('mousedown', onMouseDown);
        bar.addEventListener('mousedown', onMouseDown);
        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);

        const resizeObserver = new ResizeObserver(syncAll);
        resizeObserver.observe(el);

        const observeSectionSizes = () => {
            el.querySelectorAll('.create-folder-sec, .add-floder-single-box').forEach((node) => {
                resizeObserver.observe(node);
            });
        };
        observeSectionSizes();

        // Folder open/close only toggles the Bootstrap `show` class.
        // That does not change this box's size or its child list, so the
        // scrollbar stayed visible after both sections were collapsed.
        const mutationObserver = new MutationObserver(() => {
            observeSectionSizes();
            syncAll();
            // Re-sync after Bootstrap collapse height transition finishes.
            window.setTimeout(syncAll, 350);
        });
        mutationObserver.observe(el, {
            childList: true,
            subtree: true,
            characterData: true,
            attributes: true,
            attributeFilter: ['class'],
        });

        syncAll();

        return () => {
            el.removeEventListener('scroll', onScroll);
            handle.removeEventListener('mousedown', onMouseDown);
            bar.removeEventListener('mousedown', onMouseDown);
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);
            resizeObserver.disconnect();
            mutationObserver.disconnect();
        };
    }, [syncAll, updateFades]);

    return {
        scrollRef,
        fadeTopRef,
        fadeBottomRef,
        sidebarSectionScrollbarRef,
        handleRef,
    };
}