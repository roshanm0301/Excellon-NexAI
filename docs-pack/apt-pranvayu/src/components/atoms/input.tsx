import TextBox, { ITextBoxOptions } from "devextreme-react/text-box";
import { TextBoxType } from "devextreme/ui/text_box";
import { Button as TextBoxButton } from 'devextreme-react/text-box';

interface IInput extends ITextBoxOptions {
  type?: TextBoxType;
  value?: string;
  defaultValue?: string;
  onChange: (value: any) => void;
  label?: string;
  stylingMode?: 'outlined' | 'underlined' | 'filled';
  required?: boolean;
  options?: Record<string, any>;
  showIcon?: boolean;
}

export const DXInput = (props: IInput) => {
  const {
    type = "text",
    value = "",
    defaultValue,
    onChange,
    label = "Name",
    stylingMode = "outlined",
    options,
    showIcon = false,
    ...rest
  } = props;

  return (
    <TextBox
      mode={type}
      value={value}
      label={label}
      defaultValue={defaultValue}
      onValueChange={onChange}
      stylingMode={stylingMode}
      {...rest}
    >
      {showIcon && (
        <TextBoxButton
          name="button"
          location="after"
          options={options}
        />
      )}
    </TextBox>
  );
};
