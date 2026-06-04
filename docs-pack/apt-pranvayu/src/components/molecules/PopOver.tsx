import { Popover } from "devextreme-react";
import React from "react";

export const DXPopover = React.memo((props: any) => {
  const { data = [], children, callback, target, position, title, showEvent, jsonData, item, width, height } = props;


  return (
    <Popover
      target={target}
      showEvent={showEvent}
      position={position}
      width={width}
      height={height}
    >
      {children}
    </Popover>
  );
});
