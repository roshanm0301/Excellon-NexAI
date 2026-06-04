import { ScrollView } from "devextreme-react";
import React, { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import ReadMeEditor from "../../pages/schema/schema.readMeEditor";
import { createErrorAPI, createErrorMessageAPI, showNotification, updateErrorAPI, updateErrorMessageAPI } from "../../redux/actions";
import { useAppDispatch } from "../../store/customHooks";
import { checkDuplicateField } from "../../utility/utils";
import { DXForm } from "../atoms";
import { DXPopup } from "../template";

interface IMergePath {
    data?: any[], callback?: any, title?: string, SchemaId?: string, setClose?: any, list?: any, editItem?: any, editMode?: boolean, type?: string
}

export const AddEditErrorMessage = React.memo((props: IMergePath) => {
    const { data = [], callback, title, setClose, SchemaId, list, editItem, editMode, type } = props;
    const formDefinition = {
        Code: "",
        Type: "",
        Description: "",
        ParentSchemaId: SchemaId ? SchemaId : "",
        id: "",
        Language: "",
        RootCause: "",
        PreventiveAction: ""

    };

    const [formData, setFormData] = useState<any>(formDefinition);
    const [isOpen, setIsOpen] = useState(false);
    const dispatch = useAppDispatch()
    let found: any;

    useEffect(() => {
        setIsOpen(true)
    }, [])

    useEffect(() => {
        if (editMode === false) {
            setFormData({ ...formData, Code: "", Type: "", Description: "", id: "", RootCause: "", PreventiveAction: "", Language: "" })
        } else {
            if (type === "Error") {
                found = list?.find(
                    (element: any) => element.Code === editItem
                );
                setFormData({ ...formData, Code: found?.Code, Type: found?.Type, Description: found?.Description, id: found?.id, RootCause: found?.RootCause, PrevetiveAction: found?.PreventiveAction })
            }

            if (type === "Message") {
                found = list?.find((element: any) => element.Description === editItem);
                setFormData({ ...formData, Code: found?.code, Description: found?.Description, id: found?.id, Language: found?.Language })
            }
        }
    }, [editMode])


    const onSaveClick = async (e: any) => {
        e.preventDefault()
        if (type === "Error") {
            found = checkDuplicateField(list, formData, "Code")
        }

        if (type === "Message") {
            found = checkDuplicateField(list, formData, "Description")
        }

        if (found && !editMode) {
            dispatch(showNotification({
                isOpen: true,
                message: "Duplicate entries not allowed!!!",
                type: "error",
            }));
        } else {
            if (editMode) {
                if (type === "Error") {
                    let request: any = {
                        Code: formData.Code,
                        Type: formData.Type,
                        Description: formData.Description,
                        ParentSchemaId: SchemaId,
                        RootCause: formData.RootCause,
                        PrevevtiveAction: formData.PreventiveAction
                    }
                    const result: any = await dispatch(updateErrorAPI(formData.id, request));
                    if (result.success) {
                        dispatch(showNotification({
                            isOpen: true,
                            message: "Errorcode updated successfully...",
                            type: "success",
                        }));
                        callback(formData?.Code)
                        onHiding()
                    }
                }
                if (type === "Message") {
                    let request: any = {
                        code: formData.Code,
                        Description: formData.Description,
                    }
                    const result: any = await dispatch(updateErrorMessageAPI(formData.id, request));
                    if (result.success) {
                        dispatch(showNotification({
                            isOpen: true,
                            message: "ErrorMessage updated successfully...",
                            type: "success",
                        }));
                        callback(formData?.Description)
                        onHiding()
                    }
                }
            } else {
                if (type === "Error") {
                    let request: any = {
                        Code: formData.Code,
                        Type: formData.Type,
                        Description: formData.Description,
                        ParentSchemaId: SchemaId,
                        RootCause: formData.RootCause,
                        PrevevtiveAction: formData.PreventiveAction
                    }
                    const result: any = await dispatch(createErrorAPI(request));
                    if (result.success) {
                        dispatch(showNotification({
                            isOpen: true,
                            message: "Errorcode added successfully...",
                            type: "success",
                        }));
                        callback(formData?.Code)
                        onHiding()
                    }
                }
                if (type === "Message") {
                    let request: any = {
                        code: formData.Code,
                        Description: formData.Description,
                    }
                    const result: any = await dispatch(createErrorMessageAPI(request));
                    if (result.success) {
                        dispatch(showNotification({
                            isOpen: true,
                            message: "Messagecode added successfully...",
                            type: "success",
                        }));
                        callback(formData?.Code)
                        onHiding()
                    }
                }
            }

        }
    }
    const onRootCauseCallback = (payload: any) => {
        setFormData({ ...formData, RootCause: payload })

    }
    const onPreventiveActionCallback = (payload: any) => {
        setFormData({ ...formData, PreventiveAction: payload })
    }
    const onHiding = () => {
        setClose()
    }
    return (<>
        <DXPopup title="Add New" width="50vw" height={"40vw"} visible={isOpen} onHiding={onHiding} >
            <ScrollView>
                <div>
                    <form action="your-action" onSubmit={onSaveClick}>
                        <DXForm
                            formData={formData}
                            stylingMode="outlined"
                            items={[
                                {
                                    label: { text: "Code" },
                                    dataField: "Code",
                                    isRequired: true,

                                },
                                {
                                    label: { text: "Type" },
                                    dataField: "Type",
                                    isRequired: true,
                                    visible: type === "Error"
                                },
                                {
                                    label: { text: "Description" },
                                    dataField: "Description",
                                    isRequired: true,
                                },
                                {
                                    label: { text: "Language" },
                                    dataField: "Language",
                                    isRequired: true,
                                    visible: type === "Message"
                                },
                                {
                                    label: { text: "" },
                                    dataField: "PreventiveAction",
                                    visible: type === "Error",
                                    isRequired: true,
                                    template: async (data: any, itemElement: any) => {
                                        const root = createRoot(itemElement!);
                                        root.render(<ReadMeEditor
                                            title="Preventive Action"
                                            data={formData.PreventiveAction}
                                            callback={onPreventiveActionCallback} />);
                                    },
                                },
                                {
                                    label: { text: "" },
                                    dataField: "RootCause",
                                    visible: type === "Error",
                                    isRequired: true,
                                    template: async (data: any, itemElement: any) => {
                                        const root = createRoot(itemElement!);
                                        root.render(<ReadMeEditor
                                            data={formData.RootCause}
                                            title="Root Cause"
                                            callback={onRootCauseCallback} />);
                                    },
                                },
                                {
                                    itemType: "button",
                                    horizontalAlignment: "center",
                                    buttonOptions: {
                                        text: editMode ? "Update" : "Save",
                                        type: "default",
                                        useSubmitBehavior: true,
                                    },
                                },
                            ]}
                        />
                    </form>
                </div>
            </ScrollView>
        </DXPopup>

    </>);
});
