import { useEffect } from "react";
import { useParams } from "react-router-dom";
import { DXForm } from "../../components/atoms";
import { getNotificationAPI, updateNotificationAPI } from "../../redux/actions";
import { useAppDispatch, useAppSelector } from "../../store/customHooks";

export const ViewNotification = () => {

    const { id } = useParams()
    const dispatch = useAppDispatch()

    const notificationData = useAppSelector((state) => state.notification.notification);


    useEffect(() => {
        if (id) {
            GetNotificationAPI()
        }
    }, [id])

    const GetNotificationAPI = async () => {
        const result: any = await dispatch(getNotificationAPI(id))
        if (result) {
            let request: any = {}
            dispatch(updateNotificationAPI(request,  id ? id : ""))
        }
    }

    return (
        <div>
            <div className={"content-block dx-card responsive-paddings"}>

                <DXForm readOnly formData={notificationData} />

            </div>
        </div>

    )
}
