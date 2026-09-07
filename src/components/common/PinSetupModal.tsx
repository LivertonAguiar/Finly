import React, { useState, useEffect } from 'react';
import { ShieldCheck, Lock, CheckCircle2, AlertCircle, Fingerprint } from 'lucide-react';
import { Modal } from '../ui/Modal';
import {
  setPinCode,
  isBiometricSupported,
  setBiometricEnabled,
  setSecurityLockEnabled,
  removePinCode,
} from '../../utils/securityManager';

interface PinSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const PinSetupModal: React.FC<PinSetupModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [step, setStep] = useState<'create' | 'confirm'>('create');
  const [firstPin, setFirstPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [enableBiometric, setEnableBiometric] = useState(true);
  const [hasBiometrics, setHasBiometrics] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setStep('create');
      setFirstPin('');
      setConfirmPin('');
      setError(null);
      isBiometricSupported().then(supported => setHasBiometrics(supported));
    }
  }, [isOpen]);

  const handleDigit = (digit: string) => {
    setError(null);
    if (step === 'create') {
      if (firstPin.length < 4) {
        const next = firstPin + digit;
        setFirstPin(next);
        if (next.length === 4) {
          setTimeout(() => setStep('confirm'), 200);
        }
      }
    } else {
      if (confirmPin.length < 4) {
        const next = confirmPin + digit;
        setConfirmPin(next);
        if (next.length === 4) {
          if (next === firstPin) {
            handleSavePin(next);
          } else {
            setError('Os PINs digitados não coincidem. Tente novamente.');
            setTimeout(() => {
              setConfirmPin('');
              setStep('create');
              setFirstPin('');
            }, 1200);
          }
        }
      }
    }
  };

  const handleBackspace = () => {
    setError(null);
    if (step === 'create') {
      setFirstPin(prev => prev.slice(0, -1));
    } else {
      setConfirmPin(prev => prev.slice(0, -1));
    }
  };

  const handleSavePin = async (finalPin: string) => {
    try {
      await setPinCode(finalPin);
      setSecurityLockEnabled(true);
      if (hasBiometrics) {
        setBiometricEnabled(enableBiometric);
      }
      onSuccess();
      onClose();
    } catch (e) {
      setError('Erro ao salvar PIN.');
    }
  };

  const activePin = step === 'create' ? firstPin : confirmPin;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={step === 'create' ? 'Definir PIN de Acesso' : 'Confirmar seu PIN'}
      maxWidth="sm"
    >
      <div className="p-5 flex flex-col items-center text-center space-y-4 select-none">
        <div className="w-12 h-12 rounded-2xl bg-purple-500/10 border border-purple-500/20 text-purple-600 dark:text-purple-400 flex items-center justify-center shadow-md">
          <Lock className="w-6 h-6" />
        </div>

        <div>
          <h4 className="text-sm font-black text-slate-900 dark:text-white">
            {step === 'create' ? 'Digite um PIN de 4 dígitos' : 'Confirme seu novo PIN de 4 dígitos'}
          </h4>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {step === 'create'
              ? 'Este código será solicitado para proteger o acesso ao seu Finly'
              : 'Digite os mesmos 4 dígitos para confirmar'}
          </p>
        </div>

        {/* PIN Dots */}
        <div className="flex items-center justify-center gap-3 py-2">
          {[0, 1, 2, 3].map(i => (
            <div
              key={i}
              className={`w-3.5 h-3.5 rounded-full transition-all duration-200 ${
                activePin.length > i
                  ? 'bg-purple-600 dark:bg-purple-400 scale-125 shadow-md shadow-purple-500/30'
                  : 'bg-slate-200 dark:bg-slate-700'
              }`}
            />
          ))}
        </div>

        {error && (
          <div className="flex items-center gap-1.5 text-rose-500 text-xs font-bold animate-in fade-in">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Biometric Toggle if supported */}
        {hasBiometrics && step === 'create' && (
          <label className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 cursor-pointer w-full justify-between">
            <div className="flex items-center gap-2">
              <Fingerprint className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              <span>Habilitar Biometria (TouchID / FaceID / Digital)</span>
            </div>
            <input
              type="checkbox"
              checked={enableBiometric}
              onChange={e => setEnableBiometric(e.target.checked)}
              className="w-4 h-4 text-purple-600 rounded cursor-pointer accent-purple-600"
            />
          </label>
        )}

        {/* Keypad */}
        <div className="w-full max-w-[260px] pt-1">
          <div className="grid grid-cols-3 gap-2.5">
            {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map(n => (
              <button
                key={n}
                type="button"
                onClick={() => handleDigit(n)}
                className="h-12 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-lg font-black text-slate-900 dark:text-white transition-all active:scale-95 cursor-pointer"
              >
                {n}
              </button>
            ))}
            <div className="h-12" />
            <button
              type="button"
              onClick={() => handleDigit('0')}
              className="h-12 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-lg font-black text-slate-900 dark:text-white transition-all active:scale-95 cursor-pointer"
            >
              0
            </button>
            <button
              type="button"
              onClick={handleBackspace}
              className="h-12 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300 transition-all active:scale-95 cursor-pointer flex items-center justify-center"
            >
              Apagar
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
};
