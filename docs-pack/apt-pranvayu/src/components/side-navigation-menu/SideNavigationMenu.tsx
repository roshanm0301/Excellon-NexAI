import TreeView from 'devextreme-react/tree-view';
import React, { useCallback, useEffect, useRef } from 'react';
import ApprovalIcon from "../../assets/approval.svg";
import ApplicationIcon from "../../assets/icon-application.svg";
import ProviderIcon from "../../assets/icon-provider.svg";
import RequestIcon from "../../assets/icon-pull-request.svg";
import SchemaIcon from "../../assets/icon-scheme.svg";
import TenantIcon from "../../assets/icon-tenant.svg";
import SilverSchemaIcon from "../../assets/icon-silver.svg";
import GoldSchemaIcon from "../../assets/icon-gold.svg";
import WorkflowStudioIcon from "../../assets/icon-workflow.svg";
import { useAppSelector } from "../../store/customHooks";
import type { SideNavigationMenuProps } from '../../types';
import { useScreenSize } from '../../utils/media-query';
import './SideNavigationMenu.scss';
import * as events from 'devextreme/events';

const ICON_MAP: Record<string, string> = {
  SchemaIcon: SchemaIcon,
  TenantIcon: TenantIcon,
  ApprovalIcon: ApprovalIcon,
  RequestIcon: RequestIcon,
  ApplicationIcon: ApplicationIcon,
  ProviderIcon: ProviderIcon,
  WorkflowIcon: WorkflowStudioIcon,
  SilverSchemaIcon: SilverSchemaIcon,
  GoldSchemaIcon: GoldSchemaIcon,
  TemplateIcon: WorkflowStudioIcon,
};

export default function SideNavigationMenu(props: React.PropsWithChildren<SideNavigationMenuProps>) {
  const {
    children,
    selectedItemChanged,
    openMenu,
    compactMode,
    onMenuReady
  } = props;

  const { isLarge } = useScreenSize();
  const isManagementUser = useAppSelector((state) => state.auth.isManagementUser);
  const navigationList = useAppSelector((state) => state.role.navigationList);
  const currentPath = useAppSelector((state: any) => state.navigation.currentPath);

  const resolvedNavigation = navigationList?.length > 0
    ? navigationList.map((item: any) => ({
        ...item,
        icon: ICON_MAP[item.icon] ?? item.icon,
      }))
    : [];

  const filteredNavigation = resolvedNavigation.filter(
    (item: any) => isManagementUser || item.path !== "/user-management"
  );

  const items = filteredNavigation.map((item: any) => ({
    ...item,
    expanded: isLarge,
    path: item.path && !/^\//.test(item.path) ? `/${item.path}` : item.path,
  }));


  const treeViewRef = useRef<TreeView>(null);
  const wrapperRef = useRef<HTMLDivElement>();
  const getWrapperRef = useCallback((element: HTMLDivElement) => {
    const prevElement = wrapperRef.current;
    if (prevElement) {
      events.off(prevElement, 'dxclick');
    }

    wrapperRef.current = element;
    events.on(element, 'dxclick', (e: React.PointerEvent) => {
      openMenu(e);
    });
  }, [openMenu]);

  useEffect(() => {
    const treeView = treeViewRef.current && treeViewRef.current.instance;
    if (!treeView) {
      return;
    }

    if (currentPath !== undefined) {
      treeView.selectItem(currentPath);
      treeView.expandItem(currentPath);
    }

    if (compactMode) {
      treeView.collapseAll();
    }
  }, [currentPath, compactMode]);

  return (
    <div
      className={'dx-swatch-additional side-navigation-menu'}
      ref={getWrapperRef}
      data-compact={compactMode ? 'true' : 'false'}
    >
      {children}
      <div className={'menu-container'}>
        <TreeView
          ref={treeViewRef}
          items={items}
          keyExpr={'path'}
          selectionMode={'single'}
          focusStateEnabled={false}
          expandEvent={'click'}
          onItemClick={selectedItemChanged}
          onContentReady={onMenuReady}
          width={'100%'}
        />
      </div>
    </div>
  );
}
