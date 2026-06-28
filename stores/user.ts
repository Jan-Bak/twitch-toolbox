import { create } from 'zustand';

export type UserProfile = {
  id?: string;
  login?: string;
  display_name?: string;
  email?: string;
  profile_image_url?: string;
};

type UserState = {
  isAuthenticated: boolean;
  user: UserProfile | null;
  accessToken: string | null;
  setAuthenticated: (isAuthenticated: boolean) => void;
  setAuthState: (payload: {
    isAuthenticated: boolean;
    user?: UserProfile | null;
    accessToken?: string | null;
  }) => void;
  setUser: (user: UserProfile | null) => void;
  setAccessToken: (accessToken: string | null) => void;
  clearAuth: () => void;
};

const useUser = create<UserState>((set) => ({
  isAuthenticated: false,
  user: null,
  accessToken: null,
  setAuthenticated: (isAuthenticated) => set({ isAuthenticated }),
  setAuthState: ({ isAuthenticated, user = null, accessToken = null }) =>
    set({ isAuthenticated, user, accessToken }),
  setUser: (user) => set({ user }),
  setAccessToken: (accessToken) => set({ accessToken }),
  clearAuth: () => set({ isAuthenticated: false, user: null, accessToken: null }),
}));

export default useUser;
