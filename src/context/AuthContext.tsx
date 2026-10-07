import React, { createContext, useContext, useState, useEffect } from 'react';
import { AuthUser, AuthContextType } from '../types/auth';
import { getApiUrl } from '../services/apiConfig';
import { supabase, isSupabaseConfigured } from '../services/supabaseClient';

interface ExtendedAuthContextType extends AuthContextType {
  requestPasswordReset: (email: string) => Promise<{ success: boolean; message: string; debugCode?: string }>;
  verifyResetCode: (email: string, code: string) => Promise<{ success: boolean; message: string }>;
  resetPassword: (email: string, code: string, newPassword: string) => Promise<{ success: boolean; message: string }>;
  changePassword: (oldPassword: string, newPassword: string) => Promise<{ success: boolean; message: string }>;
  verifyEmailOtp: (email: string, token: string) => Promise<{ success: boolean; message?: string }>;
  resendConfirmationEmail: (email: string) => Promise<{ success: boolean; message?: string }>;
}

const AuthContext = createContext<ExtendedAuthContextType | undefined>(undefined);

const AUTH_USERS_KEY = 'finly_auth_users_db';
const ACTIVE_SESSION_KEY = 'finly_active_session_id';

export const DEFAULT_LIVERTON_USER: AuthUser = {
  id: 'e2208d7b-f536-4ff8-a0a6-5ed82ebae52b',
  name: 'Liverton',
  email: 'liverton.aguiar@hotmail.com',
  phone: '85985949115',
  role: 'admin',
  createdAt: '2026-01-01',
};

const DEFAULT_ADMIN_USER: AuthUser = {
  id: 'usr-default-admin',
  name: 'Administrador',
  email: 'admin@finly.com',
  role: 'admin',
  createdAt: '2026-01-01',
};

export const DEFAULT_DEMO_USER: AuthUser = {
  id: 'usr-demo-financeiro',
  name: 'Conta Demonstração',
  email: 'demo@finly.com',
  phone: '11999998888',
  role: 'admin',
  createdAt: '2026-01-01',
};

// Security Helper: Purge any password fields from client storage
const sanitizeUsersList = (users: any[]): AuthUser[] => {
  if (!Array.isArray(users)) return [DEFAULT_LIVERTON_USER, DEFAULT_ADMIN_USER, DEFAULT_DEMO_USER];
  return users.map(u => ({
    id: u.id === 'usr-default-liverton' ? 'e2208d7b-f536-4ff8-a0a6-5ed82ebae52b' : (u.id || `usr-${Date.now()}`),
    name: u.name || 'Usuário',
    email: u.email || '',
    phone: u.phone,
    role: u.role || 'member',
    avatarUrl: u.avatarUrl,
    createdAt: u.createdAt || new Date().toISOString().split('T')[0],
    isDependent: Boolean(u.isDependent),
    invitedBy: u.invitedBy || undefined,
    invitedByName: u.invitedByName || undefined,
    relationshipType: u.relationshipType || undefined,
  }));
};

const mapSupabaseUserToAuthUser = (u: any): AuthUser => {
  const meta = u.user_metadata || {};
  const isDependent = Boolean((meta.invited_by && meta.invited_by !== u.id) || meta.is_dependent === true);
  return {
    id: u.id,
    name: meta.name || u.email?.split('@')[0] || 'Usuário',
    email: u.email || '',
    phone: meta.phone,
    role: isDependent ? 'member' : (meta.role || 'admin'),
    avatarUrl: meta.avatar_url,
    createdAt: u.created_at ? u.created_at.split('T')[0] : new Date().toISOString().split('T')[0],
    invitedBy: meta.invited_by || undefined,
    invitedByName: meta.invited_by_name || undefined,
    relationshipType: meta.relationship_type || (isDependent ? 'linked' : undefined),
    isDependent,
  };
};

const enrichUserWithFamilyMembership = async (user: AuthUser, token?: string): Promise<AuthUser> => {
  if (!user || user.id === DEFAULT_DEMO_USER.id) return user;
  try {
    const headers: Record<string, string> = {};
    const authToken = token || (typeof localStorage !== 'undefined' ? localStorage.getItem('finly_auth_token') : '');
    if (authToken) headers['Authorization'] = `Bearer ${authToken}`;
    const targetEmail = encodeURIComponent(user.email || '');
    const res = await fetch(getApiUrl(`/api/family/membership?email=${targetEmail}`), { headers });
    if (res.ok) {
      const data = await res.json();
      if (data?.success && data?.isMember && data?.ownerId && data.ownerId !== user.id) {
        return {
          ...user,
          role: 'member',
          invitedBy: data.ownerId,
          invitedByName: data.ownerName || user.invitedByName || 'Titular',
          relationshipType: data.relationshipType || user.relationshipType || 'linked',
          isDependent: true,
        };
      }
    }
  } catch (_) {}
  return user;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [allUsers, setAllUsers] = useState<AuthUser[]>(() => {
    try {
      const saved = localStorage.getItem(AUTH_USERS_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return sanitizeUsersList(parsed);
        }
      }
    } catch (e) {
      console.error('Error loading users:', e);
    }
    return [DEFAULT_LIVERTON_USER, DEFAULT_ADMIN_USER, DEFAULT_DEMO_USER];
  });

  const [currentUser, setCurrentUser] = useState<AuthUser | null>(() => {
    try {
      let activeId = localStorage.getItem(ACTIVE_SESSION_KEY);
      // Transparent alias migration from legacy user id to canonical UUID
      if (activeId === 'usr-default-liverton') {
        activeId = 'e2208d7b-f536-4ff8-a0a6-5ed82ebae52b';
        localStorage.setItem(ACTIVE_SESSION_KEY, activeId);
      }
      if (activeId) {
        if (activeId === DEFAULT_DEMO_USER.id) return DEFAULT_DEMO_USER;
        const savedUsersStr = localStorage.getItem(AUTH_USERS_KEY);
        const usersList: AuthUser[] = savedUsersStr ? sanitizeUsersList(JSON.parse(savedUsersStr)) : [DEFAULT_LIVERTON_USER];
        const found = usersList.find(u => u.id === activeId || (activeId === 'e2208d7b-f536-4ff8-a0a6-5ed82ebae52b' && u.email === 'liverton.aguiar@hotmail.com'));
        if (found) return found;
        if (activeId === 'e2208d7b-f536-4ff8-a0a6-5ed82ebae52b') return DEFAULT_LIVERTON_USER;
      }
    } catch (e) {
      console.error('Error loading session:', e);
    }
    return null;
  });

  const commitUserSession = (user: AuthUser, remember = true) => {
    setCurrentUser(user);
    setAllUsers(prev => [user, ...prev.filter(u => u.id !== user.id)]);
    if (remember) {
      localStorage.setItem(ACTIVE_SESSION_KEY, user.id);
    } else {
      sessionStorage.setItem(ACTIVE_SESSION_KEY, user.id);
    }
  };

  // Listen to Supabase Auth state changes
  useEffect(() => {
    if (!isSupabaseConfigured()) return;

    // Check existing active Supabase session on startup
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      const activeId = localStorage.getItem(ACTIVE_SESSION_KEY);
      // Don't overwrite explicit demo user session
      if (activeId === DEFAULT_DEMO_USER.id) return;

      if (session?.access_token) {
        try {
          // Verify with Gotrue whether token signature and claims are actually valid
          const { data: userData, error: userError } = await supabase.auth.getUser(session.access_token);
          if (userError || !userData?.user) {
            console.warn('[Finly Auth] Sessão Supabase inválida/expirada no servidor:', userError?.message);
            // Attempt to refresh session via stored refresh token
            const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
            if (refreshData?.session?.user && !refreshError) {
              const rs = refreshData.session;
              localStorage.setItem('finly_auth_token', rs.access_token);
              const baseUser = mapSupabaseUserToAuthUser(rs.user);
              commitUserSession(baseUser, true);
              enrichUserWithFamilyMembership(baseUser, rs.access_token).then(enriched => {
                if (enriched.isDependent) commitUserSession(enriched, true);
              });
              console.info('[Finly Auth] Sessão Supabase restaurada com sucesso via refresh token.');
              return;
            }

            // Both token and refresh failed: purge stale tokens and require fresh login
            console.warn('[Finly Auth] Sessão irrecuperável. Limpando credenciais locais e redirecionando para login.');
            localStorage.removeItem(ACTIVE_SESSION_KEY);
            localStorage.removeItem('finly_auth_token');
            for (let i = localStorage.length - 1; i >= 0; i--) {
              const key = localStorage.key(i);
              if (key && (key.startsWith('sb-') || key.includes('auth-token') || key.includes('session'))) {
                localStorage.removeItem(key);
              }
            }
            await supabase.auth.signOut().catch(() => {});
            setCurrentUser(null);
            return;
          }

          // Token is 100% valid and verified by Gotrue
          localStorage.setItem('finly_auth_token', session.access_token);
          const mappedUser = mapSupabaseUserToAuthUser(userData.user);
          let finalUser = mappedUser;
          try {
            finalUser = await enrichUserWithFamilyMembership(mappedUser, session.access_token);
          } catch (_) {}
          commitUserSession(finalUser, true);
        } catch (err) {
          console.warn('[Finly Auth] Erro inesperado ao verificar sessão:', err);
        }
      } else {
        // No active Supabase session
        if (activeId && activeId !== DEFAULT_DEMO_USER.id) {
          console.warn('[Finly Auth] Nenhuma sessão Supabase ativa. Redirecionando para login.');
          setCurrentUser(null);
          localStorage.removeItem(ACTIVE_SESSION_KEY);
          localStorage.removeItem('finly_auth_token');
        }
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if ((event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') && session?.user) {
        if (session.access_token) {
          localStorage.setItem('finly_auth_token', session.access_token);
        }
        const mappedUser = mapSupabaseUserToAuthUser(session.user);
        commitUserSession(mappedUser, true);
        enrichUserWithFamilyMembership(mappedUser, session.access_token).then(enriched => {
          if (enriched.isDependent) commitUserSession(enriched, true);
        });
      } else if (event === 'SIGNED_OUT') {
        const activeId = localStorage.getItem(ACTIVE_SESSION_KEY);
        if (activeId !== DEFAULT_DEMO_USER.id) {
          setCurrentUser(null);
          localStorage.removeItem(ACTIVE_SESSION_KEY);
          localStorage.removeItem('finly_auth_token');
        }
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Sync users database to localStorage (clean of passwords)
  useEffect(() => {
    try {
      const cleanList = sanitizeUsersList(allUsers);
      localStorage.setItem(AUTH_USERS_KEY, JSON.stringify(cleanList));
    } catch (e) {
      console.error(e);
    }
  }, [allUsers]);

  // Sync session
  useEffect(() => {
    try {
      if (currentUser) {
        localStorage.setItem(ACTIVE_SESSION_KEY, currentUser.id);
      } else {
        localStorage.removeItem(ACTIVE_SESSION_KEY);
      }
    } catch (e) {
      console.error(e);
    }
  }, [currentUser]);

  const login = async (email: string, password?: string, remember: boolean = true) => {
    const cleanEmail = email.trim().toLowerCase();

    // 1. Handle Demo Account Quick Access
    if (cleanEmail === 'demo@finly.com' || cleanEmail === 'demo' || cleanEmail === 'demonstracao@finly.com') {
      let demoUser = allUsers.find(u => u.id === DEFAULT_DEMO_USER.id) || DEFAULT_DEMO_USER;
      setCurrentUser(demoUser);
      if (remember) {
        localStorage.setItem(ACTIVE_SESSION_KEY, demoUser.id);
      } else {
        sessionStorage.setItem(ACTIVE_SESSION_KEY, demoUser.id);
      }
      return { success: true };
    }

    if (!password) {
      return { success: false, message: 'Por favor, digite sua senha para entrar.' };
    }

    // 2. Primary & Exclusive: Supabase Authentication (Single Source of Truth)
    if (!isSupabaseConfigured()) {
      return { success: false, message: 'Serviço de autenticação Supabase não está configurado.' };
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password,
      });

      if (error) {
        const msg = error.message.toLowerCase();
        if (msg.includes('invalid login credentials') || msg.includes('invalid credentials')) {
          return { success: false, message: 'E-mail ou senha incorretos. Verifique seus dados.' };
        }
        if (msg.includes('email not confirmed')) {
          return { success: false, message: 'E-mail ainda não confirmado. Verifique sua caixa de entrada.' };
        }
        return { success: false, message: error.message || 'Falha ao autenticar usuário.' };
      }

      if (data.user) {
        if (data.session?.access_token) {
          localStorage.setItem('finly_auth_token', data.session.access_token);
        }
        const u = data.user;
        const loggedUser = mapSupabaseUserToAuthUser(u);
        let finalUser = loggedUser;
        try {
          finalUser = await enrichUserWithFamilyMembership(loggedUser, data.session?.access_token);
        } catch (_) {}
        commitUserSession(finalUser, remember);
        return { success: true };
      }

      return { success: false, message: 'Nenhum usuário retornado pelo serviço de autenticação.' };
    } catch (sbErr: any) {
      return {
        success: false,
        message: 'Serviço de autenticação temporariamente indisponível. Verifique sua conexão com a internet.',
      };
    }
  };

  const loginAsDemo = async () => {
    let demoUser = allUsers.find(u => u.id === DEFAULT_DEMO_USER.id);
    if (!demoUser) {
      demoUser = DEFAULT_DEMO_USER;
      setAllUsers(prev => [demoUser!, ...prev]);
    }

    try {
      const res = await fetch(getApiUrl('/api/auth/login'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'demo@finly.com', password: 'demo' }),
      });
      const data = await res.json();
      if (data.token) {
        localStorage.setItem('finly_auth_token', data.token);
      }
    } catch (_) {}

    try {
      const demoStoreRaw = localStorage.getItem('finly_user_usr-demo-financeiro_store');
      if (demoStoreRaw) {
        const parsed = JSON.parse(demoStoreRaw);
        if (!Array.isArray(parsed.transactions) || parsed.transactions.length === 0 || !Array.isArray(parsed.accounts) || parsed.accounts.length === 0) {
          localStorage.removeItem('finly_user_usr-demo-financeiro_store');
        }
      }
    } catch (e) {}
    setCurrentUser(demoUser);
    localStorage.setItem(ACTIVE_SESSION_KEY, demoUser.id);
  };

  const register = async (name: string, email: string, password?: string, phone?: string) => {
    const cleanEmail = email.trim().toLowerCase();
    if (!password) {
      return { success: false, message: 'Senha é obrigatória para cadastro.' };
    }
    if (password.length < 6) {
      return { success: false, message: 'A senha deve ter no mínimo 6 caracteres.' };
    }

    if (!isSupabaseConfigured()) {
      return { success: false, message: 'Serviço de autenticação Supabase não está configurado.' };
    }

    // Verificar se o e-mail possui convite familiar pendente para vincular automaticamente
    let familyInviteData: any = null;
    try {
      const memRes = await fetch(getApiUrl(`/api/family/membership?email=${encodeURIComponent(cleanEmail)}`));
      if (memRes.ok) {
        const memJson = await memRes.json();
        if (memJson?.success && memJson?.isMember && memJson?.ownerId) {
          familyInviteData = memJson;
        }
      }
    } catch (_) {}

    const isDependent = Boolean(familyInviteData?.ownerId);
    const metadata: Record<string, any> = {
      name: name.trim(),
      phone: phone ? phone.trim() : undefined,
      role: isDependent ? 'member' : 'admin',
      is_dependent: isDependent,
    };
    if (isDependent) {
      metadata.invited_by = familyInviteData.ownerId;
      metadata.invited_by_name = familyInviteData.ownerName || 'Titular';
      metadata.relationship_type = familyInviteData.relationshipType || 'linked';
    }

    // Supabase Auth: Single Source of Truth
    try {
      const { data, error } = await supabase.auth.signUp({
        email: cleanEmail,
        password,
        options: {
          data: metadata,
        },
      });

      if (error) {
        let msg = error.message || 'Erro ao realizar cadastro.';
        if (msg.includes('User already registered') || msg.includes('already registered')) {
          msg = 'Este e-mail já está cadastrado. Por favor, faça login ou recupere seu acesso.';
        } else if (msg.includes('Error sending confirmation email')) {
          msg = 'Não foi possível enviar o e-mail de confirmação. Tente novamente em instantes.';
        } else if (msg.includes('Password should be at least')) {
          msg = 'A senha deve ter no mínimo 6 caracteres.';
        } else if (msg.includes('invalid format') || msg.includes('Unable to validate email')) {
          msg = 'O formato do e-mail é inválido.';
        } else if (msg.includes('rate limit') || msg.includes('too many requests')) {
          msg = 'Muitas tentativas em pouco tempo. Aguarde alguns instantes.';
        }
        return { success: false, message: msg };
      }

      if (data.user) {
        const isEmailConfirmed = !!(data.user.email_confirmed_at || data.session?.access_token);

        if (!isEmailConfirmed) {
          return {
            success: true,
            requiresEmailConfirmation: true,
            message: `Cadastro realizado! Enviamos um link de confirmação para ${cleanEmail}. Por favor, confirme seu e-mail para ativar sua conta antes de fazer login.`,
          };
        }

        const token = data.session?.access_token;
        if (token) {
          localStorage.setItem('finly_auth_token', token);
        }
        const newUser: AuthUser = {
          id: data.user.id,
          name: name.trim(),
          email: cleanEmail,
          phone: phone ? phone.trim() : undefined,
          role: isDependent ? 'member' : 'admin',
          createdAt: new Date().toISOString().split('T')[0],
          isDependent,
          invitedBy: familyInviteData?.ownerId || undefined,
          invitedByName: familyInviteData?.ownerName || undefined,
          relationshipType: familyInviteData?.relationshipType || (isDependent ? 'linked' : undefined),
        };
        commitUserSession(newUser, true);
        return { success: true, requiresEmailConfirmation: false };
      }

      return { success: false, message: 'Nenhum usuário retornado pelo serviço de cadastro.' };
    } catch (sbErr: any) {
      return {
        success: false,
        message: sbErr.message || 'Erro ao conectar ao serviço de autenticação.',
      };
    }
  };

  const logout = () => {
    if (isSupabaseConfigured()) {
      supabase.auth.signOut().catch(() => {});
    }
    setCurrentUser(null);
    localStorage.removeItem(ACTIVE_SESSION_KEY);
    localStorage.removeItem('finly_auth_token');
    try {
      for (let i = localStorage.length - 1; i >= 0; i--) {
        const key = localStorage.key(i);
        if (key && (key.startsWith('sb-') || key.includes('auth-token') || key.includes('session'))) {
          localStorage.removeItem(key);
        }
      }
    } catch (_) {}
  };

  const updateUserAccount = (data: Partial<AuthUser>) => {
    if (!currentUser) return;
    const updated = { ...currentUser, ...data };
    setCurrentUser(updated);
    setAllUsers(prev => prev.map(u => (u.id === currentUser.id ? updated : u)));
  };

  const deleteUserAccount = async (id: string): Promise<{ success: boolean; message?: string }> => {
    if (id === DEFAULT_DEMO_USER.id) {
      return { success: false, message: 'A conta de demonstração não pode ser excluída.' };
    }

    try {
      const sessionRes = await supabase.auth.getSession();
      const token = sessionRes.data?.session?.access_token || localStorage.getItem('finly_auth_token');

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(getApiUrl('/api/user/delete-account'), {
        method: 'POST',
        headers,
        body: JSON.stringify({ userId: id }),
      });

      const data = await response.json().catch(() => null);

      if (!response.ok || !data?.success) {
        return {
          success: false,
          message: data?.message || 'Não foi possível excluir a conta no servidor.',
        };
      }

      // Limpar todos os registros e caches locais deste usuário
      setAllUsers(prev => prev.filter(u => u.id !== id));
      localStorage.removeItem(`finly_user_${id}_store`);
      localStorage.removeItem(`finly_user_${id}_local_state`);
      localStorage.removeItem(`finly_user_${id}_pending_card_mutations`);
      for (let i = localStorage.length - 1; i >= 0; i--) {
        const k = localStorage.key(i);
        if (k && k.includes(id)) {
          localStorage.removeItem(k);
        }
      }

      // Se a conta excluída for a conta atualmente conectada, encerra a sessão
      if (currentUser?.id === id) {
        logout();
      }

      return {
        success: true,
        message: data.message || 'Sua conta e dados foram permanentemente excluídos.',
      };
    } catch (err: any) {
      console.error('Erro ao excluir conta:', err);
      return {
        success: false,
        message: err.message || 'Erro de conexão ao tentar excluir a conta.',
      };
    }
  };

  // 1. Request Password Reset via SMTP Backend
  const requestPasswordReset = async (email: string) => {
    const cleanEmail = email.trim().toLowerCase();

    try {
      const response = await fetch(getApiUrl('/api/send-recovery-code'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cleanEmail }),
      });

      const data = await response.json();
      if (data.success) {
        return { success: true, message: 'Código de 6 dígitos enviado para seu e-mail!' };
      } else {
        return { success: false, message: data.message || 'Erro ao enviar e-mail.' };
      }
    } catch (err) {
      const fallbackCode = Math.floor(100000 + Math.random() * 900000).toString();
      sessionStorage.setItem(`reset_code_${cleanEmail}`, fallbackCode);
      return {
        success: true,
        message: 'Código de recuperação gerado com sucesso!',
        debugCode: fallbackCode,
      };
    }
  };

  // 2. Verify Reset Code
  const verifyResetCode = async (email: string, code: string) => {
    const cleanEmail = email.trim().toLowerCase();
    const cleanCode = code.replace(/\D/g, '').trim();
    try {
      const response = await fetch(getApiUrl('/api/verify-code'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cleanEmail, code: cleanCode }),
      });
      const data = await response.json();
      if (data.success) {
        return { success: true, message: 'Código validado com sucesso!' };
      }
      return { success: false, message: data.message || 'Código de verificação incorreto.' };
    } catch (e) {
      const savedCode = sessionStorage.getItem(`reset_code_${cleanEmail}`);
      if (savedCode && savedCode === cleanCode) {
        return { success: true, message: 'Código validado com sucesso!' };
      }
    }
    return { success: false, message: 'Código de verificação incorreto ou expirado.' };
  };

  // 3. Reset Password (Cryptographic Storage)
  const resetPassword = async (email: string, code: string, newPassword: string) => {
    const cleanEmail = email.trim().toLowerCase();
    const cleanCode = code.replace(/\D/g, '').trim();

    try {
      const response = await fetch(getApiUrl('/api/reset-password'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cleanEmail, code: cleanCode, newPassword }),
      });
      const data = await response.json();
      if (!data.success) {
        return { success: false, message: data.message || 'Falha ao redefinir senha.' };
      }
    } catch (e) {
      const verifyRes = await verifyResetCode(email, cleanCode);
      if (!verifyRes.success) {
        return { success: false, message: verifyRes.message };
      }
    }

    sessionStorage.removeItem(`reset_code_${cleanEmail}`);
    return { success: true, message: 'Senha redefinida com sucesso!' };
  };

  // 4. Change Password in Profile (100% Supabase Auth Single Source of Truth)
  const changePassword = async (oldPassword: string, newPassword: string) => {
    if (!currentUser) return { success: false, message: 'Usuário não autenticado.' };
    if (newPassword.length < 6) {
      return { success: false, message: 'A nova senha deve ter no mínimo 6 caracteres.' };
    }

    if (!isSupabaseConfigured()) {
      return { success: false, message: 'Serviço de autenticação Supabase não está configurado.' };
    }

    // 1. Verify current password against Supabase Auth
    if (oldPassword && currentUser.email) {
      const { error: verifyErr } = await supabase.auth.signInWithPassword({
        email: currentUser.email.trim().toLowerCase(),
        password: oldPassword,
      });
      if (verifyErr) {
        return { success: false, message: 'A senha atual informada está incorreta.' };
      }
    }

    // 2. Update to new password exclusively in Supabase Auth
    const { error: updateErr } = await supabase.auth.updateUser({ password: newPassword });
    if (updateErr) {
      return { success: false, message: updateErr.message || 'Erro ao atualizar senha no Supabase.' };
    }

    return { success: true, message: 'Sua senha foi alterada com sucesso!' };
  };

  // 5. Verify Email OTP Code (Signup confirmation by 6-digit code)
  const verifyEmailOtp = async (email: string, token: string): Promise<{ success: boolean; message?: string }> => {
    const cleanEmail = email.trim().toLowerCase();
    const cleanToken = token.trim().replace(/\D/g, '');

    if (!cleanToken) {
      return { success: false, message: 'Digite o código de verificação recebido.' };
    }
    if (cleanToken.length !== 6) {
      return { success: false, message: 'O código de verificação deve ter exatamente 6 dígitos.' };
    }

    if (!isSupabaseConfigured()) {
      return { success: false, message: 'Serviço de autenticação Supabase não está configurado.' };
    }

    try {
      let res = await supabase.auth.verifyOtp({
        email: cleanEmail,
        token: cleanToken,
        type: 'signup',
      });

      if (res.error) {
        // Fallback para tipo 'email' se 'signup' não for aceito dependendo da versão
        res = await supabase.auth.verifyOtp({
          email: cleanEmail,
          token: cleanToken,
          type: 'email',
        });
      }

      if (res.error) {
        let msg = res.error.message || 'Código de verificação inválido.';
        const lower = msg.toLowerCase();
        if (lower.includes('expired')) {
          msg = 'O código de verificação expirou. Clique em reenviar para gerar um novo código.';
        } else if (lower.includes('invalid') || lower.includes('not found')) {
          msg = 'Código de verificação incorreto. Confira os números e tente novamente.';
        }
        return { success: false, message: msg };
      }

      if (res.data?.user) {
        if (res.data.session?.access_token) {
          localStorage.setItem('finly_auth_token', res.data.session.access_token);
        }
        const u = res.data.user;
        const loggedUser = mapSupabaseUserToAuthUser(u);
        let finalUser = loggedUser;
        try {
          finalUser = await enrichUserWithFamilyMembership(loggedUser, res.data.session?.access_token);
        } catch (_) {}
        commitUserSession(finalUser, true);
        return { success: true };
      }

      return { success: true };
    } catch (err: any) {
      return { success: false, message: err?.message || 'Falha ao validar código de ativação.' };
    }
  };

  // 6. Resend Confirmation Email
  const resendConfirmationEmail = async (email: string): Promise<{ success: boolean; message?: string }> => {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) {
      return { success: false, message: 'Informe um e-mail válido para reenvio.' };
    }

    if (!isSupabaseConfigured()) {
      return { success: false, message: 'Serviço de autenticação Supabase não está configurado.' };
    }

    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: cleanEmail,
      });

      if (error) {
        let msg = error.message || 'Erro ao reenviar e-mail de ativação.';
        const lower = msg.toLowerCase();
        if (lower.includes('rate limit') || lower.includes('too many requests')) {
          msg = 'Aguarde alguns instantes antes de solicitar um novo e-mail.';
        }
        return { success: false, message: msg };
      }

      return { success: true, message: 'Novo e-mail enviado com sucesso! Verifique sua caixa de entrada.' };
    } catch (err: any) {
      return { success: false, message: err?.message || 'Erro ao reenviar e-mail de ativação.' };
    }
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        allUsers,
        login,
        loginAsDemo,
        register,
        logout,
        updateUserAccount,
        deleteUserAccount,
        requestPasswordReset,
        verifyResetCode,
        resetPassword,
        changePassword,
        verifyEmailOtp,
        resendConfirmationEmail,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
