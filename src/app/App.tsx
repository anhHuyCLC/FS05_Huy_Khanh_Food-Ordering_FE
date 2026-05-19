import { Route, Routes } from "react-router-dom";
import Home from "./pages/Home";
import Register from "./pages/Register";
import Login from "./pages/Login";
import GoogleOAuthCallback from "./pages/auth/GoogleOAuthCallback";
import Discovery from "./pages/customer/Discovery";
import Cart from "./pages/customer/Cart";
import RestaurantDetail from "./pages/customer/RestaurantDetail";
import Checkout from "./pages/customer/Checkout";
import Tracking from "./pages/customer/Tracking";
import Profile from "./pages/customer/Profile";
import Community from "./pages/customer/Community";
import RestaurantDashboard from "./pages/restaurant/RestaurantDashboard";
import AdminDashboard from "./pages/admin/AdminDashboard";
import DriverDashboard from "./pages/driver/DriverDashboard";
import Forbidden from "./pages/Forbidden";
import { AuthBootstrap } from "./components/auth/AuthBootstrap";
import { ProtectedRoute } from "./components/auth/ProtectedRoute";

function App() {
  return (
    <AuthBootstrap>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login />} />
        <Route path="/403" element={<Forbidden />} />
        <Route path="/auth/google/callback" element={<GoogleOAuthCallback />} />
        <Route path="/explore" element={<Discovery />} />
        <Route path="/cart" element={<Cart />} />
        <Route path="/restaurant/:id" element={<RestaurantDetail />} />
        <Route path="/checkout" element={<ProtectedRoute permission="order:create"><Checkout /></ProtectedRoute>} />
        <Route path="/tracking" element={<ProtectedRoute permission="order:track"><Tracking /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
        <Route path="/community" element={<Community />} />
        <Route path="/restaurant-dashboard" element={<ProtectedRoute permission="restaurant:dashboard:view"><RestaurantDashboard /></ProtectedRoute>} />
        <Route path="/admin" element={<ProtectedRoute permission="admin:dashboard:view"><AdminDashboard /></ProtectedRoute>} />
        <Route path="/driver-dashboard" element={<ProtectedRoute permission="driver:dashboard:view"><DriverDashboard /></ProtectedRoute>} />

      </Routes>
    </AuthBootstrap>
  )
}

export default App;
