export const pageStyles = {
    adminCss: 'adminCss',
    agGridCustomCss: 'agGridCustomCss',
    agGridCss: 'agGridCss',
    agGridThemeAlpineCss: 'agGridThemeAlpineCss',
    calendarCss: 'calendarCss',
    customCss: 'customCss',
    headerCss: 'headerCss',
    inboxCss: 'inboxCss',
    responsiveCss: 'responsiveCss',
    scheduleCss: 'scheduleCss',
    settingsCss: 'settingsCss',
    signInCss: 'signInCss',
};

export function usePageStylesheet(hrefs: string | string[]): boolean {
    void hrefs;
    return true;
}
