import { v4 } from "uuid";
import { ERROR } from "../components/constant/errormessage/error.message";
import { USER_LOGIN_DATA, WHO_AMI_DATA } from "../redux/actions/authAction";

export const getAuthData = () => {
  const authStr = localStorage.getItem(WHO_AMI_DATA);
  if (authStr) {
    const authJSON = JSON.parse(authStr);
    return authJSON;
  }
  return null;
};

export const getAuthToken = () => {
  const authStr = localStorage.getItem(WHO_AMI_DATA);
  if (authStr) {
    const authJSON = JSON.parse(authStr);
    return authJSON || null;
  }
  return null;
};

export const getUserAuthToken = () => {
  const authStr = localStorage.getItem(USER_LOGIN_DATA);
  if (authStr) {
    const authJSON = JSON.parse(authStr);
    return authJSON?.data?.Token || null;
  }
  return null;
};

export const getUserData = () => {
  const authStr = localStorage.getItem(USER_LOGIN_DATA);
  if (authStr) {
    const authJSON = JSON.parse(authStr);
    return authJSON;
  }
  return null;
};

export const setLocalData = (key: string, data: any) => {
  if (key) localStorage.setItem(key, JSON.stringify(data));
};

export const getLocalData = (key: string) => {
  if (key) {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : null;
  } else {
    return null;
  }
};

export const localDataKey = ["CONFIG_DATA", "WHO_AMI_DATA", "IS_BASE_PRODUCT", "USER_LOGIN_DATA", "SELECTED_ITEMS","SELECTED_ITEM_ID","OIDC_TOKEN","OIDC_IDPS"]
export const removeLocalData = (keys: any) => {
  keys.forEach((key: any) => {
    localStorage.removeItem(key);
  });
}

export const getSchemaIdFromMetaData = (
  metaData: Array<any>,
  systemName: string
) => {
  const result = metaData?.find((item: any) => item.SystemName === systemName);
  return result ? result.SchemaId : null;
};

export const checkDuplicateField = (
  array: Array<any> = [],
  data: any,
  field: string
) => {
  const isDuplicate = array.some(
    (item: any) =>
      item[field]?.toLowerCase() === data[field]?.toLowerCase()
    // &&
    // item?.id !== data?.id
  );
  return isDuplicate;
};

export const isValidField = (field: string) => {
  return `${ERROR.isValidFieldMgs} ${field}`;
};

export const isRequiredField = (field: string) => {
  return `${field} ${ERROR.isRequiredFieldMgs}`;
};

export const capitalizeFirstLetter = (str: any) => {
  if (str) return str.charAt(0).toUpperCase() + str.slice(1);
  else return str;
};

export const toCopyBranches = (copyBranch: any) => {
  if (Object.keys(copyBranch).length !== 0) {

    let _taskToCopy = Object.keys(copyBranch).map((keyName, i) => {
      let _response: any = {
        [keyName]: copyBranch[keyName]?.map((item: any) => {
          if (item.componentType === "switch") {
            return {
              ...item,
              id: v4(),
              _id: v4(), // Regenerate _id for unique task identification
              name: copyName(item.name),
              properties: {
                ...item.properties,
                taskSettings: {
                  ...item.properties.taskSettings,
                  name: copyName(item.name),
                },
              },
              branches: toCopyBranches(item?.branches)
            }
          } else {
            return {
              ...item,
              id: v4(),
              _id: v4(), // Regenerate _id for unique task identification
              name: copyName(item.name),
              properties: {
                ...item.properties,
                taskSettings: {
                  ...item.properties.taskSettings,
                  name: copyName(item.name),
                },
              },
            }
          }
        })
      }
      return { ..._response }
    })
    const mergedObject = _taskToCopy.reduce((merged, obj) => ({ ...merged, ...obj }), {});
    return mergedObject
  } else {
    return {}
  }
}

export const copyName = (name: any) => {
  return name + "Copy";
}

export const checkComponentName: any = (navigationList: any, id: any) => {
  let _controlIds: any = []

  if (navigationList.length > 0) {
    navigationList?.map((item: any) => {
      if (item?.Features?.length > 0) {
        item.Features.map((item: any) => {
          _controlIds.push(item?.ControlId)
        })
      }
    })
    let found = _controlIds?.some((buttonName: any) => buttonName === id)
    return found
  }
}
