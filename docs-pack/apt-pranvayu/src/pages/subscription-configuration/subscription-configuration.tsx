import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { v4 } from "uuid";
import { DXForm, DXSelect } from "../../components/atoms";
import { subscriptionIdentification, whoAmI } from "../../redux/actions";
import { useAppDispatch } from "../../store/customHooks";
import { getLocalData, localDataKey, removeLocalData, setLocalData } from "../../utility/utils";

export default function SubscriptionConfiguration() {
  const defaultFormData = {
    Subscription: "",
    ClientId: "",
    ClientSecret: "",
    BASE_URL: "",
    Name: ""
  }
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ ...defaultFormData });
  const [listData, setListData] = useState<any>([]);
  const [row, setRow] = useState("");
  const [error, setError] = useState("")
  const [selectSubscription, setSelectSubscription] = useState("");

  React.useEffect(() => {
    removeLocalData(localDataKey);
    const data = getLocalData('LOGGED_IN_SUBSCRIPTIONS')
    setListData(data)
    dispatch({ type: "IS_BASE_PRODUCT", payload: null });
  }, []);

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    let _formData = { ...formData, id: v4() }
    let updatedData: any = [];
    if (row !== "") {
      // update record
      updatedData = listData?.map((item: any) => {
        if (item.id === row) {
          return { ...item, ..._formData };
        }
        return item;
      });
    } else {
      // add new record 
      const newRecord = { ...formData, id: v4() };
      const found = listData?.some((item: any) => item.Subscription === newRecord.Subscription);
      if (!found) {
        updatedData = [...(listData || []), newRecord]
      } else {
        setError("You have already login with this Subscription")
      }
    }
    if (updatedData?.length > 0) {
      setLocalData("CONFIG_DATA", formData);
      dispatch({ type: "CONFIG_DATA", payload: formData });
      setError("")
      const result: any = await dispatch(whoAmI());
      if (result) {
        setListData(updatedData);
        setLocalData("LOGGED_IN_SUBSCRIPTIONS", updatedData)
        setLocalData("IS_BASE_PRODUCT", 'Pranwayu')
        dispatch(subscriptionIdentification('Pranwayu'));
        navigate(`/login`);
      }
    }
  };

  // const onItemDeleteClick = (e: any) => {
  //   const itemId = e.itemData.id;
  //   const updatedListData = listData.filter((item: any) => item.id !== itemId);
  //   setListData(updatedListData);
  //   setFormData(defaultFormData)
  //   setLocalData("LOGGED_IN_SUBSCRIPTIONS", updatedListData)
  // }

  const ClearFormData = () => {
    setFormData(defaultFormData)
    setRow("")
    setError("")
    setSelectSubscription("")
  }
  const onValueChanged = (value: any) => {
    setSelectSubscription(value)
    if (value) {
      let _formData = listData?.find((item: any) => item.id === value)
      setRow(value)
      setFormData({ ..._formData })
      setError("")
    }else{
      setRow("")
      setFormData({...defaultFormData})
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'row' }}>
      <div style={{ width: listData?.length > 0 ? "310px" : "400px" }}>
        <form
          action="your-action"
          onSubmit={handleSubmit}
          className="subscription-form"
        >
          <DXForm
            formData={formData}
            cssClass="no-margin"
            width="100%"
            // labelMode="center"
            stylingMode="outlined"
            items={[
              {
                label: { text: "Name", location: "top" },
                dataField: "Name",
                isRequired: true,
                // validationRules: [
                //   {
                //     type: "required",
                //     message: isRequiredField("Name"),
                //   },
                //   {
                //     type: "pattern",
                //     pattern: regEx.minLength,
                //     message: "Enter valid Name with 20 character",
                //   },
                // ],
              },
              {
                label: { text: "Subscription", location: "top" },
                dataField: "Subscription",
                isRequired: true,
              },
              {
                label: { text: "ClientId", location: "top" },
                dataField: "ClientId",
                isRequired: true,
              },
              {
                label: { text: "ClientSecret", location: "top" },
                dataField: "ClientSecret",
                isRequired: true,
              },
              {
                label: { text: "Base URL", location: "top" },
                dataField: "BASE_URL",
                isRequired: true,
              },
              {
                itemType: "group",
                caption: "",
                cssClass: "no-margin",
                colCount: !row ? 1 : 2,
                items: [
                  {
                    itemType: "button",
                    horizontalAlignment: !row ? 'center' : "left",
                    buttonOptions: {
                      text: "NEXT",
                      // text: row ? "UPDATE/NEXT" : "NEXT",
                      type: "default",
                      useSubmitBehavior: true,
                    },
                  },
                  {
                    itemType: "button",
                    horizontalAlignment: "right",
                    visible: row ? true : false,
                    buttonOptions: {
                      text: "CLEAR",
                      type: "default",
                      stylingMode: "outlined",
                      useSubmitBehavior: false,
                      onClick: ClearFormData,
                    },
                  },
                ],
              },
            ]}
          ></DXForm>

          {error && <span className="error-text">{error}</span>}
        </form>
      </div>

      {listData?.length > 0 &&
        <DXSelect
          height={30}
          // width={100}
          items={listData}
          displayExpr="Name"
          valueExpr="id"
          placeholder="Logged In Subscriptions"
          value={selectSubscription}
          // defaultOpened={true}
          opened={true}
          searchEnabled={true}
          onValueChange={onValueChanged}
        />
      }
    </div>
  );
}
