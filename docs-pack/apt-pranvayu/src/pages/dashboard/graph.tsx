import Chart, {Label, Legend, CommonSeriesSettings, SeriesTemplate } from 'devextreme-react/chart';
import { useTheme } from '../../contexts/ThemeContext';
import "./dashboard.scss";

interface IGraph {
    dataSource?: any,
    type?: any,
    argumentField?: any,
    visible?: boolean,
    text?: any,
    valueField?: any
}

export const DxGraph = (props: IGraph) => {
    const { dataSource, type, argumentField, visible = false, text, valueField } = props;
    const { isDark } = useTheme();

    // Theme-aware chart palette & label colors
    const chartPalette = isDark
      ? ['#f97316', '#fb923c', '#fdba74', '#60a5fa', '#a78bfa', '#34d399']
      : ['#f97316', '#fb923c', '#fdba74', '#fed7aa', '#ffedd5', '#fff7ed'];
    const labelColor = isDark ? '#a1a1aa' : '#6b7280';
    
    if (!dataSource || dataSource.length === 0) {
        return (
            <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-tertiary)', fontSize: 'var(--text-sm)' }}>
                No data available
            </div>
        );
    }

    return (
        <div>
            {text && (
                <div style={{
                    fontSize: 'var(--text-base)',
                    fontWeight: 600,
                    color: 'var(--text-primary)',
                    marginBottom: '12px'
                }}>
                    {text}
                </div>
            )}
            <Chart 
                width="100%" 
                palette={chartPalette}
                height={180} 
                dataSource={dataSource}
            >
                <CommonSeriesSettings
                    argumentField={argumentField}
                    type="bar"
                    valueField={valueField}
                    barPadding={0.5}
                    cornerRadius={4}
                    ignoreEmptyPoints={true}>
                    <Label visible={true} font={{ size: 11, color: labelColor }} />
                </CommonSeriesSettings>
                <SeriesTemplate nameField={argumentField} />
                <Legend visible={false} />
            </Chart>
        </div>
    )
}
