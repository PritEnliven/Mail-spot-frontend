import type { SingleOption } from '@components/ui/form/Select2Wrapper';

export const TIMEZONE_OPTIONS: SingleOption[] = [
    // UTC
    { value: 'UTC', label: 'GMT +00:00 — UTC' },

    // Africa
    { value: 'Africa/Cairo', label: 'GMT +02:00 — Africa/Cairo' },
    { value: 'Africa/Johannesburg', label: 'GMT +02:00 — Africa/Johannesburg' },
    { value: 'Africa/Lagos', label: 'GMT +01:00 — Africa/Lagos' },
    { value: 'Africa/Nairobi', label: 'GMT +03:00 — Africa/Nairobi' },
    { value: 'Africa/Casablanca', label: 'GMT +01:00 — Africa/Casablanca' },

    // Asia
    { value: 'Asia/Kolkata', label: 'GMT +05:30 — Asia/Kolkata' },
    { value: 'Asia/Kathmandu', label: 'GMT +05:45 — Asia/Kathmandu' },
    { value: 'Asia/Dhaka', label: 'GMT +06:00 — Asia/Dhaka' },
    { value: 'Asia/Karachi', label: 'GMT +05:00 — Asia/Karachi' },
    { value: 'Asia/Dubai', label: 'GMT +04:00 — Asia/Dubai' },
    { value: 'Asia/Riyadh', label: 'GMT +03:00 — Asia/Riyadh' },
    { value: 'Asia/Jerusalem', label: 'GMT +02:00 — Asia/Jerusalem' },
    { value: 'Asia/Tehran', label: 'GMT +03:30 — Asia/Tehran' },
    { value: 'Asia/Bangkok', label: 'GMT +07:00 — Asia/Bangkok' },
    { value: 'Asia/Jakarta', label: 'GMT +07:00 — Asia/Jakarta' },
    { value: 'Asia/Singapore', label: 'GMT +08:00 — Asia/Singapore' },
    { value: 'Asia/Hong_Kong', label: 'GMT +08:00 — Asia/Hong_Kong' },
    { value: 'Asia/Shanghai', label: 'GMT +08:00 — Asia/Shanghai' },
    { value: 'Asia/Taipei', label: 'GMT +08:00 — Asia/Taipei' },
    { value: 'Asia/Seoul', label: 'GMT +09:00 — Asia/Seoul' },
    { value: 'Asia/Tokyo', label: 'GMT +09:00 — Asia/Tokyo' },
    { value: 'Asia/Manila', label: 'GMT +08:00 — Asia/Manila' },
    { value: 'Asia/Yangon', label: 'GMT +06:30 — Asia/Yangon' },
    { value: 'Asia/Tashkent', label: 'GMT +05:00 — Asia/Tashkent' },
    { value: 'Asia/Almaty', label: 'GMT +05:00 — Asia/Almaty' },

    // Europe
    { value: 'Europe/London', label: 'GMT +00:00 — Europe/London' },
    { value: 'Europe/Paris', label: 'GMT +01:00 — Europe/Paris' },
    { value: 'Europe/Berlin', label: 'GMT +01:00 — Europe/Berlin' },
    { value: 'Europe/Rome', label: 'GMT +01:00 — Europe/Rome' },
    { value: 'Europe/Madrid', label: 'GMT +01:00 — Europe/Madrid' },
    { value: 'Europe/Amsterdam', label: 'GMT +01:00 — Europe/Amsterdam' },
    { value: 'Europe/Brussels', label: 'GMT +01:00 — Europe/Brussels' },
    { value: 'Europe/Zurich', label: 'GMT +01:00 — Europe/Zurich' },
    { value: 'Europe/Vienna', label: 'GMT +01:00 — Europe/Vienna' },
    { value: 'Europe/Stockholm', label: 'GMT +01:00 — Europe/Stockholm' },
    { value: 'Europe/Oslo', label: 'GMT +01:00 — Europe/Oslo' },
    { value: 'Europe/Copenhagen', label: 'GMT +01:00 — Europe/Copenhagen' },
    { value: 'Europe/Athens', label: 'GMT +02:00 — Europe/Athens' },
    { value: 'Europe/Helsinki', label: 'GMT +02:00 — Europe/Helsinki' },
    { value: 'Europe/Istanbul', label: 'GMT +03:00 — Europe/Istanbul' },
    { value: 'Europe/Moscow', label: 'GMT +03:00 — Europe/Moscow' },
    { value: 'Europe/Kyiv', label: 'GMT +02:00 — Europe/Kyiv' },
    { value: 'Europe/Lisbon', label: 'GMT +00:00 — Europe/Lisbon' },
    { value: 'Europe/Dublin', label: 'GMT +00:00 — Europe/Dublin' },

    // North America
    { value: 'America/New_York', label: 'GMT -05:00 — America/New_York' },
    { value: 'America/Chicago', label: 'GMT -06:00 — America/Chicago' },
    { value: 'America/Denver', label: 'GMT -07:00 — America/Denver' },
    { value: 'America/Los_Angeles', label: 'GMT -08:00 — America/Los_Angeles' },
    { value: 'America/Phoenix', label: 'GMT -07:00 — America/Phoenix' },
    { value: 'America/Anchorage', label: 'GMT -09:00 — America/Anchorage' },
    { value: 'America/Adak', label: 'GMT -10:00 — America/Adak' },
    { value: 'Pacific/Honolulu', label: 'GMT -10:00 — Pacific/Honolulu' },
    { value: 'America/Toronto', label: 'GMT -05:00 — America/Toronto' },
    { value: 'America/Vancouver', label: 'GMT -08:00 — America/Vancouver' },
    { value: 'America/Edmonton', label: 'GMT -07:00 — America/Edmonton' },
    { value: 'America/Winnipeg', label: 'GMT -06:00 — America/Winnipeg' },
    { value: 'America/Halifax', label: 'GMT -04:00 — America/Halifax' },
    { value: 'America/St_Johns', label: 'GMT -03:30 — America/St_Johns' },
    { value: 'America/Mexico_City', label: 'GMT -06:00 — America/Mexico_City' },

    // Central America & Caribbean
    { value: 'America/Panama', label: 'GMT -05:00 — America/Panama' },
    { value: 'America/Costa_Rica', label: 'GMT -06:00 — America/Costa_Rica' },
    { value: 'America/Guatemala', label: 'GMT -06:00 — America/Guatemala' },
    { value: 'America/Havana', label: 'GMT -05:00 — America/Havana' },
    { value: 'America/Puerto_Rico', label: 'GMT -04:00 — America/Puerto_Rico' },

    // South America
    { value: 'America/Sao_Paulo', label: 'GMT -03:00 — America/Sao_Paulo' },
    { value: 'America/Argentina/Buenos_Aires', label: 'GMT -03:00 — America/Argentina/Buenos_Aires' },
    { value: 'America/Santiago', label: 'GMT -04:00 — America/Santiago' },
    { value: 'America/Bogota', label: 'GMT -05:00 — America/Bogota' },
    { value: 'America/Lima', label: 'GMT -05:00 — America/Lima' },
    { value: 'America/Caracas', label: 'GMT -04:00 — America/Caracas' },
    { value: 'America/Montevideo', label: 'GMT -03:00 — America/Montevideo' },

    // Australia
    { value: 'Australia/Sydney', label: 'GMT +10:00 — Australia/Sydney' },
    { value: 'Australia/Melbourne', label: 'GMT +10:00 — Australia/Melbourne' },
    { value: 'Australia/Brisbane', label: 'GMT +10:00 — Australia/Brisbane' },
    { value: 'Australia/Perth', label: 'GMT +08:00 — Australia/Perth' },
    { value: 'Australia/Adelaide', label: 'GMT +09:30 — Australia/Adelaide' },
    { value: 'Australia/Darwin', label: 'GMT +09:30 — Australia/Darwin' },
    { value: 'Australia/Hobart', label: 'GMT +10:00 — Australia/Hobart' },

    // Pacific
    { value: 'Pacific/Auckland', label: 'GMT +12:00 — Pacific/Auckland' },
    { value: 'Pacific/Fiji', label: 'GMT +12:00 — Pacific/Fiji' },
    { value: 'Pacific/Guam', label: 'GMT +10:00 — Pacific/Guam' },
    { value: 'Pacific/Port_Moresby', label: 'GMT +10:00 — Pacific/Port_Moresby' },
    { value: 'Pacific/Tahiti', label: 'GMT -10:00 — Pacific/Tahiti' },
    { value: 'Pacific/Apia', label: 'GMT +13:00 — Pacific/Apia' },
];
