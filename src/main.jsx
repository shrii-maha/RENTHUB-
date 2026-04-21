import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { AuthProvider } from './contexts/AuthContext';
import { SocketProvider } from './contexts/SocketContext';
import App from './App';
import './index.css';

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;
const isClerkEnabled = PUBLISHABLE_KEY && !PUBLISHABLE_KEY.includes('YOUR_CLERK_KEY');

const rootElement = document.getElementById('root');

if (isClerkEnabled) {
  // Dynamically import Clerk + ClerkBridge only when key is present
  Promise.all([
    import('@clerk/clerk-react'),
    import('./components/ClerkBridge')
  ]).then(([{ ClerkProvider }, { default: ClerkBridge }]) => {
    createRoot(rootElement).render(
      <StrictMode>
        <ClerkProvider publishableKey={PUBLISHABLE_KEY} afterSignOutUrl="/">
          <AuthProvider>
            <SocketProvider>
              <ClerkBridge />
              <App />
            </SocketProvider>
          </AuthProvider>
        </ClerkProvider>
      </StrictMode>
    );
  });
} else {
  console.warn('⚠️ Clerk key not set — running with custom JWT auth. Add VITE_CLERK_PUBLISHABLE_KEY to .env to enable Clerk sign-up.');
  createRoot(rootElement).render(
    <StrictMode>
      <AuthProvider>
        <SocketProvider>
          <App />
        </SocketProvider>
      </AuthProvider>
    </StrictMode>
  );
}
