import { create } from 'zustand';
import { Usuario } from '@/types';

interface AuthStore {
  usuario: Usuario | null;
  token: string | null;
  setUsuario: (usuario: Usuario | null) => void;
  setToken: (token: string | null) => void;
  logout: () => void;
  isAuthenticated: () => boolean;
}

export const useAuthStore = create<AuthStore>((set, get) => ({
  usuario: null,
  token: localStorage.getItem('token'),

  setUsuario: (usuario) => {
    set({ usuario });
    if (!usuario) {
      localStorage.removeItem('usuario');
    } else {
      localStorage.setItem('usuario', JSON.stringify(usuario));
    }
  },

  setToken: (token) => {
    set({ token });
    if (token) {
      localStorage.setItem('token', token);
    } else {
      localStorage.removeItem('token');
    }
  },

  logout: () => {
    set({ usuario: null, token: null });
    localStorage.removeItem('token');
    localStorage.removeItem('usuario');
  },

  isAuthenticated: () => {
    return get().token !== null && get().usuario !== null;
  },
}));
