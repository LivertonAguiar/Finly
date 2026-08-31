import React, { useState } from 'react';
import {
  Lock,
  Mail,
  User,
  Phone,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  KeyRound,
  ArrowLeft,
  Send,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const AuthPage: React.FC<{ onLoginSuccess?: () => void }> = ({ onLoginSuccess }) => {
  const { login, register, allUsers, requestPasswordReset, resetPassword } = useAuth();

  const [mode, setMode] = useState<'login' | 'register' | 'forgot' | 'verify'>('login');
  const [email, setEmail] = useState('liverton.aguiar@hotmail.com');
  const [password, setPassword] = useState('123');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [recoveryCode, setRecoveryCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [debugCodeHint, setDebugCodeHint] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');
    setDebugCodeHint(null);

    // 1. LOGIN
    if (mode === 'login') {
      const res = login(email, password, rememberMe);
      if (res.success) {
        if (onLoginSuccess) onLoginSuccess();
      } else {
        setErrorMessage(res.message || 'Falha ao entrar.');
      }
    }
    // 2. REGISTER
    else if (mode === 'register') {
      if (!name.trim()) {
        setErrorMessage('Por favor, informe seu nome.');
        return;
      }
      const res = register(name, email, password, phone);
      if (res.success) {
        setSuccessMessage('Conta criada com sucesso!');
        if (onLoginSuccess) onLoginSuccess();
      } else {
        setErrorMessage(res.message || 'Falha ao cadastrar.');
      }
    }
    // 3. FORGOT PASSWORD (SEND EMAIL)
    else if (mode === 'forgot') {
      setLoading(true);
      const res = await requestPasswordReset(email);
      setLoading(false);

      if (res.success) {
        setSuccessMessage(res.message);
        if (res.debugCode) {
          setDebugCodeHint(res.debugCode);
        }
        setMode('verify');
      } else {
        setErrorMessage(res.message);
      }
    }
    // 4. VERIFY CODE & SET NEW PASSWORD
    else if (mode === 'verify') {
      if (!recoveryCode.trim()) {
        setErrorMessage('Por favor, informe o código de 6 dígitos recebido por e-mail.');
        return;
      }
      if (newPassword.length < 3) {
        setErrorMessage('A nova senha deve ter no mínimo 3 caracteres.');
        return;
      }
      if (newPassword !== confirmPassword) {
        setErrorMessage('As senhas digitadas não coincidem.');
        return;
      }

      setLoading(true);
      const res = await resetPassword(email, recoveryCode, newPassword);
      setLoading(false);

      if (res.success) {
        setSuccessMessage('Sua senha foi redefinida com sucesso! Faça login com a nova senha.');
        setPassword(newPassword);
        setMode('login');
      } else {
        setErrorMessage(res.message);
      }
    }
  };

  const handleQuickLogin = (uEmail: string) => {
    setEmail(uEmail);
    setPassword('123');
    const res = login(uEmail, '123', true);
    if (res.success && onLoginSuccess) {
      onLoginSuccess();
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Background Glows */}
      <div className="absolute top-1/4 -left-20 w-96 h-96 bg-[#007a4d]/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-emerald-600/15 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl p-8 z-10 space-y-6">
        {/* Top Brand Header */}
        <div className="flex flex-col items-center text-center">
          <div className="w-14 h-14 rounded-2xl bg-[#007a4d] flex items-center justify-center text-white font-black text-2xl shadow-lg shadow-[#007a4d]/30 mb-3.5">F</div>
          <h2 className="text-2xl font-black text-white tracking-tight flex items-center gap-1">
            <span>Fin</span><span className="text-emerald-400">ly</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            {mode === 'login' && 'Acesse sua conta para gerenciar seu patrimônio'}
            {mode === 'register' && 'Crie sua conta para começar com seus dados reais'}
            {mode === 'forgot' && 'Recupere sua senha através do seu e-mail cadastrado'}
            {mode === 'verify' && 'Digite o código de 6 dígitos e escolha sua nova senha'}
          </p>
        </div>

        {/* Tab Switcher (Visible on Login / Register) */}
        {(mode === 'login' || mode === 'register') && (
          <div className="flex rounded-2xl bg-slate-800/80 p-1 border border-slate-700/60">
            <button
              type="button"
              onClick={() => {
                setMode('login');
                setErrorMessage('');
              }}
              className={'flex-1 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ' + (
                mode === 'login'
                  ? 'bg-[#007a4d] text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              )}
            >
              Entrar
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('register');
                setErrorMessage('');
              }}
              className={'flex-1 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ' + (
                mode === 'register'
                  ? 'bg-[#007a4d] text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              )}
            >
              Criar Conta
            </button>
          </div>
        )}

        {/* Back Button on Forgot/Verify */}
        {(mode === 'forgot' || mode === 'verify') && (
          <button
            type="button"
            onClick={() => {
              setMode('login');
              setErrorMessage('');
            }}
            className="inline-flex items-center gap-1.5 text-xs text-emerald-400 font-bold hover:underline cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Voltar ao Login
          </button>
        )}

        {/* Alerts */}
        {errorMessage && (
          <div className="p-3.5 rounded-xl bg-rose-950/50 border border-rose-800 text-rose-300 text-xs flex items-center gap-2 animate-in fade-in">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{errorMessage}</span>
          </div>
        )}

        {successMessage && (
          <div className="p-3.5 rounded-xl bg-emerald-950/50 border border-emerald-800 text-emerald-300 text-xs flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
            <span>{successMessage}</span>
          </div>
        )}

        {debugCodeHint && (
          <div className="p-3 rounded-xl bg-blue-950/40 border border-blue-800 text-blue-300 text-xs text-center">
            Código de segurança: <strong className="text-white text-sm font-mono tracking-widest">{debugCodeHint}</strong>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Register Name */}
          {mode === 'register' && (
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">Nome Completo *</label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  placeholder="Seu nome"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-700 bg-slate-800 text-xs font-semibold text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>
          )}

          {/* Email (Login, Register, Forgot) */}
          {mode !== 'verify' && (
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">E-mail Cadastrado *</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  placeholder="seu@email.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-700 bg-slate-800 text-xs font-semibold text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>
          )}

          {/* Register Phone */}
          {mode === 'register' && (
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">Telefone / WhatsApp</label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="tel"
                  placeholder="(85) 98594-9115"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-700 bg-slate-800 text-xs font-semibold text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>
          )}

          {/* Password (Login, Register) */}
          {(mode === 'login' || mode === 'register') && (
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="block text-xs font-bold text-slate-300">Senha</label>
                {mode === 'login' && (
                  <button
                    type="button"
                    onClick={() => {
                      setMode('forgot');
                      setErrorMessage('');
                      setSuccessMessage('');
                    }}
                    className="text-[11px] text-emerald-400 hover:underline font-bold cursor-pointer"
                  >
                    Esqueci minha senha
                  </button>
                )}
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full pl-9 pr-10 py-2.5 rounded-xl border border-slate-700 bg-slate-800 text-xs font-semibold text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="p-1 text-slate-400 hover:text-slate-200 absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          )}

          {/* Verification Code + New Password Fields on 'verify' */}
          {mode === 'verify' && (
            <div className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  Código de 6 Dígitos (Enviado para {email})
                </label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-emerald-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    maxLength={6}
                    placeholder="123456"
                    value={recoveryCode}
                    onChange={e => setRecoveryCode(e.target.value)}
                    className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-700 bg-slate-800 text-base font-mono font-bold tracking-widest text-emerald-400 text-center focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">Nova Senha</label>
                <input
                  type="password"
                  required
                  placeholder="Digite sua nova senha"
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-700 bg-slate-800 text-xs font-semibold text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">Confirmar Nova Senha</label>
                <input
                  type="password"
                  required
                  placeholder="Confirme sua nova senha"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-700 bg-slate-800 text-xs font-semibold text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>
          )}

          {/* Remember me on login */}
          {mode === 'login' && (
            <div className="flex items-center justify-between text-xs pt-1">
              <label className="flex items-center gap-2 cursor-pointer select-none text-slate-400">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={e => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded text-[#007a4d] focus:ring-[#007a4d] border-slate-700 bg-slate-800 cursor-pointer"
                />
                <span>Manter conectado</span>
              </label>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-2xl bg-[#007a4d] hover:bg-[#006640] disabled:opacity-50 text-white text-xs font-bold shadow-lg shadow-[#007a4d]/25 transition-all flex items-center justify-center gap-2 hover:scale-[1.01] active:scale-[0.99] cursor-pointer"
          >
            {loading ? (
              <span>Enviando...</span>
            ) : mode === 'login' ? (
              <>
                <span>Acessar Painel</span>
                <ArrowRight className="w-4 h-4" />
              </>
            ) : mode === 'register' ? (
              <>
                <span>Concluir Cadastro</span>
                <ArrowRight className="w-4 h-4" />
              </>
            ) : mode === 'forgot' ? (
              <>
                <span>Enviar Código por E-mail</span>
                <Send className="w-4 h-4" />
              </>
            ) : (
              <>
                <span>Redefinir Senha e Entrar</span>
                <CheckCircle2 className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Quick Account Switcher for convenience */}
        {allUsers.length > 0 && (mode === 'login' || mode === 'register') && (
          <div className="pt-4 border-t border-slate-800 space-y-2">
            <p className="text-[11px] font-bold text-slate-400">Contas no dispositivo:</p>
            <div className="space-y-1 max-h-32 overflow-y-auto">
              {allUsers.map(u => (
                <button
                  key={u.id}
                  type="button"
                  onClick={() => handleQuickLogin(u.email)}
                  className="w-full flex items-center justify-between p-2 rounded-xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 text-xs transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-[#007a4d] text-white font-bold text-[10px] flex items-center justify-center">
                      {u.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="text-left">
                      <p className="font-bold text-white text-xs">{u.name}</p>
                      <p className="text-[10px] text-slate-400">{u.email}</p>
                    </div>
                  </div>
                  <span className="text-[10px] text-emerald-400 font-bold">Entrar ➔</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
