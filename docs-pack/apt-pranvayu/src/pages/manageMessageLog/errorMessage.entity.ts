import { PAGING } from "../../components/constant/constant";
import { IDefaultState } from "../schema";

export const ManageErrorGridColumn = [
    {
        dataField: "Code",
        caption: "Code",
        visible: true,
    },
    {
        dataField: "Description",
        caption: "Description ",
        visible: true,
    },
];

export const defaultState: IDefaultState = {
    orderby: "code",
    asc: -1,
    page: PAGING.pageIndex,
    take: PAGING.pageSize,
    search: ""
};