import {
    OIDC_AUTH_SESSION_SUCCESS,
    OIDC_AUTH_CLEAR,
    OIDC_AUTH_LOADING,
    OIDC_AUTH_ERROR
} from '../actions/oidcAuthActions';

export interface OidcAuthState {
    user: any | null;
    loading: boolean;
    error: string | null;
}

const initialState: OidcAuthState = {
    user: null,
    loading: false,
    error: null
};

const oidcAuthReducer = (state = initialState, action: any): OidcAuthState => {
    switch (action.type) {
        case OIDC_AUTH_SESSION_SUCCESS:
            return { ...state, user: action.payload };
        case OIDC_AUTH_LOADING:
            return { ...state, loading: action.payload };
        case OIDC_AUTH_ERROR:
            return { ...state, error: action.payload };
        case OIDC_AUTH_CLEAR:
            return initialState;
        default:
            return state;
    }
};

export default oidcAuthReducer;
