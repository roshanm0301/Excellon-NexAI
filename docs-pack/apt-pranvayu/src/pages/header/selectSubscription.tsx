import { DXSelect } from '../../components/atoms';

const SelectSubscription = (props: any) => {
    const { callback, subscriptions, subscription } = props

    const contextMenuItemClickHandler = (e: any) => {
        if (e) {
            let find = subscriptions?.find((i: any) => i.SystemName === e)
            callback(find)
        }
    };

    return (
        <div>
            <DXSelect
                value={subscription}
                items={subscriptions}
                onValueChange={contextMenuItemClickHandler}
                placeholder={'Select Subscription'}
                labelMode="floating"
                displayExpr={"SystemName"}
                valueExpr={'SystemName'}
                searchEnabled={true}
                width={180}
            />
        </div>

    )
}

export default SelectSubscription