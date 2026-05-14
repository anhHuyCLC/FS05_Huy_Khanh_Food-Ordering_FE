import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useGoogleAuth } from "../../hooks/useGoogleAuth";
import { useAppSelector } from "../../store";

export default function GoogleOAuthCallback() {
  const navigate = useNavigate();
  // Hook này tự động lấy code từ URL (do Google trả về) và dispatch action đăng nhập
  const { isLoading, error } = useGoogleAuth();
  const { user } = useAppSelector((state) => state.auth);

  useEffect(() => {
    // Nếu đã đăng nhập thành công và Redux có thông tin user, chuyển về trang chủ
    if (user) {
      navigate("/");
    }
  }, [user, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="p-8 bg-white rounded-2xl shadow-xl max-w-md w-full text-center">
        {isLoading ? (
          <>
            <div className="w-16 h-16 border-4 border-[#FF4500] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Đang xác thực...</h2>
            <p className="text-gray-500 text-sm">Vui lòng chờ trong giây lát để hoàn tất đăng nhập với Google.</p>
          </>
        ) : error ? (
          <>
            <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl">
              ❌
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Đăng nhập thất bại</h2>
            <p className="text-red-500 text-sm mb-6">{typeof error === 'string' ? error : 'Đã có lỗi xảy ra.'}</p>
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