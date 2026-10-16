import { authApi, LoginPayload, RegisterPayload } from '@/src/api/auth';
import type { User } from '@/src/types/api';
import { storage } from '@/src/utils/storage';
import React, {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useState,
} from 'react';

interface AuthState {
  hydrated: boolean;         // ya cargó token de SecureStore
  token: string | null;
  user: User | null;
  roles: string[];
  permisos: string[];
  loading: boolean;          // login/register en curso
  error: string | null;
}

interface AuthContextValue extends AuthState {
  isAuthenticated: boolean;
  login: (payload: LoginPayload) => Promise<void>;
  register: (payload: RegisterPayload) => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  hasPermission: (perm: string) => boolean;
  hasRole: (role: string) => boolean;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    hydrated: false,
    token: null,
    user: null,
    roles: [],
    permisos: [],
    loading: false,
    error: null,
  });

  // —— Hidratar desde SecureStore ——
  useEffect(() => {
    (async () => {
      const [token, user] = await Promise.all([
        storage.getToken(),
        storage.getUser<User>(),
      ]);

      setState((s) => ({
        ...s,
        token,
        user,
        roles: [],
        permisos: [],
        hydrated: true,
      }));

      // Si hay token, refrescamos perfil para traer roles y permisos
      if (token) {
        try {
          await refreshProfile();
        } catch {
          // Token inválido → limpiamos
          await storage.clear();
          setState((s) => ({ ...s, token: null, user: null }));
        }
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const refreshProfile = useCallback(async () => {
    const res = await authApi.profile();
    await storage.setUser(res.user);
    setState((s) => ({
      ...s,
      user: res.user,
      roles: res.roles,
      permisos: res.permisos,
    }));
  }, []);

  const login = useCallback(async (payload: LoginPayload) => {
    setState((s) => ({ ...s, loading: true, error: null }));
    try {
      const res = await authApi.login(payload);
      await Promise.all([
        storage.setToken(res.token),
        storage.setUser(res.user),
      ]);
      setState((s) => ({
        ...s,
        token: res.token,
        user: res.user,
        roles: res.roles,
        loading: false,
        error: null,
      }));
      // Traemos permisos después
      await refreshProfile();
    } catch (e: any) {
      setState((s) => ({
        ...s,
        loading: false,
        error: e?.message ?? 'Error al iniciar sesión',
      }));
      throw e;
    }
  }, [refreshProfile]);

  const register = useCallback(async (payload: RegisterPayload) => {
    setState((s) => ({ ...s, loading: true, error: null }));
    try {
      const res = await authApi.register(payload);
      await Promise.all([
        storage.setToken(res.token),
        storage.setUser(res.user),
      ]);
      setState((s) => ({
        ...s,
        token: res.token,
        user: res.user,
        roles: res.roles,
        loading: false,
        error: null,
      }));
      await refreshProfile();
    } catch (e: any) {
      setState((s) => ({
        ...s,
        loading: false,
        error: e?.message ?? 'Error al registrarse',
      }));
      throw e;
    }
  }, [refreshProfile]);

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } catch {
      // ignoramos errores al hacer logout
    }
    await storage.clear();
    setState((s) => ({
      ...s,
      token: null,
      user: null,
      roles: [],
      permisos: [],
      error: null,
    }));
  }, []);

  const hasPermission = useCallback(
    (perm: string) => state.permisos.includes(perm),
    [state.permisos]
  );

  const hasRole = useCallback(
    (role: string) => state.roles.includes(role),
    [state.roles]
  );

  const clearError = useCallback(() => {
    setState((s) => ({ ...s, error: null }));
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      ...state,
      isAuthenticated: !!state.token,
      login,
      register,
      logout,
      refreshProfile,
      hasPermission,
      hasRole,
      clearError,
    }),
    [state, login, register, logout, refreshProfile, hasPermission, hasRole, clearError]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}