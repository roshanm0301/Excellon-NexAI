import { DXButton } from '../../components/atoms';
import { List } from 'devextreme-react';

const TreeView = (props: any) => {
    const { dataSource, toggleItemSelection, selectedItems, type, onTypeExpandClick, onTypeClick, selectAll, toggleSelectAll } = props;
    return (
        <>
            <div>
                <DXButton
                    stylingMode="text"
                    text=""
                    icon={onTypeClick === true ? "chevronright" : "chevrondown"}
                    onClick={onTypeExpandClick} />

                {dataSource.length > 0 &&
                    <input
                        type="checkbox"
                        checked={selectAll}
                        onChange={toggleSelectAll}
                    />
                }
                {type}
            </div>
            {onTypeClick === false &&
                <List
                    style={{ marginLeft: '20px' }}
                    dataSource={dataSource}
                    width={300}
                    itemRender={(item) => (
                        <div>
                            <input
                                type="checkbox"
                                checked={selectedItems.some((selectedItem: any) => selectedItem.id === item.id)}
                                onChange={() => { }}
                                onClick={() => toggleItemSelection(item)}
                            />
                            {item.DisplayName}
                        </div>
                    )}
                />
            }
        </>
    )
}

export default TreeView