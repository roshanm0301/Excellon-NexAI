import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import {
  getProviderAPI,
} from "../../redux/actions";
import { useAppDispatch } from "../../store/customHooks";
import AddEditProvider from './provider.addEdit';

const AddEditProviderContainer = () => {
  const dispatch = useAppDispatch();
  const { id } = useParams();
  const [providerFormData, setProviderFormData] = useState<any>(null)

  useEffect(() => {
    if (id) {
      const fetchData = async () => {
        const result: any = await dispatch(getProviderAPI(id));
        const _providerFormData = {
          ...providerFormData,
          ...result,
        };
        setProviderFormData({ ..._providerFormData });
      };
      fetchData();
    }
  }, []);

  return (
    <AddEditProvider id={id} data={{ ...providerFormData }} isActive={true} />
  );
};

export default AddEditProviderContainer;
