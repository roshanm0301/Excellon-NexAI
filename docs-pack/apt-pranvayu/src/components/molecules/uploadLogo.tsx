import React, { useState } from "react";
import { v4 } from "uuid";
import { DXAccordion, DXFileUploader } from "../atoms";

export const UploadLogo = React.memo((props:any) => {
  const { title, data } = props;
  const LogoData = {
    id: v4(),
    Logo: {},
  };

  const [payload, setPayload] = useState<any>(LogoData);
  const [selectedFile, setSelectedFile] = useState<any>(data);

  const onFormDataChange = (e: any) => {
    setPayload({ ...payload });
    setSelectedFile(URL.createObjectURL(e.value[0]));
  };

  const handleUploadStarted = (e: any) => {
    setPayload({ ...payload });
  };

  return (
    <DXAccordion title={title || "Payload"}>
      <DXFileUploader
        accept="*"
        // visible={true}
        uploadMode="instantly"
        uploadUrl="https://js.devexpress.com/Demos/NetCore/FileUploader/Upload"
        onValueChanged={onFormDataChange}
        onUploadStarted={handleUploadStarted}
      />
    </DXAccordion>
  );
})