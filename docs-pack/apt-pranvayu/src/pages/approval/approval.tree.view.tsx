import React, { useState, useEffect } from 'react'
import { useAppDispatch, useAppSelector } from '../../store/customHooks';
import { GetUpdatedVersionData, getApprovalAPI, getSubscriptionListAPI } from '../../redux/actions';
import { useParams } from 'react-router-dom';
import './approval.scss';
import ActionAndSchemaComparer from './actionAndSchemaComparer';
import ApprovalHeader from './approval.header';
import TreeView from './treeView';

const ApprovalTreeView = () => {
    const dispatch = useAppDispatch();
    const { id } = useParams();
    const [documentByIdResult, setDocumentByIdResult] = useState<any>(null)
    const [sourceSubscription, setSourceDestination] = useState(null);
    const [destinationSubscription, setDestinationSubscription] = useState(null);
    const [onActionClick, setOnActionClick] = useState(true)
    const [onSchemaClick, setOnSchemaClick] = useState(true)
    const [selectAllAction, setSelectAllAction] = useState(false);
    const [selectAllSchema, setSelectAllSchema] = useState(false);
    const [selectedItems, setSelectedItems] = useState<string[]>([]);
    let { updatedVersionDataForAction, updatedVersionDataForSchema } = useAppSelector((state) => state.publishRequest);
    let { subscriptions } = useAppSelector((state) => state.subscription);

    useEffect(() => {
        dispatch(getSubscriptionListAPI(null));
        dispatch(GetUpdatedVersionData());
    }, [])
    
    useEffect(() => {
        if (id) {
            (async () => {
                const result: any = await dispatch(getApprovalAPI(id))
                if (result) {
                    setDocumentByIdResult(result)
                    subscriptions?.find((item: any) => {
                        if (item?.id === result?.Entity?.SourceSubscription) {
                            setSourceDestination(item.DisplayName)
                        }
                    })
                    subscriptions?.find((item: any) => {
                        if (item?.id === result?.Entity?.DestinationSubscription) {
                            setDestinationSubscription(item.DisplayName)
                        }
                    })
                }
            })();
        }
    }, [subscriptions])

    const onActionExpandClick = () => {
        setOnActionClick(!onActionClick)
    }
    const onSchemaExpandClick = () => {
        setOnSchemaClick(!onSchemaClick)
    }
    const toggleSelectAllAction = () => {
        setSelectAllAction(!selectAllAction);
        if (!selectAllAction) {
            setSelectedItems(updatedVersionDataForAction);
        } else {
            setSelectedItems([]);
        }
    };
    const toggleSelectAllSchema = () => {
        setSelectAllSchema(!selectAllSchema);
        if (!selectAllSchema) {
            setSelectedItems(updatedVersionDataForSchema);
        } else {
            setSelectedItems([]);
        }
    };
    const toggleItemSelection = async (item: any) => {
        if (selectedItems.includes(item)) {
            setSelectedItems(selectedItems.filter((selectedItem) => selectedItem !== item));
        } else {
            setSelectedItems([...selectedItems, item]);
        }
    };

    return (
        <div className={"content-block dx-card responsive-paddings"}>
            <ApprovalHeader
                documentByIdResult={documentByIdResult}
                sourceSubscription={sourceSubscription}
                selectedItems={selectedItems}
                destinationSubscription={destinationSubscription} />

            <div className="grid-header-actions">
                <div className='action-div'>
                    <TreeView
                        dataSource={updatedVersionDataForAction}
                        type={'Action'}
                        selectAll={selectAllAction}
                        toggleItemSelection={toggleItemSelection}
                        selectedItems={selectedItems}
                        onTypeClick={onActionClick}
                        onTypeExpandClick={onActionExpandClick}
                        toggleSelectAll={toggleSelectAllAction} />

                    <TreeView
                        dataSource={updatedVersionDataForSchema}
                        type={'Schema'}
                        selectAll={selectAllSchema}
                        toggleItemSelection={toggleItemSelection}
                        selectedItems={selectedItems}
                        onTypeClick={onSchemaClick}
                        onTypeExpandClick={onSchemaExpandClick}
                        toggleSelectAll={toggleSelectAllSchema} />
                </div>
                {
                    selectedItems.length > 0 &&
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                        {selectedItems?.map((item: any, key: any) =>
                            <ActionAndSchemaComparer
                                key={item.id}
                                type={item.type}
                                title={item.DisplayName}
                                documentId={item.id}
                                sourceSubscription={sourceSubscription}
                                destinationSubscription={destinationSubscription}
                            />)}
                    </div>
                }
            </div>
        </div >
    )
}

export default ApprovalTreeView
