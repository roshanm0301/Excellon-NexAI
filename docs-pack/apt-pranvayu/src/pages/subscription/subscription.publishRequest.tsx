import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DXForm } from '../../components/atoms';
import { addApprovalAPI, getSubscriptionListAPI } from '../../redux/actions';
import { useAppDispatch, useAppSelector } from '../../store/customHooks';
import { IProvisioningRequestStatus, IRequestCrud } from '../actionWorkflow/rule';
import { requestType } from '../schema';
import { publishRequestFormDefinition } from './subscription.entity';

export const PublishRequest = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const [publishRequestFormData, setPublishRequestFormData] = useState({ ...publishRequestFormDefinition })
  let { subscriptions } = useAppSelector((state) => state.subscription);

  useEffect(() => {
    dispatch(getSubscriptionListAPI(null));
  }, []);

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    setPublishRequestFormData({ ...publishRequestFormData })
    let payload = {
      Entity: publishRequestFormData,
      Status: IProvisioningRequestStatus.PendingForApproval,
      RequestType: IRequestCrud.Create,
      EntityType: "Subscription",
      AssignForApproval: "5dec1c81-ab59-47f1-ab6d-3cbb7f07302c",
      Type: requestType.Publish
    };
    await dispatch(addApprovalAPI(payload));
  };

  return (
    <div className={"content-block dx-card responsive-paddings"}>
      <div>
        <form action="your-action" onSubmit={handleSubmit}>
          <DXForm
            stylingMode="outlined"
            formData={publishRequestFormData}
            validationGroup="test"
            items={[
              {
                itemType: "group",
                cssClass: "no-margin",
                colCount: 2,
                name: 'test',
                items: [
                  {
                    label: { text: "Source Subscription", location: "top" },
                    dataField: "SourceSubscription",
                    editorType: "dxSelectBox",
                    isRequired: true,
                    editorOptions: {
                      dataSource: subscriptions,
                      searchEnabled: true,
                      valueExpr: 'id',
                      displayExpr: 'SystemName'

                    },
                  },
                  {
                    label: { text: "Destination Subscription", location: "top" },
                    dataField: "DestinationSubscription",
                    editorType: "dxSelectBox",
                    isRequired: true,
                    editorOptions: {
                      dataSource: subscriptions,
                      searchEnabled: true,
                      valueExpr: 'id',
                      displayExpr: 'SystemName'
                    },
                  },
                ],

              },
              {
                itemType: "group",
                cssClass: "no-margin",
                colCount: 1,
                items: [
                  {
                    label: { text: "Title", location: "top" },
                    dataField: "Title",
                    isRequired: true,
                  },
                  {
                    label: { text: "Description", location: "top" },
                    dataField: "Description",
                    editorType: "dxTextArea",
                  },
                ],
              },
              {
                itemType: "group",
                cssClass: "button-group",
                colCount: 1,
                items: [
                  {
                    itemType: "button",
                    buttonOptions: {
                      text: "SUBMIT",
                      type: "default",
                      useSubmitBehavior: true,
                      icon: "save",
                    },
                  },
                  {
                    itemType: "button",
                    buttonOptions: {
                      text: "Cancel",
                      stylingMode: "outlined",
                      type: "default",
                      icon: "revert",
                      onClick: function () {
                        navigate('/subscription')
                      }
                    },
                  },
                ],
              },
            ]}
          ></DXForm>
        </form>
      </div>
    </div>
  )
}
