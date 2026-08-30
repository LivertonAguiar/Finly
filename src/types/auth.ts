export interface AuthUser {
  id: string;
  name: string;
  email: string;
  password?: string;
  phone?: string;
  role: 'admin' | 'consultor' | 'member';
  avatarUrl?: string;
  createdAt: string;
}

export interface AuthContextType {
  currentUser: AuthUser | null;
  allUsers: AuthUser[];
  login: (email: string, password?: string, remember?: boolean) => { success: boolean; message?: string };
  register: (name: string, email: string, password?: string, phone?: string) => { success: boolean; message?: string };
  logout: () => void;
  updateUserAccount: (data: Partial<AuthUser>) => void;
  deleteUserAccount: (id: string) => void;
}
