import React from 'react';
import ScrollView from 'devextreme-react/scroll-view';
import './single-card.scss';
import type { SingleCardProps } from '../../types';

export default function SingleCardWithoutHeader({ title, description, children }: React.PropsWithChildren<SingleCardProps>) {
  return (
    <ScrollView height={'100%'} width={'100%'} className={'with-footer single-card'} style={{ marginTop: '20px' }}>
      <div className={'dx-card content'}>
        <div className={'header'}>
          <div className={'title'}>{title}</div>
          <div className={'description'}>{description}</div>
        </div>
        {children}
      </div>
    </ScrollView>
)}
