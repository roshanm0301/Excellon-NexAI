import { useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams } from "react-router-dom";
import {
  getRoleAPI, getRoleById,
} from "../../redux/actions";
import { useAppDispatch } from "../../store/customHooks";
import AddEditRole from './role.addEdit';
import RoleEditForPranvayu from './role.roleEditForPranvayu';


const AddEditRoleContainer = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { id } = useParams();
  const [formData, setFormData] = useState<any>(null)

  useEffect(() => {
    if (id) {
      const fetchData = async () => {
        const result: any = await dispatch(getRoleById(id));
        const _formData = {
          ...formData,
          ...result,
        };
        setFormData({ ..._formData });
      };
      fetchData();
    }
  }, []);
  return (
    <>
      {
        location.pathname.includes("/role/role-edit-for-pranvayu") ?
          <RoleEditForPranvayu id={id} data={{ ...formData }} isActive={true} />
          :
          <AddEditRole id={id} data={{ ...formData }} isActive={true} />
      }
    </>
  );
}

export default AddEditRoleContainer;