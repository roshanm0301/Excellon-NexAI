import { Accordion } from "devextreme-react";
import React from "react";
import { IAccordion } from "../atoms";

export function AccordionGroupTemplate(props: IAccordion) {
  const {
    dataSource = [],
    selectedItems = [],
    collapsible = false,
    multiple = false,
    id,
    ...rest
  } = props;

  return (
    <Accordion
      // itemTitleRender={""}
      // itemRender={itemRender}
      dataSource={dataSource}
      collapsible={collapsible}
      multiple={multiple}
      id={id}
      selectedItems={selectedItems}
      {...rest}
    />
  );
}
