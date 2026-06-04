import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { DXDataGrid } from "../../components/atoms";
import { PAGING } from "../../components/constant/constant";
import { GET_NOTIFICATION_LIST_PAGING, getNotificationPagingAPI } from "../../redux/actions";
import { useAppDispatch, useAppSelector } from "../../store/customHooks";
import { IDefaultState } from "../schema";
import { EyeIcon } from "../../assets/icons";


const defaultState: IDefaultState = {
    orderby: "CreatedOn",
    asc: -1,
    page: PAGING.pageIndex,
    take: PAGING.pageSize,
    search: "",
};
export const ListNotification = () => {
    const onRowClick = (e: any) => {
        navigate(`/view-notification/${e.row.data.id}`)

    };

    const NotificationGridColumns = [
        {
            dataField: "id",
            caption: "Document Id",
            visible: true,
            width: "25%",
        },
        {
            dataField: "SubscriptionId",
            caption: "Subscription Id",
            visible: true,
            width: "25%",
        },
        {
            dataField: "Message",
            caption: "Message",
            visible: true,
            width: "25%",
        }, {
            dataField: "IsRead",
            caption: "IsRead",
            visible: true,
            width: "25%",
        }, {
            type: "buttons",
            caption: "Actions",
            width: "25%",
            buttons: [
                {
                    visible: true,
                    hint: "View Request",
                    icon: EyeIcon,
                    onClick: onRowClick,
                },
                // {
                //   visible: true,
                //   hint: "View Request",
                //   icon: TrashIcon,
                // },
            ],
        },

    ];

    const dispatch = useAppDispatch()
    const navigate = useNavigate()
    const [state, setState] = useState({ ...defaultState });

    const { notificationListByPaging, count } = useAppSelector((state) => state.notification);
    useEffect(() => {
        getNotification()
    }, [state])

    const getNotification = async () => {
        // dispatch({ type:GET_NOTIFICATION_LIST_PAGING , notificationList:[] });
        let type = "list"
        await dispatch(getNotificationPagingAPI(state, type));
    }




    const onPageIndexChange = (value: number) => {
        setState({ ...state, page: value });
    };

    const onPageSizeChange = async (value: number) => {
        if (value >= count) {
            setState({ ...state, page: 0, take: count });
        } else {
            setState({ ...state, take: value });
        }
    };
    return (
        <div>
            <div className={"content-block dx-card responsive-paddings"}>
                <DXDataGrid
                    showBorders={true}
                    hoverStateEnabled={true}
                    dataSource={notificationListByPaging}
                    count={count}
                    keyExpr="_id"
                    columns={NotificationGridColumns}
                    defaultPageSize={state.take}
                    onPageIndexChange={onPageIndexChange}
                    onPageSizeChange={onPageSizeChange} />
            </div>
        </div>

    )
}
