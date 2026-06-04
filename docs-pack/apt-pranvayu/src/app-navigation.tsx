import ApprovalIcon from "./assets/approval.svg";
import ApplicationIcon from "../src/assets/icon-application.svg";
import ProviderIcon from "../src/assets/icon-provider.svg";
import RequestIcon from "../src/assets/icon-pull-request.svg";
import SchemaIcon from "../src/assets/icon-scheme.svg";
import TenantIcon from "../src/assets/icon-tenant.svg";

export const navigation = [
  {
    text: "Dashboard",
    path: "/dashboard",
    icon: "home",
  },
  {
    text: "Schema",
    path: "/schema",
    icon: SchemaIcon,
  },
  {
    text: "Role",
    path: "/role",
    icon: "group",
  },
  {
    text: "Subscription",
    path: "/subscription",
    icon: TenantIcon ,
  },
  {
    text: "Approval",
    path: "/approval",
    icon: ApprovalIcon,
  },
  {
    text: "Request",
    path: "/request",
    icon: RequestIcon,
  },
  {
    text: "Application",
    path: "/application",
    icon: ApplicationIcon,
  },
  {
    text: "User Management",
    path: "/user",
    icon: "card",
  },
  {
    text: "Provider",
    path: "/provider",
    icon: ProviderIcon,
  },
  {
    text: "Logs",
    path: "/logs",
    icon:"warning",
  },
   {
    text: "Template",
    path: "/template",
    icon: ApplicationIcon,
  }
];
