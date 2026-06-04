import Button, { IButtonOptions } from "devextreme-react/button";
import { ButtonStyle, ButtonType, ClickEvent } from "devextreme/ui/button";

interface IButton extends IButtonOptions {
  text: string;
  onClick?: (e: ClickEvent | any) => void;
  stylingMode?: ButtonStyle;
  icon?: string;
  type?: ButtonType;
  id?: string;
}

export const DXButton = (props: IButton) => {
  const {
    text = "button",
    stylingMode = "outlined",
    icon = "",
    onClick,
    type = "normal",
    id,
    ...rest
  } = props;

  return (
    <Button
      {...rest}
      id={id}
      text={text}
      onClick={onClick}
      type={type}
      stylingMode={stylingMode}
      icon={icon}
    />
  );
};
