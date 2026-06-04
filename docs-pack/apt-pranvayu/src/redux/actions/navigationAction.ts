import { AppDispatch } from "../../store/store";

export const USE_NAVIGATION = 'USE_NAVIGATION'

export const useNavigation = (isUseNavigation: any) => (dispatch: AppDispatch) =>
  dispatch({
    type: USE_NAVIGATION,
    payload: isUseNavigation,
  });
