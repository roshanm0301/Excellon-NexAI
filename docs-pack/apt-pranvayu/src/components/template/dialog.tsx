import Popup, { IPopupOptions } from "devextreme-react/popup";

export interface IPopup extends IPopupOptions {
  width?: number | string | (() => number | string)
  title: string
  height?: number | string | (() => number | string)
  visible: any
  onHiding: any
  children?: any
  hideOnOutsideClick?: boolean
}

export function DXPopup(props: IPopup) {
  const { width = 660, title, height = 540, visible, onHiding, children, hideOnOutsideClick = false,showCloseButton=true,showTitle=true, ...rest } = props;

  return (
    <Popup
      onHiding={onHiding}
      visible={visible}
      title={title}
      dragEnabled={false}
      hideOnOutsideClick={hideOnOutsideClick}
      width={width}
      height={height}
      showTitle={showTitle}
      showCloseButton={showCloseButton}
      {...rest}
    >
      {children}
    </Popup>
  );
}
