import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../store/customHooks';
import { refreshOidcSession, oidcLogout } from '../../redux/actions/oidcAuthActions';
import { showNotification } from '../../redux/actions/authAction';
import { setUnauthorizedErrorCallback, setUnauthorizedError } from '../../api/api';
import { Button } from 'devextreme-react/button';
import './AuthRouteGuard.scss';

interface AuthRouteGuardProps {
  children: React.ReactNode;
}

export const AuthRouteGuard: React.FC<AuthRouteGuardProps> = ({ children }) => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const oidcUser = useAppSelector((state) => state.oidcAuth.user);
  const legacyUser = useAppSelector((state) => state.auth.userData);
  const [showUnauthorizedModal, setShowUnauthorizedModal] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Check for valid token on mount and when user state changes
  useEffect(() => {
    const checkTokenValidity = () => {
      const hasUser = oidcUser || legacyUser;

      if (hasUser) {
        const oidcToken = localStorage.getItem('OIDC_TOKEN');
        const legacyToken = localStorage.getItem('WHO_AMI_DATA');

        if (!oidcToken && !legacyToken) {
          dispatch(oidcLogout());
          navigate('/landing-page');
        }
      }
    };

    checkTokenValidity();
  }, [oidcUser, legacyUser, dispatch, navigate]);

  // Set up callback for 401 errors
  useEffect(() => {
    setUnauthorizedErrorCallback(() => {
      setShowUnauthorizedModal(true);
    });

    return () => {
      setUnauthorizedErrorCallback(null);
    };
  }, []);

  // Periodic token check to catch localStorage clearing
  useEffect(() => {
    const tokenCheckInterval = setInterval(() => {
      const hasUser = oidcUser || legacyUser;
      if (hasUser) {
        const oidcToken = localStorage.getItem('OIDC_TOKEN');
        const legacyToken = localStorage.getItem('WHO_AMI_DATA');

        if (!oidcToken && !legacyToken) {
          dispatch(oidcLogout());
          navigate('/landing-page');
        }
      }
    }, 5000);

    return () => clearInterval(tokenCheckInterval);
  }, [oidcUser, legacyUser, dispatch, navigate]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      const success = await dispatch<any>(refreshOidcSession());
      if (success) {
        dispatch(showNotification({
          isOpen: true,
          message: 'Session refreshed successfully',
          type: 'success'
        }));
        setShowUnauthorizedModal(false);
        setUnauthorizedError(false);
      } else {
        dispatch(showNotification({
          isOpen: true,
          message: 'Failed to refresh session. Please login again.',
          type: 'error'
        }));
      }
    } catch {
      dispatch(showNotification({
        isOpen: true,
        message: 'Failed to refresh session. Please login again.',
        type: 'error'
      }));
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleClose = () => {
    setShowUnauthorizedModal(false);
    setUnauthorizedError(false);
  };

  return (
    <>
      {children}

      {showUnauthorizedModal && (
        <div className="auth-guard-overlay" role="dialog" aria-modal="true" aria-labelledby="session-expired-title">
          <div className="auth-guard-modal">
            <h4 id="session-expired-title" className="auth-guard-title">
              Session Expired
            </h4>
            <p className="auth-guard-message">
              Your session has expired. Please refresh your session to continue.
            </p>
            <div className="auth-guard-actions">
              <Button
                text="Refresh Session"
                type="default"
                onClick={handleRefresh}
                disabled={isRefreshing}
                icon="refresh"
              />
              <Button
                text="Close"
                type="normal"
                onClick={handleClose}
                disabled={isRefreshing}
              />
            </div>
            {isRefreshing && (
              <p className="auth-guard-refreshing">Refreshing session...</p>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default AuthRouteGuard;
