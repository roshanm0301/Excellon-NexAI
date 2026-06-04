import React, { useState, useEffect } from 'react'
import { DXAccordion, DXButton } from '../../components/atoms'
import { ScrollView } from 'devextreme-react'
import Comparer from './comparer'
import { GetActionByReferenceId, GetSchemaByReferenceId, getDocumentByActionId, getSchemaAPI } from '../../redux/actions'
import { useAppDispatch } from '../../store/customHooks'

const ActionAndSchemaComparer = (props: any) => {
    const { sourceSubscription, destinationSubscription, documentId, title, type } = props;
    const dispatch = useAppDispatch();
    const [documentData, setDocumentData] = useState(null)
    const [referenceData, setReferenceData] = useState(null);


    useEffect(() => {
        (async()=>{
            const payloadForAction = {
                ReferenceId: documentId
            }
           if (type === "Action") {
                const documentByIdResultForAction: any = await dispatch(getDocumentByActionId(documentId))
                setDocumentData(documentByIdResultForAction)
                const actionIdResult: any = await dispatch(GetActionByReferenceId(payloadForAction));
                setReferenceData(actionIdResult.reduce((obj:any, item:any) => item, {}))
            } else {
                let documentByIdResultForSchema: any = await dispatch(getSchemaAPI(documentId));
                setDocumentData(documentByIdResultForSchema)
                const schemaIdResult: any = await dispatch(GetSchemaByReferenceId(payloadForAction));
                setReferenceData(schemaIdResult.reduce((obj:any, item:any) => item, {}))
            }
        })()
    }, [documentId])

    return (
        <DXAccordion title={title} defaultSelectedIndex={-1} width={700}>
            <>
                <ScrollView width="100%" height="100%">
                    <div>
                        <Comparer leftTitle={`Source - ${sourceSubscription}`} rightTitle={`Destination - ${destinationSubscription}`} oldJSON={documentData} newJSON={referenceData} />
                    </div>
                </ScrollView>
            </>
        </DXAccordion>)
}

export default ActionAndSchemaComparer