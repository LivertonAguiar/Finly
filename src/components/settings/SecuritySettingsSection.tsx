import React, { useState, useEffect } from 'react';
import {
  Lock,
  KeyRound,
  Fingerprint,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  ShieldCheck,
  Clock,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import {
  isSecurityLockEnabled,
  setSecurityLockEnabled,
  isPinConfigured,
  isBiometricEnabled,
  setBiometricEnabled,
  getBiometricStatus,
  authenticateWithBiometrics,
  getLockTimeoutMinutes,
  setLockTimeoutMinutes,
  BiometricStatusInfo,
} from '../../utils/securityManager';
import { PinSetupModal } from '../common/PinSetupModal';
import { calculatePasswordStrength } from '../../utils/passwordStrength';

export interface SecuritySettingsSectionProps {
  showPasswordSection?: boolean;
  className?: string;
}

export const SecuritySettingsSection: React.FC<SecuritySettingsSectionProps> = ({
  showPasswordSection = true,
  className = '',
}) => {
  const { currentUser, changePassword } = useAuth();

  // Password state
  const [currentPass, setCurrentPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  const [isChangingPass, setIsChangingPass] = useState(false);
  const [passAlert, setPassAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Security Lock & Biometrics
  const [pinEnabled, setPinEnabled] = useState(isSecurityLockEnabled());
  const [pinConfigured, setPinConfigured] = useState(isPinConfigured());
  const [biometricEnabled, setBiometricEnabledState] = useState(isBiometricEnabled());
  const [biometricSupported, setBiometricSupported] = useState(false);
  const [biometricStatus, setBiometricStatus] = useState<BiometricStatusInfo>({ supported: false, enrolled: false });
  const [lockTimeout, setLockTimeout] = useState(getLockTimeoutMinutes());
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);

  useEffect(() => {
    getBiometricStatus().then(status => {
      setBiometricStatus(status);
      setBiometricSupported(status.supported && status.enrolled);
      if (!status.supported || !status.enrolled) {
        setBiometricEnabledState(false);
        setBiometricEnabled(false);
      }
    });
  }, []);

  const strength = calculatePasswordStrength(newPass);

  const handleTogglePin = (checked: boolean) => {
    if (checked) {
      if (!isPinConfigured()) {
        setIsPinModalOpen(true);
      } else {
        setSecurityLockEnabled(true);
        setPinEnabled(true);
      }
    } else {
      setSecurityLockEnabled(false);
      setPinEnabled(false);
    }
  };

  const handleToggleBiometric = async (checked: boolean) => {
    if (checked) {
      const success = await authenticateWithBiometrics();
      if (success) {
        setBiometricEnabled(true);
        setBiometricEnabledState(true);
      } else {
        setBiometricEnabled(false);
        setBiometricEnabledState(false);
      }
    } else {
      setBiometricEnabled(false);
      setBiometricEnabledState(false);
    }
  };

  const handleChangeTimeout = (mins: number) => {
    setLockTimeout(mins);
    setLockTimeoutMinutes(mins);
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPassAlert(null);

    if (!currentPass) {
      setPassAlert({ type: 'error', message: 'Informe sua senha atual.' });
      return;
    }
    if (newPass.length < 6) {
      setPassAlert({ type: 'error', message: 'A nova senha deve ter no mínimo 6 dígitos.' });
      return;
    }
    if (newPass !== confirmPass) {
      setPassAlert({ type: 'error', message: 'A nova senha e a confirmação não coincidem.' });
      return;
    }

    setIsChangingPass(true);
    try {
      const res = await changePassword(currentPass, newPass);
      if (res.success) {
        setPassAlert({ type: 'success', message: res.message });
        setCurrentPass('');
        setNewPass('');
        setConfirmPass('');
      } else {
        setPassAlert({ type: 'error', message: res.message });
      }
    } catch (err: any) {
      setPassAlert({ type: 'error', message: err.message || 'Erro ao alterar senha.' });
    } finally {
      setIsChangingPass(false);
      setTimeout(() => setPassAlert(null), 5000);
    }
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* 1. SEÇÃO DE SENHA */}
      {showPasswordSection && (
        <div className="p-5 sm:p-6 rounded-[25px] bg-white dark:bg-[#1E1F23] border border-slate-200/80 dark:border-white/[0.08] shadow-sm dark:shadow-2xl space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-purple-50 dark:bg-purple-600/20 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold shrink-0 shadow-xs">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-black text-slate-900 dark:text-white">
                Alterar Senha de Acesso
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Atualize sua credencial de login com verificação de segurança
              </p>
            </div>
          </div>

          {passAlert && (
            <div
              className={`p-3 rounded-xl text-xs font-bold flex items-center gap-2 animate-in fade-in ${
                passAlert.type === 'success'
                  ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 border border-emerald-200/80 dark:border-emerald-800/60'
                  : 'bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 border border-rose-200/80 dark:border-rose-800/60'
              }`}
            >
              {passAlert.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0" />
              )}
              <span>{passAlert.message}</span>
            </div>
          )}

          <form onSubmit={handleChangePassword} className="space-y-3 pt-1">
            {/* Senha Atual */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Senha Atual
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showCurrentPass ? 'text' : 'password'}
                  value={currentPass}
                  onChange={e => setCurrentPass(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-600"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPass(!showCurrentPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 cursor-pointer"
                  title={showCurrentPass ? 'Ocultar senha' : 'Ver senha'}
                >
                  {showCurrentPass ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            {/* Nova Senha & Confirmação */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Nova Senha
                </label>
                <div className="relative">
                  <input
                    type={showNewPass ? 'text' : 'password'}
                    value={newPass}
                    onChange={e => setNewPass(e.target.value)}
                    placeholder="Mínimo 6 caracteres"
                    className="w-full pl-3.5 pr-10 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-600"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPass(!showNewPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 cursor-pointer"
                  >
                    {showNewPass ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Confirmar Nova Senha
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPass ? 'text' : 'password'}
                    value={confirmPass}
                    onChange={e => setConfirmPass(e.target.value)}
                    placeholder="Repita a nova senha"
                    className="w-full pl-3.5 pr-10 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-600"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPass(!showConfirmPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 cursor-pointer"
                  >
                    {showConfirmPass ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            </div>

            {/* Medidor de Força de Senha (S-02) */}
            {newPass.length > 0 && (
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 space-y-2 animate-in fade-in">
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="text-slate-600 dark:text-slate-400">Força da Senha:</span>
                  <span className={strength.colorClass}>{strength.label}</span>
                </div>
                <div className="h-1.5 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-300 ${strength.barColorClass}`}
                    style={{ width: `${strength.percent}%` }}
                  />
                </div>
                {strength.suggestions.length > 0 && (
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Sugestões: {strength.suggestions.join(', ')}.
                  </p>
                )}
              </div>
            )}

            <div className="flex justify-end pt-1">
              <button
                type="submit"
                disabled={isChangingPass || !currentPass || !newPass}
                className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold transition-all cursor-pointer shadow-xs active:scale-95 disabled:opacity-50"
              >
                {isChangingPass ? 'Atualizando...' : 'Atualizar Senha'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 2. BLOQUEIO BIOMÉTRICO E PIN NUMÉRICO (S-01 & C-01) */}
      <div className="p-5 sm:p-6 rounded-[25px] bg-white dark:bg-[#1E1F23] border border-slate-200/80 dark:border-white/[0.08] shadow-sm dark:shadow-2xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-purple-50 dark:bg-purple-600/20 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold shrink-0 shadow-xs">
              <Fingerprint className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-black text-slate-900 dark:text-white">
                Bloqueio Biométrico & PIN (PBKDF2)
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Proteja a abertura do Finly com código numérico seguro ou biometria
              </p>
            </div>
          </div>

          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={pinEnabled}
              onChange={e => handleTogglePin(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
          </label>
        </div>

        {pinEnabled && (
          <div className="space-y-3.5 pt-3 border-t border-slate-100 dark:border-white/5 animate-in fade-in">
            {/* PIN Code */}
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                  Código PIN de Acesso
                </span>
                <span className="text-[11px] text-slate-400 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                  {pinConfigured ? 'Criptografado com PBKDF2 (100.000 iterações)' : 'Nenhum PIN definido ainda'}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsPinModalOpen(true)}
                className="px-3 py-1.5 rounded-xl border border-purple-200 dark:border-purple-800/60 bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-300 text-xs font-bold hover:bg-purple-100 dark:hover:bg-purple-900/40 transition-colors cursor-pointer active:scale-95"
              >
                {pinConfigured ? 'Alterar PIN' : 'Definir PIN'}
              </button>
            </div>

            {/* Biometria */}
            <div className="flex items-center justify-between pt-2.5 border-t border-slate-100 dark:border-white/5">
              <div className="flex items-center gap-2">
                <Fingerprint className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                <div>
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                    Desbloqueio por Biometria
                  </span>
                  <span className="text-[10px] text-slate-400">
                    {biometricSupported
                      ? 'TouchID, FaceID ou impressão digital disponível'
                      : biometricStatus.reason || 'Sensor biométrico não detectado'}
                  </span>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  disabled={!biometricSupported}
                  checked={biometricEnabled}
                  onChange={e => handleToggleBiometric(e.target.checked)}
                  className="sr-only peer disabled:opacity-40"
                />
                <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-purple-600 peer-disabled:opacity-40"></div>
              </label>
            </div>

            {/* Tempo de Inatividade */}
            <div className="flex items-center justify-between pt-2.5 border-t border-slate-100 dark:border-white/5">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                <div>
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                    Bloquear Automaticamente
                  </span>
                  <span className="text-[10px] text-slate-400">
                    Tempo de inatividade em segundo plano
                  </span>
                </div>
              </div>
              <select
                value={lockTimeout}
                onChange={e => handleChangeTimeout(parseInt(e.target.value, 10))}
                className="px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold text-slate-800 dark:text-slate-200 cursor-pointer focus:outline-none focus:ring-1 focus:ring-purple-500"
              >
                <option value={0}>Imediato</option>
                <option value={1}>Após 1 minuto</option>
                <option value={5}>Após 5 minutos</option>
                <option value={15}>Após 15 minutos</option>
                <option value={30}>Após 30 minutos</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Pin Setup Modal */}
      <PinSetupModal
        isOpen={isPinModalOpen}
        onClose={() => setIsPinModalOpen(false)}
        onSuccess={() => {
          setPinConfigured(true);
          setPinEnabled(true);
          setSecurityLockEnabled(true);
        }}
      />
    </div>
  );
};
