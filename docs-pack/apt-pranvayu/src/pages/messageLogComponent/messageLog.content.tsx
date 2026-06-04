import React, { useEffect, useState } from 'react'
import { DXForm } from '../../components/atoms'

export const MessageLogContent = (props: any) => {
  let { data } = props
  const [formData, setFormData] = useState({})
  useEffect(() => {
    setFormData(data)
  }, [])

  return (
    <div>

      {data.map((i: any, key: any) => {
        return <>
          <div>
            <span style={{ fontSize: "16px", fontWeight: 500 }}> {key + 1}.</span>
          </div>
          <DXForm
            readOnly
            stylingMode="outlined"
            formData={i}
            key={key}
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
                        label: { text: "Code", location: "left" },
                        dataField: "code",
                        isRequired: true
                      },

                      {
                        label: { text: "Language", location: "left" },
                        dataField: "Language",
                        isRequired: true
                      },

                    ],
                  },
                  {
                    label: { text: "Description", location: "left" },
                    dataField: "Description",
                    isRequired: true,
                    editorType: "dxTextArea"
                  },

                ]
              }
            ]}
          />

          <div style={{ marginBottom: "25px", borderBottom: "1px solid var(--border-primary, #3c3c3c)", }}>

          </div>
          </>
      })}

    </div>
  )

}
