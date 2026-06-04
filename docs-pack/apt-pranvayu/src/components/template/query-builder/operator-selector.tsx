import React from "react";
import { DXSelect } from "../../atoms";
import { OperatorSelectorProps } from "react-querybuilder";

export const OperatorSelector = React.memo((props: OperatorSelectorProps) => {
  // const [value, setValue] = useState("");

  // useEffect(() => {
  //   if (props.value) {
  //     setValue(props.value);
  //   }
  // }, [props.value]);

  const onChange = (e: any) => {
    //setValue(e.value);
    props.handleOnChange(e);
  };

  return (
    <DXSelect
      value={props.value}
      items={props.options}
      onValueChange={onChange}
      label={props.title}
      labelMode="floating"
      name={props.title}
      // className={props.className}
      displayExpr={"label"}
      valueExpr={"name"}
      width={'25%'}
    />
  );
});
