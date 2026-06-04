import { useEffect, useState } from 'react'
import { DXForm } from '../../components/atoms'

export const ErrorLogContent = (props: any) => {
  let { errorData } = props
  const [formData, setFormData] = useState({})
  useEffect(() => {
    setFormData(errorData)
  }, [errorData])
  return (
    <div className="error-cardstyle">

      <DXForm
        readOnly={true}
        stylingMode="outlined"
        formData={formData}
        cssClass={"dx-form"}
        items={[
          {
            itemType: "group",
            cssClass: "no-margin",
            colCount: 1,
            items: [
              {
                itemType: "group",
                colCount: 2,
                items: [
                  {
                    label: { text: "Parent schema Id", location: "left" },
                    dataField: "parentSchemaId",
                    isRequired: true,
                  },
                  {
                    label: { text: "Error Code", location: "left" },
                    dataField: "Code",
                    isRequired: true
                  }, {
                    label: { text: "Description", location: "left" },
                    dataField: "Description",
                    editorType: "dxTextArea",
                    isRequired: true
                  },
                ],
              },

              {
                label: { text: "Root cause", location: "left" },
                // dataField: "",
                editorType: "dxTextArea",
                isRequired: true
              },
              {
                label: { text: "Preventive Action", location: "left" },
                // dataField: "Description",
                editorType: "dxTextArea",
                isRequired: true
              },

            ]
          }
        ]}
      />

    </div>
  )
}
