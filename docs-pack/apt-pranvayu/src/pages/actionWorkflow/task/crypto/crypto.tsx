import { DXSelect } from "../../../../components/atoms";
import { useStepEditor } from "../../../../react";
import { CryptoMethod } from "./crypto.Crypto";
import { CryptoDecrypt } from "./crypto.Deccrypt";
import { CryptoEncrypt } from "./crypto.Encrypt";

export const Crypto = () => {
  const items: any[] = [
    "Select Crypto Method",
    "Hash",
    "Encrypt",
    "Decrypt",
  ];
  const { properties, setProperty } = useStepEditor();

  const onValueChanged = (value: any) => {
    let _formData: any = properties?.taskSettings

    delete _formData?.path
    delete _formData?.hashAlgo
    delete _formData?.iv
    delete _formData?.algorithm
    delete _formData?.data
    delete _formData?.secret
    delete _formData?.outputEncoding
    delete _formData?.inputEncoding

    if (value !== "Select Crypto Method") setProperty("type", value);
  };

  const render = () => {
    switch (properties["type"]) {
      case "Hash":
        return <CryptoMethod />;
      case "Encrypt":
        return <CryptoEncrypt />;
      case "Decrypt":
        return <CryptoDecrypt />;

      default:
        return <h4 className={"content-block"}>Select Method Type</h4>;
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
