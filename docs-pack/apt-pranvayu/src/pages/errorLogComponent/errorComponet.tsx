import { DXButton } from '../../components/atoms';

interface IProps {
    dashboardCount?: any,
    src?: any,
    text?: any,
    componentName?: string,
    onClick?: any;
}

const ErrorComponent = (props: IProps) => {
    const { dashboardCount, src, onClick, text, componentName } = props;

    return (
        <div className={'card-item'} onClick={onClick}>
            <div>
                <img alt="schema" src={src} style={{ width: '25px' }} />
                <b className='align'>{componentName}</b>
            </div>
            <div className={'text'}>

                <div className='align'>
                    <div style={{ position: 'absolute', bottom: 2 }}>
                        <DXButton
                            style={{ marginBottom: '10px' }}
                            text={text}
                            stylingMode={"text"}
                            type="default"
                        />
                    </div>
                </div>
            </div>
        </div>
    )
}

export default ErrorComponent