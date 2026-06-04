import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ErrorCodeIcon } from '../../assets/icons'
import { getErrorByCodeAPI } from '../../redux/actions'
import { useAppDispatch, useAppSelector } from '../../store/customHooks'
import ErrorComponent from './errorComponet'

export const ErrorDashBoard = () => {

  const [value, setValue] = useState("")
  const errorByCode = useAppSelector((state: any) => state.error.errorByCode)
  const dispatch = useAppDispatch()
  const navigate=useNavigate()
  const onChange = async (e: any) => {
    setValue(e)
    if (e.length >= 3) {
      let req: any = { Code: e }
      const res = await dispatch(getErrorByCodeAPI(req))
    }
  }

  return (
    <>
    <div className={"content-block dx-card dashboard"}>
      <ErrorComponent
        componentName={"Error Code"}
        dashboardCount={ 0}
        src={ErrorCodeIcon}
        onClick={() => { navigate('/error-log') }}
        text={"Search Error Code"}
      />

      <ErrorComponent
        componentName={"Message"}
        dashboardCount={ 0}
        src={ErrorCodeIcon}
        onClick={() => { navigate('/message-log') }}
        text={"Search Message"}
      />

      <ErrorComponent
        componentName={"Manage Error Code"}
        dashboardCount={0}
        src={ErrorCodeIcon}
        onClick={() => { navigate('/manage-error-log') }}
        text={"Manage"}
      />
      <ErrorComponent
        componentName={"Manage Message"}
        dashboardCount={0}
        src={ErrorCodeIcon}
        onClick={() => { navigate('/manage-message-log') }}
        text={"Manage"}
      />

    </div>
  </>
  )
}
