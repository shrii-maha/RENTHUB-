/**
 * ClerkBridge.jsx
 * 
 * This component lives INSIDE <ClerkProvider> so it can safely
 * use Clerk hooks. It watches the Clerk user state and syncs it
 * to our MongoDB backend via AuthContext.syncClerkUser().
 */
import { useEffect } from 'react';
import { useUser, useClerk } from '@clerk/clerk-react';
import { useAuth } from '../contexts/AuthContext';

export default function ClerkBridge() {
  const { user: clerkUser, isLoaded, isSignedIn } = useUser();
  const { signOut } = useClerk();
  const { syncClerkUser, logout: customLogout, isSignedIn: customSignedIn } = useAuth();

  // When Clerk signs in a user, sync them to MongoDB
  useEffect(() => {
    if (!isLoaded) return;

    if (isSignedIn && clerkUser) {
      syncClerkUser(clerkUser);
    }
  }, [isLoaded, isSignedIn, clerkUser, syncClerkUser]);

  // Patch logout to also sign out from Clerk
  useEffect(() => {
    if (!isSignedIn && !customSignedIn) return;
    
    // If custom auth logs out but Clerk still has a session, sign out Clerk too
    if (!customSignedIn && isSignedIn) {
      signOut();
    }
  }, [customSignedIn, isSignedIn, signOut]);

  return null; // renders nothing — only a side-effect bridge
}
