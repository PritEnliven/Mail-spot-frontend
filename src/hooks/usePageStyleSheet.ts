import { useEffect, useState } from 'react';

type PageStyleKey =
    | 'adminCss'
    | 'agGridCustomCss'
    | 'agGridCss'
    | 'agGridThemeAlpineCss'
    | 'calendarCss'
    | 'customCss'
    | 'headerCss'
    | 'inboxCss'
    | 'scheduleCss'
    | 'settingsCss'
    | 'signInCss'
    | 'responsiveCss';

const styleLoaders: Record<PageStyleKey, () => Promise<unknown>> = {
    adminCss: () => import('@styles/admin.css'),
    agGridCustomCss: () => import('@styles/ag-grid-custom.css'),
    agGridCss: () => import('ag-grid-community/styles/ag-grid.css'),
    agGridThemeAlpineCss: () => import('ag-grid-community/styles/ag-theme-alpine.css'),
    calendarCss: () => import('@styles/calendar.style.css'),
    customCss: () => import('@styles/custom.css'),
    headerCss: () => import('@styles/header-main-style.css'),
    inboxCss: () => import('@styles/inbox-style.css'),
    scheduleCss: () => import('@styles/schedule.css'),
    settingsCss: () => import('@styles/setting-style.css'),
    signInCss: () => import('@styles/sign-in-style.css'),
    responsiveCss: () => import('@styles/responsive.css'),
};

/** Keys for usePageStylesheet — use dynamic import so Vite rewrites CSS image URLs in production. */
export const pageStyles: Record<PageStyleKey, PageStyleKey> = {
    adminCss: 'adminCss',
    agGridCustomCss: 'agGridCustomCss',
    agGridCss: 'agGridCss',
    agGridThemeAlpineCss: 'agGridThemeAlpineCss',
    calendarCss: 'calendarCss',
    customCss: 'customCss',
    headerCss: 'headerCss',
    inboxCss: 'inboxCss',
    scheduleCss: 'scheduleCss',
    settingsCss: 'settingsCss',
    signInCss: 'signInCss',
    responsiveCss: 'responsiveCss',
};

// export function usePageStylesheet(keys: PageStyleKey | PageStyleKey[]): boolean {
//     const stylesheets = Array.isArray(keys) ? keys : [keys];
//     const [loaded, setLoaded] = useState(false);

//     useEffect(() => {
//         if (stylesheets.length === 0) {
//             setLoaded(true);
//             return;
//         }

//         let cancelled = false;

//         Promise.all(stylesheets.map((key) => styleLoaders[key]()))
//             .then(() => {
//                 if (!cancelled) setLoaded(true);
//             })
//             .catch(() => {
//                 if (!cancelled) setLoaded(true);
//             });

//         return () => {
//             cancelled = true;
//             // setLoaded(false);
//         };
//     }, [stylesheets.join(',')]);

//     return loaded;
// }





export function usePageStylesheet(keys: PageStyleKey | PageStyleKey[]): boolean {
    const stylesheets = Array.isArray(keys) ? keys : [keys];
    const [loaded, setLoaded] = useState(false);
    useEffect(() => {
        if (stylesheets.length === 0) {
            setLoaded(true);
            return;
        }
        let cancelled = false;
        const loadStylesSequentially = async () => {
            try {
                for (const key of stylesheets) {
                    if (cancelled) return;
                    await styleLoaders[key]();
                }
                if (!cancelled) setLoaded(true);
            } catch {
                if (!cancelled) setLoaded(true);
            }
        };
        loadStylesSequentially();
        return () => {
            cancelled = true;
        };
    }, [stylesheets.join(',')]);
    return loaded;
}