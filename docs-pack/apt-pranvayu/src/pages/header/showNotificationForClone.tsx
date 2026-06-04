import { List } from 'devextreme-react';
import { useEffect, useState } from 'react';
import { v4 } from "uuid";
import { DXButton } from '../../components/atoms';
import { DXPopover } from '../../components/molecules/PopOver';
import { useAppSelector } from '../../store/customHooks';
import './Header.scss';

const ShowNotificationForClone = (props: any) => {
    const [showNotification, setShowNotification] = useState(false)
    const [listData, setListData] = useState<any>([]);
    const socket = useAppSelector((state) => state.auth.socket);

    // useEffect(() => {
    //     const handleSocketData = (key: string, data: any) => {
    //         if (data) {
    //             const newObj = { message: data, id: v4() };
    //             setListData((prevArray: any) => [...prevArray, newObj]);
    //         }
    //     };

    //     if (socket) {
    //         const socketListeners = [
    //             "WhoAmIIdentity",
    //             "AdminIdentity",
    //             "ConfigCollection",
    //             "MenuAccessCollection",
    //             "RoleCollection",
    //             "NewInstance",
    //             "CloneRoleMenuMappingCollection",
    //             "CloneTemplateCollection",
    //             "CloneSettingCollection"
    //         ];

    //         socketListeners.forEach((key) => {
    //             socket.on(key, (data: any) => handleSocketData(key, data));
    //         });
    //     }
    // }, [socket]);

    const onViewNotification = () => {
        setShowNotification(!showNotification)
    }

    const clearAll = () => {
        setListData([])
    }

    return (
        <div>
            <div id="showNotification">
                <div className="notification-button">
                    <DXButton
                        text=""
                        type="default"
                        icon="preferences"
                        visible={listData?.length > 0 ? true : false}
                        onClick={onViewNotification}
                    />

                    {listData?.length > 0 && <span className="notify-badge-for-clone">
                        {listData?.length}
                    </span>}

                </div>
            </div>
            {showNotification && listData.length > 0 &&<div>
                <DXPopover
                    target="#showNotification"
                    showEvent="click"
                    position="top"
                    width={listData.length > 0 ? 300 : 200}
                    height={listData.length > 0 ? 500 : 300}
                >
                    <div style={{ position: "relative" }}>
                        <List
                            height={420}
                            style={{ right: 10, width: "10px", left: 190 }}
                            dataSource={listData}
                            width={300}
                            displayExpr={"message"}
                        />

                        <div className='notification-button' >
                            <DXButton type='default' stylingMode="text" visible={listData.length > 0 ? true : false} text='Clear All' onClick={clearAll} />
                        </div>
                    </div>
                </DXPopover>
            </div>}
        </div>

    )
}

export default ShowNotificationForClone