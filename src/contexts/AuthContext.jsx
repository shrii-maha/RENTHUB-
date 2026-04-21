import { createContext, useContext, useState, useEffect, useCallback } from 'react';

const AuthContext = createContext(null);

// Check if Clerk is enabled (key present and not placeholder)
const CLERK_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;
const isClerkEnabled = CLERK_KEY && !CLERK_KEY.includes('YOUR_CLERK_KEY');

// Lazy Clerk hook — only imported when Clerk is actually enabled
let useClerkUser = () => ({ user: null, isLoaded: true, isSignedIn: false });
let useClerkSignOut = () => ({ signOut: async () => {} });

export function AuthProvider({ children }) {
  const [dbUser, setDbUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('rh_token'));
  const [loading, setLoading] = useState(true);
  const [clerkUser, setClerkUser] = useState(null);
  const [clerkSignedIn, setClerkSignedIn] = useState(false);
  const [clerkLoaded, setClerkLoaded] = useState(!isClerkEnabled); // if no Clerk, treat as loaded

  // ---------------------------------------------------------
  // 1. Restore custom JWT session on mount
  // ---------------------------------------------------------
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

  // ---------------------------------------------------------
  // 2. Sync Clerk state into local state (only if Clerk enabled)
  // ---------------------------------------------------------
  useEffect(() => {
    if (!isClerkEnabled) return;

    // Dynamically use Clerk hooks via an inner component approach
    // We poll Clerk's window object as a fallback since we can't
    // use hooks conditionally. The ClerkProvider bridge does this.
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
      isClerkEnabled,
      login,
      register,
      logout,
      syncClerkUser,   // exposed so ClerkBridge can call it
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
