import { useState } from 'react';
import { ErrorLogContent } from './errorLog.content';
import { DXInput } from '../../components/atoms';
import { SearchIcon } from '../../assets/icons';
import { useAppDispatch, useAppSelector } from '../../store/customHooks';
import { getErrorByCodeAPI } from '../../redux/actions';

export const ErrorLog = () => {
  const [value, setValue] = useState("");
  const errorByCode = useAppSelector((state: any) => state.error.errorByCode);
  const dispatch = useAppDispatch();

  const onChange = async (e: any) => {
    setValue(e);
    if (e.length >= 3) {
      const req = { Code: e };
      await dispatch(getErrorByCodeAPI(req as any));
    }
  };

  return (
    <div className="content-block dx-card responsive-paddings">
      <div className="error-log-container">
        <div className="error-search">
          <DXInput
            value={value}
            label="Search error"
            required={true}
            onChange={onChange}
            width="40%"
            showIcon={true}
            options={{ icon: SearchIcon }}
          />
        </div>
        {errorByCode && (
          <div className="error-log-result">
            <ErrorLogContent errorData={errorByCode} />
          </div>
        )}
      </div>
    </div>
  );
};
