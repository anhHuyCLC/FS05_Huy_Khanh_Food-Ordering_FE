import { useCallback, useEffect, useState } from 'react';
import { getAuthorizationCodeFromUrl, initGoogleSDK, renderGoogleOneTap, startGoogleOAuthFlow } from '../services/googleOAuth';
import { useAuthActions } from './useAuth';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
const REDIRECT_URI = import.meta.env.VITE_GOOGLE_REDIRECT_URI || `${window.location.origin}/auth/google/callback`;

const getErrorMessage = (error: unknown, fallback: string) => {
  if (error && typeof error === "object" && "response" in error) {
    const response = (error as { response?: { data?: { message?: string } } }).response;
    if (response?.data?.message) return response.data.message;
  }

  if (error instanceof Error) return error.message;
  return fallback;
};

export function useGoogleAuth() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { loginWithGoogleCode, loginWithGoogleIdToken } = useAuthActions();

  useEffect(() => {
    if (GOOGLE_CLIENT_ID) {
      initGoogleSDK();
    }
  }, []);

  useEffect(() => {
    const code = getAuthorizationCodeFromUrl();

    if (!code) return;

    setLoading(true);
    setError(null);
    loginWithGoogleCode(code)
      .then(() => {
        window.history.replaceState({}, document.title, window.location.pathname);
      })
      .catch((error: unknown) => {
        setError(getErrorMessage(error, "Đăng nhập bằng Google thất bại."));
      })
      .finally(() => {
        setLoading(false);
      });
  }, [loginWithGoogleCode]);

  const handleCredentialResponse = useCallback(async (response: { credential?: string }) => {
    if (!response.credential) return;

    setLoading(true);
    setError(null);

    try {
      await loginWithGoogleIdToken(response.credential);
    } catch (error) {
      setError(getErrorMessage(error, "Đăng nhập bằng Google thất bại."));
    } finally {
      setLoading(false);
    }
  }, [loginWithGoogleIdToken]);

  const handleGoogleOAuthFlow = useCallback(() => {
    if (GOOGLE_CLIENT_ID) {
      startGoogleOAuthFlow(GOOGLE_CLIENT_ID, REDIRECT_URI);
    } else {
      console.error("VITE_GOOGLE_CLIENT_ID is not defined in .env file");
      alert("Chưa cấu hình Google Client ID. Vui lòng kiểm tra lại file .env của bạn.");
    }
  }, []);

  const initializeOneTap = useCallback((elementId: string) => {
    if (GOOGLE_CLIENT_ID) {
      renderGoogleOneTap(elementId);
    }
  }, []);

  return {
    handleGoogleOAuthFlow,
    handleCredentialResponse,
    initializeOneTap,
    isLoading: loading,
    error,
    clientId: GOOGLE_CLIENT_ID,
  };
}
