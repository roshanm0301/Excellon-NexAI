import React from "react";
import { DXButton } from "../../atoms";
import { ClickEvent } from "devextreme/ui/button";

export const ButtonTemplate = () => {
  const onSave = (e: SubmitEvent) => {
  };
  const onCancel = (e: ClickEvent) => {
  };
  return (
    <div>
      <DXButton
        text={"Save"}
        useSubmitBehavior={true}
        onClick={onSave}
      ></DXButton>
      <DXButton
        text={"Cancel"}
        useSubmitBehavior={false}
        onClick={onCancel}
      ></DXButton>
      <DXButton
        text={"Send for Approval"}
        useSubmitBehavior={false}
        onClick={onCancel}
      ></DXButton>
    </div>
  );
};
