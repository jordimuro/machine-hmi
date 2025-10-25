import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../hooks/useAuth';
import { Lock } from 'lucide-react';
import LanguageSelector from './LanguageSelector';

export default function Login() {
  const { t } = useTranslation();
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  const handleNumberClick = (num) => {
    if (pin.length < 8) {
      setPin(pin + num);
      setError('');
    }
  };

  const handleClear = () => {
    setPin('');
    setError('');
  };

  const handleSubmit = async () => {
    if (pin.length < 4) {
      setError(t('auth.pinRequired'));
      return;
    }

    setLoading(true);
    setError('');

    try {
      await login(pin);
    } catch (err) {
      setError(t('auth.invalidPin'));
      setPin('');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSubmit();
    } else if (e.key === 'Backspace') {
      setPin(pin.slice(0, -1));
    } else if (/^\d$/.test(e.key)) {
      handleNumberClick(e.key);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md relative">
        {/* Language Selector */}
        <div className="absolute top-4 right-4">
          <LanguageSelector />
        </div>

        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-100 rounded-full mb-4">
            <Lock className="w-8 h-8 text-primary-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">{t('app.title')}</h1>
          <p className="text-gray-600">{t('auth.enterPin')}</p>
        </div>

        {/* PIN Display */}
        <div className="mb-6">
          <div className="bg-gray-100 rounded-lg p-6 text-center min-h-[80px] flex items-center justify-center">
            <div className="text-4xl font-mono tracking-widest">
              {pin ? '•'.repeat(pin.length) : <span className="text-gray-400">••••</span>}
            </div>
          </div>
          {error && (
            <div className="mt-3 text-danger-600 text-center font-medium">
              {error}
            </div>
          )}
        </div>

        {/* PIN Pad */}
        <div className="grid grid-cols-3 gap-4 mb-6" onKeyDown={handleKeyPress} tabIndex={0}>
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
            <button
              key={num}
              onClick={() => handleNumberClick(num.toString())}
              className="pin-btn"
              disabled={loading}
            >
              {num}
            </button>
          ))}
          <button
            onClick={handleClear}
            className="pin-btn bg-gray-200 hover:bg-gray-300 text-gray-700"
            disabled={loading}
          >
            C
          </button>
          <button
            onClick={() => handleNumberClick('0')}
            className="pin-btn"
            disabled={loading}
          >
            0
          </button>
          <button
            onClick={() => setPin(pin.slice(0, -1))}
            className="pin-btn bg-gray-200 hover:bg-gray-300 text-gray-700"
            disabled={loading}
          >
            ←
          </button>
        </div>

        {/* Submit Button */}
        <button
          onClick={handleSubmit}
          disabled={loading || pin.length < 4}
          className="btn-primary w-full"
        >
          {loading ? t('auth.authenticating') : t('auth.login')}
        </button>

        {/* Info */}
        <div className="mt-6 text-center text-sm text-gray-500">
          <p>{t('auth.defaultPins')}:</p>
          <p>{t('auth.operator')}: 1111 | {t('auth.maintenance')}: 2222</p>
        </div>
      </div>
    </div>
  );
}
