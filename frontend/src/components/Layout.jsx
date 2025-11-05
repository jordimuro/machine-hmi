import { useState, useEffect } from 'react';
import { Link, useLocation, Outlet } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../hooks/useAuth';
import { useWebSocketStatus, useWebSocket } from '../hooks/useWebSocket';
import LanguageSelector from './LanguageSelector';
import ThemeSelector from './ThemeSelector';
import {
  LayoutDashboard,
  Bell,
  Terminal,
  TrendingUp,
  LogOut,
  Wifi,
  WifiOff,
  User,
  Activity,
  Menu,
  X,
  AlertTriangle,
  CheckCircle,
} from 'lucide-react';

export default function Layout() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const location = useLocation();
  const { t } = useTranslation();
  const { user, logout } = useAuth();
  const wsConnected = useWebSocketStatus();
  const { data } = useWebSocket();
  
  // Actualizar la hora cada segundo
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);
  
  // Obtener estado OPC y alarmas de los datos del WebSocket
  const opcStatus = data.opcua_status || 'disconnected';
  const alarms = data.alarms || [];
  const activeAlarms = alarms.filter(alarm => alarm.active);
  const opcConnected = opcStatus === 'connected';

  const navigation = [
    { name: t('nav.dashboard'), path: '/', icon: LayoutDashboard },
    { name: 'OPC-UA ActualSpeed', path: '/opcua', icon: Activity },
    { name: t('nav.alarms'), path: '/alarms', icon: Bell },
    { name: t('nav.history'), path: '/history', icon: TrendingUp },
    { name: t('motorDiagnostics.title'), path: '/motor-diagnostics', icon: Activity },
    { name: t('opcPerformance.title'), path: '/opc-performance', icon: Activity },
    ...(user?.role === 'maintenance'
      ? [{ name: t('nav.commands'), path: '/commands', icon: Terminal }]
      : []),
  ];

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex flex-col">
      {/* Fixed Header */}
      <header className="sticky top-0 z-50 bg-white dark:bg-gray-800 shadow-md">
        <div className="px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            {/* Mobile menu button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              {mobileMenuOpen ? (
                <X className="w-6 h-6 text-gray-600 dark:text-gray-400" />
              ) : (
                <Menu className="w-6 h-6 text-gray-600 dark:text-gray-400" />
              )}
            </button>

            <h1 className="text-xl md:text-2xl font-bold text-primary-600 dark:text-primary-400">
              {t('app.title')}
            </h1>

            {/* Connection Status - Hidden on small screens */}
            <div className="hidden sm:flex items-center gap-2">
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

          {/* User Info and Selectors */}
          <div className="flex items-center gap-2 md:gap-4">
            {/* Theme Selector */}
            <ThemeSelector />
            
            {/* Language Selector */}
            <LanguageSelector />

            {/* User Info - Hidden on small screens */}
            <div className="hidden sm:flex items-center gap-2">
              <User className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300 capitalize">
                {t(`auth.${user?.role}`)}
              </span>
            </div>

            {/* Logout button - Icon only on mobile */}
            <button
              onClick={logout}
              className="flex items-center gap-2 px-2 md:px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 rounded-lg transition-colors"
            >
              <LogOut className="w-5 h-5" />
              <span className="hidden md:inline font-medium">{t('nav.logout')}</span>
            </button>
          </div>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden md:block border-t border-gray-200 dark:border-gray-700">
          <div className="px-4 flex gap-2 overflow-x-auto">
            {navigation.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;

              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`
                    flex items-center gap-2 px-4 lg:px-6 py-3 font-medium transition-colors
                    border-b-2 no-select whitespace-nowrap
                    ${
                      isActive
                        ? 'text-primary-600 dark:text-primary-400 border-primary-600 dark:border-primary-400'
                        : 'text-gray-600 dark:text-gray-400 border-transparent hover:text-gray-800 dark:hover:text-gray-200 hover:border-gray-300 dark:hover:border-gray-600'
                    }
                  `}
                >
                  <Icon className="w-5 h-5" />
                  <span className="text-sm lg:text-base">{item.name}</span>
                </Link>
              );
            })}
          </div>
        </nav>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <nav className="md:hidden border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
            <div className="px-4 py-2 space-y-1">
              {navigation.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;

                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`
                      flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-colors
                      no-select
                      ${
                        isActive
                          ? 'text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/20'
                          : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700'
                      }
                    `}
                  >
                    <Icon className="w-5 h-5" />
                    <span>{item.name}</span>
                  </Link>
                );
              })}
              
              {/* Connection Status in mobile menu */}
              <div className="flex items-center gap-3 px-4 py-3 text-sm">
                {wsConnected ? (
                  <>
                    <Wifi className="w-5 h-5 text-success-600" />
                    <span className="text-success-600 font-medium">
                      {t('connection.connected')}
                    </span>
                  </>
                ) : (
                  <>
                    <WifiOff className="w-5 h-5 text-danger-600" />
                    <span className="text-danger-600 font-medium">
                      {t('connection.disconnected')}
                    </span>
                  </>
                )}
              </div>

              {/* User info in mobile menu */}
              <div className="flex items-center gap-3 px-4 py-3 text-sm border-t border-gray-200 dark:border-gray-700">
                <User className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                <span className="text-gray-700 dark:text-gray-300 capitalize">
                  {t(`auth.${user?.role}`)}
                </span>
              </div>
            </div>
          </nav>
        )}
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>

      {/* Fixed Footer */}
      <footer className="sticky bottom-0 z-40 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 px-4 py-2 shadow-lg">
        <div className="flex items-center justify-between text-sm">
          {/* OPC Connection Status */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              {opcConnected ? (
                <>
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-green-600 dark:text-green-400 font-medium">
                    OPC-UA Connected
                  </span>
                </>
              ) : (
                <>
                  <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                  <span className="text-red-600 dark:text-red-400 font-medium">
                    OPC-UA Disconnected
                  </span>
                </>
              )}
            </div>
            
            {/* Alarms Status */}
            <div className="flex items-center gap-2">
              {activeAlarms.length > 0 ? (
                <>
                  <AlertTriangle className="w-4 h-4 text-orange-500" />
                  <span className="text-orange-600 dark:text-orange-400 font-medium">
                    {activeAlarms.length} {activeAlarms.length === 1 ? 'Alarma Activa' : 'Alarmas Activas'}
                  </span>
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span className="text-green-600 dark:text-green-400 font-medium">
                    Sin Alarmas
                  </span>
                </>
              )}
            </div>
          </div>
          
          {/* Date and Time */}
          <div className="text-gray-600 dark:text-gray-400 font-medium">
            {currentTime.toLocaleString('es-ES', {
              weekday: 'short',
              year: 'numeric',
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit'
            })}
          </div>
        </div>
      </footer>
    </div>
  );
}
