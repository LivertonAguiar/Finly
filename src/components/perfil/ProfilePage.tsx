import React, { useState, useRef, useEffect } from 'react';
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
  Fingerprint,
  Clock,
  Trash2,
  Sparkles,
  RefreshCw,
  AlertTriangle,
} from 'lucide-react';
import { useFinancial } from '../../context/FinancialContext';
import { useAuth } from '../../context/AuthContext';
import { useConfirm } from '../../context/ConfirmContext';
import { Modal } from '../ui/Modal';
import { SecuritySettingsSection } from '../settings/SecuritySettingsSection';

export const ProfilePage: React.FC = () => {
  const { user, updateUser, toggleTheme, exportBackupJSON, importBackupJSON, resetToCleanState, loadDemoData } = useFinancial();
  const { confirm } = useConfirm();
  const { currentUser, updateUserAccount, deleteUserAccount, logout, changePassword, login, loginAsDemo } = useAuth();

  const [name, setName] = useState(currentUser?.name || user.name);
  const [email, setEmail] = useState(currentUser?.email || user.email);
  const [phone, setPhone] = useState(currentUser?.phone || user.phone || '');
  const [currency, setCurrency] = useState(user.currency);
  const [savedAlert, setSavedAlert] = useState(false);
  const [backupAlert, setBackupAlert] = useState<string | null>(null);

  // Password change states
  // Delete account modal states
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteConfirmationInput, setDeleteConfirmationInput] = useState('');
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const handleDeleteAccount = async () => {
    if (!currentUser || currentUser.id === 'usr-demo-financeiro') return;
    if (deleteConfirmationInput.trim().toUpperCase() !== 'EXCLUIR') return;

    setIsDeletingAccount(true);
    setDeleteError(null);
    try {
      const res = await deleteUserAccount(currentUser.id);
      if (!res.success) {
        setDeleteError(res.message || 'Erro ao excluir a conta.');
        setIsDeletingAccount(false);
      } else {
        setIsDeleteModalOpen(false);
      }
    } catch (err: any) {
      setDeleteError(err.message || 'Erro inesperado.');
      setIsDeletingAccount(false);
    }
  };

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    updateUser({ name, email, phone, currency });
    updateUserAccount({ name, email, phone });
    setSavedAlert(true);
    setTimeout(() => setSavedAlert(false), 3000);
  };

  const handleRestoreFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          const res = importBackupJSON(event.target.result as string);
          if (res.success) {
            const countStr = res.counts?.transactions ? ` (${res.counts.transactions} transações)` : '';
            setBackupAlert(`Backup restaurado com sucesso!${countStr}`);
          } else {
            setBackupAlert(`Erro: ${res.error || 'Arquivo de backup inválido.'}`);
          }
          setTimeout(() => setBackupAlert(null), 5000);
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
          <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-indigo-500 via-purple-600 to-violet-500 text-white font-black text-2xl flex items-center justify-center uppercase shadow-md shadow-purple-500/20">
            {(name || 'U').charAt(0)}
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">{name}</h3>
            <div className="flex items-center gap-2 mt-1">
              <span className="inline-block text-[10px] font-bold px-2 py-0.5 rounded bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-400">
                {currentUser?.isDependent
                  ? `Membro da Família • Vinculado a ${currentUser.invitedByName || 'Titular'}`
                  : (currentUser?.role === 'admin' ? 'Titular Administrador' : 'Membro da Família')}
              </span>
            </div>
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
            className="px-6 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-md shadow-purple-500/20 transition-all cursor-pointer"
          >
            Salvar Perfil
          </button>
        </div>
      </form>

      {/* 2. Segurança, Senha e Bloqueio Biométrico / PIN (C-01 & S-02) */}
      <SecuritySettingsSection />

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

      {/* 4. Logout Card */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center justify-between gap-4">
        <div>
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">Sair da Conta Atual</h3>
          <p className="text-xs text-slate-400 mt-0.5">Encerre sua sessão para entrar com outro usuário</p>
        </div>

        <button
          type="button"
          onClick={logout}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition-colors shrink-0 cursor-pointer"
        >
          <LogOut className="w-4 h-4" />
          <span>Sair da Conta</span>
        </button>
      </div>

      {/* 5. Zona de Perigo: Exclusão Permanente de Conta */}
      <div className="p-6 rounded-2xl bg-rose-50/40 dark:bg-rose-950/20 border border-rose-200/70 dark:border-rose-900/40 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1 rounded-lg bg-rose-100 dark:bg-rose-900/50 text-rose-600 dark:text-rose-400">
              <Trash2 className="w-4 h-4" />
            </span>
            <h3 className="text-sm font-bold text-rose-900 dark:text-rose-300">Excluir Conta Permanentemente</h3>
          </div>
          <p className="text-xs text-rose-700/80 dark:text-rose-400/80 mt-1 max-w-xl">
            Exclui em definitivo todos os seus registros financeiros, contas, cartões e o seu login do banco de dados e do servidor.
          </p>
        </div>

        {currentUser?.id === 'usr-demo-financeiro' ? (
          <span className="text-xs font-medium text-slate-400 dark:text-slate-500 italic">
            Bloqueado na conta demo
          </span>
        ) : (
          <button
            type="button"
            onClick={() => {
              setIsDeleteModalOpen(true);
              setDeleteConfirmationInput('');
              setDeleteError(null);
            }}
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 active:scale-95 text-white text-xs font-bold transition-all shrink-0 cursor-pointer shadow-sm"
          >
            <Trash2 className="w-4 h-4" />
            <span>Excluir Minha Conta</span>
          </button>
        )}
      </div>

      {/* Modal de Confirmação de Exclusão de Conta */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          if (!isDeletingAccount) {
            setIsDeleteModalOpen(false);
            setDeleteConfirmationInput('');
            setDeleteError(null);
          }
        }}
        title="Excluir Conta Permanentemente"
        maxWidth="md"
      >
        <div className="space-y-4">
          <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs font-bold flex items-start gap-2.5">
            <AlertTriangle className="w-5 h-5 shrink-0 text-rose-600 dark:text-rose-400 mt-0.5" />
            <div className="space-y-1">
              <p className="font-black text-rose-800 dark:text-rose-200">Atenção: Ação Irreversível!</p>
              <p className="font-normal text-rose-700 dark:text-rose-300 text-[11px] leading-relaxed">
                Ao prosseguir, todas as informações associadas à sua conta serão expurgadas do PostgreSQL e do servidor. Não haverá como restaurá-las posteriormente.
              </p>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs space-y-1.5 text-slate-600 dark:text-slate-300">
            <p className="font-bold text-slate-800 dark:text-slate-100">O que será permanentemente apagado:</p>
            <ul className="list-disc pl-4 space-y-0.5 text-[11px] text-slate-500 dark:text-slate-400">
              <li>Todas as contas bancárias e carteiras</li>
              <li>Histórico de receitas, despesas e parcelamentos</li>
              <li>Cartões de crédito, dívidas, metas e orçamentos</li>
              <li>Investimentos e patrimônio cadastrado</li>
              <li>Seu usuário e credenciais de login no sistema</li>
            </ul>
          </div>

          {deleteError && (
            <div className="p-3 rounded-xl bg-rose-100 dark:bg-rose-950 border border-rose-300 dark:border-rose-800 text-rose-800 dark:text-rose-300 text-xs font-semibold">
              {deleteError}
            </div>
          )}

          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-200">
              Digite <span className="text-rose-600 dark:text-rose-400 font-black">EXCLUIR</span> para confirmar:
            </label>
            <input
              type="text"
              value={deleteConfirmationInput}
              onChange={(e) => setDeleteConfirmationInput(e.target.value.toUpperCase())}
              placeholder="Digite EXCLUIR"
              disabled={isDeletingAccount}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-bold focus:outline-none focus:ring-2 focus:ring-rose-500 uppercase tracking-wider"
            />
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <button
              type="button"
              disabled={isDeletingAccount}
              onClick={() => {
                setIsDeleteModalOpen(false);
                setDeleteConfirmationInput('');
                setDeleteError(null);
              }}
              className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl cursor-pointer disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="button"
              disabled={deleteConfirmationInput.trim() !== 'EXCLUIR' || isDeletingAccount}
              onClick={handleDeleteAccount}
              className="flex items-center gap-2 px-5 py-2 text-xs font-bold bg-rose-600 hover:bg-rose-700 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl shadow-md cursor-pointer transition-all"
            >
              {isDeletingAccount ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Excluindo Conta...</span>
                </>
              ) : (
                <>
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Excluir Definitivamente</span>
                </>
              )}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
