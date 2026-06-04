import { Switch } from "devextreme-react";
import Button from "devextreme-react/button";
import Toolbar, { Item } from "devextreme-react/toolbar";
import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { useTheme } from "../../contexts/ThemeContext";
import UserPanel from "../../components/template/user-panel/UserPanel";
import {
  GetAppVersion,
  GetSubscriptionByIdentity,
  SelectedItems,
  getMenuBySubscriptionId,
  getUserByIdentityId,
  selectedSubscription,
  selectedVersionAPI,
  setSelectedItemId,
  subscriptionChange,
  useSelection,
} from "../../redux/actions";
import { useAppDispatch, useAppSelector } from "../../store/customHooks";
import type { HeaderProps } from "../../types";
import { getLocalData, setLocalData } from "../../utility/utils";
import "./Header.scss";
import SelectSubscription from "./selectSubscription";
import ShowNotification from "./showNotification";
import ShowNotificationForClone from "./showNotificationForClone";
import SelectVersionComponent from "./selectVersion";

const Header = ({ menuToggleEnabled, title, toggleMenu }: HeaderProps) => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { isDark, toggle: toggleTheme } = useTheme();
  const [isFullScreen, setIsFullScreen] = useState(!!document.fullscreenElement);

  const onThemeToggle = useCallback(() => {
    toggleTheme();
  }, [toggleTheme]);

  const toggleFullScreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  }, []);

  useEffect(() => {
    const onFsChange = () => setIsFullScreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', onFsChange);
    return () => document.removeEventListener('fullscreenchange', onFsChange);
  }, []);
  let { subscriptionListByIdentity, selectedVersion, getAppVersion } = useAppSelector((state) => state.subscription);
  let userData = useAppSelector((state) => state.auth.userData);
  let navigationList = useAppSelector((state) => state.role.navigationList);
  let { isProduct, config } = useAppSelector((state) => state.auth);
  let { user } = useAppSelector((state) => state.oidcAuth);
  const [subscription, setSubscription] = useState("");
  const [subscriptionList, setSubscriptionList] = useState([]);
  const [hintMessage, setHintMessage] = useState("Developer Mode");
  const _version = config?.BASE_URL?.match(/\/(v\d+\.\d+)\//)?.[1];
  const [version, setVersion] = useState(selectedVersion);


  useEffect(() => {
    dispatch(selectedVersionAPI(_version));
    setVersion(_version)
  }, [config.BASE_URL])

  useEffect(() => {
    dispatch(GetAppVersion(null));
  }, [])

  useEffect(() => {
    const loggedInSubscription = getLocalData("CONFIG_DATA");
    let defaultSubscription: any = {};
    subscriptionListByIdentity?.map((item: any) => {
      if (item?.SystemName !== "") {
        if (item?.id === loggedInSubscription?.Subscription) {
          defaultSubscription = item;
        }
      }
    });
    let _subscriptionList: any = [];
    subscriptionListByIdentity?.map((item: any) => {
      if (item !== null) {
        return _subscriptionList?.push(item);
      }
    });
    setSubscriptionList(_subscriptionList);
    setSubscription(defaultSubscription?.SystemName);
    dispatch(selectedSubscription(defaultSubscription));
  }, [subscriptionListByIdentity]);

  useEffect(() => {
    (async () => {
      dispatch(GetSubscriptionByIdentity(null));
      const result: any = await dispatch(
        getUserByIdentityId(userData?.data?.IdentityId)
      );
      // setUserName(result?.FirstName + " " + result?.LastName);
    })();
  }, [userData]);

  useEffect(() => {
    const FetchData = async () => {
      dispatch(useSelection(user));
    };
    FetchData();
  }, [user]);

  const onValueChange = (e: any) => {
    const messageText = e === true ? "Contributor Mode" : "Developer Mode";
    setHintMessage(messageText);
    // setUser(!user);
  };

  const onSubscriptionChange = (item: any) => {
    let _defaultConfig = { ...config, Subscription: item.id };
    setLocalData("CONFIG_DATA", _defaultConfig);
    dispatch({ type: "CONFIG_DATA", payload: _defaultConfig });
    setSubscription(item.SystemName);
    dispatch(selectedSubscription(item));
    dispatch(subscriptionChange(true));
    dispatch(getMenuBySubscriptionId(null));
    dispatch(SelectedItems([]));
    dispatch(setSelectedItemId(null));
    navigate("/dashboard");
  };

  const onVersionChange = (item: any) => {
    const updatedBaseUrl = config?.BASE_URL?.replace(/v\d+\.\d+\//, `${item}/`);
    let _defaultConfig = { ...config, BASE_URL: updatedBaseUrl };
    setVersion(item)
    dispatch(selectedVersionAPI(item));
    setLocalData("CONFIG_DATA", _defaultConfig);
    dispatch({ type: "CONFIG_DATA", payload: _defaultConfig });
    navigate("/dashboard");
    globalThis.location.reload();
  }

  return (
    <header className={"header-component"}>
      <Toolbar className={"header-toolbar"}>
        <Item
          visible={menuToggleEnabled}
          location={"before"}
          widget={"dxButton"}
          cssClass={"menu-button"}
        >
          <Button icon="menu" stylingMode="text" onClick={toggleMenu} />
        </Item>
        <Item
          location={"before"}
          cssClass={"header-title"}
          text={title}
          visible={!!title}
        />

        <Item visible={false} location={"after"}>
          <b className="header-mode-label">
            {user === true ? "Contributor Mode" : "Developer Mode"}
          </b>
        </Item>

        <Item location={"after"} locateInMenu={"auto"}>
          <b className="header-role-label">{navigationList[0]?.Role}</b>
        </Item>

        <Item visible={false} location={"after"} cssClass={"menu-button"}>
          <Switch
            hint={hintMessage}
            value={user}
            disabled={true}
            onValueChange={(e: any) => onValueChange(e)}
          />
        </Item>

        <Item
          location={"after"}
          visible={isProduct === "Pranwayu"}
          menuItemTemplate={"userPanelTemplate"}
        >
          <SelectSubscription
            subscription={subscription}
            subscriptions={subscriptionList}
            callback={onSubscriptionChange}
          />
        </Item>

        <Item
          location={"after"}
          locateInMenu={"auto"}
          menuItemTemplate={"userPanelTemplate"}
        >
          <SelectVersionComponent
            selectedVersion={version}
            callback={onVersionChange}
            versionList={getAppVersion ?? []}
          />
        </Item>

        <Item
          location={"after"}
          locateInMenu={"auto"}
          visible={isProduct === "Pranwayu"}
        >
          <ShowNotificationForClone />
        </Item>

        <Item location={"after"}>
          <ShowNotification />
        </Item>

        <Item location={"after"} locateInMenu={"auto"} cssClass={"theme-toggle-item"}>
          <button
            className="theme-toggle-btn"
            onClick={toggleFullScreen}
            title={isFullScreen ? 'Exit full screen' : 'Full screen'}
            aria-label={isFullScreen ? 'Exit full screen' : 'Full screen'}
          >
            {isFullScreen ? (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="4 14 4 20 10 20" />
                <polyline points="20 10 20 4 14 4" />
                <line x1="14" y1="10" x2="21" y2="3" />
                <line x1="3" y1="21" x2="10" y2="14" />
              </svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 3 21 3 21 9" />
                <polyline points="9 21 3 21 3 15" />
                <line x1="21" y1="3" x2="14" y2="10" />
                <line x1="3" y1="21" x2="10" y2="14" />
              </svg>
            )}
          </button>
        </Item>

        <Item location={"after"} cssClass={"theme-toggle-item"}>
          <button
            className={`theme-toggle-btn ${isDark ? 'is-dark' : 'is-light'}`}
            onClick={onThemeToggle}
            title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {isDark ? (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="5" />
                <line x1="12" y1="1" x2="12" y2="3" />
                <line x1="12" y1="21" x2="12" y2="23" />
                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                <line x1="1" y1="12" x2="3" y2="12" />
                <line x1="21" y1="12" x2="23" y2="12" />
                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
              </svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
              </svg>
            )}
          </button>
        </Item>

        <Item
          location={"after"}
          locateInMenu={"auto"}
          menuItemTemplate={"userPanelTemplate"}
        >
          <Button
            className={"user-button authorization"}
            hint={user?.user?.username}
            stylingMode={"text"}
          >
            <UserPanel menuMode={"context"} />
          </Button>
        </Item>
      </Toolbar>
    </header>
  );
};

export default Header;
