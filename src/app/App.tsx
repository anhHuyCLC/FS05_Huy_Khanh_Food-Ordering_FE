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

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/register" element={<Register />} />
      <Route path="/login" element={<Login />} />
      <Route path="/auth/google/callback" element={<GoogleOAuthCallback />} />
      <Route path="/explore" element={<Discovery />} />
      <Route path="/cart" element={<Cart />} />
      <Route path="/restaurant/:id" element={<RestaurantDetail />} />
      <Route path="/checkout" element={<Checkout />} />
      <Route path="/tracking" element={<Tracking />} />
      <Route path="/profile" element={<Profile />} />
      <Route path="/community" element={<Community />} />
      <Route path="/restaurant-dashboard" element={<RestaurantDashboard />} />
      <Route path="/admin" element={<AdminDashboard />} />
      <Route path="/driver-dashboard" element={<DriverDashboard />} />

    </Routes>
  )
}

export default App;