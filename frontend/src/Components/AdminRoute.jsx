    import { Navigate } from 'react-router-dom';
    import { useState, useEffect } from 'react';
    import API from '../api';

    export default function AdminRoute({ children }) {
    const [isAdmin, setIsAdmin] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        checkAdminStatus();
    }, []);

    const checkAdminStatus = async () => {
        try {
        const token = localStorage.getItem('token');
        if (!token) {
            setIsAdmin(false);
            setLoading(false);
            return;
        }

        const response = await API.get('/users/profile');
        setIsAdmin(response.data.user?.role === 'admin');
        } catch (error) {
        console.error('Error checking admin status:', error);
        setIsAdmin(false);
        } finally {
        setLoading(false);
        }
    };

    if (loading) {
        return (
        <div className="min-h-screen flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-900"></div>
        </div>
        );
    }

    return isAdmin ? children : <Navigate to="/login" />;
    }