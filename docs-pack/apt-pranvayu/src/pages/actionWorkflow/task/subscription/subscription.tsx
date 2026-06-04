import { DXSelect } from "../../../../components/atoms";
import { useStepEditor } from "../../../../react";
import { SubscriptionGet } from "./subscription.get";
import { SubscriptionList } from "./subscription.list";
import { SubscriptionPost } from "./subscription.post";
import { SubscriptionSet } from "./subscription.set";

export const Subscription = () => {
  const items: any[] = [
    "Select Subscription Type",
    "Get",
    "Set",
    "Post",
    "List",
  ];
  const { properties, setProperty } = useStepEditor();

  const onValueChanged = (value: any) => {
    let _formData: any = properties?.taskSettings
    delete _formData?.schema
    delete _formData?.documentId
    delete _formData?.payload
    delete _formData?.subscriptionId

    if (value !== "Select Subscription Type") setProperty("type", value);
  };

  const render = () => {
    switch (properties["type"]) {
      case "Get":
        return <SubscriptionGet />;
      case "Set":
        return <SubscriptionSet />;
      case "Post":
        return <SubscriptionPost />;
      case "List":
        return <SubscriptionList />;
      default:
        return <h4 className={"content-block"}>Select Subscription Type</h4>;
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
