import { Tabs } from 'devextreme-react';
import { useState } from 'react';
import { SubscriptionTabsDataSource } from './subscription.entity';
import { SubscriptionOnBoardContainer } from './subscription.onBoard.container';
import SubscriptionSetting from './subscription.setting';
import { useParams } from 'react-router-dom';

const SubscriptionSettingContainer = () => {
    const { id } = useParams()
    const [selectedIndex, setSelectedIndex] = useState(1);
    const onSelectionChanged = (args: any) => {
        if (args.name === "selectedIndex") {
            setSelectedIndex(args.value);
        }
    };

    return (
        <div>
            <Tabs
                dataSource={SubscriptionTabsDataSource}
                selectedItem={SubscriptionTabsDataSource[selectedIndex]}
                selectedIndex={selectedIndex}
                onOptionChanged={onSelectionChanged}
            />

            {selectedIndex === 0 &&
                <SubscriptionOnBoardContainer isReadOnly={true} />
            }

            {
                selectedIndex === 1  &&
                <SubscriptionSetting subscriptionId={id} editMode={true} />
            }
        </div >
    )
}

export default SubscriptionSettingContainer