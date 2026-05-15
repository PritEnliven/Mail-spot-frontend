// src/hooks/usePageStylesheet.ts
import { useEffect, useState } from 'react';

const adminCss = new URL('@styles/admin.css', import.meta.url).href;
const agGridCustomCss = new URL('@styles/ag-grid-custom.css', import.meta.url).href;
const agGridCss = new URL('ag-grid-community/styles/ag-grid.css', import.meta.url).href;
const agGridThemeAlpineCss = new URL('ag-grid-community/styles/ag-theme-alpine.css', import.meta.url).href;
const calendarCss = new URL('@styles/calendar.style.css', import.meta.url).href;
const customCss = new URL('@styles/custom.css', import.meta.url).href;
const headerCss = new URL('@styles/header-main-style.css', import.meta.url).href;
const inboxCss = new URL('@styles/inbox-style.css', import.meta.url).href;
const responsiveCss = new URL('@styles/responsive.css', import.meta.url).href;
const scheduleCss = new URL('@styles/schedule.css', import.meta.url).href;
const settingsCss = new URL('@styles/setting-style.css', import.meta.url).href;
const signInCss = new URL('@styles/sign-in-style.css', import.meta.url).href;


export const pageStyles = {
    adminCss,
    agGridCustomCss,
    agGridCss,
    agGridThemeAlpineCss,
    calendarCss,
    customCss,
    headerCss,
    inboxCss,
    responsiveCss,
    scheduleCss,
    settingsCss,
    signInCss,
};

export function usePageStylesheet(hrefs: string | string[]): boolean {
    const stylesheets = Array.isArray(hrefs) ? hrefs : [hrefs];
    const [loaded, setLoaded] = useState(false);

    useEffect(() => {
        if (stylesheets.length === 0) {
            setLoaded(true);
            return;
        }

        let loadedCount = 0;
        const links: HTMLLinkElement[] = [];

        const handleLoad = () => {
            loadedCount += 1;
            if (loadedCount === stylesheets.length) setLoaded(true);
        };

        stylesheets.forEach((href) => {
            const alreadyExists = document.head.querySelector(
                `link[data-page-style="${href}"]`
            );

            if (alreadyExists) {
                handleLoad();
                return;
            }

            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = href;  // ← now receives Webpack-resolved URL
            link.setAttribute('data-page-style', href);
            link.onload = handleLoad;
            link.onerror = handleLoad;

            document.head.appendChild(link);
            links.push(link);
        });

        return () => {
            links.forEach((link) => {
                const el = document.head.querySelector(
                    `link[data-page-style="${link.getAttribute('data-page-style')}"]`
                );
                if (el) document.head.removeChild(el);
            });
            setLoaded(false);
        };
    }, [stylesheets.join(',')]);

    return loaded;
}