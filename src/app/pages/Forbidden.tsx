import { Link } from "react-router-dom";
import { ShieldAlert } from "lucide-react";

export default function Forbidden() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-6">
      <div className="max-w-md w-full bg-white border border-gray-100 rounded-2xl p-8 text-center shadow-sm">
        <div className="w-14 h-14 rounded-2xl bg-red-50 text-red-500 mx-auto mb-4 flex items-center justify-center">
          <ShieldAlert className="w-7 h-7" />
        </div>
        <h1 className="text-2xl font-black text-gray-900 mb-2">403</h1>
        <p className="text-sm text-gray-500 mb-6">
          You do not have permission to access this page.
        </p>
        <Link
          to="/"
          className="inline-flex items-center justify-center px-5 py-3 rounded-xl text-white text-sm font-semibold"
          style={{ background: "linear-gradient(135deg, #FF4500, #FF6B35)" }}
        >
          Back to home
        </Link>
      </div>
    </div>
  );
}
