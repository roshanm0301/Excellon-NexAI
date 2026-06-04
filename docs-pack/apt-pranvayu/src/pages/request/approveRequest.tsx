import { TagBox } from 'devextreme-react';
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from "react-router-dom";
import { DXButton, DXCheckbox, DXInput } from '../../components/atoms';
import { DXPopup } from '../../components/template';
import { addActionAPI, addSchemaAPI, approvedApprovalAPI, getActionAPI, getActionListAPI } from '../../redux/actions';
import { useAppDispatch, useAppSelector } from "../../store/customHooks";
import { IProvisioningRequestStatus } from "../actionWorkflow/rule";
import { DefaultCrud, requestType } from '../schema';
import './request.scss';

export const ApproveRequest = (props: any) => {
    const dispatch = useAppDispatch();
    const navigate = useNavigate();

    const { id } = useParams();

    let { formData, resultData, schemaId, onSelectToggle } = props;

    const [modify, setModify] = useState<any>(false)
    const [clone, setClone] = useState<any>(false)
    const [showForm, setShowForm] = useState<any>(false)

    const [systemName, setSystemName] = useState<any>("")
    const [isPopUpOpen, setIsPopUpOpen] = useState(false);
    const [selectedActions, setSelectedActions] = useState([])

    const { actions, count } = useAppSelector((state) => state.action);

    useEffect(() => {
        if (schemaId) dispatch(getActionListAPI(schemaId));
    }, [schemaId]);

    const onModifyChange = (e: any) => {
        setShowForm(false)
        setModify(!modify)
        setClone(false)
    }

    const onCloneChange = (e: any) => {
        setModify(false)
        setClone(!clone)
        setShowForm(!clone)
    }
    const onChange = (e: any) => {
        setSystemName(e)
    }

    const onCancelClick = () => {
        // setModify(false)
        setIsPopUpOpen(false)
    }

    const statusApproved = async (item: any) => {
        // setFormData({ ...formData });
        let _resultData = resultData

        const _formData = {
            ...formData,
            IsLock: false,
            Status: "DRAFT"
        }
        const _payload = {
            ..._resultData,
            Status: item,
            Entity: _formData,
        };
        let payload = {
            ..._payload
        }

        let result: any = null;
        if (resultData?.id) {
            result = await dispatch(approvedApprovalAPI(resultData?.id, payload));
            if (result.success) {
                navigate(`/approval/${requestType.CheckoutRequest}`);
                props.onSelectToggle(false)
            }
        }
    }

    const onConfirmClick = () => {
        setIsPopUpOpen(false)
        if (modify) {
            statusApproved(IProvisioningRequestStatus.Approved)
        }
        if (clone) {
            onConfirmClone();
        }
    }

    const tagBoxChange = (e: any) => {
        setSelectedActions(e)
    }

    const onConfirmClone = async () => {
        let _resultData = resultData

        const _formData = {
            ...formData,
            IsLock: false,
            SystemName: systemName
        }
        const payload = {
            ..._resultData,
            Status: IProvisioningRequestStatus.Approved,
            Entity: _formData,
        };

        delete payload.Entity.id
        delete payload.Entity._id
        delete payload.Entity.id
        delete payload.Entity.PartitionKey
        delete payload.Entity.SubscriptionId

        let createResult: any = null;
        if (!payload.Entity.id) {
            let _payload = {
                ...payload.Entity,
                DefaultCrud: DefaultCrud
            }
            createResult = await dispatch(addSchemaAPI(_payload));
            let ActionResultPayload: any
            if (createResult.success && selectedActions.length > 0) {
                Promise.all(
                    selectedActions.map(async (item: any) => {
                        const ActionResult: any = await dispatch(getActionAPI(item))
                        let _ActionResult = ActionResult

                        delete _ActionResult.id
                        delete _ActionResult._id
                        delete _ActionResult.id
                        delete _ActionResult.PartitionKey

                        ActionResultPayload = {
                            ..._ActionResult,
                            ParentSchemaId: createResult.data.id
                        }

                        const postActionResult: any = await dispatch(addActionAPI(ActionResultPayload))

                        // if () {
                        // }
                    })
                ).then(() => {
                    statusApproved(IProvisioningRequestStatus.Approved)
                })
            } else {
                if (createResult.success) {
                    statusApproved(IProvisioningRequestStatus.Approved)
                }
            }
        }
    }

    const onSubmit = () => {
        setIsPopUpOpen(true)
    }

    const onCancel = () => {
        props.onSelectToggle(false)
    }

    return (
        <div>
            <div className={"content-block dx-card responsive-paddings"}>
                <h4>
                    System Name   : {formData.SystemName} <br />
                    Display Name  : {formData.DisplayName} <br />
                    Table Name    : {formData.TableName} <br />
                    Database Type : {formData.DatabaseType} <br />
                    Entity Type   : {resultData.EntityType} <br />
                    Remark        : {resultData.Remark} <br />
                </h4>
            </div>

            <div className={"content-block dx-card responsive-paddings"}>
                <div style={{ display: "flex", flexDirection: "row", justifyContent: "space-around", paddingTop: '60px', paddingBottom: '60px' }} className='request-container' >
                    <div>
                        <div className="checkBoxstyle" >
                            <DXCheckbox text="Modify"
                                value={modify} onValueChanged={onModifyChange} />
                            <DXCheckbox disabled style={{ marginTop: "5px" }} text="Clone" value={clone} onValueChanged={onCloneChange} />
                        </div>


                    </div>
                    <>
                        {
                            showForm && <div className='inputStyle'>

                                <div className="cardstyle">
                                    <div style={{ display: "flex" }}>
                                        <span>Exsiting System Name :</span> &nbsp;
                                        <DXInput label='' value={formData?.SystemName} disabled onChange={onChange} />
                                    </div>
                                    <div style={{ display: "flex", marginTop: "5px" }}>
                                        <span>New System Name :</span> &nbsp; &nbsp; &nbsp; &nbsp;
                                        <DXInput label='' value={systemName} onChange={onChange} />
                                    </div>
                                    <div style={{ display: "flex", marginTop: "5px" }}>
                                        <span>Select Actions :</span> &nbsp; &nbsp; &nbsp; &nbsp; &nbsp;&nbsp; &nbsp; &nbsp; &nbsp;
                                        <TagBox
                                            dataSource={actions}
                                            displayExpr="SystemName"
                                            valueExpr="id"
                                            multiline={true}
                                            maxDisplayedTags={0}
                                            label=""
                                            stylingMode="outlined"
                                            // labelMode="floating"
                                            showSelectionControls={true}
                                            searchEnabled={true}
                                            width={"51.5%"}
                                            height={"34px"}
                                            onValueChange={tagBoxChange}
                                        />
                                    </div>
                                </div>
                                {/* <DXButton style={{ marginTop: "10px" }} text="Save" type='default' onClick={onCloneSave} /> */}
                            </div>

                        }</>
                    <div style={{ display: "flex", width: "100%", justifyContent: "end", marginRight: "20px" }}>
                        <DXButton style={{ width: "120px", margin: "10px" }} text="Save" type="default" stylingMode="contained" onClick={onSubmit} />
                        <DXButton style={{ width: "120px", margin: "10px" }} text="Cancel" type="default" stylingMode="outlined" onClick={onCancel} />

                    </div>
                </div>

                <DXPopup
                    title=""
                    width="300px"
                    height="120px"
                    visible={isPopUpOpen}
                    onHiding={() => setIsPopUpOpen(false)}
                    showCloseButton={false}
                    showTitle={false}
                >
                    <div>
                        <span>Do you want to modify?</span>
                        <div className="buttonstyle">

                            <DXButton type="default" text="Yes" onClick={onConfirmClick} />
                            <DXButton type="default" text="No" onClick={onCancelClick} />
                        </div>
                    </div>
                </DXPopup>
            </div>

        </div>

    )
}
