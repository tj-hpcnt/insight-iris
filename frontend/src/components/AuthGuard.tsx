import React, { useEffect, useState } from 'react';
import { useLocation, Navigate } from 'react-router-dom';

interface User {
  username: string;
  role: string;
}

interface AuthGuardProps {
  children: React.ReactNode;
  user: User | null;
  onSetUser: (user: User | null) => void;
}

const AuthGuard: React.FC<AuthGuardProps> = ({ children, user, onSetUser }) => {
  const [isLoading, setIsLoading] = useState(true);
  const location = useLocation();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/auth/me', {
          credentials: 'include',
        });

        if (response.ok) {
          const userData = await response.json();
          onSetUser(userData);
        } else {
          onSetUser(null);
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        onSetUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    if (!user) {
      checkAuth();
    } else {
      setIsLoading(false);
    }
  }, [user, onSetUser]);

  if (isLoading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh'
      }}>
        <div>Loading...</div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

export default AuthGuard; 