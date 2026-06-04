import { Accordion, IAccordionOptions, Item } from "devextreme-react/accordion";
import { ReactNode } from "react";

export interface IAccordion extends IAccordionOptions<any, any> {
  title: string;
  collapsible?: boolean;
  width?: number;
  height?: number;
  children: ReactNode;
  defaultSelectedIndex?: number;
}

export const DXAccordion = (props: IAccordion) => {
  const {
    title,
    collapsible = true,
    width,
    height,
    children,
    defaultSelectedIndex = 0,
    ...rest
  } = props;

  return (
    <Accordion
      height={height}
      width={width}
      collapsible={collapsible}
      defaultSelectedIndex={defaultSelectedIndex}
      {...rest}
    >
      <Item title={title}>{children}</Item>
    </Accordion>
  );
};
