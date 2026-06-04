import { PAGING } from "../../components/constant/constant";
import { IDefaultState } from "../schema";



export const defaultState: IDefaultState = {
    orderby: "code",
    asc: -1,
    page: PAGING.pageIndex,
    take: PAGING.pageSize,
    search: ""
};