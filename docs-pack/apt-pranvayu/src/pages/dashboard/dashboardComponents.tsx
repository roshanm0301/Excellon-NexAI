import React from 'react'
import { DXButton } from '../../components/atoms'

interface IProps {
  dashboardCount?: any, 
  src?: any, 
  text?: any,
  componentName?: string,
  onClick?:any;
}

const DashboardComponents = (props:IProps) => {
  const { dashboardCount, src, onClick, text, componentName } = props;

  return (
    <div className={'card-item'}>
      <div>
        <img alt="schema" src={src} style={{ width: '25px' }} />
        <b className='align'>{componentName}</b>
      </div>
      <div className={'card-title'}>
        <center>
          <b style={{ color: 'var(--color-primary, #f97316)' }} className="circle">{dashboardCount}</b>
        </center>
        <div className='align'>
          <div style={{ position: 'absolute', bottom: 2 }}>
            <DXButton
              style={{ marginBottom: '10px' }}
              text={text}
              stylingMode={"text"}
              onClick={onClick}
              type="default"
            />
          </div>
        </div>
      </div>
    </div>
  )
}

export default DashboardComponents