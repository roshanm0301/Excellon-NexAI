import { ScrollView } from 'devextreme-react';
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { DXButton, DXForm } from '../../components/atoms';
import { regEx } from '../../components/constant/regex';
import { addGoldSchemaAPI, getGoldSchemaAPI, getSchemaAPI, GetWarehouseDatatypesAPI, showNotification, updateGoldSchemaAPI } from '../../redux/actions';
import { useAppDispatch, useAppSelector } from '../../store/customHooks';
import { isRequiredField, isValidField } from '../../utility/utils';
import { AddColumn } from '../schema';
import { validateQueryColumns } from '../silverSchema';
import { DXPopup } from '../../components/template';
import { GoldSchemaDefinition } from './goldSchema.entity';

export const GoldSchemaAddEdit = () => {
  const navigate = useNavigate();
  const { id } = useParams()
  const dispatch = useAppDispatch();
  const [schemaFormData, setSchemaFormData] = useState<any>({
    ...GoldSchemaDefinition,
  });
  const { getWarehouseDatatypesList } = useAppSelector((state) => state.silverSchema)
  const [isOpen, setIsOpen] = useState<boolean>(false)
  const [queryResult, setQueryResult] = useState<any>(null)

  useEffect(() => {
    dispatch(GetWarehouseDatatypesAPI(null));
  }, []);


  useEffect(() => {
    const fetchData = async () => {
      if (id) {
        const result: any = await dispatch(getGoldSchemaAPI(id));
        if (result) {
          setSchemaFormData({ ...schemaFormData, ...result });
        }
      }
    }
    fetchData()
  }, [id]);

  const onFieldDataChanged = () => {
    setSchemaFormData({ ...schemaFormData });
  }

  const handleKeyDown = (e: any) => {
    if (e.keyCode === 13) {
      e.preventDefault();
    }
  }

  const onColumnDataCallback = (column: any) => {
    setSchemaFormData((state: any) => {
      return { ...state, Columns: column };
    });
  };

  const createUpdateAPICall = async () => {
    let result: any
    if (id) {
      result = await dispatch(updateGoldSchemaAPI(id, schemaFormData));
    } else {
      result = await dispatch(addGoldSchemaAPI(schemaFormData));
    }
    // if (result?.success) {
    //   navigate("/gold-schema");
    // }
  }

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    let queryResult = validateQueryColumns(schemaFormData.Query, schemaFormData.Columns)
    setQueryResult(queryResult)
    if (queryResult?.success) {
      createUpdateAPICall()
    } else if (queryResult?.invalidColumns?.length === 1 && queryResult.invalidColumns[0] === '*') {
      dispatch(showNotification({
        isOpen: true,
        message: "Using select * from is not allowed in the query.",
        type: "error"

      }));
    }
    else {
      setIsOpen(true)
    }
  }

  const onHiding = () => {
    setIsOpen(false)
    setQueryResult(null)
  }

  const onCancelClick = () => {
    navigate("/gold")
  }

  return (
    <div>
      <ScrollView height={'100%'} width={"100%"} direction="vertical">
        <div className={"content-block dx-card responsive-paddings"}>
          <form action="your-action" onSubmit={handleSubmit} onKeyDown={handleKeyDown}>
            <DXForm
              stylingMode="outlined"
              formData={schemaFormData}
              validationGroup="test"
              onFieldDataChanged={onFieldDataChanged}
              items={[
                {
                  itemType: "group",
                  cssClass: "no-margin",
                  colCount: 2,
                  name: "test",
                  items: [
                    {
                      label: { text: "System Name", location: "top" },
                      dataField: "SystemName",
                      validationRules: [
                        {
                          type: "required",
                          message: isRequiredField("SystemName"),
                        },
                        {
                          type: "pattern",
                          pattern: regEx.validString,
                          message: isValidField(
                            "SystemName, {Special characters are not allowed}"
                          ),
                        },
                      ],
                    },
                    {
                      label: { text: "Display Name", location: "top" },
                      dataField: "DisplayName",
                      isRequired: true,
                      validationRules: [
                        {
                          type: "required",
                          message: isRequiredField("DisplayName"),
                        },
                      ],
                    },
                    {
                      label: { text: "Table Name", location: "top" },
                      dataField: "TableName",
                      isRequired: true,
                      disabled: id ? true : false,
                      validationRules: [
                        {
                          type: "required",
                          message: isRequiredField("TableName"),
                        },
                      ],
                    }
                  ],
                },
                {
                  label: { text: "Description", location: "top" },
                  dataField: "Description",
                  editorType: "dxTextArea",
                  editorOptions: {
                    height: 40,
                  },
                },
                {
                  label: { text: "Query", location: "top" },
                  dataField: "Query",
                  editorType: "dxTextArea",
                  isRequired: true,
                  editorOptions: {
                    height: 220,
                  },
                  validationRules: [
                    {
                      type: "required",
                      message: isRequiredField("Query"),
                    },
                  ],
                },
              ]}
            />

            {/* ..................Add Column Section................ */}
            <AddColumn
              title={"Add Column"}
              data={schemaFormData.Columns}
              callback={onColumnDataCallback}
              isActive={true}
              listData={getWarehouseDatatypesList}
              disable={false}
            />

            <div className="schemaButtons">
              &nbsp;&nbsp;
              <>
                <DXButton id="schema-btn-save" type="default" text={id ? "UPDATE" : "SAVE"} useSubmitBehavior={true} stylingMode="contained" icon="save" validationGroup="test" />
                &nbsp;&nbsp;
                <DXButton id="schema-btn-cancel" type="default" text='Cancel' icon="revert" onClick={onCancelClick} />
              </>
            </div>
          </form>
        </div >
      </ScrollView >
      <DXPopup
        title="Warning"
        width="50vw"
        height="auto"
        visible={isOpen}
        onHiding={() => {
          setIsOpen(false);
        }}
      >
        <div
          style={{
            backgroundColor: 'var(--color-warning-light, #fffbeb)',
            color: 'var(--color-warning-dark, #d97706)',
            border: '1px solid var(--color-warning, #f59e0b)',
            borderRadius: '4px',
            padding: '16px',
            marginBottom: '20px'
          }}
        >
          <div>
            <p>
              The column(s) you have entered do not match with the Gold Schema columns:
            </p>
            <ul style={{ marginTop: '8px', paddingLeft: '20px' }}>
              {queryResult?.invalidColumns?.map((col: any, index: number) => (
                <li key={index}>{col}</li>
              ))}
            </ul>
            <p style={{ marginTop: '16px' }}>
              Do you still want to proceed?
            </p>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '12px' }}>
            <DXButton
              stylingMode={"contained"}
              onClick={() => {
                setIsOpen(false);
                createUpdateAPICall()
              }}
              text='Yes, Proceed'
            />

            <DXButton
              stylingMode={"outlined"}
              onClick={onHiding}
              text="No"
            />
          </div>
        </div>
      </DXPopup>
    </div>
  )
}
