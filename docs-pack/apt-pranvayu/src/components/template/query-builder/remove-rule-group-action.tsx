import React from "react";

import { ActionProps } from "react-querybuilder";
import { DXButton } from "../../atoms";

export const RemoveRuleAndGroupAction = React.memo((props: ActionProps) => {

  const handleOnClick = (e: any) => {
    props.handleOnClick(e.event);
  };

  return (
    <DXButton
      className={props.className}
      text={""}
      icon="remove"
      onClick={handleOnClick}
      width={'auto'}
      type='default'
    />
  );
});
