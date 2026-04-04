import React, { createContext, useState, useContext, useEffect } from 'react';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [authState, setAuthState] = useState({
    user: null,
    token: null,
    isAuthenticated: false,
    isLoading: true,
  });

  useEffect(() => {
    const initializeAuth = () => {
      try {
        const token = localStorage.getItem('token');
        const userStr = localStorage.getItem('user');
        
        if (token && userStr) {
          const user = JSON.parse(userStr);
          setAuthState({
            user,
            token,
            isAuthenticated: true,
            isLoading: false,
          });
        } else {
          setAuthState(prev => ({ ...prev, isLoading: false }));
        }
      } catch (error) {
        console.error('خطأ في تحميل بيانات المصادقة:', error);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setAuthState({
          user: null,
          token: null,
          isAuthenticated: false,
          isLoading: false,
        });
      }
    };

    initializeAuth();
  }, []);

  const login = (userData, token) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    
    setAuthState({
      user: userData,
      token,
      isAuthenticated: true,
      isLoading: false,
    });
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    
    setAuthState({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
    });
  };

  const updateUser = (updatedUserData) => {
    const currentUser = { ...authState.user, ...updatedUserData };
    localStorage.setItem('user', JSON.stringify(currentUser));
    
    setAuthState(prev => ({
      ...prev,
      user: currentUser,
    }));
  };

  const value = {
    ...authState,
    login,
    logout,
    updateUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth يجب استخدامه داخل AuthProvider');
  }
  return context;
};