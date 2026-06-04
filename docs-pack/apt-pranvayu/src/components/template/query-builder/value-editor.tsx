import React, { useEffect, useState } from "react";

import { DXInput } from "../../atoms";
import { ValueEditorProps } from "react-querybuilder";

export const ValueEditor = React.memo((props: ValueEditorProps) => {
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
      name={props.valueSource}
      // className={props.className}
      onChange={onChange}
      width={"33%"}
    />
  );
});
