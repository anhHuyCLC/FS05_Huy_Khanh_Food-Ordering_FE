import { useCallback, useEffect } from 'react';
import { loginWithGoogleCode, loginWithGoogleIdToken } from '../features/authSlice';
import { getAuthorizationCodeFromUrl, initGoogleSDK, renderGoogleOneTap, startGoogleOAuthFlow } from '../services/googleOAuth';
import { useAppDispatch, useAppSelector } from '../store';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

// QUAN TRỌNG: Đây chính là chuỗi phải khớp 100% với Google Cloud và Backend
const REDIRECT_URI = import.meta.env.VITE_GOOGLE_REDIRECT_URI || `${window.location.origin}/auth/google/callback`;

export function useGoogleAuth() {
  const dispatch = useAppDispatch();
  const { loading, error } = useAppSelector((state) => state.auth);

  useEffect(() => {
    if (GOOGLE_CLIENT_ID) {
      initGoogleSDK(GOOGLE_CLIENT_ID);
    }
  }, []);

  useEffect(() => {
    // Lấy code từ URL do Google trả về
    const code = getAuthorizationCodeFromUrl();
    
    if (code) {
      dispatch(loginWithGoogleCode(code));
      
      // Dọn dẹp URL cho sạch sẽ (ẩn code đi)
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [dispatch]);

  const handleCredentialResponse = useCallback(async (response: any) => {
    if (response.credential) {
      dispatch(loginWithGoogleIdToken(response.credential) as any);
    }
  }, [dispatch]);

  const handleGoogleOAuthFlow = useCallback(() => {
    // Chuyển hướng sang màn hình đăng nhập của Google từ Frontend
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
