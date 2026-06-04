import ContextMenu, { Position } from 'devextreme-react/context-menu';
import List from 'devextreme-react/list';
import { useCallback, useMemo } from 'react';
import { useNavigate } from "react-router-dom";
import { oidcLogout } from '../../../redux/actions/oidcAuthActions';
import { useAppDispatch } from '../../../store/customHooks';
import type { UserPanelProps } from '../../../types';
import defaultUser from '../../../utils/default-user';
import './UserPanel.scss';
import { localDataKey, removeLocalData } from '../../../utility/utils';

export default function UserPanel({ menuMode }: UserPanelProps) {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  const signOut = useCallback(() => {
    dispatch(oidcLogout())
     removeLocalData(localDataKey);
    navigate(`/landing-page`);
  }, []);

  const menuItems = useMemo(() => ([
    {
      text: 'Profile',
      icon: 'user',
      onClick: () => navigate("/profile"),
    },
    {
      text: 'Change Password',
      icon: 'lock',
      onClick: () => navigate("/change-password"),
    },
    {
      text: 'Logout',
      icon: 'runner',
      onClick: signOut,
    }
  ]), [signOut, navigate]);

  return (
    <div className={'user-panel'}>
      <div className={'user-info'}>
        <div className={'image-container'}>
          <div
            style={{
              background: `url(${defaultUser!.avatarUrl}) no-repeat var(--bg-tertiary)`,
              backgroundSize: 'cover'
            }}
            className={'user-image'} />
        </div>
      </div>

      {menuMode === 'context' && (
        <ContextMenu
          items={menuItems}
          target={'.user-button'}
          showEvent={'dxclick'}
          width={210}
          cssClass={'user-menu'}
        >
          <Position my={'top center'} at={'bottom center'} />
        </ContextMenu>
      )}
      {menuMode === 'list' && (
        <List className={'dx-toolbar-menu-action'} items={menuItems} />
      )}
    </div>
  );
}
