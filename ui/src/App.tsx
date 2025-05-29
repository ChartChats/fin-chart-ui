import React, { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Provider } from 'react-redux';
import { store } from './store';
import { ThemeProvider } from "@/contexts/ThemeContext";
import Dashboard from "./pages/Dashboard";
import NotFound from "./pages/NotFound";
import LoginModal from "./components/Login/LoginModal";
import { auth } from "./config/firebase";
import { onAuthStateChanged } from "firebase/auth";

function App() {
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setIsAuthenticated(!!user);
      setShowLoginModal(!user);
    });

    return () => unsubscribe();
  }, []);

  return (
    <Provider store={store}>
      <ThemeProvider>
        <BrowserRouter>
          {
            showLoginModal &&
            !isAuthenticated &&
            <LoginModal
              onClose={ () => setShowLoginModal(false) }
            />
          }
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </ThemeProvider>
    </Provider>
  );
}

export default App;