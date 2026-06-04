import { ButtonGroup, IButtonGroupOptions } from 'devextreme-react/button-group';
import { ClickEvent } from 'devextreme/ui/button';
import { ButtonStyle, ItemClickEvent } from 'devextreme/ui/button_group';

interface IGroupButton extends IButtonGroupOptions {
  items: any[];
  keyExpr?: string;
  onClick?: (e: ClickEvent | any) => void;
  stylingMode?: ButtonStyle;
  selectedItemKeys?: any[];
  onItemClick?: (e: ItemClickEvent) => void;
  icon?: string;
  text?: string;
}

export const DXGroupButton = (props: IGroupButton) => {
  const { items, keyExpr, stylingMode, selectedItemKeys, onItemClick, ...rest } = props;

  return (
    <ButtonGroup
      items={items}
      keyExpr={keyExpr}
      stylingMode={stylingMode}
      selectedItemKeys={selectedItemKeys}
      onItemClick={onItemClick}
      {...rest}
    />
  );
};