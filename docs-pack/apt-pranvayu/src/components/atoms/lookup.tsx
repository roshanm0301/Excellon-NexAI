import { useState } from "react";
import { Lookup, DropDownOptions, ILookupOptions } from "devextreme-react/lookup";

export interface ILookup extends ILookupOptions {
  items: any[];
  defaultValue: any;
  label: string;
  displayExpr: string;
  valueExpr: string;
  callBack: (value: any) => void;
}

export const DXLookup = (props: ILookup) => {
  const {
    items = [],
    defaultValue = null,
    label = "label",
    displayExpr = "name",
    valueExpr = "name",
    callBack,
    ...rest
  } = props;

  const [value, setValue] = useState<any>(defaultValue);

  const onValueChange = (newValue: any) => {
    setValue(newValue);
    callBack(newValue);
  };

  return (
    <Lookup
      items={items}
      value={value}
      onValueChange={onValueChange}
      label={label}
      displayExpr={displayExpr}
      valueExpr={valueExpr}
      {...rest}
    >
      <DropDownOptions
        showTitle={false}
        showCloseButton={false}
        hideOnOutsideClick={true}
      />
    </Lookup>
  );
};
