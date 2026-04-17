import { createContext, useContext, useState, useEffect, useCallback } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('rh_token'));
  const [loading, setLoading] = useState(true);

  // Restore session on mount
  useEffect(() => {
    const storedToken = localStorage.getItem('rh_token');
    if (storedToken) {
      fetch('/api/auth/me', {
        headers: { Authorization: `Bearer ${storedToken}` }
      })
        .then(res => res.ok ? res.json() : Promise.reject())
        .then(userData => {
          setUser(userData);
          setToken(storedToken);
        })
        .catch(() => {
          localStorage.removeItem('rh_token');
          setToken(null);
          setUser(null);
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = useCallback(async (email, password) => {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Login failed');
    localStorage.setItem('rh_token', data.token);
    setToken(data.token);
    setUser(data.user);
    return data.user;
  }, []);

  const register = useCallback(async (fullName, email, password) => {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fullName, email, password })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Registration failed');
    localStorage.setItem('rh_token', data.token);
    setToken(data.token);
    setUser(data.user);
    return data.user;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('rh_token');
    setToken(null);
    setUser(null);
  }, []);

  const updateProfile = useCallback(async (data) => {
    const res = await fetch('/api/auth/profile', {
      method: 'PUT',
      headers: { 
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(data)
    });
    const updatedUser = await res.json();
    if (!res.ok) throw new Error(updatedUser.error || 'Update failed');
    setUser(updatedUser);
    return updatedUser;
  }, [token]);

  const updateAvatar = useCallback(async (formData) => {
    const res = await fetch('/api/auth/avatar', {
      method: 'POST',
      headers: { 
        Authorization: `Bearer ${token}`
      },
      body: formData
    });
    const updatedUser = await res.json();
    if (!res.ok) throw new Error(updatedUser.error || 'Avatar upload failed');
    setUser(updatedUser);
    return updatedUser;
  }, [token]);

  const adminEmail = import.meta.env.VITE_ADMIN_EMAIL || 'admin@renthub.com';

  return (
    <AuthContext.Provider value={{
      user,
      token,
      loading,
      isSignedIn: !!user,
      isAdmin: user?.role === 'admin',
      login,
      register,
      logout,
      updateProfile,
      updateAvatar,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
