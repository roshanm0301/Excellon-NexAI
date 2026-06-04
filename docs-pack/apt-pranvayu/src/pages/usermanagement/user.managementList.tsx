import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router';
import { DXButton, DXInput } from '../../components/atoms';
import { GetAllIdentityList, deactivateUser, getRoleListAPI, getSubscriptionListAPI } from '../../redux/actions';
import { useAppDispatch, useAppSelector } from '../../store/customHooks';
import { RootState } from '../../store/store';
import UserCard from './userCard';
import './usermanagement.scss';
import { SearchIcon } from '../../assets/icons';

const UserList = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  let { usersList } = useSelector((state: RootState) => state.userManagement);
  let { roles } = useAppSelector((state) => state.role);
  let { subscriptions, count } = useAppSelector((state) => state.subscription);

  // setUserDetails API calling
  useEffect(() => {
    dispatch(GetAllIdentityList(null))
    dispatch(getRoleListAPI(null))
    dispatch(getSubscriptionListAPI(null));
  }, []);


  const onDeleteClick = async (documentId: any) => {
    const payload = { IsActive: false }
    const result: any = await dispatch(deactivateUser(documentId, payload));
    if (result?.success) {
      dispatch(GetAllIdentityList(null))
    }
  }

  return (
    <div>
      <div className={"content-block dx-card responsive-paddings"}>
        <div className="grid-header-actions">
          <DXInput
            label="Search"
            required={true}
            onChange={(e: any) => setSearch(e)}
            defaultValue={search}
            value={search}
            width={280}
            showIcon={true}
            options={{ icon: SearchIcon }}
          >
          </DXInput>
          <DXButton
            icon="plus"
            text="ADD USER"
            type="default"
            stylingMode="outlined"
            onClick={() => { navigate(`/user/add-user`) }}
          />
        </div>
        <div className="user-card-grid">
          {usersList?.data?.filter((item: any) => item?.FirstName?.toLowerCase().includes(search.toLowerCase()))
            .map((item: any, key: any) => {
              return <div key={item.IdentityId}>
                <UserCard item={item} roles={roles} onDeleteClick={onDeleteClick} subscriptions={subscriptions} />
              </div>
            })}
        </div>
      </div>
    </div>
  )
}

export default UserList;