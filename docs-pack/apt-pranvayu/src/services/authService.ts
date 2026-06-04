import { UserManager, UserManagerSettings, User } from 'oidc-client-ts';

const oidcConfig: UserManagerSettings = {
    authority: 'https://rnd-pranvayu.excellonconnect.com/auth',
    client_id: 'pranvayu-local', // TODO: Make this configurable if needed
    redirect_uri: window.location.origin + '/callback',
    response_type: 'code',
    scope: 'openid profile email',
    post_logout_redirect_uri: window.location.origin + '/login',
    automaticSilentRenew: true,
    // silent_redirect_uri: window.location.origin + '/silent-renew.html', // Optional: for silent renew
};

class AuthService {
    private userManager: UserManager;

    constructor() {
        this.userManager = new UserManager(oidcConfig);
    }

    public getUser(): Promise<User | null> {
        return this.userManager.getUser();
    }

    public login(): Promise<void> {
        return this.userManager.signinRedirect();
    }

    public signinSilent(): Promise<User | null> {
        return this.userManager.signinSilent();
    }

    public logout(): Promise<void> {
        return this.userManager.signoutRedirect();
    }

    public async handleCallback(): Promise<User> {
        const user = await this.userManager.signinCallback();
        if (!user) {
            throw new Error('No user returned from signinCallback');
        }
        return user;
    }

    public getAccessToken(): Promise<string | null> {
        return this.userManager.getUser().then(user => {
            return user?.access_token || null;
        });
    }
}

export const authService = new AuthService();
