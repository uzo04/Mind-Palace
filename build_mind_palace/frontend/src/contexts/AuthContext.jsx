import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { authService } from '../services/auth.service';

const AuthContext = createContext(null);

function clearStoredSession() {
  localStorage.removeItem('token');
  localStorage.removeItem('mind-palace-user');
}

function readStoredUser() {
  try {
    const saved = localStorage.getItem('mind-palace-user');
    return saved ? JSON.parse(saved) : null;
  } catch {
    clearStoredSession();
    return null;
  }
}

export function AuthProvider({ children }) {
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [user, setUser] = useState(() => readStoredUser());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const hydrate = async () => {
      if (!token) {
        setUser(null);
        setLoading(false);
        return;
      }

      try {
        const me = await authService.me();
        setUser(me);
        localStorage.setItem('mind-palace-user', JSON.stringify(me));
      } catch {
        clearStoredSession();
        setToken(null);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    hydrate();
  }, [token]);

  useEffect(() => {
    const handleAuthExpired = () => {
      clearStoredSession();
      setToken(null);
      setUser(null);
      setLoading(false);
    };

    window.addEventListener('mind-palace:auth-expired', handleAuthExpired);
    return () => window.removeEventListener('mind-palace:auth-expired', handleAuthExpired);
  }, []);

  const login = async (values) => {
    const data = await authService.login(values);
    localStorage.setItem('token', data.token);
    localStorage.setItem('mind-palace-user', JSON.stringify(data.user));
    setToken(data.token);
    setUser(data.user);
    return data.user;
  };

  const register = async (values) => {
    const data = await authService.register(values);
    localStorage.setItem('token', data.token);
    localStorage.setItem('mind-palace-user', JSON.stringify(data.user));
    setToken(data.token);
    setUser(data.user);
    return data.user;
  };

  const logout = () => {
    clearStoredSession();
    setToken(null);
    setUser(null);
  };

  const value = useMemo(() => ({
    token,
    user,
    loading,
    isAuthenticated: Boolean(token && user),
    login,
    register,
    logout,
  }), [token, user, loading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside AuthProvider');
  return context;
}
