import { Link, useLocation, Outlet } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../hooks/useAuth';
import { useWebSocketStatus } from '../hooks/useWebSocket';
import LanguageSelector from './LanguageSelector';
import {
  LayoutDashboard,
  Bell,
  Terminal,
  TrendingUp,
  LogOut,
  Wifi,
  WifiOff,
  User,
} from 'lucide-react';

export default function Layout() {
  const location = useLocation();
  const { t } = useTranslation();
  const { user, logout } = useAuth();
  const wsConnected = useWebSocketStatus();

  const navigation = [
    { name: t('nav.dashboard'), path: '/', icon: LayoutDashboard },
    { name: t('nav.alarms'), path: '/alarms', icon: Bell },
    { name: t('nav.history'), path: '/history', icon: TrendingUp },
    ...(user?.role === 'maintenance'
      ? [{ name: t('nav.commands'), path: '/commands', icon: Terminal }]
      : []),
  ];

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      {/* Header */}
      <header className="bg-white shadow-md">
        <div className="px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-bold text-primary-600">{t('app.title')}</h1>

            {/* Connection Status */}
            <div className="flex items-center gap-2">
              {wsConnected ? (
                <>
                  <Wifi className="w-5 h-5 text-success-600" />
                  <span className="text-sm text-success-600 font-medium">
                    {t('connection.connected')}
                  </span>
                </>
              ) : (
                <>
                  <WifiOff className="w-5 h-5 text-danger-600" />
                  <span className="text-sm text-danger-600 font-medium">
                    {t('connection.disconnected')}
                  </span>
                </>
              )}
            </div>
          </div>

          {/* User Info and Language Selector */}
          <div className="flex items-center gap-4">
            {/* Language Selector */}
            <LanguageSelector />

            {/* User Info */}
            <div className="flex items-center gap-2">
              <User className="w-5 h-5 text-gray-600" />
              <span className="text-sm font-medium text-gray-700 capitalize">
                {t(`auth.${user?.role}`)}
              </span>
            </div>

            <button
              onClick={logout}
              className="flex items-center gap-2 px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg transition-colors"
            >
              <LogOut className="w-5 h-5" />
              <span className="font-medium">{t('nav.logout')}</span>
            </button>
          </div>
        </div>

        {/* Navigation */}
        <nav className="border-t border-gray-200">
          <div className="px-4 flex gap-2">
            {navigation.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;

              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`
                    flex items-center gap-2 px-6 py-3 font-medium transition-colors
                    border-b-2 no-select
                    ${
                      isActive
                        ? 'text-primary-600 border-primary-600'
                        : 'text-gray-600 border-transparent hover:text-gray-800 hover:border-gray-300'
                    }
                  `}
                >
                  <Icon className="w-5 h-5" />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </div>
        </nav>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 px-4 py-2">
        <div className="flex items-center justify-between text-sm text-gray-600">
          <span>{t('app.title')} {t('app.version')}</span>
          <span>{new Date().toLocaleString()}</span>
        </div>
      </footer>
    </div>
  );
}
