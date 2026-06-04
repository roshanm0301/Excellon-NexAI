import { ScrollView } from 'devextreme-react'
import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { DXButton } from '../../components/atoms'
import { RevertHistoryByParentId, getActionAPI, getSchemaAPI } from '../../redux/actions'
import { useAppDispatch } from '../../store/customHooks'
import Comparer from '../approval/comparer'

export const ViewFile = () => {
    const { id } = useParams()
    let entityType = localStorage.getItem("EntityType")
    let formData = localStorage.getItem("formData")
    const dispatch = useAppDispatch()
    const navigate = useNavigate()
    const [open, setOpen] = useState(false)
    const [newFormData, setNewFormData] = useState<any>({})

    const onCancel = (e: any) => {
        navigate(-1)
        setOpen(!open)

    }
    const onRevert = async(e: any) => {
        
        navigate(-1)
        setOpen(!open)
        let request={id:localStorage.getItem("revertId")}
         await dispatch(RevertHistoryByParentId(request));
    }

    useEffect(() => {
        getById()
    }, [id])

    const getById = async () => {
        let Entity = JSON.parse(entityType ? entityType : "")
        if (Entity === "Schema") {
            const result: any = await dispatch(getSchemaAPI(id ? id : ""));
            setNewFormData(result)

        }
        if (Entity === "Action") {
            const result: any = await dispatch(getActionAPI(id ? id : ""));
            setNewFormData(result)

        }

    }
    return (
        <div style={{ display: "flex", flexDirection: "column", }}>
            <div style={{ display: "flex", flexDirection: "row" }}>
                <div style={{ margin: "10px", width: "100%" }}>
                    <DXButton type='default' text="" stylingMode='text' hint='Back' icon="arrowleft" onClick={onCancel} />
                </div>

                <div style={{ margin: "10px", display: "flex", justifyContent: "end", float: "right" }}>
                    <DXButton type='default' text="" stylingMode='text' hint='Revert' icon="revert" onClick={onRevert} />
                </div>

            </div>

            <div className={"content-block dx-card responsive-paddings"}>
                <ScrollView width="100%" height="100%">
                    <div>
                        <Comparer oldJSON={JSON.parse(formData || "")} newJSON={newFormData} />
                    </div>
                </ScrollView>
            </div>
        </div>
    )
}
