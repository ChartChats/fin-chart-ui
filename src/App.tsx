import React, { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Provider } from 'react-redux';
import { store } from './store';
import { ThemeProvider } from "@/contexts/ThemeContext";
import Dashboard from "./pages/Dashboard";
import NotFound from "./pages/NotFound";
import LoginModal from "@/components/Login/LoginModal";
import { auth } from "./config/firebase";
import { onAuthStateChanged } from "firebase/auth";
import apiClient from "./store/client";
import { Spin } from "antd";

function App() {
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const validateToken = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No token found');
      }

      // Validate token with backend
      const response = await apiClient.get('/user/login');
      const { email, uuid } = response.data;

      const firebaseUser = auth.currentUser;
      localStorage.setItem('user', JSON.stringify({
        email,
        uuid,
        displayName: firebaseUser?.displayName,
        photoURL: firebaseUser?.photoURL,
      }));

      setIsAuthenticated(true);
      setShowLoginModal(false);
    } catch (error) {
      console.error('Token validation failed:', error);
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      setShowLoginModal(true);
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setIsAuthenticated(false);
    setShowLoginModal(true);
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const token = await user.getIdToken(true);
          localStorage.setItem('token', token);
          await validateToken();
        } catch (error) {
          console.error('Auth state change error:', error);
          handleLogout();
        }
      } else {
        handleLogout();
        setIsLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  // Don't render Dashboard until authentication is confirmed
  if (isLoading) {
    return (
      <Provider store={store}>
        <ThemeProvider>
          <div className="flex items-center justify-center h-screen">
            <Spin size="large" />
          </div>
        </ThemeProvider>
      </Provider>
    );
  }

  return (
    <Provider store={store}>
      <ThemeProvider>
        <BrowserRouter>
          {showLoginModal && !isAuthenticated && (
            <LoginModal onClose={() => setShowLoginModal(false)} />
          )}
          <Routes>
            <Route
              path="/"
              element={
                isAuthenticated ? (
                  <Dashboard />
                ) : (
                  <div className="flex items-center justify-center h-screen">
                    <Spin size="large" />
                  </div>
                )
              }
            />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </ThemeProvider>
    </Provider>
  );
}

export default App;