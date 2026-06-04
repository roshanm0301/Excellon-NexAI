import { combineReducers } from "redux";
import authReducer from "./authReducer";
import commonReducer from "./commonReducer";
import schemaReducer from "./schemaReducer";
import actionReducer from "./actionReducer";
import roleReducer from "./roleReducer";
import subscriptionReducer from "./subscriptionReducer";
import provisioningRequestReducer from "./provisioningRequestReducer";
import userManagementReducer from "./userManagementReducer";
import navigationReducer from "./navigationReducer";
import applicationReducer from "./applicationReducer";
import providerReducer from "./providerReducer";
import roleApplicationMappingReducer from "./roleApplicationMappingReducer";
import claimsReducer from "./claimsReducer";
import dashboardReducer from "./dashboardReducer";
import publishRequestReducer from "./publishRequestReducer";
import errorReducer from "./errorCodeReducer";
import notificationReducer from "./notificationReducer";
import silverSchemaReducer from "./silverSchemaReducer";
import GoldSchemaReducer from "./goldSchemaReducer";
import oidcAuthReducer from './oidcAuthReducer';
import templateReducer from './templateReducer';

const rootReducer = combineReducers({
  auth: authReducer,
  common: commonReducer,
  schema: schemaReducer,
  action: actionReducer,
  role: roleReducer,
  subscription: subscriptionReducer,
  provisioningRequest: provisioningRequestReducer,
  userManagement: userManagementReducer,
  navigation: navigationReducer,
  application: applicationReducer,
  provider: providerReducer,
  roleApplicationMapping: roleApplicationMappingReducer,
  claim: claimsReducer,
  dashboard: dashboardReducer,
  publishRequest: publishRequestReducer,
  error: errorReducer,
  notification: notificationReducer,
  silverSchema: silverSchemaReducer,
  goldSchema: GoldSchemaReducer,
  oidcAuth: oidcAuthReducer,
  template: templateReducer
});

export default rootReducer;
