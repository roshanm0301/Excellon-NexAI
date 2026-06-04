import { DXSelect } from "../../../../components/atoms/select";
import { useStepEditor } from "../../../../react";
import { CreateContainer } from "./azure.CreateContainer";
import { DeleteContainer } from "./azure.DeleteContainer";
import { Download } from "./azure.Download";
import { DownloadBlobToBuffer } from "./azure.DownloadBlobToBuffer";
import { DownloadToBuffer } from "./azure.DownloadToBuffer";
import { GetBlockBlobClient } from "./azure.GetBlockBlobClient";
import { GetContainerClient } from "./azure.GetContainerClient";
import { GetProperties } from "./azure.GetProperties";
import { ListContainers } from "./azure.ListContainers";
import { SetProperties } from "./azure.SetProperties";
import { UndeleteContainer } from "./azure.UndeleteContainer";
import { Upload } from "./azure.Upload";
import { UploadData } from "./azure.UploadData";


export const Azure = () => {
  const items: any[] = ["Select Date Type", "GetContainerClient", "CreateContainer", "DeleteContainer",
    "UndeleteContainer", "GetProperties", "SetProperties", "ListContainers", "DownloadBlobToBuffer",
    "Download", "GetBlockBlobClient", "UploadData", "DownloadToBuffer", "Upload"];

  const { properties, setProperty } = useStepEditor();

  const onValueChanged = (value: any) => {
    if (value !== "Select Azure Type") setProperty("type", value);
  };

  const render = () => {
    switch (properties["type"]) {
      case "GetContainerClient":
        return <GetContainerClient />;
      case "CreateContainer":
        return <CreateContainer />;
      case "DeleteContainer":
        return <DeleteContainer />;
      case "UndeleteContainer":
        return <UndeleteContainer />;
      case "GetProperties":
        return <GetProperties />
      case "SetProperties":
        return <SetProperties />
      case "ListContainers":
        return <ListContainers />
      case "DownloadBlobToBuffer":
        return <DownloadBlobToBuffer />
      case "Download":
        return <Download />
      case "GetBlockBlobClient":
        return <GetBlockBlobClient />
      case "UploadData":
        return <UploadData />
      case "DownloadToBuffer":
        return <DownloadToBuffer />
      case "Upload":
        return <Upload />
      default:
        return <h4 className={"content-block"}>Select Azure Type</h4>;
    }
  };

  return (
    <>
      <DXSelect
        items={items}
        value={properties["type"] || ""}
        onValueChange={onValueChanged}
      />
      <br />
      {render()}
    </>
  );
};
