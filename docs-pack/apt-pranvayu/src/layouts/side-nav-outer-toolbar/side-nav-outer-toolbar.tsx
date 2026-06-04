import Drawer from "devextreme-react/drawer";
import ScrollView from "devextreme-react/scroll-view";
import React, { useState, useCallback, useRef,useEffect } from "react";
import { useNavigate } from "react-router";
import { SideNavigationMenu } from "../../components";
import Header from "../../pages/header/Header";
import Footer from "../../pages/footer/Footer";
import "./side-nav-outer-toolbar.scss";
import { useScreenSize } from "../../utils/media-query";
import { Template } from "devextreme-react/core/template";
import { useMenuPatch } from "../../utils/patches";
import { ClickEvent } from "devextreme/ui/button";
import { ItemClickEvent } from "devextreme/ui/tree_view";
import type { SideNavToolbarProps } from "../../types";
import { useAppSelector } from "../../store/customHooks";

export default function SideNavOuterToolbar({
  title,
  children,
}: React.PropsWithChildren<SideNavToolbarProps>) {
  const scrollViewRef = useRef<ScrollView>(null);
  const navigate = useNavigate();
  const { isXSmall, isLarge } = useScreenSize();
  const [patchCssClass, onMenuReady] = useMenuPatch();
  const [menuStatus, setMenuStatus] = useState(
    MenuStatus.Closed
  );

  let currentPath = useAppSelector((state) => state.navigation.currentPath);

  useEffect(() => {
    if (currentPath.includes('action') || currentPath.includes('workflow-editor')) {
      setMenuStatus(MenuStatus.Closed)
    }
  }, [currentPath])

  const toggleMenu = useCallback(({ event }: ClickEvent) => {
    setMenuStatus((prevMenuStatus) =>
      prevMenuStatus === MenuStatus.Closed
        ? MenuStatus.Opened
        : MenuStatus.Closed
    );
    event?.stopPropagation();
  }, []);

  const temporaryOpenMenu = useCallback(() => {
    setMenuStatus((prevMenuStatus) =>
      prevMenuStatus === MenuStatus.Closed
        ? MenuStatus.TemporaryOpened
        : prevMenuStatus
    );
  }, []);

  const onOutsideClick = useCallback(() => {
    setMenuStatus((prevMenuStatus) =>
      prevMenuStatus !== MenuStatus.Closed && !isLarge
        ? MenuStatus.Closed
        : prevMenuStatus
    );
    return menuStatus === MenuStatus.Closed ? true : false;
  }, [isLarge]);

  const onNavigationChanged = useCallback(
    ({ itemData, event, node }: ItemClickEvent) => {
      if (
        menuStatus === MenuStatus.Closed ||
        !itemData?.path
        //  || node?.selected
      ) {
        event?.preventDefault();
        return;
      }

      navigate(itemData.path);
      scrollViewRef.current?.instance.scrollTo(0);

      if (!isLarge || menuStatus === MenuStatus.TemporaryOpened) {
        setMenuStatus(MenuStatus.Closed);
        event?.stopPropagation();
      }
    },
    [navigate, menuStatus, isLarge]
  );

  return (
    <div className={"side-nav-outer-toolbar"}>
      <Header menuToggleEnabled toggleMenu={toggleMenu} title={title} />
      <Drawer
        className={["drawer", patchCssClass].join(" ")}
        position={"before"}
        closeOnOutsideClick={onOutsideClick}
        openedStateMode={isLarge ? "shrink" : "overlap"}
        revealMode={isXSmall ? "slide" : "expand"}
        minSize={isXSmall ? 0 : 52}
        maxSize={250}
        shading={isLarge ? false : true}
        opened={menuStatus === MenuStatus.Closed ? false : true}
        template={"menu"}
      >
        <div className={"container"}>
          <ScrollView
            useNative={false}
            scrollByContent={true}
            bounceEnabled={false}
            ref={scrollViewRef}
            className={"layout-body with-footer"}
          >
            <div className={"content"}>
              {React.Children.map(children, (item: any) => {
                return item.type !== Footer && item;
              })}
            </div>
            {/* <div className={"content-block"}>
              {React.Children.map(children, (item: any) => {
                return item.type === Footer && item;
              })}
            </div> */}
          </ScrollView>
        </div>
        <Template name={"menu"}>
          <SideNavigationMenu
            compactMode={menuStatus === MenuStatus.Closed}
            selectedItemChanged={onNavigationChanged}
            openMenu={temporaryOpenMenu}
            onMenuReady={onMenuReady}
          ></SideNavigationMenu>
        </Template>
      </Drawer>
    </div>
  );
}

const MenuStatus = {
  Closed: 1,
  Opened: 2,
  TemporaryOpened: 3,
};
