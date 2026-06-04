import { useState } from 'react'
import { DXInput, DXSelect } from '../../components/atoms'
import { SearchIcon } from '../../assets/icons'
import { MessageLogContent } from './messageLog.content'
import { getErrorMessageByCodeDescriptionAPI } from '../../redux/actions'
import { useAppDispatch, useAppSelector } from '../../store/customHooks'

export const MessageLog = () => {
  const [value, setValue] = useState("")
  const dispatch = useAppDispatch()
  let options: any
  const messageByCode = useAppSelector((state: any) => state.error.messageByCode)

  const onChange = async (e: any) => {
    setValue(e)
    if (e.length >= 3) {
      let req: any = { search: e }
      const res:any = await dispatch(getErrorMessageByCodeDescriptionAPI(req))
    }
  }

  return (
    <div className={"content-block dx-card responsive-paddings"}>
      <div style={{ display: "flex", flexDirection: "column" }}>
        <div className="error-search" style={{ marginTop: "20px" ,marginBottom: "40px" }}>

          <DXInput
          value={value}
            label="Search message"
            required={true}
            onChange={onChange}
            width={"40%"}
            showIcon={true}
            options={{ icon: SearchIcon }}
          ></DXInput>
          <div style={{ marginTop: "6px", float: "right", marginLeft: "40px" }}>
            <DXSelect
            disabled
              value={value}
              items={options}
              onValueChange={onChange}
              // label={props.title}
              labelMode="floating"
              // name={props.title}
              // className={props.className}
              displayExpr={"label"}
              valueExpr={"name"}
              width={'100%'}
              height={"100%"}
            />
          </div>
        </div>
       {messageByCode&& <div style={{ margin: "20px" }}>
          <MessageLogContent data={messageByCode} />
        </div>}
      </div></div>
  )
}
