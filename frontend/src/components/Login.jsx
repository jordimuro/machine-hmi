import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Lock, User, KeyRound } from 'lucide-react';
import LanguageSelector from './LanguageSelector';

export default function Login() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, isAuthenticated } = useAuth();

  // Redirigir si ya está autenticado
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!username.trim()) {
      setError(t('auth.usernameRequired'));
      return;
    }

    if (!password.trim()) {
      setError(t('auth.passwordRequired'));
      return;
    }

    setLoading(true);
    setError('');

    try {
      await login(username.trim(), password);
      // La navegación se maneja en el useEffect
    } catch (err) {
      setError(t('auth.invalidCredentials'));
      setPassword('');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = (e) => {
    // Solo permitir números en el campo de contraseña
    const value = e.target.value.replace(/[^0-9]/g, '');
    setPassword(value);
    setError('');
  };

  const handleUsernameChange = (e) => {
    // Permitir alfanuméricos en el campo de usuario
    const value = e.target.value.replace(/[^a-zA-Z0-9]/g, '');
    setUsername(value);
    setError('');
  };

  return (
    <div className="login-container min-h-screen bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center p-4">
      <div className="login-card bg-white rounded-2xl shadow-2xl p-6 sm:p-8 w-full max-w-sm sm:max-w-md relative">
        {/* Language Selector */}
        <div className="absolute top-4 right-4">
          <LanguageSelector />
        </div>

        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-100 rounded-full mb-4">
            <Lock className="w-8 h-8 text-primary-600" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-2">{t('app.title')}</h1>
          <p className="text-sm text-gray-600">{t('auth.enterCredentials')}</p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Username Field */}
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">
              <User className="w-4 h-4 inline mr-2" />
              {t('auth.username')}
            </label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={handleUsernameChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-lg touch-manipulation"
              placeholder={t('auth.usernamePlaceholder')}
              disabled={loading}
              maxLength={20}
              autoComplete="username"
            />
          </div>

          {/* Password Field */}
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
              <KeyRound className="w-4 h-4 inline mr-2" />
              {t('auth.password')}
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={handlePasswordChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-lg font-mono tracking-widest touch-manipulation"
              placeholder={t('auth.passwordPlaceholder')}
              disabled={loading}
              maxLength={10}
              autoComplete="current-password"
            />
          </div>

          {/* Error Message */}
          {error && (
            <div className="text-danger-600 text-center font-medium bg-danger-50 p-3 rounded-lg">
              {error}
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading || !username.trim() || !password.trim()}
            className="w-full bg-primary-600 hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-4 px-6 rounded-lg transition-all duration-200 text-lg touch-manipulation active:scale-95"
          >
            {loading ? t('auth.authenticating') : t('auth.login')}
          </button>
        </form>

        {/* Info */}
        <div className="mt-6 text-center text-sm text-gray-500">
          <p className="mb-2">{t('auth.defaultCredentials')}:</p>
          <div className="space-y-1">
            <div><strong>admin</strong> - 2222</div>
            <div><strong>guest</strong> - 1111</div>
          </div>
        </div>
      </div>
    </div>
  );
}
