import { Routes, Route, useLocation } from "react-router-dom";
import { useState } from "react";
import { AnimatePresence } from "framer-motion";
import { AuthProvider } from "./context/AuthContext";
import { useEffect } from "react";

// Layout
import Topbar from "./components/layout/Topbar";
import Sidebar from "./components/layout/Sidebar";
import Footer from "./components/layout/Footer";

// Pages & Components
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import AdminUsers from "./pages/AdminUsers"; // ⬅️ thêm import

// ❌ XÓA: import Cart from "./pages/Cart";
import Messages from "./pages/Messages";
import MyPosts from "./pages/MyPosts";
import CreatePost from "./pages/CreatePost";
import Favorites from "./pages/Favorites";
import Profile from "./pages/Profile";
import ProductDetail from "./components/product/ProductDetail";
import ProductGrid from "./components/product/ProductGrid";

// Dashboard & Order
import SellerDashboard from "./pages/SellerDashboard";
import SellerOrders from "./pages/SellerOrders";
import BuyerOrders from "./pages/BuyerOrders";
import OrderDetail from "./pages/OrderDetail";
// ❌ XÓA: import SellerStatistics from "./pages/SellerStatistics";

// Common
import PrivateRoute from "./components/common/PrivateRoute";
import PageWrapper from "./components/common/PageWrapper";
import AdminChat from "./components/chat/AdminChat";

export default function App() {
  const [selectedCategory, setSelectedCategory] = useState(null);
  const location = useLocation();

    useEffect(() => {
    document.title = "Trang chủ | UniTrade";
  }, []);

  return (
    <AuthProvider>
      
      {/* Sidebar */}
      <Sidebar
        selectedCategory={selectedCategory}
        setSelectedCategory={setSelectedCategory}
      />

      {/* Topbar */}
      <Topbar />

      {/* Routes */}
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          {/* Công khai */}
          <Route
            path="/"
            element={
              <PageWrapper>
                <Home selectedCategory={selectedCategory} />
              </PageWrapper>
            }
            
          />
          <Route
            path="/login"
            element={
              <PageWrapper>
                <Login />
              </PageWrapper>
            }
          />
          <Route
  path="/admin/users"
  element={
    <PrivateRoute>
      <PageWrapper>
        <AdminUsers />
      </PageWrapper>
    </PrivateRoute>
  }
/>
          <Route
            path="/register"
            element={
              <PageWrapper>
                <Register />
              </PageWrapper>
            }
          />
          <Route
            path="/products"
            element={
              <PageWrapper>
                <ProductGrid />
              </PageWrapper>
            }
          />
          <Route
            path="/products/:id"
            element={
              <PageWrapper>
                <ProductDetail />
              </PageWrapper>
            }
          />

          {/* Yêu cầu đăng nhập */}
          <Route
            path="/favorites"
            element={
              <PrivateRoute>
                <PageWrapper>
                  <Favorites />
                </PageWrapper>
              </PrivateRoute>
            }
          />

          {/* ❌ GỠ route giỏ hàng vì đã bỏ Cart.jsx theo phương án B */}
          {/* <Route
            path="/cart"
            element={
              <PrivateRoute>
                <PageWrapper>
                  <Cart />
                </PageWrapper>
              </PrivateRoute>
            }
          /> */}

          <Route
            path="/messages"
            element={
              <PrivateRoute>
                <PageWrapper>
                  <Messages />
                </PageWrapper>
              </PrivateRoute>
            }
          />
          <Route
            path="/myposts"
            element={
              <PrivateRoute>
                <PageWrapper>
                  <MyPosts />
                </PageWrapper>
              </PrivateRoute>
            }
          />
          <Route
            path="/post/create"
            element={
              <PrivateRoute>
                <PageWrapper>
                  <CreatePost />
                </PageWrapper>
              </PrivateRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <PrivateRoute>
                <PageWrapper>
                  <Profile />
                </PageWrapper>
              </PrivateRoute>
            }
          />

          {/* Seller routes */}
          <Route
            path="/seller/dashboard"
            element={
              <PrivateRoute>
                <PageWrapper>
                  <SellerDashboard />
                </PageWrapper>
              </PrivateRoute>
            }
          />
          <Route
            path="/seller/orders"
            element={
              <PrivateRoute>
                <PageWrapper>
                  <SellerOrders />
                </PageWrapper>
              </PrivateRoute>
            }
          />

          {/* ❌ GỠ route thống kê riêng — đã gộp vào Dashboard */}
          {/* <Route
            path="/seller/statistics"
            element={
              <PrivateRoute>
                <PageWrapper>
                  <SellerStatistics />
                </PageWrapper>
              </PrivateRoute>
            }
          /> */}

          {/* Buyer order history */}
          <Route
            path="/orders/buyer"
            element={
              <PrivateRoute>
                <PageWrapper>
                  <BuyerOrders />
                </PageWrapper>
              </PrivateRoute>
            }
          />
          <Route
            path="/orders/:id"
            element={
              <PrivateRoute>
                <PageWrapper>
                  <OrderDetail />
                </PageWrapper>
              </PrivateRoute>
            }
          />
        </Routes>
      </AnimatePresence>
<div className="flex flex-col min-h-screen"></div>
      {/* Footer */}
      <Footer />

      {/* Chat admin popup */}
      <AdminChat />
    </AuthProvider>
  );
}
