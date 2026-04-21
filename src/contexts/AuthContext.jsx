import { createContext, useContext, useState, useEffect, useCallback } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [dbUser, setDbUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('rh_token'));
  const [loading, setLoading] = useState(true);

  // Restore session from stored JWT on mount (set by ClerkBridge after Clerk sign-in)
  useEffect(() => {
    const storedToken = localStorage.getItem('rh_token');
    if (storedToken) {
      fetch('/api/auth/me', {
        headers: { Authorization: `Bearer ${storedToken}` }
      })
        .then(res => res.ok ? res.json() : Promise.reject())
        .then(userData => {
          setDbUser(userData);
          setToken(storedToken);
        })
        .catch(() => {
          localStorage.removeItem('rh_token');
          setToken(null);
          setDbUser(null);
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  // Called by ClerkBridge when Clerk signs in — syncs Clerk user to MongoDB, gets JWT
  const syncClerkUser = useCallback(async (clerkUserData) => {
    if (!clerkUserData) return;
    const primaryEmail = clerkUserData.primaryEmailAddress?.emailAddress;
    if (!primaryEmail) return;

    try {
      const res = await fetch('/api/auth/clerk-sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clerkId: clerkUserData.id,
          email: primaryEmail,
          fullName: clerkUserData.fullName || clerkUserData.firstName || primaryEmail.split('@')[0],
          avatar: clerkUserData.imageUrl || '',
        })
      });
      if (!res.ok) return;
      const data = await res.json();
      if (data.token) {
        localStorage.setItem('rh_token', data.token);
        setToken(data.token);
        setDbUser(data.user);
      }
    } catch (err) {
      console.error('Clerk sync failed:', err);
    }
  }, []);

  // Called by ClerkBridge when Clerk signs out
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
      logout,
      syncClerkUser,
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
