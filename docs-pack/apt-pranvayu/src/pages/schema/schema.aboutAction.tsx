import { useState, useEffect } from "react";
import { DXButton, DXForm } from "../../components/atoms";
import { showNotification, updateActionAPI } from "../../redux/actions";
import { useAppDispatch } from "../../store/customHooks";
import ReadMeEditor from "./schema.readMeEditor";
import { IAboutActionProps } from "./schema.entity";

const formDefinition = {
    Tags: [],
    Description: "",
    Help: ""
};

export const AboutAction = (props: IAboutActionProps) => {
    const { schemaId, id, data, setIsOpen } = props;

    const dispatch = useAppDispatch();

    const [formData, setFormData] = useState({ ...formDefinition })
    const [error, setError] = useState("")
    const onEditorCallback = (readMeText: string) => {
        setFormData({ ...formData, Help: readMeText });
    };

    useEffect(() => {
        if (data) {
            setFormData(data)
        }
    }, [data])

    const handleSubmit = async (e: any) => {
        e.event.preventDefault();
        if (formData?.Description === "" || formData?.Tags.length === 0) {
            dispatch(showNotification({
                isOpen: true,
                message: "Please enter required field!",
                type: "error",
            }));
            return
        } else {
            let request: any = {
                Tags: formData.Tags,
                Description: formData.Description,
                Help: formData.Help
            };
            if (schemaId && id) {
                const result: any = await dispatch(
                    updateActionAPI(request, schemaId, id)
                );
                setIsOpen(false)
            }
        }
    }


    return (
        <form >
            <DXForm
                stylingMode="outlined"
                formData={formData}
                items={[
                    {
                        itemType: "group",
                        cssClass: "no-margin",
                        colCount: 2,
                        items: [
                            {
                                label: { text: "Tag", location: "top" },
                                dataField: "Tags",
                                editorType: "dxTagBox",
                                isRequired: true,
                                editorOptions: {
                                    multiline: true,
                                    label: "Tags",
                                    showSelectionControls: true,
                                    searchEnabled: true,
                                    acceptCustomValue: true,
                                    openOnFieldClick: false,
                                },
                            },
                        ]
                    }
                ]}
            />

            <div style={{ marginBottom: 12 }}>
                <label style={{ display: "block", marginBottom: 4, fontSize: 13, fontWeight: 500 }}>
                    Description <span style={{ color: "red" }}>*</span>
                </label>
                <textarea
                    value={formData.Description}
                    onChange={(e) => setFormData({ ...formData, Description: e.target.value })}
                    rows={5}
                    style={{
                        width: "100%",
                        height: 120,
                        overflowY: "scroll",
                        resize: "vertical",
                        padding: "8px 10px",
                        fontSize: 14,
                        border: "1px solid #ccc",
                        borderRadius: 4,
                        boxSizing: "border-box",
                        outline: "none",
                        fontFamily: "inherit",
                    }}
                />
            </div>

            <ReadMeEditor data={formData.Help} callback={onEditorCallback} />
            <div style={{ display: "flex", flexDirection: "row" }}>
                <DXButton type="default" text={"SAVE"} onClick={handleSubmit} stylingMode="contained" icon="save" />
                <span style={{ color: "var(--color-error, #f14c4c)" }}>{error}</span>
            </div>

        </form>
    )
}