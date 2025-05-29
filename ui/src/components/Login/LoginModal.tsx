import React, { useState } from 'react';
import { signInWithPopup } from 'firebase/auth';
import { auth, googleProvider } from '../../config/firebase';
import './LoginModal.css';

interface LoginModalProps {
  onClose: () => void;
}

const LoginModal: React.FC<LoginModalProps> = ({ onClose }) => {
  const [error, setError] = useState<string | null>(null);

  const handleGoogleSignIn = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const idToken = await result.user.getIdToken();
      console.log("Firebase ID Token:", idToken);
      onClose();
    } catch (error) {
      setError('Failed to sign in with Google');
      console.error('Sign in error:', error);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <h2>Welcome to ChartChats</h2>
        <p>Please sign in to continue</p>
        <button className="google-button" onClick={handleGoogleSignIn}>
          <img 
            src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" 
            alt="Google" 
            className="google-icon"
          />
          Sign in with Google
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