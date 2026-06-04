import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { DXForm } from "../../components/atoms";
import { regEx } from "../../components/constant/regex";
import {
  addProviderAPI,
  getProviderListAPI,
  getProviderListPagingAPI,
  updateProviderAPI,
} from "../../redux/actions";
import { useAppDispatch, useAppSelector } from "../../store/customHooks";
import { RootState } from "../../store/store";
import { isRequiredField, isValidField } from "../../utility/utils";
import { IProvisioningRequestStatus } from "../actionWorkflow/rule";
import { IContainerProps } from "../schema";
import { ProviderData, ProviderTypes } from "./provider.entity";

const AddEditProvider = (props: IContainerProps) => {
  const { id, data, isActive } = props;
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const [type, setType] = useState("");
  const [providerFormData, setProviderFormData] = useState<any>({
    ...ProviderData,
  });
  const selectedUser = useSelector(
    (state: RootState) => state.auth.selectedUser
  );
  let providers = useAppSelector((state) => state.provider.providers);

  useEffect(() => {
    if (data) {
      setProviderFormData((st: any) => {
        return { ...st, ...data };
      });
      setType(data?.Type);
    }
  }, [data]);

  useEffect(() => {
    dispatch(getProviderListAPI(null));
  }, []);

  const addEditProvider = async (item: any) => {
    setProviderFormData((st: any) => {
      return { ...st, ...providerFormData };
    });
    let optionsData = { ...providerFormData };
    delete optionsData.SystemName;
    delete optionsData.DisplayName;

    let _optionsData: any;

    if (providerFormData.type === ProviderTypes.minio) {
      _optionsData = {
        ...optionsData,
        "s3.region": optionsData.s3_region,
        "aws.access.key.id": optionsData.aws_access_key_id,
        "aws.secret.access.key": optionsData.aws_secret_access_key,
      };

      delete _optionsData.s3_region;
      delete _optionsData.aws_access_key_id;
      delete _optionsData.aws_secret_access_key;
    } else {
      _optionsData = {
        ...optionsData,
      };
    }

    let _providerFormData = {
      Options: _optionsData,
      SystemName: providerFormData.SystemName,
      DisplayName: providerFormData?.DisplayName,
    };

    let result: any = null;
    if (id) {
      result = await dispatch(updateProviderAPI(id, _providerFormData));
    } else {
      result = await dispatch(addProviderAPI(_providerFormData));
    }

    navigate("/provider");
  };

  const handleSubmit = (e: any) => {
    e.preventDefault();
    // return false
    addEditProvider(IProvisioningRequestStatus.Draft);
  };

  const handleSendForApproval = () => {
    addEditProvider(IProvisioningRequestStatus.PendingForApproval);
  };

  const onFieldDataChanged = (e: any) => {
    setType(e.value);
    switch (e.value) {
      case ProviderTypes.mongodb:
        delete providerFormData.host;
        delete providerFormData.port;
        delete providerFormData.username;
        delete providerFormData.synchronize;
        delete providerFormData.endPoint;
        delete providerFormData.useSSL;
        delete providerFormData.accessKey;
        delete providerFormData.secretKey;
        delete providerFormData.s3_region;
        delete providerFormData.aws_access_key_id;
        delete providerFormData.aws_secret_access_key;
        delete providerFormData.auth;
        delete providerFormData.ssl;
        delete providerFormData.node;
        break;

      case ProviderTypes.postgres:
        delete providerFormData.url;
        delete providerFormData.authSource;
        delete providerFormData.endPoint;
        delete providerFormData.useSSL;
        delete providerFormData.accessKey;
        delete providerFormData.secretKey;
        delete providerFormData.s3_region;
        delete providerFormData.aws_access_key_id;
        delete providerFormData.aws_secret_access_key;
        delete providerFormData.auth;
        delete providerFormData.ssl;
        delete providerFormData.node;
        break;

      case ProviderTypes.minio:
        delete providerFormData.subscriptionName;
        delete providerFormData.database;
        delete providerFormData.url;
        delete providerFormData.authSource;
        delete providerFormData.password;
        delete providerFormData.host;
        delete providerFormData.username;
        delete providerFormData.synchronize;
        delete providerFormData.auth;
        delete providerFormData.ssl;
        delete providerFormData.node;
        break;

      case ProviderTypes.elasticsearch:
        delete providerFormData.port;
        delete providerFormData.endPoint;
        delete providerFormData.subscriptionName;
        delete providerFormData.database;
        delete providerFormData.authSource;
        delete providerFormData.password;
        delete providerFormData.host;
        delete providerFormData.username;
        delete providerFormData.synchronize;
        delete providerFormData.useSSL;
        delete providerFormData.accessKey;
        delete providerFormData.secretKey;
        delete providerFormData.s3_region;
        delete providerFormData.aws_access_key_id;
        delete providerFormData.aws_secret_access_key;
        delete providerFormData.url;
        break;

      default:
        break;
    }
    setProviderFormData((st: any) => {
      if (type === ProviderTypes.elasticsearch) {
        return { ...st, ...providerFormData, ssl: { rejectUnauthorized: false } };
      } else {
        return { ...st, ...providerFormData };
      }
    });
  };

  const handleIsVisible = (_datafield: string, _type: string) => {
    switch (_datafield) {
      case 'database':
        if (_type === ProviderTypes.minio) {
          return false
        } else if (_type === ProviderTypes.elasticsearch) {
          return false
        } else {
          return true
        }
      case 'password':
        if (_type === ProviderTypes.minio) {
          return false
        } else if (_type === ProviderTypes.elasticsearch) {
          return false
        } else {
          return true
        }
      default:
        return false
    }
  }

  return (
    <div>
      <div className={"content-block dx-card responsive-paddings"}>
        <form action="your-action" onSubmit={handleSubmit}>
          <DXForm
            // onFieldDataChanged={onFieldDataChanged}
            formData={providerFormData}
            stylingMode="outlined"
            colCount={1}
            items={[
              {
                itemType: "group",
                cssClass: "no-margin",
                colCount: 2,
                items: [
                  {
                    label: { text: "System Name", location: "top" },
                    dataField: "SystemName",
                    isRequired: true,
                  },
                  {
                    label: { text: "Display Name", location: "top" },
                    dataField: "DisplayName",
                    isRequired: true,
                  },
                  {
                    label: { text: "Type", location: "top" },
                    dataField: "type",
                    editorType: "dxSelectBox",
                    disabled: id ? true : false,
                    editorOptions: {
                      valueExpr: "ProviderType",
                      displayExpr: "ProviderType",
                      dataSource: providers,
                      searchEnabled: true,
                      onValueChanged: onFieldDataChanged,
                    },
                  },
                  {
                    label: { text: "Subscription Name", location: "top" },
                    dataField: "subscriptionName",
                    visible:
                      type === ProviderTypes.mongodb && !id ? true : false,
                    isRequired: true,
                  },
                  {
                    label: { text: "URL", location: "top" },
                    dataField: "url",
                    visible: type === ProviderTypes.mongodb && !id ? true : false,
                    isRequired: true,
                  },
                  {
                    label: { text: "AuthSource", location: "top" },
                    dataField: "authSource",
                    visible:
                      type === ProviderTypes.mongodb && !id ? true : false,
                    isRequired: true,
                  },
                  {
                    label: { text: "Database", location: "top" },
                    dataField: "database",
                    isRequired: true,
                    visible: handleIsVisible('database', type) && !id ? true : false,
                  },
                  {
                    label: { text: "Password", location: "top" },
                    dataField: "password",
                    isRequired: true,
                    visible: handleIsVisible('password', type) && !id ? true : false,
                  },
                  {
                    label: { text: "Host", location: "top" },
                    dataField: "host",
                    visible:
                      type === ProviderTypes.postgres && !id ? true : false,
                    isRequired: true,
                  },
                  {
                    label: { text: "port", location: "top" },
                    dataField: "port",
                    editorType: "dxNumberBox",
                    visible:
                      type === ProviderTypes.postgres ||
                        (type === ProviderTypes.minio && !id)
                        ? true
                        : false,
                    isRequired: true,
                    validationRules: [
                      {
                        type: "required",
                        message: isRequiredField("port"),
                      },
                      {
                        type: "pattern",
                        pattern: regEx.number,
                        message: isValidField(`path ${regEx.number}`),
                      },
                    ],
                  },
                  {
                    label: { text: "Username", location: "top" },
                    dataField: "username",
                    visible:
                      type === ProviderTypes.postgres && !id ? true : false,
                    isRequired: true,
                  },
                  {
                    label: { text: "Synchronize", location: "top" },
                    dataField: "synchronize",
                    editorType: "dxCheckBox",
                    visible:
                      type === ProviderTypes.postgres && !id ? true : false,
                  },
                  {
                    label: { text: "End Point", location: "top" },
                    dataField: "endPoint",
                    visible: type === ProviderTypes.minio && !id ? true : false,
                    isRequired: true,
                  },
                  {
                    label: { text: "Use SSL", location: "left" },
                    dataField: "useSSL",
                    editorType: "dxCheckBox",
                    visible: type === ProviderTypes.minio && !id ? true : false,
                  },
                  {
                    label: { text: "Access Key", location: "top" },
                    dataField: "accessKey",
                    visible: type === ProviderTypes.minio && !id ? true : false,
                    isRequired: true,
                  },
                  {
                    label: { text: "Secret Key", location: "top" },
                    dataField: "secretKey",
                    visible: type === ProviderTypes.minio && !id ? true : false,
                    isRequired: true,
                  },
                  {
                    label: { text: "s3.region", location: "top" },
                    dataField: "s3_region",
                    visible: type === ProviderTypes.minio && !id ? true : false,
                    // isRequired: true,
                  },
                  {
                    label: { text: "aws.access.key.id", location: "top" },
                    dataField: "aws_access_key_id",
                    visible: type === ProviderTypes.minio && !id ? true : false,
                    // isRequired: true,
                  },
                  {
                    label: { text: "aws.secret.access.key", location: "top" },
                    dataField: "aws_secret_access_key",
                    visible: type === ProviderTypes.minio && !id ? true : false,
                    // isRequired: true,
                  },
                  {
                    label: { text: "Node", location: "top" },
                    dataField: "node",
                    visible: type === ProviderTypes.elasticsearch && !id ? true : false,
                    // isRequired: true,
                  },
                  {
                    label: { text: "Username", location: "top" },
                    dataField: "auth.username",
                    visible: type === ProviderTypes.elasticsearch && !id ? true : false,
                    // isRequired: true,
                  },
                  {
                    label: { text: "Password", location: "top" },
                    dataField: "auth.password",
                    visible: type === ProviderTypes.elasticsearch && !id ? true : false,
                    // isRequired: true,
                  },
                  {
                    label: { text: "RejectUnauthorized", location: "top" },
                    dataField: "ssl.rejectUnauthorized",
                    editorType: "dxCheckBox",
                    visible:
                      type === ProviderTypes.elasticsearch && !id ? true : false,
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
                    visible: isActive,
                    buttonOptions: {
                      text: id ? "UPDATE" : "SUBMIT",
                      type: "default",
                      useSubmitBehavior: true,
                      icon: "save",
                    },
                  },
                  {
                    itemType: "button",
                    buttonOptions: {
                      text: "CANCEL",
                      icon: "revert",
                      type: "default",
                      stylingMode: "outlined",
                      onClick: function () {
                        if (isActive === false) {
                          navigate("/approval");
                        } else {
                          navigate("/provider");
                        }
                      },
                    },
                  },
                  {
                    itemType: "button",
                    visible: selectedUser === true,
                    disabled: true,
                    buttonOptions: {
                      disabled: true,
                      text: "SEND FOR APPROVAL",
                      icon: "lock",
                      type: "default",
                      stylingMode: "outlined",
                      onClick: handleSendForApproval,
                    },
                  },
                ],
              },
            ]}
          />
        </form>
      </div>
    </div>
  );
};

export default AddEditProvider;
