import React, { createContext, useContext, useState, useEffect } from 'react';
import { AuthUser, AuthContextType } from '../types/auth';

interface ExtendedAuthContextType extends AuthContextType {
  requestPasswordReset: (email: string) => Promise<{ success: boolean; message: string; debugCode?: string }>;
  verifyResetCode: (email: string, code: string) => Promise<{ success: boolean; message: string }>;
  resetPassword: (email: string, code: string, newPassword: string) => Promise<{ success: boolean; message: string }>;
  changePassword: (oldPassword: string, newPassword: string) => { success: boolean; message: string };
}

const AuthContext = createContext<ExtendedAuthContextType | undefined>(undefined);

const AUTH_USERS_KEY = 'plannerfin_auth_users_db';
const ACTIVE_SESSION_KEY = 'plannerfin_active_session_id';

const DEFAULT_ADMIN_USER: AuthUser = {
  id: 'usr-default-liverton',
  name: 'Liverton',
  email: 'liverton.aguiar@hotmail.com',
  password: '123',
  phone: '85985949115',
  role: 'admin',
  createdAt: '2026-01-01',
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [allUsers, setAllUsers] = useState<AuthUser[]>(() => {
    try {
      const saved = localStorage.getItem(AUTH_USERS_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.error(e);
    }
    return [DEFAULT_ADMIN_USER];
  });

  const [currentUser, setCurrentUser] = useState<AuthUser | null>(() => {
    try {
      const activeId = localStorage.getItem(ACTIVE_SESSION_KEY);
      if (activeId) {
        const savedUsersStr = localStorage.getItem(AUTH_USERS_KEY);
        const usersList: AuthUser[] = savedUsersStr ? JSON.parse(savedUsersStr) : [DEFAULT_ADMIN_USER];
        const found = usersList.find(u => u.id === activeId);
        if (found) return found;
      }
    } catch (e) {
      console.error(e);
    }
    return DEFAULT_ADMIN_USER;
  });

  // Sync users db to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(AUTH_USERS_KEY, JSON.stringify(allUsers));
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

  const login = (email: string, password?: string, remember: boolean = true) => {
    const cleanEmail = email.trim().toLowerCase();
    const user = allUsers.find(u => u.email.toLowerCase() === cleanEmail);

    if (!user) {
      return { success: false, message: 'Usuário não encontrado com este e-mail.' };
    }

    if (password && user.password && user.password !== password) {
      return { success: false, message: 'Senha incorreta.' };
    }

    setCurrentUser(user);
    if (remember) {
      localStorage.setItem(ACTIVE_SESSION_KEY, user.id);
    }
    return { success: true };
  };

  const register = (name: string, email: string, password?: string, phone?: string) => {
    const cleanEmail = email.trim().toLowerCase();
    const existing = allUsers.find(u => u.email.toLowerCase() === cleanEmail);

    if (existing) {
      return { success: false, message: 'Já existe uma conta com este e-mail.' };
    }

    const newUser: AuthUser = {
      id: 'usr-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
      name: name.trim(),
      email: cleanEmail,
      password: password || '123',
      phone: phone || '',
      role: 'member',
      createdAt: new Date().toISOString().split('T')[0],
    };

    setAllUsers(prev => [...prev, newUser]);
    setCurrentUser(newUser);
    localStorage.setItem(ACTIVE_SESSION_KEY, newUser.id);
    return { success: true };
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
    localStorage.removeItem(`plannerfin_user_${id}_store`);
    if (currentUser?.id === id) {
      logout();
    }
  };

  // 1. Request Password Reset via Real SMTP Gmail Backend
  const requestPasswordReset = async (email: string) => {
    const cleanEmail = email.trim().toLowerCase();
    const user = allUsers.find(u => u.email.toLowerCase() === cleanEmail);
    if (!user) {
      return { success: false, message: 'Nenhuma conta cadastrada com este e-mail.' };
    }

    try {
      const response = await fetch('http://localhost:3001/api/send-recovery-code', {
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
      // Fallback local code if backend is not started yet
      const fallbackCode = Math.floor(100000 + Math.random() * 900000).toString();
      sessionStorage.setItem(`reset_code_${cleanEmail}`, fallbackCode);
      console.warn('Backend SMTP offline, using generated code:', fallbackCode);
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
      const response = await fetch('http://localhost:3001/api/verify-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cleanEmail, code }),
      });
      const data = await response.json();
      if (data.success) {
        return { success: true, message: 'Código validado com sucesso!' };
      }
    } catch (e) {
      // Fallback verification
      const savedCode = sessionStorage.getItem(`reset_code_${cleanEmail}`);
      if (savedCode && savedCode === code.trim()) {
        return { success: true, message: 'Código validado com sucesso!' };
      }
    }
    return { success: false, message: 'Código de verificação incorreto ou expirado.' };
  };

  // 3. Reset Password
  const resetPassword = async (email: string, code: string, newPassword: string) => {
    const cleanEmail = email.trim().toLowerCase();
    const verifyRes = await verifyResetCode(email, code);
    if (!verifyRes.success) {
      return { success: false, message: verifyRes.message };
    }

    setAllUsers(prev =>
      prev.map(u => (u.email.toLowerCase() === cleanEmail ? { ...u, password: newPassword } : u))
    );

    if (currentUser?.email.toLowerCase() === cleanEmail) {
      setCurrentUser(prev => (prev ? { ...prev, password: newPassword } : null));
    }

    sessionStorage.removeItem(`reset_code_${cleanEmail}`);
    return { success: true, message: 'Senha redefinida com sucesso!' };
  };

  // 4. Change Password in Profile
  const changePassword = (oldPassword: string, newPassword: string) => {
    if (!currentUser) return { success: false, message: 'Usuário não autenticado.' };
    if (currentUser.password && currentUser.password !== oldPassword) {
      return { success: false, message: 'A senha atual informada está incorreta.' };
    }
    if (newPassword.length < 3) {
      return { success: false, message: 'A nova senha deve ter no mínimo 3 caracteres.' };
    }

    updateUserAccount({ password: newPassword });
    return { success: true, message: 'Sua senha foi alterada com sucesso!' };
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        allUsers,
        login,
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
