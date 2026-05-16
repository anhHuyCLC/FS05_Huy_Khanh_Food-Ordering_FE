import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../../store";
import { loginWithGoogleCode } from "../../features/authSlice";
import { getAuthorizationCodeFromUrl } from "../../services/googleOAuth";

export default function GoogleOAuthCallback() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { user, loading, error } = useAppSelector((state) => state.auth);
  const isFetched = useRef(false);

  useEffect(() => {
    if (user) {
      navigate("/");
      return;
    }

    const code = getAuthorizationCodeFromUrl();
    if (code && !isFetched.current) {
      isFetched.current = true;
      dispatch(loginWithGoogleCode(code))
        .unwrap()
        .then(() => {
          window.history.replaceState({}, document.title, window.location.pathname);
          navigate("/");
        })
        .catch(() => {
          window.history.replaceState({}, document.title, window.location.pathname);
        });
    } else if (!code && !loading && !user && !isFetched.current) {
      navigate("/login");
    }
  }, [dispatch, navigate, user, loading]);

  const displayError = error;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="p-8 bg-white rounded-2xl shadow-xl max-w-md w-full text-center">
        {loading ? (
          <>
            <div className="w-16 h-16 border-4 border-[#FF4500] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Đang xác thực...</h2>
            <p className="text-gray-500 text-sm">Vui lòng chờ trong giây lát để hoàn tất đăng nhập với Google.</p>
          </>
        ) : displayError ? (
          <>
            <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl">
              ❌
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Đăng nhập thất bại</h2>
            <p className="text-red-500 text-sm mb-6">{typeof displayError === 'string' ? displayError : 'Đã có lỗi xảy ra.'}</p>
            <button 
              onClick={() => navigate('/login')}
              className="w-full py-3 bg-[#FF4500] text-white rounded-xl font-semibold hover:bg-orange-600 transition-colors"
            >
              Quay lại trang đăng nhập
            </button>
          </>
        ) : (
          <>
            <div className="w-16 h-16 border-4 border-[#FF4500] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Đăng nhập thành công!</h2>
            <p className="text-gray-500 text-sm">Đang chuyển hướng...</p>
          </>
        )}
      </div>
    </div>
  );
}