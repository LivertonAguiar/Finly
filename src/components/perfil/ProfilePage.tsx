import React, { useState, useRef } from 'react';
import {
  User,
  Shield,
  Key,
  Bell,
  Moon,
  Sun,
  DollarSign,
  CheckCircle2,
  Download,
  Upload,
  LogOut,
  AlertCircle,
  FileJson,
  Users,
  Lock,
} from 'lucide-react';
import { useFinancial } from '../../context/FinancialContext';
import { useAuth } from '../../context/AuthContext';
import { useConfirm } from '../../context/ConfirmContext';
import { Trash2, Sparkles, RefreshCw, Smartphone } from 'lucide-react';
import { AppUpdateModal } from '../common/AppUpdateModal';
import { APP_VERSION } from '../../utils/appUpdateService';

export const ProfilePage: React.FC = () => {
  const { user, updateUser, toggleTheme, exportBackupJSON, importBackupJSON, resetToCleanState, loadDemoData } = useFinancial();
  const { confirm } = useConfirm();
  const { currentUser, updateUserAccount, logout, changePassword, login, loginAsDemo } = useAuth();

  const [name, setName] = useState(currentUser?.name || user.name);
  const [email, setEmail] = useState(currentUser?.email || user.email);
  const [phone, setPhone] = useState(currentUser?.phone || user.phone || '');
  const [currency, setCurrency] = useState(user.currency);
  const [savedAlert, setSavedAlert] = useState(false);
  const [backupAlert, setBackupAlert] = useState<string | null>(null);
  const [showUpdateModal, setShowUpdateModal] = useState(false);

  // Password change states
  const [currentPass, setCurrentPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [passAlert, setPassAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    updateUser({ name, email, phone, currency });
    updateUserAccount({ name, email, phone });
    setSavedAlert(true);
    setTimeout(() => setSavedAlert(false), 3000);
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPassAlert(null);

    if (newPass !== confirmPass) {
      setPassAlert({ type: 'error', message: 'A nova senha e a confirmação não coincidem.' });
      return;
    }

    const res = await changePassword(currentPass, newPass);
    if (res.success) {
      setPassAlert({ type: 'success', message: res.message });
      setCurrentPass('');
      setNewPass('');
      setConfirmPass('');
    } else {
      setPassAlert({ type: 'error', message: res.message });
    }
  };

  const handleRestoreFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          const success = importBackupJSON(event.target.result as string);
          if (success) {
            setBackupAlert('Backup restaurado com sucesso!');
          } else {
            setBackupAlert('Erro: Arquivo de backup inválido.');
          }
          setTimeout(() => setBackupAlert(null), 4000);
        }
      };
      reader.readAsText(file);
    }
  };

  return (
    <div className="max-w-3xl space-y-6 mx-auto">
      <div>
        <h2 className="text-xl font-black text-slate-800 dark:text-slate-100">Meu Perfil</h2>
        <p className="text-xs text-slate-400">Gerencie seus dados pessoais, alteração de senha e cópias de segurança</p>
      </div>

      {savedAlert && (
        <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 text-xs font-bold flex items-center gap-2 border border-emerald-200 dark:border-emerald-800 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4" /> Alterações salvas com sucesso!
        </div>
      )}

      {backupAlert && (
        <div className={'p-3.5 rounded-xl text-xs font-bold flex items-center gap-2 border animate-in fade-in ' + (
          backupAlert.includes('sucesso')
            ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
            : 'bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800'
        )}>
          <CheckCircle2 className="w-4 h-4" /> {backupAlert}
        </div>
      )}

      {/* 1. Profile Form */}
      <form onSubmit={handleSaveProfile} className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-5">
        <div className="flex items-center gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="w-16 h-16 rounded-full bg-[#007a4d] text-white font-black text-2xl flex items-center justify-center uppercase shadow-md">
            {(name || 'U').charAt(0)}
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">{name}</h3>
            <p className="text-xs text-slate-400">{email}</p>
            <span className="inline-block mt-1 text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400">
              {currentUser?.role === 'admin' ? 'Titular Administrador' : 'Membro da Família'}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Nome Completo</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-800 dark:text-slate-100"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">E-mail de Login</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-800 dark:text-slate-100"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Telefone / WhatsApp</label>
          <input
            type="text"
            value={phone}
            onChange={e => setPhone(e.target.value)}
            placeholder="(85) 98594-9115"
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-800 dark:text-slate-100"
          />
        </div>

        <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end">
          <button
            type="submit"
            className="px-6 py-2.5 rounded-xl bg-[#007a4d] hover:bg-[#006640] text-white text-xs font-bold shadow-md transition-all cursor-pointer"
          >
            Salvar Perfil
          </button>
        </div>
      </form>

      {/* 2. Change Password Section */}
      <form onSubmit={handleChangePassword} className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex items-center gap-2">
          <Lock className="w-5 h-5 text-emerald-600" />
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">Segurança & Alteração de Senha</h3>
        </div>
        <p className="text-xs text-slate-400 -mt-2">
          Altere a senha da sua conta diretamente informando sua senha atual.
        </p>

        {passAlert && (
          <div className={'p-3 rounded-xl text-xs font-bold flex items-center gap-2 border animate-in fade-in ' + (
            passAlert.type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
              : 'bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800'
          )}>
            {passAlert.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
            <span>{passAlert.message}</span>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Senha Atual *</label>
            <input
              type="password"
              required
              value={currentPass}
              onChange={e => setCurrentPass(e.target.value)}
              placeholder="••••••••"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-800 dark:text-slate-100"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Nova Senha *</label>
            <input
              type="password"
              required
              value={newPass}
              onChange={e => setNewPass(e.target.value)}
              placeholder="Nova senha"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-800 dark:text-slate-100"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Confirmar Nova Senha *</label>
            <input
              type="password"
              required
              value={confirmPass}
              onChange={e => setConfirmPass(e.target.value)}
              placeholder="Confirme a nova"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-800 dark:text-slate-100"
            />
          </div>
        </div>

        <div className="pt-2 flex justify-end">
          <button
            type="submit"
            className="px-5 py-2.5 rounded-xl bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 text-white text-xs font-bold border border-slate-700 transition-all cursor-pointer"
          >
            Atualizar Senha
          </button>
        </div>
      </form>

      {/* 3. Backup & Data Security Card */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex items-center gap-2">
          <FileJson className="w-5 h-5 text-emerald-600" />
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">Backup & Segurança dos Seus Dados</h3>
        </div>
        <p className="text-xs text-slate-400 -mt-2">
          Seus dados são salvos localmente e isolados no seu navegador. Você pode baixar uma cópia completa em JSON para guardar ou restaurar a qualquer momento.
        </p>

        <div className="flex flex-col sm:flex-row flex-wrap items-center gap-3 pt-2">
          <button
            type="button"
            onClick={exportBackupJSON}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm transition-all cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Baixar Backup (.JSON)</span>
          </button>

          <input
            type="file"
            ref={fileInputRef}
            onChange={handleRestoreFile}
            accept=".json,application/json"
            className="hidden"
          />

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 text-slate-700 dark:text-slate-200 text-xs font-bold transition-all cursor-pointer"
          >
            <Upload className="w-4 h-4 text-slate-500" />
            <span>Restaurar Backup</span>
          </button>

          {currentUser?.id === 'usr-demo-financeiro' ? (
            <>
              <button
                type="button"
                onClick={() => {
                  logout();
                }}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-emerald-500/40 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-xs font-black transition-all cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Entrar na Minha Conta Principal</span>
              </button>

              <button
                type="button"
                onClick={async () => {
                  const ok = await confirm({
                    title: 'Restaurar Dados da Demo?',
                    message: 'Isso irá restaurar o conjunto completo de dados fictícios originais da Conta Demonstração.',
                    confirmText: 'Restaurar Demo',
                    type: 'info'
                  });
                  if (ok) {
                    loadDemoData();
                    setBackupAlert('Dados da conta demo restaurados com sucesso!');
                    setTimeout(() => setBackupAlert(null), 4000);
                  }
                }}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-purple-300 dark:border-purple-800/80 bg-purple-50 dark:bg-purple-950/40 hover:bg-purple-100 dark:hover:bg-purple-900/50 text-purple-700 dark:text-purple-300 text-xs font-black transition-all cursor-pointer"
              >
                <RefreshCw className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                <span>Restaurar Dados da Demo</span>
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={async () => {
                const ok = await confirm({
                  title: 'Acessar Modo Demonstração?',
                  message: 'Você entrará na conta demo com dados fictícios completos para testes. Sua conta pessoal continuará totalmente salva e segura.',
                  confirmText: 'Entrar na Demo',
                  type: 'info'
                });
                if (ok) {
                  loginAsDemo();
                }
              }}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-purple-300 dark:border-purple-800/80 bg-purple-50 dark:bg-purple-950/40 hover:bg-purple-100 dark:hover:bg-purple-900/50 text-purple-700 dark:text-purple-300 text-xs font-black transition-all cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              <span>Acessar Conta Demonstração (Demo)</span>
            </button>
          )}
        </div>
      </div>

      {/* 4. App Updates & In-App Synchronization Card */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">Atualizações do Aplicativo</h3>
            <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-500 border border-purple-500/20">
              v{APP_VERSION}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">Verifique novas versões, atualize o APK ou limpe o cache do app</p>
        </div>

        <button
          type="button"
          onClick={() => setShowUpdateModal(true)}
          className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-black shadow-md shadow-purple-500/20 transition-all cursor-pointer"
        >
          <Sparkles className="w-4 h-4 text-purple-200" />
          <span>Verificar Atualizações</span>
        </button>
      </div>

      {/* 5. Logout Card */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center justify-between gap-4">
        <div>
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">Sair da Conta Atual</h3>
          <p className="text-xs text-slate-400 mt-0.5">Encerre sua sessão para entrar com outro usuário</p>
        </div>

        <button
          type="button"
          onClick={logout}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-400 text-xs font-bold hover:bg-rose-100 transition-colors shrink-0 cursor-pointer"
        >
          <LogOut className="w-4 h-4" />
          <span>Sair da Conta</span>
        </button>
      </div>

      <AppUpdateModal isOpen={showUpdateModal} onClose={() => setShowUpdateModal(false)} />
    </div>
  );
};
