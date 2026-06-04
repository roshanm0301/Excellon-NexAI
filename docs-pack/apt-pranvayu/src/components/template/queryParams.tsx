import { ScrollView, Switch } from "devextreme-react";
import { AVJEditor } from "../molecules";
import { DXTextArea } from "../atoms";
import { useState, useEffect } from "react";
import { ActionDefinition } from "../../pages/actionWorkflow/action.definition";
import { useGlobalEditor } from "../../react";
import { IAction } from "../../pages/actionWorkflow";
import { useAppDispatch } from "../../store/customHooks";
import { showNotification } from "../../redux/actions";

interface IQueryParams{
data:any,
jsonData:{},
avjCallback:any,
callback:any,
item:string,
columns?:any[]
}
export const QueryParamsTemplate = (props: IQueryParams) => {
  const { data , jsonData, columns, avjCallback, callback, item } = props;
  const [showAJV, setShowAJV] = useState(true);
  const [formData, setFormData] = useState(ActionDefinition);
  let { properties, setProperty } = useGlobalEditor();
  const [state, setState] = useState({
    Params: ActionDefinition.Params,
    Query: ActionDefinition.Query,
    Body: ActionDefinition.Body,
    selectedItems: [],
    responseResolverSelectedItems: [],
  });

  const dispatch = useAppDispatch();

  useEffect(() => {
    const action = properties?.globalSettings as IAction;
    if (action) {
      setFormData({ ...action });
      setState({
        ...state,
        // ...data,
        Params: action.Params,
        Query: action.Query,
        Body: action.Body,
      });
    }
  }, [data]);

  useEffect(() => {
    if (data.length > 0) {
        setFormData(data)
    }
  }, [data])

  const onChangeJSONEditor = (e: any, type: string) => {
    let _state: any
   try{
    if (e === "") {
      _state = { ...state, [type]: {} }
    } else {
      const value = JSON.parse(e);
      _state = { ...state, [type]: value }
    }
    setState(_state);
    callback(_state);
   }catch(e:any){
    dispatch(showNotification({
      isOpen: true,
      message: "Please enter valid JSON",
      type: "error",
    }));
   }
  };

  const onValueChange = (e: any) => {
    setShowAJV(!showAJV);
  };

  return (
        <>
          <div
            style={{
              display: "flex",
              flexDirection: "row",
              marginBottom: "15px",
            }}
          >
            <Switch
              value={showAJV}
              onValueChanged={(e: any) => onValueChange(e)}
            />
            <span style={{ marginLeft: "15px" }}>
              {showAJV ? "JSON Editor" : "AJV Editor"}{" "}
            </span>
          </div>
          {showAJV ? (
            <ScrollView height={'80%'}>
              <div className={"content-block dx-card responsive-paddings"}>
                <DXTextArea
                  name={item}
                  value={JSON.stringify(jsonData)}
                  onValueChange={(e: any) => {
                    onChangeJSONEditor(e, item);
                  }}
                  stylingMode="outlined"
                />
              </div>
            </ScrollView>
          ) : (
            <div className={"content-block dx-card responsive-paddings"}>
              <AVJEditor
                columns={columns}
                data={data}
                callback={avjCallback}
              />
            </div>
          )}
        </>
  );
};
