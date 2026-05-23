import { Route, Routes } from "react-router-dom";
import Home from "./pages/Home";
import Register from "./pages/Register";
import RegisterRestaurant from "./pages/RegisterRestaurant";
import RegisterDriver from "./pages/RegisterDriver";
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
import { PERMISSIONS } from "./constants/permissions";
import { ChatBox } from "../components/chat/ChatBox";
import { Toaster } from "./components/ui/sonner";

function App() {
  return (
    <AuthBootstrap>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/register" element={<Register />} />
        <Route path="/register/restaurant" element={<RegisterRestaurant />} />
        <Route path="/register/driver" element={<RegisterDriver />} />
        <Route path="/login" element={<Login />} />
        <Route path="/403" element={<Forbidden />} />
        <Route path="/auth/google/callback" element={<GoogleOAuthCallback />} />
        <Route path="/explore" element={<Discovery />} />
        <Route path="/cart" element={<Cart />} />
        <Route path="/restaurant/:id" element={<RestaurantDetail />} />
        <Route path="/checkout" element={<Checkout />} />
        <Route path="/tracking" element={<Tracking />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/community" element={<Community />} />
        <Route path="/restaurant-dashboard" element={<ProtectedRoute permission="restaurant:dashboard:view"><RestaurantDashboard /></ProtectedRoute>} />
        <Route path="/admin" element={<ProtectedRoute permission={PERMISSIONS.ADMIN_MANAGEMENT.READ}><AdminDashboard /></ProtectedRoute>} />
        <Route path="/driver-dashboard/*" element={<DriverDashboard />} />

      </Routes>
      <ChatBox />
      <Toaster />
    </AuthBootstrap>
  )
}

export default App;
