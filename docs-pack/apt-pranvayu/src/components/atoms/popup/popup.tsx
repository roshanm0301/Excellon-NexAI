import { DXButton } from "../button";
import "./popup.css";

export const DXPopupForDefinition = (props: any) => {
  const { isOpen, onClose,height, children } = props;
  return (
    <div style={{height:height}} className={`bottom-popup ${isOpen ? "open" : ""}`}>
      <DXButton
        text=""
        className="close-button sticky-button"
        onClick={onClose}
        icon="close"
      />
      <div className="popup-container">{children}</div>
    </div>
  );
};
