import CheckBox, { ICheckBoxOptions } from 'devextreme-react/check-box';

interface ICheckBox extends ICheckBoxOptions {
  text: string;
  value: boolean;
  onValueChanged: (value: any) => void;
}

export function DXCheckbox(props: ICheckBox) {
  const { text, value, onValueChanged, ...rest } = props;

  return (
    <CheckBox
      text={text}
      value={value}
      onValueChange={onValueChanged}
      {...rest}
    />
  );
}