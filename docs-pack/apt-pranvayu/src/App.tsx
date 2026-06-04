import "devextreme/dist/css/dx.common.css";
import "./dx-styles.scss";
import "./styles/tables.scss";
import "./styles/settings.scss";
import "./themes/generated/theme.additional.css";
import "./themes/generated/theme.base.css";
import "./styles/_vscode-dark-overrides.scss";

import React, { useEffect, useState } from "react";
import { BrowserRouter as Router } from "react-router-dom";
import Content from "./Content";
import UnauthenticatedContent from "./UnauthenticatedContent";
import Loader from "./components/atoms/loader/loader";
import Notification from "./components/atoms/notification";
import { ToastProvider } from "./components/ui/Toast/Toast";
import CommandPalette from "./components/ui/CommandPalette/CommandPalette";
import { ThemeProvider } from "./contexts/ThemeContext";
import { pranwayuDefaultConfig } from "./config";
import { getMenuBySubscriptionId, selectedSubscription } from "./redux/actions";
import { checkOidcSession } from './redux/actions/oidcAuthActions';
import { useAppDispatch, useAppSelector } from "./store/customHooks";
import { getLocalData, setLocalData } from "./utility/utils";
import { useScreenSizeClass } from "./utils/media-query";

const App = React.memo(() => {
  const dispatch = useAppDispatch()
  // Legacy user (password flow) & new OIDC user
  const legacyUser = useAppSelector((state) => state.auth.userData);
  const oidcUser = useAppSelector((state) => state.oidcAuth.user);
  const oidcLoading = useAppSelector((state) => state.oidcAuth.loading);
  const [bootstrapped, setBootstrapped] = useState(false);

  // Bootstrap session once on mount if no legacy user present
  useEffect(() => {
    if (!legacyUser && !oidcUser) {
      (async () => {
        await dispatch<any>(checkOidcSession());
        setBootstrapped(true);
      })();
    } else {
      setBootstrapped(true);
    }
  }, [legacyUser, oidcUser, dispatch]);

  // Additional check: if we have user in Redux but no token in localStorage, clear the user
  useEffect(() => {
    const hasUser = legacyUser || oidcUser;
    if (hasUser) {
      const oidcToken = localStorage.getItem('OIDC_TOKEN');
      const legacyToken = localStorage.getItem('WHO_AMI_DATA');
      
      if (!oidcToken && !legacyToken) {
        // This will trigger a re-render and redirect to UnauthenticatedContent
        dispatch({ type: 'OIDC_AUTH_CLEAR' });
        dispatch({ type: 'USER_LOGIN_FAILED' });
      }
    }
  }, [legacyUser, oidcUser, dispatch]);

  // Listen for localStorage changes (when user manually clears it)
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'OIDC_TOKEN' || e.key === 'WHO_AMI_DATA') {
        if (e.newValue === null && (oidcUser || legacyUser)) {
          dispatch({ type: 'OIDC_AUTH_CLEAR' });
          dispatch({ type: 'USER_LOGIN_FAILED' });
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [oidcUser, legacyUser, dispatch]);

  // Request fullscreen on first user gesture after login
  useEffect(() => {
    const activeUser = legacyUser || oidcUser;
    if (!activeUser) return;

    const enterFullscreen = () => {
      if (document.documentElement.requestFullscreen && !document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(() => {});
      }
      document.removeEventListener('click', enterFullscreen);
      document.removeEventListener('keydown', enterFullscreen);
    };

    document.addEventListener('click', enterFullscreen, { once: true });
    document.addEventListener('keydown', enterFullscreen, { once: true });

    return () => {
      document.removeEventListener('click', enterFullscreen);
      document.removeEventListener('keydown', enterFullscreen);
    };
  }, [legacyUser, oidcUser]);

  useEffect(() => {
    const activeUser = legacyUser || oidcUser;
    if (activeUser) {
      // Ensure CONFIG_DATA exists in localStorage with default subscription
      let configData = getLocalData("CONFIG_DATA");
      if (!configData) {
        configData = pranwayuDefaultConfig;
        setLocalData("CONFIG_DATA", configData);
        dispatch({ type: "CONFIG_DATA", payload: configData });
      }
      
      // Set the selected subscription in Redux state
      const defaultSubscription = {
        id: configData.Subscription,
        SystemName: "Default Subscription"
      };
      dispatch(selectedSubscription(defaultSubscription));
      
      // Fetch menu - subscription will be automatically added to headers via API interceptor
      dispatch(getMenuBySubscriptionId(null));
    }
  }, [legacyUser, oidcUser, dispatch]);

  if ((legacyUser || oidcUser)) {
    return <Content />;
  }

  // While bootstrapping session show minimal placeholder (Loader component already global)
  if (!bootstrapped || oidcLoading) {
    return <div className="session-initializing">Initializing session...</div>;
  }

  return <UnauthenticatedContent />;
});


export default function Root() {
  const screenSizeClass = useScreenSizeClass();
  return (
    <Router>
      <ThemeProvider>
        <ToastProvider>
          <div className={`app ${screenSizeClass}`}>
            <App />
            <CommandPalette />
          </div>
          <Loader />
          <Notification />
        </ToastProvider>
      </ThemeProvider>
    </Router>
  );
}
