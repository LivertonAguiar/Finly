import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Lock,
  Fingerprint,
  Delete,
  ShieldCheck,
  AlertCircle,
  KeyRound,
  LogOut,
} from 'lucide-react';
import { FinlyLogo } from '../ui/FinlyLogo';
import {
  verifyPinCode,
  unlockApp,
  isBiometricEnabled,
  authenticateWithBiometrics,
} from '../../utils/securityManager';
import { useAuth } from '../../context/AuthContext';
import { useConfirm } from '../../context/ConfirmContext';

interface PinLockScreenProps {
  onUnlock?: () => void;
}

export const PinLockScreen: React.FC<PinLockScreenProps> = ({ onUnlock }) => {
  const { currentUser, logout } = useAuth();
  const { confirm } = useConfirm();

  const [pin, setPin] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [isShaking, setIsShaking] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [biometricAvailable, setBiometricAvailable] = useState(isBiometricEnabled());

  const autoBiometricTriggered = useRef(false);

  // Auto-trigger biometric prompt on mount if configured
  useEffect(() => {
    if (biometricAvailable && !autoBiometricTriggered.current) {
      autoBiometricTriggered.current = true;
      const timer = setTimeout(() => {
        handleBiometricAuth();
      }, 350);
      return () => clearTimeout(timer);
    }
  }, [biometricAvailable]);

  const handleSuccessfulUnlock = useCallback(() => {
    unlockApp();
    if (onUnlock) onUnlock();
  }, [onUnlock]);

  const handleBiometricAuth = async () => {
    try {
      const success = await authenticateWithBiometrics();
      if (success) {
        handleSuccessfulUnlock();
      }
    } catch (e) {}
  };

  const handleNumberClick = (digit: string) => {
    if (pin.length < 4 && !isVerifying) {
      setError(null);
      const nextPin = pin + digit;
      setPin(nextPin);

      if (nextPin.length === 4) {
        verifyEnteredPin(nextPin);
      }
    }
  };

  const handleDelete = () => {
    if (pin.length > 0 && !isVerifying) {
      setError(null);
      setPin(prev => prev.slice(0, -1));
    }
  };

  const verifyEnteredPin = async (inputPin: string) => {
    setIsVerifying(true);
    try {
      const isValid = await verifyPinCode(inputPin);
      if (isValid) {
        handleSuccessfulUnlock();
      } else {
        setIsShaking(true);
        setError('PIN incorreto. Tente novamente.');
        setTimeout(() => {
          setPin('');
          setIsShaking(false);
          setIsVerifying(false);
        }, 600);
      }
    } catch (err) {
      setError('Erro ao validar PIN.');
      setIsVerifying(false);
      setPin('');
    }
  };

  // Keyboard listener for physical keyboard typing
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key >= '0' && e.key <= '9') {
        handleNumberClick(e.key);
      } else if (e.key === 'Backspace') {
        handleDelete();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [pin, isVerifying]);

  const handleLogout = async () => {
    const ok = await confirm({
      title: 'Desconectar da Conta',
      message: 'Esqueceu seu PIN? Para recuperar o acesso, você será desconectado e poderá entrar novamente com seu e-mail e senha.',
      confirmText: 'Sair e Entrar com Senha',
      type: 'danger',
    });
    if (ok) {
      unlockApp();
      logout();
    }
  };

  return (
    <div className="fixed inset-0 z-[99999] flex flex-col items-center justify-between bg-slate-950 text-white select-none p-6 pt-12 pb-8 overflow-y-auto">
      {/* Background radial ambient glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-30">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-purple-600/30 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 left-1/2 -translate-x-1/2 translate-y-1/2 w-80 h-80 bg-emerald-500/20 rounded-full blur-3xl" />
      </div>

      {/* Header Info */}
      <div className="relative z-10 flex flex-col items-center text-center space-y-4 max-w-sm">
        <div className="scale-110">
          <FinlyLogo size="lg" showText={true} />
        </div>

        <div className="w-14 h-14 rounded-2xl bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center shadow-lg shadow-purple-500/10 mt-2">
          <Lock className="w-7 h-7" />
        </div>

        <div>
          <h2 className="text-xl font-black tracking-tight text-white">
            {currentUser?.name ? `Olá, ${currentUser.name.split(' ')[0]}` : 'Finly Protegido'}
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Digite seu PIN de segurança de 4 dígitos para desbloquear
          </p>
        </div>

        {/* PIN Indicators */}
        <div className={`flex items-center justify-center gap-4 py-3 transition-transform ${isShaking ? 'animate-shake' : ''}`}>
          {[0, 1, 2, 3].map(index => {
            const filled = pin.length > index;
            return (
              <div
                key={index}
                className={`w-4 h-4 rounded-full transition-all duration-200 ${
                  filled
                    ? 'bg-purple-500 scale-125 shadow-lg shadow-purple-500/50 border border-purple-300'
                    : 'bg-slate-800 border-2 border-slate-700'
                }`}
              />
            );
          })}
        </div>

        {error ? (
          <div className="flex items-center gap-1.5 text-rose-400 text-xs font-bold animate-in fade-in">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            <span>{error}</span>
          </div>
        ) : (
          <div className="h-4" />
        )}
      </div>

      {/* Numeric Keypad */}
      <div className="relative z-10 w-full max-w-xs space-y-3 my-auto">
        <div className="grid grid-cols-3 gap-3.5">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map(num => (
            <button
              key={num}
              type="button"
              onClick={() => handleNumberClick(num)}
              className="h-16 rounded-2xl bg-slate-900/80 hover:bg-slate-800/90 active:bg-purple-600/30 border border-slate-800 text-2xl font-black text-white flex items-center justify-center transition-all duration-150 active:scale-90 cursor-pointer shadow-md"
            >
              {num}
            </button>
          ))}

          {/* Biometrics button or empty */}
          {biometricAvailable ? (
            <button
              type="button"
              onClick={handleBiometricAuth}
              className="h-16 rounded-2xl bg-purple-600/20 hover:bg-purple-600/30 active:bg-purple-600/50 border border-purple-500/30 text-purple-300 flex items-center justify-center transition-all duration-150 active:scale-90 cursor-pointer shadow-md"
              title="Autenticar por Biometria"
            >
              <Fingerprint className="w-8 h-8 text-purple-400" />
            </button>
          ) : (
            <div className="h-16" />
          )}

          {/* Zero */}
          <button
            type="button"
            onClick={() => handleNumberClick('0')}
            className="h-16 rounded-2xl bg-slate-900/80 hover:bg-slate-800/90 active:bg-purple-600/30 border border-slate-800 text-2xl font-black text-white flex items-center justify-center transition-all duration-150 active:scale-90 cursor-pointer shadow-md"
          >
            0
          </button>

          {/* Delete Button */}
          <button
            type="button"
            onClick={handleDelete}
            className="h-16 rounded-2xl bg-slate-900/40 hover:bg-slate-800/60 active:bg-rose-600/20 border border-slate-800/60 text-slate-400 hover:text-white flex items-center justify-center transition-all duration-150 active:scale-90 cursor-pointer"
            title="Apagar dígito"
          >
            <Delete className="w-6 h-6" />
          </button>
        </div>
      </div>

      {/* Footer Fallback Actions */}
      <div className="relative z-10 flex flex-col items-center space-y-3 pt-4">
        <button
          type="button"
          onClick={handleLogout}
          className="flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-slate-200 transition-colors py-1 px-3 rounded-lg hover:bg-slate-900"
        >
          <KeyRound className="w-3.5 h-3.5" />
          <span>Esqueceu o PIN? Entrar com Senha</span>
        </button>

        <div className="flex items-center gap-1.5 text-[10px] text-slate-500">
          <ShieldCheck className="w-3 h-3 text-emerald-400" />
          <span>Proteção Criptografada Finly Vault</span>
        </div>
      </div>
    </div>
  );
};
