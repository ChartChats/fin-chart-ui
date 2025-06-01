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
import {
  Spin
} from "antd";

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
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      setShowLoginModal(true);
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const token = await user.getIdToken(true);
        localStorage.setItem('token', token);
        await validateToken();
      } else {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setIsAuthenticated(false);
        setShowLoginModal(true);
        setIsLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

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
                isLoading
                  ? <Spin><Dashboard /></Spin>
                  : <Dashboard />
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
