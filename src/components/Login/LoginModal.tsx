import React, { useState } from 'react';
import { signInWithPopup } from 'firebase/auth';
import { auth, googleProvider } from '@/config/firebase';
import { Spin } from 'antd';
import './LoginModal.css';

interface LoginModalProps {
  onClose: () => void;
}

const LoginModal: React.FC<LoginModalProps> = ({ onClose }) => {
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      const token = await user.getIdToken(true);
      
      // Store token and user info
      localStorage.setItem('token', token);
      localStorage.setItem(
        'user',
        JSON.stringify({
          email: user.email,
          displayName: user.displayName,
          photoURL: user.photoURL,
        })
      );

      onClose();
    } catch (error: any) {
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2>Welcome to ChartChats</h2>
        <p>Please sign in to continue</p>
        <button className="google-button" onClick={handleGoogleSignIn} disabled={isLoading}>
          {
            isLoading
              ? <Spin size="small" />
              : (
                  <>
                    <img src="https://www.google.com/favicon.ico" alt="Google" className="google-icon" />
                    Sign in with Google
                  </>
                )
          }
        </button>
        {
          error &&
          <p className="error-message">
            { error }
          </p>
        }
      </div>
    </div>
  );
};

export default LoginModal;
