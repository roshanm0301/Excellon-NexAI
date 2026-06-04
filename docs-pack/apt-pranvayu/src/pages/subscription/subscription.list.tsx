import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { SearchIcon } from "../../assets/icons";
import {
  DXButton,
  DXDataGrid,
  DXInput,
} from "../../components/atoms";
import { PAGING } from "../../components/constant/constant";
import { DXPopup } from "../../components/template";
import {
  getSubscriptionAPI,
  getSubscriptionPagingAPI,
  showNotification,
} from "../../redux/actions";
import { useAppDispatch, useAppSelector } from "../../store/customHooks";
import { CheckoutProcess } from "./subscription.checkoutProcess";

export const SubscriptionList = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const defaultState = {
    orderby: "CreatedOn",
    asc: -1,
    page: PAGING.pageIndex,
    take: PAGING.pageSize,
    search: "",
  };
  const [state, setState] = useState({ ...defaultState });
  let { subscriptionById, getAllSubscriptionByPaging, pagingCount } =
    useAppSelector((state) => state.subscription);
  let { selectedSubscription } = useAppSelector((state) => state.subscription);
  let isProduct = useAppSelector((state) => state.auth.isProduct);
  const [isOpen, setIsOpen] = useState(false);
  const [subscriptionFormData, setSubscriptionFormData] = useState<any>();

   // SubscriptionList API calling
  useEffect(() => {
    getSubscriptionList();
  }, [state]);

  useEffect(() => {
    getSubscriptionList();
    // return () => {
    //   dispatch(setSubscriptionDetails(null));
    // };
  }, [selectedSubscription]);

  const getSubscriptionList = async () => {
    if (isProduct === "Srishti") {
      await dispatch(getSubscriptionPagingAPI(state));
    } else {
      await dispatch(getSubscriptionAPI(selectedSubscription?.id));
    }
  };

  // add Subscription button click navigate to add Subscription module
  const PublishSubscription = (e: any) => {
    navigate("/publish-subscription");
  };

  const onCloneClick = (e: any) => {
    navigate(`/subscription/edit-subscription-onboard/${e.row.data.id}`);
  };

  const onCheckoutRequest = (e: any) => {
    if (e.row.data.Status === "PUBLISHED") {
      setSubscriptionFormData(e.row.data);
      setIsOpen(!isOpen);
    } else {
      dispatch(
        showNotification({
          isOpen: true,
          message: "Subscription not Published yet!",
          type: "error",
        })
      );
    }
  };

  const onSettingClick = (e: any) => {
    navigate(`/subscription/subscription-setting/${e.row.data.SubscriptionId}`);
  };

  const SubscriptionGridColumn = [
    {
      dataField: "SystemName",
      caption: "System Name",
      visible: true,
    },
    {
      dataField: "DisplayName",
      caption: "Display Name",
      visible: true,
    },
    {
      dataField: "Status",
      caption: "Status",
      visible: true,
    },
    {
      type: "buttons",
      caption: "Actions",
      visible: isProduct === "Pranwayu" ? false : true,
      buttons: [
        {
          text: "edit",
          visible: true,
          hint: "Edit Schema",
          icon: "edit",
          onClick: onCloneClick,
        },
        {
          text: "setting",
          visible: true,
          hint: "Subscription Setting",
          icon: "preferences",
          onClick: onSettingClick,
        },
        {
          text: "checkout",
          hint: "Send for Checkout Request",
          icon: "airplane",
          visible: false,
          onClick: onCheckoutRequest,
        },
      ],
    },
  ];

  const onPopupChange = (e: boolean) => {
    setIsOpen(e);
  };
  const onPageIndexChange = (value: number) => {
    setState({ ...state, page: value });
  };

  const onPageSizeChange = async (value: number) => {
    if (value >= pagingCount) {
      setState({ ...state, page: 0, take: pagingCount });
    } else {
      setState({ ...state, take: value });
    }
  };

  return (
    <div>
      <div className={"content-block dx-card responsive-paddings"}>
        <div className="grid-header-actions">
          {isProduct === "Srishti" && (
            <DXInput
              label="Search"
              required={true}
              onChange={(e: any) => setState({ ...state, search: e })}
              defaultValue={state.search}
              value={state.search}
              width={280}
              showIcon={true}
              options={{ icon: SearchIcon }}
            ></DXInput>
          )}

          <div>
            <DXButton
              visible={false}
              text="Publish"
              icon="upload"
              type="default"
              onClick={() => navigate("/subscription/publish-request")}
            />
            <DXButton
              visible={isProduct !== "Pranwayu"}
              text="onBoard Subscription"
              icon="add"
              type="default"
              onClick={() => navigate("/subscription/subscription-onboard")}
            />
          </div>
        </div>

        {isProduct === "Srishti" ? (
          <DXDataGrid
            dataSource={getAllSubscriptionByPaging}
            keyExpr="id"
            columns={SubscriptionGridColumn}
            count={pagingCount}
            // Pagination
            defaultPageSize={state.take}
            onPageIndexChange={onPageIndexChange}
            onPageSizeChange={onPageSizeChange}
          />
        ) : (
          <DXDataGrid
            dataSource={subscriptionById}
            keyExpr="id"
            count={subscriptionById?.length}
            columns={SubscriptionGridColumn}
            visible={false}
          />
        )}
        <DXPopup
          title=""
          visible={isOpen}
          onHiding={() => setIsOpen(false)}
          showCloseButton={false}
          showTitle={false}
          width="400px"
          height="300px"
        >
          <CheckoutProcess
            data={subscriptionFormData}
            setIsOpen={onPopupChange}
          />
        </DXPopup>
      </div>
    </div>
  );
};
