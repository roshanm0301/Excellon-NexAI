import { memo, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { AddEditSchema } from ".";
import { getSchemaAPI } from "../../redux/actions";
import { useAppDispatch } from "../../store/customHooks";

export const AddEditSchemaContainer = memo(() => {
  const dispatch = useAppDispatch();
  const { id } = useParams();
  const [schemaFormData, setSchemaFormData] = useState<any>(null);

  useEffect(() => {
    if (id) {
      (async function () {
        const result: any = await dispatch(getSchemaAPI(id));
        setSchemaFormData({ ...schemaFormData, ...result });
      })();
    }
  }, []);

  return <AddEditSchema id={id} data={schemaFormData} isActive={true} disableUpdateButtons={true} height={480} visibility={true}/>;
})
