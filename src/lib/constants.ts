// Countries list
export const COUNTRIES = [
    { code: 'AR', name: 'Argentina' },
    { code: 'BR', name: 'Brazil' },
    { code: 'CL', name: 'Chile' },
    { code: 'CO', name: 'Colombia' },
    { code: 'CR', name: 'Costa Rica' },
    { code: 'EC', name: 'Ecuador' },
    { code: 'MX', name: 'Mexico' },
    { code: 'PE', name: 'Peru' },
    { code: 'PT', name: 'Portugal' },
    { code: 'ES', name: 'Spain' },
    { code: 'US', name: 'United States' },
    { code: 'UY', name: 'Uruguay' },
    { code: 'VE', name: 'Venezuela' },
] as const

// Languages - Portuguese, English, Spanish for now
export const LANGUAGES = [
    { code: 'pt', name: 'Português' },
    { code: 'en', name: 'English' },
    { code: 'es', name: 'Español' },
] as const

// Common timezones
export const TIMEZONES = [
    { value: 'UTC', label: 'UTC' },
    { value: 'America/New_York', label: 'Eastern Time (ET)' },
    { value: 'America/Chicago', label: 'Central Time (CT)' },
    { value: 'America/Denver', label: 'Mountain Time (MT)' },
    { value: 'America/Los_Angeles', label: 'Pacific Time (PT)' },
    { value: 'America/Sao_Paulo', label: 'Brasília Time (BRT)' },
    { value: 'America/Argentina/Buenos_Aires', label: 'Argentina Time (ART)' },
    { value: 'America/Santiago', label: 'Chile Time (CLT)' },
    { value: 'America/Bogota', label: 'Colombia Time (COT)' },
    { value: 'America/Lima', label: 'Peru Time (PET)' },
    { value: 'America/Mexico_City', label: 'Mexico City Time (CST)' },
    { value: 'Europe/Madrid', label: 'Central European Time (CET)' },
    { value: 'Europe/Lisbon', label: 'Western European Time (WET)' },
] as const

export type CountryCode = typeof COUNTRIES[number]['code']
export type LanguageCode = typeof LANGUAGES[number]['code']
export type TimezoneValue = typeof TIMEZONES[number]['value']










