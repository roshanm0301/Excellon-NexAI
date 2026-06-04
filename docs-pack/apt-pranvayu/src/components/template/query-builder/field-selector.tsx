import React, { useEffect, useState } from "react";
import { FieldSelectorProps } from "react-querybuilder";
import { DXInput } from "../../atoms";

export const FieldSelector = React.memo((props: FieldSelectorProps) => {
  const [value, setValue] = useState("");

  useEffect(() => {
    if (props.value && props.value !== "~") {
      setValue(props.value);
    }
  }, [props.value]);

  const onChange = (e: any) => {
    setValue(e);
    props.handleOnChange(e);
  };

  return (
    <DXInput
      value={value}
      label={props.title}
      name={props.title}
      width={'33%'}
      // className={`${props.className} mt-6`}
      onChange={onChange}
    />
  );
});
