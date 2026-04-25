import { createContext, useContext, useState, useEffect, useCallback } from 'react';

const AuthContext = createContext(null);

// ─────────────────────────────────────────────────────────────────────────────
// AuthProvider — manages the global authentication state for the entire app.
// Uses a JWT stored in localStorage. On mount it verifies the token with the
// backend so that the session is restored across page reloads.
// ─────────────────────────────────────────────────────────────────────────────
export function AuthProvider({ children }) {
  const [dbUser, setDbUser]   = useState(null);
  const [token,  setToken]    = useState(null);
  const [loading, setLoading] = useState(true);

  // ── Restore session on first render ───────────────────────────────────────
  useEffect(() => {
    const saved = localStorage.getItem('rh_token');
    if (!saved) {
      setLoading(false);
      return;
    }

    fetch('/api/auth/me', {
      headers: { Authorization: `Bearer ${saved}` }
    })
      .then(async (res) => {
        if (!res.ok) {
          // Token invalid / expired → wipe it silently
          localStorage.removeItem('rh_token');
          return null;
        }
        return res.json();
      })
      .then((userData) => {
        if (userData) {
          setToken(saved);
          setDbUser(userData);
        }
      })
      .catch(() => {
        // Network error — don't wipe the token, just leave the user logged out
        // for this session. The token will be re-verified next time.
        console.warn('⚠️ Could not reach the auth server. Working offline.');
      })
      .finally(() => setLoading(false));
  }, []);

  // ── Email + Password sign-in ───────────────────────────────────────────────
  const login = useCallback(async (email, password) => {
    const res  = await fetch('/api/auth/login', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ email, password })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Login failed');

    localStorage.setItem('rh_token', data.token);
    setToken(data.token);
    setDbUser(data.user);
    return data.user;
  }, []);

  // ── Registration ──────────────────────────────────────────────────────────
  const register = useCallback(async (fullName, email, password) => {
    const res  = await fetch('/api/auth/register', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ fullName, email, password })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Registration failed');

    localStorage.setItem('rh_token', data.token);
    setToken(data.token);
    setDbUser(data.user);
    return data.user;
  }, []);

  // ── Sign-out ──────────────────────────────────────────────────────────────
  const logout = useCallback(() => {
    localStorage.removeItem('rh_token');
    setToken(null);
    setDbUser(null);
  }, []);

  // ── Profile update ────────────────────────────────────────────────────────
  const updateProfile = useCallback(async (data) => {
    const stored = localStorage.getItem('rh_token');
    const res = await fetch('/api/auth/profile', {
      method:  'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization:  `Bearer ${stored}`
      },
      body: JSON.stringify(data)
    });
    const updated = await res.json();
    if (!res.ok) throw new Error(updated.error || 'Update failed');
    setDbUser(updated);
    return updated;
  }, []);

  // ── Avatar upload ─────────────────────────────────────────────────────────
  const updateAvatar = useCallback(async (formData) => {
    const stored = localStorage.getItem('rh_token');
    const res = await fetch('/api/auth/avatar', {
      method:  'POST',
      headers: { Authorization: `Bearer ${stored}` },
      body:    formData
    });
    const updated = await res.json();
    if (!res.ok) throw new Error(updated.error || 'Avatar upload failed');
    setDbUser(updated);
    return updated;
  }, []);

  return (
    <AuthContext.Provider value={{
      user:       dbUser,
      token,
      loading,
      isSignedIn: !!dbUser,
      isAdmin:    dbUser?.role === 'admin',
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
