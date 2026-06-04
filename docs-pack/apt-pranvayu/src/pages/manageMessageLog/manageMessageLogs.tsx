import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { SearchIcon } from '../../assets/icons'
import { DXButton, DXDataGrid, DXInput } from '../../components/atoms'
import { AddEditErrorMessage } from '../../components/molecules/AddEditErrorMessage'
import { getMessageListPagingAPI, subscriptionChange } from '../../redux/actions'
import { useAppDispatch, useAppSelector } from '../../store/customHooks'
import { defaultState } from './errorMessage.entity'

export const ManageMessageLog = () => {
  const [isOpen, setIsOpen] = useState(false)
  const [state, setState] = useState({ ...defaultState});
  const [editMode,setEditMode]=useState(false)
  const [editItem, setEditItem] = useState("")

  const navigate = useNavigate();
  const dispatch = useAppDispatch()
  let { messageCount, messageList, message } = useAppSelector((state) => state.error);
  let { IsSubscriptionChanged } = useAppSelector((state) => state.auth);

  const onEditRowKeyChange = (e: any,d:any) => {
    setEditItem(e?.row?.data.Description)
    setIsOpen(true)
    setEditMode(true)
  };
  const addMessage = () => {
    setIsOpen(true)
    setEditMode(false)
  }

  useEffect(() => {
    MessageListPagingAPI();
  }, [state])

  useEffect(() => {
    if(IsSubscriptionChanged){
      MessageListPagingAPI();
      dispatch(subscriptionChange(false))
    }
  }, [IsSubscriptionChanged])

  const MessageListPagingAPI=async()=>{
    dispatch(getMessageListPagingAPI(state));
  }

  const ManageMessageGridColumn = [
    {
        dataField: "code",
        caption: "Code",
        visible: true,
    }, 
    {
        dataField: "Description",
        caption: "Description ",
        visible: true,
    },{
      dataField: "Language",
      caption: "Language ",
      visible: true,
  },
    {
        type: "buttons",
        caption: "Actions",
        width: "10%",
        buttons: [
          {
            visible: true,
            hint: "View Request",
            icon: 'edit',
            onClick: onEditRowKeyChange
          },
        ],
      },
];
 const onPageIndexChange = (value: number) => {
    setState({ ...state, page: value });
  };

  const onPageSizeChange = async (value: number) => {
    if (value >= messageCount) {
      setState({ ...state, page: 0, take: messageCount });
    } else {
      setState({ ...state, take: value });
    }
  };
 
  return (
    <div className={"content-block dx-card responsive-paddings"}>
      <div>
        <div className={"content-block dx-card responsive-paddings"}>
          <div className="grid-header-actions">
            <DXInput
             label="Search"
             required={true}
             onChange={(e: any) => setState({ ...state, search: e })}
             defaultValue={state.search}
             value={state.search}
             width={"40%"}
             showIcon={true}
             options={{ icon: SearchIcon }}
            >
            </DXInput>
            <DXButton
            text="ADD MESSAGE"
            icon="add"
            type="default"
            onClick={addMessage}
          // width={'100%'}
          ></DXButton>
          </div>
          <DXDataGrid
            dataSource={messageList}
            keyExpr="id"
            columns={ManageMessageGridColumn}
          count={messageCount}
          defaultPageSize={state.take}
          onPageIndexChange={onPageIndexChange}
          onPageSizeChange={onPageSizeChange}
          />
        </div>

      </div>
      {isOpen && <AddEditErrorMessage setClose={() => setIsOpen(false)} type='Message' list={messageList} editMode={editMode} editItem={editItem} callback={()=>{}} />}
    </div>
  )
}
