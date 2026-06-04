import FileUploader, { IFileUploaderOptions } from 'devextreme-react/file-uploader';
import { ValueChangedEvent } from 'devextreme/ui/file_uploader';
import { useState } from 'react';
import "../../../src/pages/subscription/subscription.scss";
import AvtarIcon from "../../assets/icon-avatar.svg";
import { DXButton } from './button';
export interface IFileUploader extends IFileUploaderOptions {
    accept: string
    labelText?: string
    uploadUrl: string
    onValueChanged: ((e: ValueChangedEvent) => void)
}

export const DXFileUploader = (props: IFileUploader) => {
    const { accept, labelText, uploadUrl, onValueChanged ,...rest} = props;
    const [state, setState] = useState({
        isDropZoneActive: false,
        imageSource: '',
        textVisible: true,
        progressVisible: false,
        progressValue: 0,
        isUploaded: false
    });

    const onUploaded = (e: any) => {
        const { file } = e;
        const fileReader: any = new FileReader();
        fileReader.onload = () => {
            setState({
                ...state,
                isDropZoneActive: false,
                imageSource: fileReader.result,
                textVisible: false,

            });
        };
        fileReader.readAsDataURL(file);
        setState({
            ...state,
            textVisible: false,
            progressVisible: false,
            progressValue: 0,
        });
    }

    function removeProfile() {
        setState({
            ...state,
            imageSource: '',
            textVisible: false,
            progressVisible: false,
            progressValue: 0,
        });
    }
    function uploadProfile() {
        // TODO: implement profile upload
    }

    return (
        <>
            <div id="dropzone-external" className={`flex-box ${state.isDropZoneActive ? 'dx-theme-accent-as-border-color dropzone-active' : 'dx-theme-border-color'}`}>
                {state.imageSource && <img id="dropzone-image" src={state.imageSource} alt="profilepic" className='avatar' />}
                {/* {state.textVisible */}
                {!state.imageSource && <div id="dropzone-text" className="flex-box">
                    <span><img src={AvtarIcon} alt="Avatar" className='avatar'></img></span>
                </div>}
            </div>

            <div style={{ display: "flex"}}>
                <div id="dropzone-button">
                    <DXButton
                        className={state.imageSource ?  "upload-button-preview": "upload-button-next"}
                        text={"UPLOAD"}
                        stylingMode={"outlined"}
                        onClick={uploadProfile}
                        type="default"
                        icon={"edit"}
                    /></div>

                {state.imageSource && <DXButton
                    className="delet-button"
                    text={"DELETE"}
                    stylingMode={"outlined"}
                    onClick={removeProfile}
                    type="default"
                    icon={"trash"}
                />}
            </div>
            <FileUploader
                id="file-uploader"
                dialogTrigger="#dropzone-button"
                dropZone="#dropzone-button"
                multiple={false}
                accept={accept}
                uploadMode="instantly"
                visible={false}
                uploadUrl={uploadUrl}
                onValueChanged={onValueChanged}
                onUploaded={onUploaded}
                {...rest}
            >
            </FileUploader>


        </>

    )
}