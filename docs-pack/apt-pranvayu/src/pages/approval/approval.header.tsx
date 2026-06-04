import { useEffect } from 'react'
import { DXButton } from '../../components/atoms';
import { useAppDispatch } from '../../store/customHooks';
import { showNotification, updateProviderCopyMultipleSchemaAndActionList } from '../../redux/actions';

const ApprovalHeader = (props: any) => {
    const { documentByIdResult, sourceSubscription, destinationSubscription, selectedItems } = props;
    const dispatch = useAppDispatch();

    const onAcceptClick = async () => {
        const array = selectedItems?.map((item: any) => item.id);
        const payload = {
            SourceSubscriptionId: documentByIdResult?.Entity?.SourceSubscription,
            Schemas: array,
            NewSubscriptionId: documentByIdResult?.Entity?.DestinationSubscription,
            DestinationProvider:documentByIdResult?.Entity?.DestinationProvider
        }
        const result: any = await dispatch(updateProviderCopyMultipleSchemaAndActionList(payload));
        if (result?.success) {
            dispatch(showNotification({
                isOpen: true,
                message: result?.data,
                type: "success",
            }));
        } else {
            dispatch(showNotification({
                isOpen: true,
                message: result?.message,
                type: "error",
            }));
        }
    }
    const onRejectClick = () => {

    }
    return (
        <div className="grid-header-actions">
            <b>Title: </b>{documentByIdResult?.Entity?.Title}
            <b>EntityType: </b>{documentByIdResult?.EntityType}
            <b>RequestType: </b>{documentByIdResult?.RequestType}
            <b>SourceSubscription:</b>{sourceSubscription}
            <b>DestinationSubscription:</b>{destinationSubscription}
            <div className='button-alignment'>
                <DXButton hint='Accept' text="" disabled={selectedItems.length === 0} icon="todo" onClick={onAcceptClick} />
                <DXButton hint='Reject' text="" disabled={selectedItems.length === 0} icon="remove" onClick={onRejectClick} />
            </div>
        </div>
    )
}

export default ApprovalHeader