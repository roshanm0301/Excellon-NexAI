import { DXSelect } from "../../../../components/atoms";
import { useStepEditor } from "../../../../react";
import {
  HashPasswordSecurity,
  JWTSignSecurity,
  JWTVerifySecurity,
  MatchPasswordSecurity,
  VerifyPassword,
} from ".";

export const Security = () => {
  const items: any[] = [
    "Select Security Type",
    "JWTSign",
    "JWTVerify",
    "hashPassword",
    "matchPassword",
    "verifyPassword",
  ];
  const { properties, setProperty } = useStepEditor();

  const onValueChanged = (value: any) => {
    let _formData: any = properties?.taskSettings
    delete _formData?.payload
    if (value !== "JWTVerify" || value !== "JWTSign") {
      delete _formData?.options

    }
    delete _formData?.secret
    delete _formData?.token
    delete _formData?.password
    delete _formData?.hash
    if (value !== "Select Document Type") setProperty("type", value);
  };

  const render = () => {
    switch (properties["type"]) {
      case "JWTSign":
        return <JWTSignSecurity />;
      case "JWTVerify":
        return <JWTVerifySecurity />;
      case "hashPassword":
        return <HashPasswordSecurity />;
      case "matchPassword":
        return <MatchPasswordSecurity />;
      case "verifyPassword":
        return <VerifyPassword />;
      default:
        return <h4 className={"content-block"}>Select Document Type</h4>;
    }
  };

  return (
    <>
      <DXSelect
        items={items}
        value={properties["type"] || ""}
        onValueChange={onValueChanged}
      />
      <br></br>
      {/* Based on document type render the relevant component */}
      {render()}
    </>
  );
};
