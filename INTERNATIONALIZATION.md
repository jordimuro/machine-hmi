# Internationalization (i18n) Guide

## Overview

Machine HMI Edge supports 8 languages out of the box with easy runtime switching via a visual flag selector.

## Supported Languages

| Language | Code | Flag | Native Name |
|----------|------|------|-------------|
| English | `en` | 🇬🇧 | English |
| Spanish | `es` | 🇪🇸 | Español |
| German | `de` | 🇩🇪 | Deutsch |
| Italian | `it` | 🇮🇹 | Italiano |
| French | `fr` | 🇫🇷 | Français |
| Polish | `pl` | 🇵🇱 | Polski |
| Chinese | `zh` | 🇨🇳 | 中文 |
| Japanese | `ja` | 🇯🇵 | 日本語 |

## Features

### 🎌 Visual Language Selector
- Flag dropdown in application header
- Click globe/flag icon to open selector
- Select language by clicking flag
- Current language highlighted with checkmark

### 💾 Persistence
- Selected language saved in browser `localStorage`
- Preference persists across sessions
- No need to re-select after page reload

### 🔍 Auto-Detection
- Detects browser language on first visit
- Falls back to English if language not supported
- Uses `navigator.language` API

### 🔄 Real-time Switching
- Changes apply immediately
- No page reload required
- Smooth transition between languages

## Technical Implementation

### Dependencies

```json
{
  "i18next": "^23.11.0",
  "react-i18next": "^14.1.0",
  "i18next-browser-languagedetector": "^7.2.1"
}
```

### File Structure

```
frontend/src/
├── i18n.js                          # i18n configuration
├── locales/
│   ├── en/translation.json          # English translations
│   ├── es/translation.json          # Spanish translations
│   ├── de/translation.json          # German translations
│   ├── it/translation.json          # Italian translations
│   ├── fr/translation.json          # French translations
│   ├── pl/translation.json          # Polish translations
│   ├── zh/translation.json          # Chinese translations
│   └── ja/translation.json          # Japanese translations
└── components/
    └── LanguageSelector.jsx         # Language selector component
```

### Translation Files

Each language has a JSON file with nested keys:

```json
{
  "app": {
    "title": "Machine HMI",
    "version": "v1.0.0"
  },
  "auth": {
    "login": "Login",
    "enterPin": "Enter your PIN to continue",
    "pin": "PIN"
  },
  "nav": {
    "dashboard": "Dashboard",
    "alarms": "Alarms",
    "history": "History"
  }
}
```

### Usage in Components

```jsx
import { useTranslation } from 'react-i18next';

function MyComponent() {
  const { t } = useTranslation();

  return (
    <div>
      <h1>{t('app.title')}</h1>
      <p>{t('auth.enterPin')}</p>
    </div>
  );
}
```

### Interpolation

Use variables in translations:

```json
{
  "commands": {
    "confirmMessage": "Are you sure you want to execute command: {{command}}?"
  }
}
```

```jsx
t('commands.confirmMessage', { command: 'START' })
// Output: "Are you sure you want to execute command: START?"
```

### Pluralization

Handle singular/plural forms:

```json
{
  "alarms": {
    "activeCount": "{{count}} alarm active",
    "activeCount_other": "{{count}} alarms active"
  }
}
```

```jsx
t('alarms.activeCount', { count: 1 })  // "1 alarm active"
t('alarms.activeCount', { count: 5 })  // "5 alarms active"
```

## Adding a New Language

### 1. Create Translation File

Create `frontend/src/locales/{code}/translation.json`:

```json
{
  "app": { "title": "..." },
  "auth": { ... },
  "nav": { ... },
  ...
}
```

### 2. Import in i18n.js

```javascript
import newLangTranslation from './locales/new/translation.json';

const resources = {
  en: { translation: enTranslation },
  new: { translation: newLangTranslation },
  // ...
};
```

### 3. Add to Language Selector

Update `LanguageSelector.jsx`:

```javascript
const LANGUAGES = [
  // ... existing languages
  { code: 'new', name: 'New Language', flag: '🏴' },
];
```

### 4. Test

1. Reload application
2. Open language selector
3. Select new language
4. Verify all UI elements translated

## Translation Keys

### App Level
- `app.title` - Application name
- `app.version` - Version string

### Authentication
- `auth.login` - Login button
- `auth.enterPin` - PIN prompt
- `auth.invalidPin` - Error message
- `auth.operator` - Operator role
- `auth.maintenance` - Maintenance role

### Navigation
- `nav.dashboard` - Dashboard tab
- `nav.alarms` - Alarms tab
- `nav.history` - History tab
- `nav.commands` - Commands tab
- `nav.logout` - Logout button

### Connection
- `connection.connected` - Connected status
- `connection.disconnected` - Disconnected status

### Dashboard
- `dashboard.title` - Page title
- `dashboard.subtitle` - Description
- `dashboard.noTags` - Empty state message

### Tags
- `tags.machineSpeed` - Speed label
- `tags.temperatureZone1` - Temp zone 1
- `tags.pressure` - Pressure label
- `tags.on` - On state
- `tags.off` - Off state

### Alarms
- `alarms.title` - Page title
- `alarms.allClear` - No alarms message
- `alarms.activeCount` - Alarm counter
- `alarms.alarm_overtemp` - Overtemp message
- `alarms.since` - Timestamp label

### History
- `history.title` - Page title
- `history.selectTag` - Dropdown label
- `history.timeRange` - Time selector
- `history.refresh` - Refresh button
- `history.average` - Average label
- `history.minimum` - Min value
- `history.maximum` - Max value

### Commands
- `commands.title` - Page title
- `commands.start` - Start button
- `commands.stop` - Stop button
- `commands.resetAlarms` - Reset button
- `commands.confirmAction` - Confirm dialog title
- `commands.confirmMessage` - Confirmation text
- `commands.cancel` - Cancel button
- `commands.confirm` - Confirm button

### Common
- `common.loading` - Loading message
- `common.error` - Error label
- `common.success` - Success label
- `common.close` - Close button
- `common.save` - Save button

## Best Practices

### 1. Use Semantic Keys

```javascript
// ✅ Good
t('commands.start')

// ❌ Bad
t('startButton')
```

### 2. Keep Nested Structure

```javascript
// ✅ Good
{
  "auth": {
    "login": "Login",
    "logout": "Logout"
  }
}

// ❌ Bad
{
  "authLogin": "Login",
  "authLogout": "Logout"
}
```

### 3. Avoid Hardcoded Strings

```jsx
// ✅ Good
<button>{t('common.save')}</button>

// ❌ Bad
<button>Save</button>
```

### 4. Use Interpolation

```javascript
// ✅ Good
t('welcome', { name: user.name })

// ❌ Bad
`Welcome ${user.name}`
```

### 5. Provide Fallbacks

Always provide English as fallback:

```javascript
fallbackLng: 'en'
```

## Testing

### Manual Testing

1. Open application in browser
2. Click globe/flag icon in header
3. Select each language
4. Navigate through all pages
5. Verify translations appear correctly
6. Check pluralization works
7. Test with different browser languages

### Automated Testing

```javascript
import { renderWithI18n } from './test-utils';

test('renders translated text', () => {
  const { getByText } = renderWithI18n(<MyComponent />, { lng: 'es' });
  expect(getByText('Panel')).toBeInTheDocument();
});
```

## Troubleshooting

### Missing Translation

If a key is missing, English (fallback) is shown:

```
[i18next] key 'missingKey' not found
```

**Fix**: Add key to translation file

### Language Not Changing

**Possible causes:**
1. localStorage not cleared
2. Browser cache
3. Translation file not imported

**Fix**:
```javascript
// Clear localStorage
localStorage.removeItem('i18nextLng');

// Check i18n.js imports
import newTranslation from './locales/new/translation.json';
```

### Flag Not Showing

Emojis may not render on all systems.

**Alternative**: Use SVG flags or icon font

## Performance

### Bundle Size

Each translation file adds ~5-10KB to bundle.

**Optimization**: Code-split translations:

```javascript
const resources = {
  en: () => import('./locales/en/translation.json'),
  es: () => import('./locales/es/translation.json'),
  // ...
};
```

### Runtime Performance

i18next is optimized for performance:
- Caching enabled by default
- Minimal re-renders
- Lazy loading support

## Accessibility

### Language Attribute

HTML `lang` attribute automatically updated:

```html
<html lang="es">
```

### Screen Readers

Translations work with screen readers.

### Keyboard Navigation

Language selector fully keyboard accessible:
- Tab to focus
- Enter/Space to open
- Arrow keys to navigate
- Enter to select

## Future Enhancements

- [ ] Add RTL language support (Arabic, Hebrew)
- [ ] Backend API message translation
- [ ] Date/time format localization
- [ ] Number format localization (decimals, thousands)
- [ ] Currency formatting
- [ ] Translation management UI
- [ ] Automatic translation via API
- [ ] Translation statistics dashboard

## Resources

- [i18next Documentation](https://www.i18next.com/)
- [react-i18next Guide](https://react.i18next.com/)
- [Language Codes (ISO 639-1)](https://en.wikipedia.org/wiki/List_of_ISO_639-1_codes)
- [Unicode CLDR](http://cldr.unicode.org/)

## Support

For translation issues or to contribute new languages:
- Open issue on GitHub
- Submit pull request with new translation file
- Contact maintainers for translation review
