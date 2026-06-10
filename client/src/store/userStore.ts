import { create } from "zustand";

type User = { id: string; username: string; email: string };

type UserStore = {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  setUser: (user: User) => void;
  clearUser: () => void;
  setIsLoading: (value: boolean) => void;
};

export const userStore = create<UserStore>((set) => ({
  user: null,
  isLoading: true,
  isAuthenticated: false,
  setUser: (user) => set({ user, isAuthenticated: true }),
  clearUser: () => set({ user: null, isAuthenticated: false }),
  setIsLoading: (value) => set({ isLoading: value }),
}));
