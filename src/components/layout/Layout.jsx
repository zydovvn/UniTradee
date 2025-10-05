import { Routes, Route } from "react-router-dom";
import { useState } from "react";
import { AuthProvider } from "./context/AuthContext";

// Layout
import Topbar from "./components/layout/Topbar";
import Sidebar from "./components/layout/Sidebar";
import Footer from "./components/layout/Footer";

// Pages & Components
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Cart from "./pages/Cart";
import Messages from "./pages/Messages";
import MyPosts from "./pages/MyPosts";
import CreatePost from "./pages/CreatePost";
import Favorites from "./pages/Favorites";
import Profile from "./pages/Profile";
import ProductDetail from "./components/product/ProductDetail";
import ProductGrid from "./components/product/ProductGrid";

// Common
import PrivateRoute from "./components/common/PrivateRoute";

export default function App() {
  const [selectedCategory, setSelectedCategory] = useState(null);

  return (
    <AuthProvider>
      {/* Sidebar có thể toggle bên trái */}
      <Sidebar
        selectedCategory={selectedCategory}
        setSelectedCategory={setSelectedCategory}
      />

      {/* Topbar gộp Navbar + Header */}
      <Topbar />

      {/* Routes */}
      <Routes>
        <Route
          path="/"
          element={<Home selectedCategory={selectedCategory} />}
        />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        <Route path="/products" element={<ProductGrid />} />
        <Route path="/products/:id" element={<ProductDetail />} />

        <Route
          path="/favorites"
          element={
            <PrivateRoute>
              <Favorites />
            </PrivateRoute>
          }
        />

        <Route
          path="/cart"
          element={
            <PrivateRoute>
              <Cart />
            </PrivateRoute>
          }
        />

        <Route
          path="/messages"
          element={
            <PrivateRoute>
              <Messages />
            </PrivateRoute>
          }
        />

        <Route
          path="/myposts"
          element={
            <PrivateRoute>
              <MyPosts />
            </PrivateRoute>
          }
        />

        <Route
          path="/post/create"
          element={
            <PrivateRoute>
              <CreatePost />
            </PrivateRoute>
          }
        />

        <Route
          path="/profile"
          element={
            <PrivateRoute>
              <Profile />
            </PrivateRoute>
          }
        />
      </Routes>

      {/* Footer */}
      <Footer />
    </AuthProvider>
  );
}
