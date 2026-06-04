import { useEffect, useState } from 'react';
import { HistoryComponent } from '../../components/molecules/HistoryComponent';
import { GetHistoryByParentId } from '../../redux/actions';
import { useAppDispatch, useAppSelector } from '../../store/customHooks';
import { IViewHistory } from './schema.entity';

export const ViewHistory = (props: IViewHistory) => {
    const { schemaId } = props;
    const dispatch = useAppDispatch()
    const [oldFormData, setOldFormData] = useState({})

    let historyById = useAppSelector((state) => state.schema.historyById)
    localStorage.setItem("length", JSON.stringify(historyById?.data.length))
    useEffect(() => {
        getHistory()
    }, [schemaId])

    const getHistory = async () => {
        let request = { ParentDocumentId: schemaId }
        const result: any = await dispatch(GetHistoryByParentId(request));
        setOldFormData(result?.data)
    }

    return (
        <div>
            <div style={{ margin: "10px" }}>
                {historyById?.data.map((i: any, key: any) => {
                    return <HistoryComponent CommitDate={i.CommitDate} formData={i.Entity} id={i._id} EntityType={i.EntityType} ParentDocumentId={i.ParentDocumentId} key={key} Name={i.Entity.SystemName} versionNo={i.Revision} />
                })}
            </div>
        </div>
    )
}
