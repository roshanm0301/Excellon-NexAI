import { IRadioGroupOptions, RadioGroup } from 'devextreme-react/radio-group';

interface IRadioButton extends IRadioGroupOptions {
  items: any;
  className?: string;
  value: any;
  itemRender?: any;
  onValueChanged: (e: any) => void;
}

export function DXRadioGroup(props: IRadioButton) {
  const { className, items, value, itemRender, onValueChanged, ...rest } = props;

  return (
    <RadioGroup
      className={className}
      items={items}
      value={value}
      itemRender={itemRender}
      onValueChanged={onValueChanged}
      {...rest}
    />
  );
}