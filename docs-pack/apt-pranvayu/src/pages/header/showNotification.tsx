import { List } from 'devextreme-react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DXButton } from '../../components/atoms';
import { DXPopover } from '../../components/molecules/PopOver';
import { getNotificationPagingAPI } from '../../redux/actions';
import { useAppDispatch, useAppSelector } from '../../store/customHooks';
import './Header.scss';

const ShowNotification = () => {
    const dispatch = useAppDispatch();
    const navigate = useNavigate();
    const [show, setShow] = useState(false);

    const { notificationList, unReadCount } = useAppSelector((state) => state.notification);

    const unreadNotifications = notificationList.filter(
        (item: any) => item.IsRead === false
    );

    useEffect(() => {
        getNotification();
    }, []);

    const getNotification = async () => {
        const params = { skip: 0, take: 1000 };
        await dispatch(getNotificationPagingAPI(params, "show"));
    };

    const onItemClick = (item: any) => {
        navigate(`/view-notification/${item?.itemData.id}`);
        setShow(false);
        getNotification();
    };

    const onViewNotification = () => {
        setShow(!show);
    };

    const showMore = () => {
        navigate('/list-notification');
        setShow(false);
    };

    return (
        <div>
            <div id="show" className="notification-button">
                <DXButton
                    text=""
                    type="default"
                    icon="bell"
                    onClick={onViewNotification}
                />
                {notificationList && (
                    <span className="notify-badge">{unReadCount}</span>
                )}
            </div>

            {show && (
                <DXPopover
                    target="#show"
                    showEvent="click"
                    position="top"
                    width={unReadCount ? 300 : 200}
                    height={unReadCount ? 500 : 300}
                >
                    <div className="notification-popover-content">
                        {unReadCount ? (
                            <List
                                onItemClick={onItemClick}
                                height={420}
                                dataSource={unreadNotifications}
                                width={300}
                                displayExpr="Message"
                            />
                        ) : (
                            <div className="notification-empty">
                                No updated notifications
                            </div>
                        )}
                        <div className="notification-button">
                            <DXButton
                                type="default"
                                stylingMode="text"
                                text="Show All"
                                onClick={showMore}
                            />
                        </div>
                    </div>
                </DXPopover>
            )}
        </div>
    );
};

export default ShowNotification;