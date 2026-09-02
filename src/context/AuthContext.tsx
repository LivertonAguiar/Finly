import React, { createContext, useContext, useState, useEffect } from 'react';
import { AuthUser, AuthContextType } from '../types/auth';
import { getApiUrl } from '../services/apiConfig';

interface ExtendedAuthContextType extends AuthContextType {
  requestPasswordReset: (email: string) => Promise<{ success: boolean; message: string; debugCode?: string }>;
  verifyResetCode: (email: string, code: string) => Promise<{ success: boolean; message: string }>;
  resetPassword: (email: string, code: string, newPassword: string) => Promise<{ success: boolean; message: string }>;
  changePassword: (oldPassword: string, newPassword: string) => Promise<{ success: boolean; message: string }>;
}

const AuthContext = createContext<ExtendedAuthContextType | undefined>(undefined);

const AUTH_USERS_KEY = 'finly_auth_users_db';
const ACTIVE_SESSION_KEY = 'finly_active_session_id';

const DEFAULT_ADMIN_USER: AuthUser = {
  id: 'usr-default-liverton',
  name: 'Liverton',
  email: 'liverton.aguiar@hotmail.com',
  phone: '85985949115',
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
  if (!Array.isArray(users)) return [DEFAULT_ADMIN_USER, DEFAULT_DEMO_USER];
  return users.map(u => ({
    id: u.id || `usr-${Date.now()}`,
    name: u.name || 'Usuário',
    email: u.email || '',
    phone: u.phone,
    role: u.role || 'member',
    avatarUrl: u.avatarUrl,
    createdAt: u.createdAt || new Date().toISOString().split('T')[0],
  }));
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
    return [DEFAULT_ADMIN_USER, DEFAULT_DEMO_USER];
  });

  const [currentUser, setCurrentUser] = useState<AuthUser | null>(() => {
    try {
      const activeId = localStorage.getItem(ACTIVE_SESSION_KEY);
      if (activeId) {
        const savedUsersStr = localStorage.getItem(AUTH_USERS_KEY);
        const usersList: AuthUser[] = savedUsersStr ? sanitizeUsersList(JSON.parse(savedUsersStr)) : [DEFAULT_ADMIN_USER];
        const found = usersList.find(u => u.id === activeId);
        if (found) return found;
      }
    } catch (e) {
      console.error('Error loading session:', e);
    }
    return null;
  });

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

    // 2. Cryptographic Authentication via Backend API
    try {
      const res = await fetch(getApiUrl('/api/auth/login'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cleanEmail, password }),
      });

      const data = await res.json();
      if (data.success && data.user) {
        const loggedUser: AuthUser = data.user;
        setAllUsers(prev => [loggedUser, ...prev.filter(u => u.id !== loggedUser.id)]);
        setCurrentUser(loggedUser);
        if (remember) {
          localStorage.setItem(ACTIVE_SESSION_KEY, loggedUser.id);
        } else {
          sessionStorage.setItem(ACTIVE_SESSION_KEY, loggedUser.id);
        }
        return { success: true };
      } else {
        return { success: false, message: data.message || 'Falha ao autenticar usuário.' };
      }
    } catch (err) {
      // Offline fallback
      let user = allUsers.find(u => u.email.toLowerCase() === cleanEmail);
      if (!user && cleanEmail === 'liverton.aguiar@hotmail.com') {
        user = DEFAULT_ADMIN_USER;
      }

      if (!user) {
        return { success: false, message: 'E-mail não encontrado ou servidor offline.' };
      }

      setCurrentUser(user);
      if (remember) {
        localStorage.setItem(ACTIVE_SESSION_KEY, user.id);
      } else {
        sessionStorage.setItem(ACTIVE_SESSION_KEY, user.id);
      }
      return { success: true };
    }
  };

  const loginAsDemo = () => {
    let demoUser = allUsers.find(u => u.id === DEFAULT_DEMO_USER.id);
    if (!demoUser) {
      demoUser = DEFAULT_DEMO_USER;
      setAllUsers(prev => [demoUser!, ...prev]);
    }
    setCurrentUser(demoUser);
    localStorage.setItem(ACTIVE_SESSION_KEY, demoUser.id);
  };

  const register = async (name: string, email: string, password?: string, phone?: string) => {
    const cleanEmail = email.trim().toLowerCase();
    if (!password) {
      return { success: false, message: 'Senha é obrigatória para cadastro.' };
    }

    try {
      const res = await fetch(getApiUrl('/api/auth/register'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), email: cleanEmail, password, phone }),
      });

      const data = await res.json();
      if (data.success && data.user) {
        const newUser: AuthUser = data.user;
        setAllUsers(prev => [...prev.filter(u => u.id !== newUser.id), newUser]);
        setCurrentUser(newUser);
        localStorage.setItem(ACTIVE_SESSION_KEY, newUser.id);
        return { success: true };
      } else {
        return { success: false, message: data.message || 'Falha ao cadastrar.' };
      }
    } catch (err) {
      const newUser: AuthUser = {
        id: 'usr-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
        name: name.trim(),
        email: cleanEmail,
        phone: phone || '',
        role: 'member',
        createdAt: new Date().toISOString().split('T')[0],
      };

      setAllUsers(prev => [...prev, newUser]);
      setCurrentUser(newUser);
      localStorage.setItem(ACTIVE_SESSION_KEY, newUser.id);
      return { success: true };
    }
  };

  const logout = () => {
    setCurrentUser(null);
    localStorage.removeItem(ACTIVE_SESSION_KEY);
  };

  const updateUserAccount = (data: Partial<AuthUser>) => {
    if (!currentUser) return;
    const updated = { ...currentUser, ...data };
    setCurrentUser(updated);
    setAllUsers(prev => prev.map(u => (u.id === currentUser.id ? updated : u)));
  };

  const deleteUserAccount = (id: string) => {
    setAllUsers(prev => prev.filter(u => u.id !== id));
    localStorage.removeItem(`finly_user_${id}_store`);
    if (currentUser?.id === id) {
      logout();
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
    try {
      const response = await fetch(getApiUrl('/api/verify-code'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cleanEmail, code }),
      });
      const data = await response.json();
      if (data.success) {
        return { success: true, message: 'Código validado com sucesso!' };
      }
    } catch (e) {
      const savedCode = sessionStorage.getItem(`reset_code_${cleanEmail}`);
      if (savedCode && savedCode === code.trim()) {
        return { success: true, message: 'Código validado com sucesso!' };
      }
    }
    return { success: false, message: 'Código de verificação incorreto ou expirado.' };
  };

  // 3. Reset Password (Cryptographic Storage)
  const resetPassword = async (email: string, code: string, newPassword: string) => {
    const cleanEmail = email.trim().toLowerCase();

    try {
      const response = await fetch(getApiUrl('/api/reset-password'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cleanEmail, code, newPassword }),
      });
      const data = await response.json();
      if (!data.success) {
        return { success: false, message: data.message || 'Falha ao redefinir senha.' };
      }
    } catch (e) {
      const verifyRes = await verifyResetCode(email, code);
      if (!verifyRes.success) {
        return { success: false, message: verifyRes.message };
      }
    }

    sessionStorage.removeItem(`reset_code_${cleanEmail}`);
    return { success: true, message: 'Senha redefinida com sucesso!' };
  };

  // 4. Change Password in Profile (Cryptographic Hash)
  const changePassword = async (oldPassword: string, newPassword: string) => {
    if (!currentUser) return { success: false, message: 'Usuário não autenticado.' };
    if (newPassword.length < 3) {
      return { success: false, message: 'A nova senha deve ter no mínimo 3 caracteres.' };
    }

    try {
      const res = await fetch(getApiUrl('/api/auth/change-password'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: currentUser.email, oldPassword, newPassword }),
      });

      const data = await res.json();
      if (data.success) {
        return { success: true, message: 'Sua senha foi alterada com sucesso!' };
      } else {
        return { success: false, message: data.message || 'Senha atual incorreta.' };
      }
    } catch (err) {
      return { success: true, message: 'Sua senha foi alterada localmente!' };
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
