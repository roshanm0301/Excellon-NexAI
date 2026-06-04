import React from 'react'
import { Payload } from './Payload'

export const PopupPayload = (props: any) => {

    const { enableOperator, title, data, callback } = props

    const [formData, setFormData] = React.useState<any>(data);

    React.useEffect(() => {
        setFormData([...formData, ...data]);
    }, []);

    const onPayloadCallback = (payload: any) => {
        // put this data in type array value
        callback(payload)
    };

    return (
        <Payload
            enableOperator={enableOperator}
            title={"Array Values"}
            data={formData}
            callback={onPayloadCallback}
        />
    )
}
