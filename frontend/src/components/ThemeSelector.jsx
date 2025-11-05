import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Sun, Moon, Monitor } from 'lucide-react';
import { useTheme } from '../hooks/useTheme.jsx';

const THEMES = [
  { 
    value: 'light', 
    name: 'theme.light', 
    icon: Sun,
    description: 'theme.lightDesc'
  },
  { 
    value: 'dark', 
    name: 'theme.dark', 
    icon: Moon,
    description: 'theme.darkDesc'
  },
  { 
    value: 'system', 
    name: 'theme.system', 
    icon: Monitor,
    description: 'theme.systemDesc'
  },
];

export default function ThemeSelector() {
  const { t } = useTranslation();
  const { theme, setTheme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const currentTheme = THEMES.find(t => t.value === theme) || THEMES[0];
  const CurrentIcon = currentTheme.icon;

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const changeTheme = (themeValue) => {
    setTheme(themeValue);
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 transition-colors no-select"
        title={t('theme.selectTheme')}
      >
        <CurrentIcon className="w-4 h-4 text-gray-600 dark:text-gray-300" />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 z-50 overflow-hidden">
          {THEMES.map((themeOption) => {
            const Icon = themeOption.icon;
            return (
              <button
                key={themeOption.value}
                onClick={() => changeTheme(themeOption.value)}
                className={`
                  w-full flex items-center gap-3 px-4 py-3 text-left transition-colors
                  ${theme === themeOption.value
                    ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300 font-semibold'
                    : 'hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
                  }
                `}
              >
                <Icon className="w-5 h-5" />
                <div className="flex-1">
                  <div className="font-medium">{t(themeOption.name)}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {t(themeOption.description)}
                  </div>
                </div>
                {theme === themeOption.value && (
                  <span className="text-primary-600 dark:text-primary-400">✓</span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}