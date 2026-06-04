import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { SearchIcon } from '../../assets/icons'
import { DXButton, DXDataGrid, DXInput } from '../../components/atoms'
import { AddEditErrorMessage } from '../../components/molecules/AddEditErrorMessage'
import { getErrorListPagingAPI } from '../../redux/actions'
import { useAppDispatch, useAppSelector } from '../../store/customHooks'
import { defaultState } from './error.entity'

export const ErrorLogManage = () => {
  const [editItem, setEditItem] = useState("")
  const [isOpen, setIsOpen] = useState(false)
  const [state, setState] = useState({ ...defaultState });
  const [editMode, setEditMode] = useState(false)
  const navigate = useNavigate();
  const dispatch = useAppDispatch()

  let { errorList, errorCount, errorMessage } = useAppSelector((state) => state.error);
  const onEditRowKeyChange = (e: any, d: any) => {
    setEditItem(e?.row?.data.Code)
    setIsOpen(true)
    setEditMode(true)
  };
  const ManageErrorGridColumn = [
    {
      dataField: "Code",
      caption: "Code",
      visible: true,
    }, {
      dataField: "Type",
      caption: "Type ",
      visible: true,
    },
    {
      dataField: "Description",
      caption: "Description ",
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
  const addNewError = () => {
    setIsOpen(true)
    setEditMode(false)

  }

  useEffect(() => {
    dispatch(getErrorListPagingAPI(state));
  }, [state]);


  const onPageIndexChange = (value: number) => {
    setState({ ...state, page: value });
  };

  const onPageSizeChange = async (value: number) => {
    if (value >= errorCount) {
      setState({ ...state, page: 0, take: errorCount });
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
              text="ADD ERROR"
              icon="add"
              type="default"
              onClick={addNewError}
            ></DXButton>
          </div>
          <DXDataGrid
            dataSource={errorList}
            keyExpr="id"
            columns={ManageErrorGridColumn}
            count={errorCount}
            defaultPageSize={state.take}
            onPageIndexChange={onPageIndexChange}
            onPageSizeChange={onPageSizeChange}
          />
        </div>

      </div>
      {isOpen && <AddEditErrorMessage setClose={() => setIsOpen(false)} type='Error' list={errorList} editMode={editMode} editItem={editItem} callback={()=>{}}  />}

    </div>
  )
}
