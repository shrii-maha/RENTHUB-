import { createContext, useContext, useState, useEffect, useCallback } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [dbUser, setDbUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('rh_token'));
  const [loading, setLoading] = useState(true);

  // ---------------------------------------------------------
  // Restore custom JWT session on mount
  // ---------------------------------------------------------
  useEffect(() => {
    const storedToken = localStorage.getItem('rh_token');
    if (storedToken) {
      fetch('/api/auth/me', {
        headers: { Authorization: `Bearer ${storedToken}` }
      })
        .then(res => {
          if (!res.ok) {
            return res.json().then(errData => {
              throw new Error(`Status ${res.status}: ${errData.error || 'Unknown backend error'}`);
            }).catch(() => {
              throw new Error(`Status ${res.status}: Invalid JSON from server (might be Vercel/Render timeout)`);
            });
          }
          return res.json();
        })
        .then(userData => {
          console.log('✅ Session restored for:', userData.email);
          setDbUser(userData);
          setToken(storedToken);
          // Temporary success alert for debugging
          alert("SUCCESS! You are logged in as " + userData.email);
        })
        .catch((err) => {
          console.error('❌ Session restoration failed.', err);
          alert("Login failed! The server rejected your token. Error details: " + err.message);
          localStorage.removeItem('rh_token');
          setToken(null);
          setDbUser(null);
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  // ---------------------------------------------------------
  // Custom JWT methods
  // ---------------------------------------------------------
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
    setDbUser(data.user);
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
    setDbUser(data.user);
    return data.user;
  }, []);

  const logout = useCallback(async () => {
    localStorage.removeItem('rh_token');
    setToken(null);
    setDbUser(null);
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
    setDbUser(updatedUser);
    return updatedUser;
  }, [token]);

  const updateAvatar = useCallback(async (formData) => {
    const res = await fetch('/api/auth/avatar', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: formData
    });
    const updatedUser = await res.json();
    if (!res.ok) throw new Error(updatedUser.error || 'Avatar upload failed');
    setDbUser(updatedUser);
    return updatedUser;
  }, [token]);

  return (
    <AuthContext.Provider value={{
      user: dbUser,
      token,
      loading,
      isSignedIn: !!dbUser,
      isAdmin: dbUser?.role === 'admin',
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
