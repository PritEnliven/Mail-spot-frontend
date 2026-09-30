import type { ReactNode } from 'react';
import { getFlagImageUrl, getIsoForDialCode } from '@constants/phoneCountryCodes';

/** Renders flag + short ISO name in the menu; selected value stays dial code. */
export function formatPhoneCountryOptionLabel(
    option: { value: string; label: string },
    meta?: { context: 'menu' | 'value' },
): ReactNode {
    const iso = getIsoForDialCode(option.value);
    const text =
        meta?.context === 'value'
            ? option.value
            : iso
                ? `${iso} (${option.value})`
                : option.value;

    return (
        <span className="contact-phone-country-option">
            {iso && (
                <img
                    src={getFlagImageUrl(iso)}
                    alt=""
                    className="contact-phone-flag"
                    width={20}
                    height={15}
                    loading="lazy"
                />
            )}
            <span className="contact-phone-country-text">{text}</span>
        </span>
    );
}
