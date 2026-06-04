import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { AddEditApplication } from ".";
import { GetByApplicationIdAPI, getApplicationAPI } from "../../redux/actions";
import { useAppDispatch } from "../../store/customHooks";

export const AddEditApplicationContainer = () => {
  const dispatch = useAppDispatch();
  const { id } = useParams();
  const [formData, setFormData] = useState<any>(null)

  useEffect(() => {
    if (id) {
      (async () => {
        const result: any = await dispatch(getApplicationAPI(id));
        const roleResult: any = await dispatch(GetByApplicationIdAPI({ ApplicationId: id }))
        const _formData = {
          ...formData,
          ...result,
          ...roleResult
        };
        setFormData({ ..._formData });
      })()
    }
  }, []);

  return (
    <AddEditApplication id={id} data={{ ...formData }} isActive={true} />
  );
};