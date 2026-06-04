import React from "react";

import { ActionWithRulesAndAddersProps } from "react-querybuilder";
import { DXButton } from "../../atoms";

export const RuleAndGroupAction = React.memo(
  (props: ActionWithRulesAndAddersProps) => {

    const handleOnClick = (e: any) => {
      props.handleOnClick(e.event, props.context);
    };

    return (
      <DXButton
        className={props.className}
        text={props.title || ""}
        area-title={props.title}
        // icon="plus"
        onClick={handleOnClick}
        width={"auto"}
        type='default'
      />
    );
  }
);
