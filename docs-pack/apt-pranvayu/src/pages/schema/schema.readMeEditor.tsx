import MDEditor from "@uiw/react-md-editor";
import React, { useEffect, useState } from "react";
import showdown from 'showdown';
import { DXButton } from "../../components/atoms";
import './schema.scss';
import { IReadMeEditor } from ".";

export default function ReadMeEditor(props: IReadMeEditor) {
    const { data, callback, title = "Help",disable } = props

    const [readMeText, setReadMeText] = React.useState('');
    const [readmeData, setReadmeData] = useState("");

    const converter = new showdown.Converter();

    useEffect(() => {
        if (data) {
            setReadMeText(converter.makeMarkdown(data))
        }
    }, [data])

    const handleClick = (e: any) => {
        setReadmeData(converter.makeHtml(readMeText));
        callback(converter.makeHtml(readMeText))
    }

    const handleReset = (e: any) => {
        setReadMeText('')
        callback('')
    }

    return (
        <>
            <span className={"readme-editor"}>{title}</span>
            <div data-color-mode="dark">
                <MDEditor height={150} value={readMeText} onChange={(e: any) => setReadMeText(e)} />
            </div>
            <div className="columnButtons">
                <DXButton type="normal" stylingMode="text" hint="SAVE HELP" icon="save" text="" onClick={handleClick} disabled={disable} />
                <DXButton type="normal" stylingMode="text" hint="RESET HELP" icon="refresh" text="" onClick={handleReset} disabled={disable}/>
            </div>
        </>
    );
}