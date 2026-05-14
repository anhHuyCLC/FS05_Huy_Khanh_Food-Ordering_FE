/**
 * Custom React hook for Google OAuth integration
 * 
 * Usage:
 * const { handleGoogleLogin, isLoading, error } = useGoogleAuth();
 * <button onClick={handleGoogleLogin}>Login with Google</button>
 */

import { useCallback, useEffect } from 'react';
import { loginWithGoogleCode, loginWithGoogleIdToken } from '../features/authSlice';
import { getAuthorizationCodeFromUrl, initGoogleSDK, renderGoogleOneTap, startGoogleOAuthFlow } from '../services/googleOAuth';
import { useAppDispatch, useAppSelector } from '../store';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
const REDIRECT_URI = import.meta.env.VITE_GOOGLE_REDIRECT_URI || `${window.location.origin}/auth/google/callback`;

export function useGoogleAuth() {
  const dispatch = useAppDispatch();
  const { loading, error } = useAppSelector((state) => state.auth);

  // Initialize Google SDK on mount
  useEffect(() => {
    if (GOOGLE_CLIENT_ID) {
      initGoogleSDK(GOOGLE_CLIENT_ID);
    }
  }, []);

  // Check for authorization code in URL (OAuth callback)
  useEffect(() => {
    const code = getAuthorizationCodeFromUrl();
    if (code) {
      dispatch(loginWithGoogleCode(code) as any);
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [dispatch]);

  /**
   * Handle Google One Tap credential response
   * This receives the ID token from Google SDK
   */
  const handleCredentialResponse = useCallback(async (response: any) => {
    if (response.credential) {
      dispatch(loginWithGoogleIdToken(response.credential) as any);
    }
  }, [dispatch]);

  /**
   * Start OAuth2 flow with authorization code
   * Redirects to Google login
   */
  const handleGoogleOAuthFlow = useCallback(() => {
    if (GOOGLE_CLIENT_ID) {
      startGoogleOAuthFlow(GOOGLE_CLIENT_ID, REDIRECT_URI);
    } else {
      console.error("VITE_GOOGLE_CLIENT_ID is not defined in .env file");
      alert("Chưa cấu hình Google Client ID. Vui lòng kiểm tra lại file .env của bạn.");
    }
  }, []);

  /**
   * Initialize and render Google One Tap UI
   */
  const initializeOneTap = useCallback((elementId: string) => {
    if (GOOGLE_CLIENT_ID) {
      renderGoogleOneTap(elementId);
    }
  }, []);

  return {
    // Use this to start OAuth code flow (redirects to Google)
    handleGoogleOAuthFlow,
    // Use this for One Tap UI callback
    handleCredentialResponse,
    // Use this to render One Tap UI
    initializeOneTap,
    // State
    isLoading: loading,
    error,
    clientId: GOOGLE_CLIENT_ID,
  };
}
