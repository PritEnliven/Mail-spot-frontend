import { useLayoutEffect, useRef, useState, type RefObject } from 'react';

type Options = {
    /** Extra width reserved for gaps between footer sections */
    gapReserve?: number;
    /** Avoid flicker when width sits near the threshold */
    hysteresisPx?: number;
};

/**
 * Collapse compose/reply footer actions into a "More" menu only when the
 * footer container cannot fit the expanded icon group (not viewport width).
 */
export function useComposeActionsOverflow(
    footerRef: RefObject<HTMLElement | null>,
    measureRef: RefObject<HTMLElement | null>,
    deps: unknown[] = [],
    options: Options = {},
) {
    const { gapReserve = 48, hysteresisPx = 16 } = options;
    const [isCompact, setIsCompact] = useState(false);
    const compactRef = useRef(false);

    useLayoutEffect(() => {
        const footer = footerRef.current;
        const measure = measureRef.current;
        if (!footer || !measure) return;

        const update = () => {
            const footerWidth = footer.clientWidth;
            if (footerWidth <= 0) return;

            const discardEl = footer.querySelector<HTMLElement>('[data-compose-discard]');
            const sendEl = footer.querySelector<HTMLElement>('[data-compose-send]');
            const toolbarEl = footer.querySelector<HTMLElement>('.compose-editor-toolbar-slot');

            const fixedWidth =
                (discardEl?.offsetWidth ?? 0) +
                (sendEl?.offsetWidth ?? 0) +
                (toolbarEl?.offsetWidth ?? 0);

            const styles = getComputedStyle(footer);
            const paddingX =
                (parseFloat(styles.paddingLeft) || 0) + (parseFloat(styles.paddingRight) || 0);

            const available = footerWidth - fixedWidth - paddingX - gapReserve;
            const needed = measure.scrollWidth;

            let next = compactRef.current;
            if (!compactRef.current && needed > available) {
                next = true;
            } else if (compactRef.current && needed < available - hysteresisPx) {
                next = false;
            }

            if (next !== compactRef.current) {
                compactRef.current = next;
                setIsCompact(next);
            }
        };

        const ro = new ResizeObserver(() => update());
        ro.observe(footer);
        // Toolbar slot fills asynchronously after CKEditor moves into it
        if (typeof ResizeObserver !== 'undefined') {
            const toolbarEl = footer.querySelector('.compose-editor-toolbar-slot');
            if (toolbarEl) ro.observe(toolbarEl);
        }

        update();
        // Re-measure after fonts/icons/layout settle
        const t1 = window.setTimeout(update, 50);
        const t2 = window.setTimeout(update, 300);

        return () => {
            ro.disconnect();
            window.clearTimeout(t1);
            window.clearTimeout(t2);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps -- callers pass explicit measure deps
    }, [footerRef, measureRef, gapReserve, hysteresisPx, ...deps]);

    return isCompact;
}
