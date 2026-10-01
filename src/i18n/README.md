# `src/i18n/` Directory

This directory provides internationalization (i18n) and bilingual language switching support (Arabic & English) across the entire ThoughtGraph AI platform.

## Files
- `translations.ts`: Comprehensive bilingual dictionary mapping all UI labels, action names, placeholders, alerts, and tooltips into Arabic (`ar`) and English (`en`).
- `LanguageContext.tsx`: React Context Provider component (`LanguageProvider`) synchronizing document direction (`dir="rtl"` / `dir="ltr"`), document language attributes, and persisting user preference in localStorage.
- `useLanguage.ts`: Context definition and custom `useLanguage()` hook returning current language, switcher functions, and the active translation dictionary `t`.
