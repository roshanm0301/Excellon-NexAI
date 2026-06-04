import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DXButton, DXCheckbox, DXInput } from '../../components/atoms';
import { addSubscriptionSettingAPI, getSubscriptionSettingAPI, getSubscriptionSettingValueAPI, updateSubscriptionSettingAPI } from '../../redux/actions';
import { useAppDispatch, useAppSelector } from '../../store/customHooks';
import { setLocalData } from '../../utility/utils';

const SubscriptionSetting = (props: any) => {
    const { editMode, subscriptionId } = props;
    const dispatch = useAppDispatch();
    const navigate = useNavigate();
    let { subscriptionSettingList, subscriptionSettingValueList } = useAppSelector((state) => state.subscription);
    const [subscriptionSettings, setSubscriptionSettings] = useState<any>([]);
    let { config } = useAppSelector((state) => state.auth);

    useEffect(() => {
        (async () => {
            await dispatch(getSubscriptionSettingAPI(subscriptionId ? subscriptionId : config.Subscription));
            await dispatch(getSubscriptionSettingValueAPI(subscriptionId ? subscriptionId : config.Subscription))
        })()
    }, [])

    useEffect(() => {
        const subscriptionSettings: any[] = [];

        for (const iterator of subscriptionSettingList) {
            let item = { ...iterator };

            // Edit Case
            if (subscriptionSettingValueList && subscriptionSettingValueList?.length > 0 && editMode === true) {
                for (const valueIterator of subscriptionSettingValueList) {
                    if (iterator.SystemName === valueIterator.SubscriptionSettingCode) {
                        item.Value = valueIterator.Value;
                        item.SubscriptionSettingCode = valueIterator.SubscriptionSettingCode
                        item.id = valueIterator.id
                        item.id = valueIterator.id //set Document for update from subscriptionSettingValueList
                        subscriptionSettings.push(item)
                    }
                }
            } else {
                // Add Case
                if (item.Type === 'Boolean') {
                    item.Value = false
                    subscriptionSettings.push(item)
                } else if (item.Type === 'Number') {
                    item.Value = 0;
                    subscriptionSettings.push(item)
                }
            }
        }
        setSubscriptionSettings(subscriptionSettings)

    }, [subscriptionSettingList, subscriptionSettingValueList])

    const handleInputChange = (e: any, item: any, index: number) => {
        const updateList = [...subscriptionSettings]
        updateList[index].Value = e;
        updateList[index].SubscriptionSettingCode = item.SystemName;
        updateList[index].id = item.id;
        setSubscriptionSettings([...updateList])
        const _subscriptionSettingsValue = updateList
            ?.filter(({ SubscriptionSettingCode }) => {
                return SubscriptionSettingCode;      //set only those data which having SubscriptionSettingCode
            })
            .map(({ SubscriptionSettingCode, Value }) => ({ SubscriptionSettingCode, Value }));

        setLocalData("SUBSCRIPTION_SETTING_CREATE", _subscriptionSettingsValue);
    }

    const onSubmitClick = async () => {
        if (subscriptionSettingValueList && subscriptionSettingValueList?.length > 0 && editMode === true) {
            const _subscriptionSettingsForUpdate = subscriptionSettings?.map(({ SubscriptionSettingCode, Value, id }: any) => ({ SubscriptionSettingCode, Value, id }));
            const res: any = await dispatch(updateSubscriptionSettingAPI(subscriptionId, { Values: _subscriptionSettingsForUpdate }))
            if (res?.success) navigate('/subscription')
        } else {
            const _subscriptionSettings = subscriptionSettings?.map(({ SubscriptionSettingCode, Value }: any) => ({ SubscriptionSettingCode, Value }));
            const result: any = await dispatch(addSubscriptionSettingAPI({ Values: _subscriptionSettings }))
            // if (result?.success) navigate('/subscription')
        }
    };
    return (
        <div className={"content-block dx-card responsive-paddings"}>
            <div style={{ margin: '20px' }}>
                {subscriptionSettings?.map((item: any, index: number) => (
                    <div style={{ display: 'flex', paddingBottom: '10px' }} key={item._id}>
                        <span style={{ width: '300px' }}>
                            {item.SystemName}&nbsp;-&nbsp;{item.SystemName}
                        </span>
                        <>
                            : &nbsp;&nbsp;
                        </>
                        {item.Type === "Boolean" ? (
                            <DXCheckbox text={""}
                                value={item.Value}
                                onValueChanged={(e) => handleInputChange(e, item, index)} />
                        ) : (
                            <DXInput
                                label=""
                                onChange={(e: any) => handleInputChange(e, item, index)}
                                defaultValue={item.Value}
                                value={item.Value.toString()}
                            >
                            </DXInput>
                        )}
                    </div>
                ))}
                {editMode === true &&
                    <DXButton
                        id="schema-btn-save"
                        type="default"
                        text={subscriptionSettingValueList?.length > 0 && editMode === true ? "UPDATE" : "SAVE"}
                        useSubmitBehavior={false}
                        stylingMode="contained"
                        icon="save"
                        onClick={onSubmitClick}
                    />
                }

            </div>
        </div>
    )
}

export default SubscriptionSetting