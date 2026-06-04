import { useState } from 'react';
import { useNavigate } from 'react-router';
import { DXButton } from '../../components/atoms';
import { DXPopup } from '../../components/template';
import AvatarIcon from "../../assets/avatar-image.png";

const UserCard = (props: any) => {
    const { item, roles, onDeleteClick, subscriptions } = props;
    const [isOpen, setIsOpen] = useState(false);
    const [subscriptionOpen, setIsSubscriptionOpen] = useState(false);
    const navigate = useNavigate();

    const filterNamesByIds = (idArray: any) => {
        const _subscriptions: string[] = subscriptions?.length > 0
            ? subscriptions
                .filter((sub: any) => idArray?.includes(sub.id))
                .map((sub: any) => sub.SystemName)
            : [];

        return _subscriptions.length > 0 ? (
            <ul className="subscription-list">
                {_subscriptions.map((name: string) => (
                    <li key={name}>{name}</li>
                ))}
            </ul>
        ) : (
            <p className="text-center text-muted">No data found.</p>
        );
    };

    const onSubscriptionClick = () => {
        setIsSubscriptionOpen(true);
    };

    return (
        <div className="card">
            <div className="user-info">
                <div className="form-avatar-card">
                    <img alt={`${item?.FirstName} ${item?.LastName}`} src={AvatarIcon} />
                </div>
            </div>
            <div className="text">
                <div className="text-center fontWeight">
                    {item?.FirstName} {item?.LastName}
                </div>
                <div className="text-center">
                    <span className="fontWeight">Role: </span>
                    {roles?.find((e: any) => e.id === item.RoleId)?.SystemName}
                    <div className="user-card-align">
                        {item?.Subscriptions?.length > 0 && (
                            <DXButton
                                text="Subscriptions"
                                stylingMode="text"
                                icon="info"
                                onClick={onSubscriptionClick}
                            />
                        )}
                    </div>
                </div>
                <div className="user-card-align">
                    <div className="card-actions">
                        <DXButton
                            hint="Reset Password"
                            text=""
                            icon="imgarunlock"
                            type="default"
                            onClick={() => navigate(`/user/reset-password/${item.IdentityId}`)}
                        />
                        <DXButton
                            text=""
                            icon="edit"
                            type="default"
                            onClick={() => navigate(`/user/edit-user/${item.IdentityId}`)}
                        />
                        <DXButton
                            text=""
                            icon="trash"
                            type="default"
                            onClick={() => setIsOpen(true)}
                        />
                    </div>
                </div>
                <DXPopup
                    title="Deactivate user"
                    width="50%"
                    height="30%"
                    onHiding={() => setIsOpen(false)}
                    visible={isOpen}
                >
                    <div className="confirm-dialog-content">
                        <p>Are you sure you want to deactivate this record?</p>
                        <div className="confirm-dialog-actions">
                            <DXButton text="Yes" type="default" onClick={() => onDeleteClick(item.IdentityId)} />
                            <DXButton text="No" type="default" onClick={() => setIsOpen(false)} />
                        </div>
                    </div>
                </DXPopup>

                <DXPopup
                    title="Subscriptions"
                    width="20%"
                    height="40%"
                    onHiding={() => setIsSubscriptionOpen(false)}
                    visible={subscriptionOpen}
                >
                    {filterNamesByIds(item?.Subscriptions)}
                </DXPopup>
            </div>
        </div>
    );
};

export default UserCard;