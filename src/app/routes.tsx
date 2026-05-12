import { createBrowserRouter } from "react-router";
import { Root } from "./Root";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Discovery from "./pages/customer/Discovery";
import RestaurantDetail from "./pages/customer/RestaurantDetail";
import Checkout from "./pages/customer/Checkout";
import Tracking from "./pages/customer/Tracking";
import Profile from "./pages/customer/Profile";
import Community from "./pages/customer/Community";
import Cart from "./pages/customer/Cart";
import RestaurantDashboard from "./pages/restaurant/RestaurantDashboard";
import DriverDashboard from "./pages/driver/DriverDashboard";
import AdminDashboard from "./pages/admin/AdminDashboard";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: Root,
    children: [
      { index: true, Component: Home },
      { path: "login", Component: Login },
      { path: "register", Component: Register },
      { path: "explore", Component: Discovery },
      { path: "cart", Component: Cart },
      { path: "restaurant/:id", Component: RestaurantDetail },
      { path: "checkout", Component: Checkout },
      { path: "tracking", Component: Tracking },
      { path: "profile", Component: Profile },
      { path: "community", Component: Community },
      { path: "restaurant-dashboard", Component: RestaurantDashboard },
      { path: "driver-dashboard", Component: DriverDashboard },
      { path: "admin", Component: AdminDashboard },
      { path: "*", Component: Home },
    ],
  },
]);