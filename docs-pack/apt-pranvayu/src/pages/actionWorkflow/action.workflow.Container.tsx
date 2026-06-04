import { useEffect, useState } from "react";
import { useLocation, useParams } from "react-router-dom";
import {
  getActionAPI,
  getTemplateAPI,
} from "../../redux/actions";
import { useAppDispatch } from "../../store/customHooks";
import { ActionWorkFlow } from "./action.workflow";

interface IActionWorkFlowContainerProps {
  SchemaIdCompareMode?: string;
  DocumentIdCompareMode?: string;
  disableToolBox?: boolean;
}

export const ActionWorkflowContainer = (props: IActionWorkFlowContainerProps) => {
  const { SchemaIdCompareMode, DocumentIdCompareMode, disableToolBox } = props;

  const location = useLocation()
  const dispatch = useAppDispatch();
  const { SchemaId, id } = useParams();

  const [formData, setFormData] = useState<any>(null)
  let cloneDocumentId: any
  let isTemplateView = location?.pathname.includes("/template")


  if (location.pathname.includes("/schema/clone-action")) {
    cloneDocumentId = JSON.parse(
      localStorage.getItem("id") || ""
    );
  }

  useEffect(() => {
    let documentId = id;
    if (DocumentIdCompareMode) {
      documentId = DocumentIdCompareMode;
    } else if (cloneDocumentId) {
      documentId = cloneDocumentId
    }

    if (documentId) {
      (async () => {
        let result: any
        if (!isTemplateView && documentId) {
          result = await dispatch(getActionAPI(documentId));
        } else {
          result = await dispatch(getTemplateAPI(documentId));
        }
        const _formData = {
          ...formData,
          ...result,
        };
        setFormData({ ..._formData });
      })()
    }
  }, []);


  return (
    <>
      {disableToolBox
        ?
        <ActionWorkFlow
          disableToolBox={disableToolBox}
          id={DocumentIdCompareMode || ""}
          SchemaId={SchemaIdCompareMode}
          actionByIdData={formData}
          isTreeView={true} />
        :
        <ActionWorkFlow
          disableToolBox={false}
          id={id || cloneDocumentId}
          SchemaId={SchemaId}
          actionByIdData={formData}
          isTemplateView={location?.pathname.includes("/template")} />
      }
    </>
  );
};