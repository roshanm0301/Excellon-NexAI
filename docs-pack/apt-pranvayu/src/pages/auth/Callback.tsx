import React, { useEffect, useState } from 'react';
import { useAppDispatch } from '../../store/customHooks';
import { handleCallback } from '../../redux/actions/oidcAuthActions';
import { useNavigate } from 'react-router-dom';

const Callback = () => {
    const dispatch = useAppDispatch();
    const navigate = useNavigate();
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const processCallback = async () => {
            try {
                const user = await dispatch<any>(handleCallback());
                if (user) {
                    // Navigate to dashboard after successful authentication
                    // The App.tsx will switch to Content component which will load the menu
                    navigate('/dashboard', { replace: true });
                } else {
                    setError('Authentication failed - no user returned');
                    setTimeout(() => navigate('/login'), 2000);
                }
            } catch (error: any) {
                console.error('Callback processing error', error);
                setError(error?.message || 'Authentication failed');
                setTimeout(() => navigate('/login'), 2000);
            }
        };

        processCallback();
    }, [dispatch, navigate]);

    if (error) {
        return (
            <div style={{ padding: '20px', textAlign: 'center' }}>
                <p>Error: {error}</p>
                <p>Redirecting to login...</p>
            </div>
        );
    }

    return (
        <div style={{ padding: '20px', textAlign: 'center' }}>
            <p>Processing authentication...</p>
        </div>
    );
};

export default Callback;
