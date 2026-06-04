import { DataGrid } from "devextreme-react";
import {
  Editing,
  IDataGridOptions,
  Pager,
  Paging,
  SearchPanel,
} from "devextreme-react/data-grid";
import { PAGING } from "../constant/constant";
import { useEffect, useState } from "react";
import CustomStore from "devextreme/data/custom_store";

export interface IDataGrid extends IDataGridOptions {
  keyExpr?: string;
  dataSource: any[];
  columns?: any[];
  defaultPageSize?: any;
  onPageIndexChange?: (value: any) => void;
  onPageSizeChange?: (value: any) => void;
  allowedPageSizes?: any;
  onEditRowKeyChange?: (value: any) => void;
  onEdit?: boolean;
  count?: number;
  visible?: boolean;
  mode?: string;
  onRowClick?: (value: any) => void;
  gridVisible?: boolean;
  onSearch?: boolean;
  onSearchPanelChange?: (value: any) => void;
  onTextChange?: (value: any) => void;
}

export const DXDataGrid = (props: any) => {
  const {
    keyExpr = "id",
    dataSource,
    columns,
    defaultPageSize = PAGING.pageSizes,
    onPageIndexChange,
    onPageSizeChange,
    allowedPageSizes = PAGING.pageSizes,
    onEditRowKeyChange,
    onEdit = true,
    count,
    visible = true,
    onRowClick,
    gridVisible = true,
    onSearch = false,
    onSearchPanelChange,
    onTextChange,
    ...rest
  } = props;

  const [dataStore, setDataStore] = useState({});

  useEffect(() => {
    const store = new CustomStore({
      key: keyExpr,
      load() {
        return Promise.resolve({
          data: dataSource,
          totalCount: count,
        });
      },
    });
    setDataStore(store);
  }, [dataSource, count, keyExpr]);

  return (
    <DataGrid
      showBorders={false}
      hoverStateEnabled={true}
      allowColumnReordering={true}
      remoteOperations={true}
      keyExpr={keyExpr}
      dataSource={dataStore}
      columns={columns}
      className="data-grid"
      onRowClick={onRowClick}
      visible={gridVisible}
      onSearchPanelChange={onSearchPanelChange}
      columnResizingMode="widget"
      allowColumnResizing={true}
      rowAlternationEnabled={false}
      showColumnLines={false}
      showRowLines={true}
      {...rest}
    >
      {onSearch && (
        <SearchPanel
          visible={true}
          width={240}
          searchVisibleColumnsOnly={true}
          placeholder="Search..."
          onTextChange={onTextChange}
        />
      )}
      <Paging
        defaultPageSize={defaultPageSize}
        onPageIndexChange={onPageIndexChange}
        onPageSizeChange={onPageSizeChange}
      />
      <Pager
        showPageSizeSelector={true}
        allowedPageSizes={allowedPageSizes}
        displayMode="compact"
        visible={visible}
      />
      {onEdit && (
        <Editing
          mode="row"
          allowUpdating
          editRowKey="id"
          onEditRowKeyChange={onEditRowKeyChange}
        />
      )}
    </DataGrid>
  );
};
