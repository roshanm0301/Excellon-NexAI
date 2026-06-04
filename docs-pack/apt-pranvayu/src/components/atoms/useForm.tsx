import { Form, IFormOptions } from "devextreme-react/form";

interface IForm extends IFormOptions {
  items?: any;
  formData?: any;
  onFormDataChange?: (value: any) => void;
  children?: React.ReactNode;
  ref?: any;
  colCount?: number;
  labelMode?: 'static' | 'floating' | 'hidden';
  labelLocation?: 'left' | 'top' | 'right';
  scrollingEnabled?: boolean;
  defaultFormData?: any;
  cssClass?: string;
  stylingMode?: string;
}

export function DXForm(props: IForm) {
  const {
    items,
    formData,
    ref,
    onFormDataChange,
    children,
    defaultFormData = {},
    colCount = 1,
    labelMode = "floating",
    labelLocation = "top",
    scrollingEnabled = true,
    ...rest
  } = props;

  return (
    <Form
      formData={formData || defaultFormData}
      colCount={colCount}
      labelMode={labelMode}
      ref={ref}
      labelLocation={labelLocation}
      items={items}
      onFormDataChange={onFormDataChange}
      scrollingEnabled={scrollingEnabled}
      {...rest}
    >
      {children}
    </Form>
  );
}
