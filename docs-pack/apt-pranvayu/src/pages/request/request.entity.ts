export const RequestDefinition = {
    SchemaId: '',
    SystemName: '',
    Name: ''
};

export const defaultStateForPickList: any = {
    skip: 0,
    take: 500,
    orderby:'FilterType',
    asc: 1,
    page: 0
  };

export const defaultStateForActionType: any = {
    skip: 0,
    take: 500,
    orderby:'ActionType',
    asc: 1,
    page: 0,
    search:'ActionType'
  };

export enum FilterTypeForRequest {
    FilterType='FilterType',
    ProvisingRequestStatus='ProvisingRequestStatus',
    RequestType='RequestType',
    ActionType='ActionType'
}