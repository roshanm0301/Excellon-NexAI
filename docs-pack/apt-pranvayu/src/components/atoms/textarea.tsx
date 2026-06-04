import { TextArea, ITextAreaOptions } from "devextreme-react/text-area";
import { ChangeEvent } from "devextreme/ui/text_area";

interface ITextArea extends ITextAreaOptions {
  name: string;
  onValueChange: (e: ChangeEvent | any) => void;
  value: string;
  autoResizeEnabled?: boolean;
  maxHeight?: number | string;
  minHeight?: number | string;
  spellcheck?: boolean;
  width?: number;
  height?: number;
  placeholder?: string;
  readOnly?: boolean;
}

export function DXTextArea(props: ITextArea) {
  const { name, value, onValueChange, height, width, ...rest } = props;

  return (
    <TextArea
      name={name}
      autoResizeEnabled
      value={value}
      onValueChange={onValueChange}
      height={height}
      width={width}
      minHeight="100"
      {...rest}
    />
  );
}
