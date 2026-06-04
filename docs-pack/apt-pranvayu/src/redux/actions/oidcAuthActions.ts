import { AppDispatch, RootState } from '../../store/store';
import { authService } from '../../services/authService';
import { User } from 'oidc-client-ts';

export const OIDC_AUTH_SESSION_SUCCESS = 'OIDC_AUTH_SESSION_SUCCESS';
export const OIDC_AUTH_CLEAR = 'OIDC_AUTH_CLEAR';
export const OIDC_AUTH_LOADING = 'OIDC_AUTH_LOADING';
export const OIDC_AUTH_ERROR = 'OIDC_AUTH_ERROR';

export const checkOidcSession = () => async (dispatch: AppDispatch) => {
    dispatch({ type: OIDC_AUTH_LOADING, payload: true });
    try {
        const user: User | null = await authService.getUser();
        if (user && !user.expired) {
            dispatch({ type: OIDC_AUTH_SESSION_SUCCESS, payload: user });
            // Optionally set token in localStorage if needed by other parts of the app
            localStorage.setItem('OIDC_TOKEN', user.access_token);
            return user;
        } else {
            dispatch({ type: OIDC_AUTH_SESSION_SUCCESS, payload: null });
            return null;
        }
    } catch (e) {
        console.error('OIDC session check failed', e);
        dispatch({ type: OIDC_AUTH_ERROR, payload: e });
        return null;
    } finally {
        dispatch({ type: OIDC_AUTH_LOADING, payload: false });
    }
};

export const login = () => async () => {
    await authService.login();
};

export const oidcLogout = () => async (dispatch: AppDispatch) => {
    await authService.logout();
    dispatch({ type: OIDC_AUTH_CLEAR });
    localStorage.removeItem('OIDC_TOKEN');
};

export const refreshOidcSession = () => async (dispatch: AppDispatch) => {
    try {
        const user = await authService.signinSilent();
        if (user) {
            dispatch({ type: OIDC_AUTH_SESSION_SUCCESS, payload: user });
            localStorage.setItem('OIDC_TOKEN', user.access_token);
            return true;
        }
        return false;
    } catch (e) {
        console.error('Silent refresh failed', e);
        return false;
    }
};

export const handleCallback = () => async (dispatch: AppDispatch) => {
    dispatch({ type: OIDC_AUTH_LOADING, payload: true });
    try {
        const user = await authService.handleCallback();
        dispatch({ type: OIDC_AUTH_SESSION_SUCCESS, payload: user });
        localStorage.setItem('OIDC_TOKEN', user.access_token);
        return user;
    } catch (e) {
        console.error('OIDC callback handling failed', e);
        dispatch({ type: OIDC_AUTH_ERROR, payload: e });
        throw e;
    } finally {
        dispatch({ type: OIDC_AUTH_LOADING, payload: false });
    }
};
