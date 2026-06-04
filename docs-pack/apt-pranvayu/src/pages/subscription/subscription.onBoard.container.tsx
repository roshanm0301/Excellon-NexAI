import { memo, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getSubscriptionById } from "../../redux/actions";
import { useAppDispatch } from "../../store/customHooks";
import { SubscriptionOnBoard } from "./subscription.onBoard";

export const SubscriptionOnBoardContainer = memo((props:any) => {
    const dispatch = useAppDispatch();
    const { id } = useParams();
    const{isReadOnly}=props;
    const [subscriptionFormData, setSubscriptionFormData] = useState<any>(null);

    useEffect(() => {
        if (id) {
            (async function () {
                const result: any = await dispatch(getSubscriptionById(id));
                setSubscriptionFormData({ ...subscriptionFormData, ...result });
            })();
        }
    }, []);

    return <SubscriptionOnBoard id={id} data={subscriptionFormData} isActive={true} disableUpdateButtons={true} isReadOnly={isReadOnly}/>;
})
