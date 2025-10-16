import { create } from 'zustand';

interface AuthState {
  token: string | null;
  username: string | null;
  login: (token: string, username: string, remember?: boolean) => void;
  logout: () => void;
}

const tokenKey = 'qrvideo_token';
const usernameKey = 'qrvideo_username';

const getInitialState = () => {
  if (typeof window === 'undefined') {
    return { token: null, username: null };
  }

  return {
    token: localStorage.getItem(tokenKey),
    username: localStorage.getItem(usernameKey),
  };
};

export const useAuthStore = create<AuthState>((set) => ({
  ...getInitialState(),
  login: (token, username, remember = true) => {
    if (remember && typeof window !== 'undefined') {
      localStorage.setItem(tokenKey, token);
      localStorage.setItem(usernameKey, username);
    }

    set({ token, username });
  },
  logout: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(tokenKey);
      localStorage.removeItem(usernameKey);
    }

    set({ token: null, username: null });
  },
}));

export const authStore = {
  get token() {
    return useAuthStore.getState().token;
  },
  logout() {
    useAuthStore.getState().logout();
  },
};
