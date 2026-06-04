import SelectBox, { ISelectBoxOptions } from "devextreme-react/select-box";
import { ChangeEvent } from "devextreme/ui/select_box";

interface ISelectBox extends ISelectBoxOptions {
  items: any[];
  value: any;
  onValueChange: (e: ChangeEvent | any) => void;
  stylingMode?: 'outlined' | 'underlined' | 'filled';
  displayExpr?: string;
  valueExpr?: string;
  required?: boolean;
  label?: string;
}

export const DXSelect = (props: ISelectBox) => {
  const {
    items = [],
    value = "",
    stylingMode = "outlined",
    onValueChange,
    displayExpr,
    valueExpr,
    label,
    searchEnabled = true,
    ...rest
  } = props;

  return (
    <SelectBox
      items={items}
      value={value}
      onValueChange={onValueChange}
      stylingMode={stylingMode}
      displayExpr={displayExpr}
      valueExpr={valueExpr}
      label={label}
      searchEnabled={searchEnabled}
      {...rest}
    />
  );
};
