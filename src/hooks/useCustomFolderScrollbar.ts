import { useEffect, useRef, useCallback } from 'react';

export function useCustomFolderScrollbar() {
    const scrollRef = useRef<HTMLUListElement | null>(null);
    const fadeTopRef = useRef<HTMLDivElement | null>(null);
    const fadeBottomRef = useRef<HTMLDivElement | null>(null);
    const scrollbarRef = useRef<HTMLDivElement | null>(null);
    const handleRef = useRef<HTMLDivElement | null>(null);

    const update = useCallback(() => {
        const el = scrollRef.current;
        const bar = scrollbarRef.current;
        const handle = handleRef.current;
        const topFade = fadeTopRef.current;
        const bottomFade = fadeBottomRef.current;

        if (!el || !bar || !handle || !topFade || !bottomFade) return;

        const contentHeight = el.scrollHeight;
        const visibleHeight = el.clientHeight;
        const scrollTop = el.scrollTop;
        const maxScroll = contentHeight - visibleHeight;

        // ── Fade logic
        topFade.style.opacity = Math.min(scrollTop / 60, 1).toString();
        bottomFade.style.opacity = Math.min((maxScroll - scrollTop) / 60, 1).toString();

        // ── Scrollbar visibility
        if (contentHeight <= visibleHeight) {
            bar.classList.remove('visible');
            handle.style.height = '100%';
            handle.style.top = '0px';
            return;
        }

        bar.classList.add('visible');

        // ── Handle size
        const ratio = visibleHeight / contentHeight;
        const barHeight = bar.clientHeight;
        const handleHeight = Math.max(ratio * barHeight, 30);
        handle.style.height = `${handleHeight}px`;

        // ── Handle position
        const maxTop = barHeight - handleHeight;
        handle.style.top = `${(scrollTop / maxScroll) * maxTop}px`;
    }, []);

    const scrollUp = useCallback(() => {
        scrollRef.current?.scrollBy({ top: -60, behavior: 'smooth' });
    }, []);

    const scrollDown = useCallback(() => {
        scrollRef.current?.scrollBy({ top: 60, behavior: 'smooth' });
    }, []);

    useEffect(() => {
        const el = scrollRef.current;
        if (!el) return;

        el.addEventListener('scroll', update, { passive: true });

        const resizeObserver = new ResizeObserver(update);
        resizeObserver.observe(el);

        const mutationObserver = new MutationObserver(update);
        
        mutationObserver.observe(el, {
            childList: true,
            subtree: true,
        });

        update();

        return () => {
            el.removeEventListener('scroll', update);
            resizeObserver.disconnect();
            mutationObserver.disconnect();
        };
    }, [update]);

    return {
        scrollRef,
        fadeTopRef,
        fadeBottomRef,
        scrollbarRef,
        handleRef,
        scrollUp,
        scrollDown,
    };
}