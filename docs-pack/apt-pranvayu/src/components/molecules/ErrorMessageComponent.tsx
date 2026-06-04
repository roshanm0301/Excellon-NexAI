import React, { useEffect, useState } from "react";
import { v4 } from "uuid";
import { getErrorListAPI, getMessageListAPI } from "../../redux/actions";
import { useAppDispatch, useAppSelector } from "../../store/customHooks";
import { DXButton, DXSelect } from "../atoms";
import { AddEditErrorMessage } from "./AddEditErrorMessage";

interface IError {
    data?: any, callback?: any, SchemaId?: string, dataSource?: any, title?: string, id?: string, setClose?: any, text?: any
}

export const ErrorMessageComponent = React.memo((props: IError) => {
    const { data, callback, title, SchemaId, dataSource, text } = props;
    const formDefinition = {
        id: v4(),
        error: "",
    };
    const [editMode, setEditMode] = useState(false)
    const [value, setValue] = useState("")
    const [failedToggle, setFailedToggle] = useState(false)
    const [isOpen, setIsOpen] = useState(false);
    const [formData, setFormData] = useState({ ...formDefinition });
    const [id, setId] = useState("")
    const dispatch = useAppDispatch()

    let errorCodeList = useAppSelector((state) => state.error.errorCodeList);
    let errorMessageList = useAppSelector((state) => state.error.errorMessageList);

    useEffect(() => {
        if (SchemaId) {
            getErrorList()
        }
    }, [SchemaId]);

    useEffect(() => {
            getErrorList()
    
    }, [SchemaId]);

    const getErrorList = async () => {
        if (text === "Error") {//getErrorListAPI
            let request: any = { ParentSchemaId: SchemaId }
            let params:any={search:""}
            const result: any = await dispatch(getErrorListAPI(request,params));
        } else {//getMessage List API
            const result: any = await dispatch(getMessageListAPI())
        }


    }
    useEffect(() => {
        setValue(data)
    }, [data])

    const addNewError = () => {
        setFailedToggle(!failedToggle)
        setIsOpen(true)
        setEditMode(false)
    }

    const editError = () => {
        setFailedToggle(!failedToggle)
        setIsOpen(true)
        setEditMode(true)
    }

    const onCallBack = (value: any) => {
        getErrorList()
        setValue(value)
        callback(value);
    }

    const onValueChange = (e: any) => {
        // e.preventDefault()
        if (e) {
            setFormData({ ...formData, error: e })
            setValue(e)
            callback(e);
        }
    };

    return (<>
        <div className="error-message-row">
            <DXSelect
                value={value}
                items={text === "Error" ? errorCodeList : errorMessageList}
                onValueChange={(e: any) => onValueChange(e)}
                label={text}
                labelMode="floating"
                displayExpr={text === "Error" ? "Code" : "Description"}
                valueExpr={text === "Error" ? "Code" : "Description"}
                searchEnabled={true}
                width={"60%"}
            />

            <DXButton
                text={""}
                stylingMode={"outlined"}
                onClick={addNewError}
                type="default"
                icon={"add"}
            />

            <DXButton
                text={""}
                stylingMode={"outlined"}
                onClick={editError}
                type="default"
                icon={"edit"}
            />
        </div>
        {isOpen && <AddEditErrorMessage editMode={editMode} type={text} list={text==="Error"?errorCodeList:errorMessageList} editItem={value} callback={onCallBack} setClose={() => setIsOpen(false)} SchemaId={SchemaId} />}

    </>);
});
