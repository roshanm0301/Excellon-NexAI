import { Step } from "../../../designer";
import {
  ArrayIcon, ConditionIcon, DateIcon, DocumentIcon, GeometryIcon, RuleIcon,
  HttpIcon, IdentifierIcon, JsonIcon, LoopIcon, ObjectIcon, PromiseIcon, ProviderIcon, QueryIcon, TemplateIcon,
  RequestIcon, ResolverIcon, ResponseIcon, SecurityIcon, SwitchIcon, TaskIcon, CacheIcon,
  TransactionIcon, UUIDIcon, SchemaIcon, MathIcon, ActionIcon, RepositoryIcon, SubscriptionIcon, SMTPIcon, WorkFlowIcon, EntityTaskIcon, ORMIcon, FilterIcon, TrinoIcon, MinIOIcon, AzureIcon, VariableIcon, ValidatorIcon, ExportIcon, KeycloakIcon
} from "../../../assets/icons"

export const StepConfig = {
  validator: (step: Step) => !!step.name,
  iconUrlProvider: (_: any, type: string) => {
    if (type === "Document") {
      return DocumentIcon;
    } else if (type === "Request") {
      return RequestIcon;
    } else if (type === "Response") {
      return ResponseIcon;
    } else if (type === "Resolver") {
      return ResolverIcon;
    } else if (type === "Rule") {
      return RuleIcon;
    } else if (type === "Query") {
      return QueryIcon;
    } else if (type === "Date") {
      return DateIcon;
    } else if (type === "UUID") {
      return UUIDIcon;
    } else if (type === "Object") {
      return ObjectIcon;
    } else if (type === "Array") {
      return ArrayIcon;
    } else if (type === "Geometry") {
      return GeometryIcon;
    } else if (type === "Switch") {
      return SwitchIcon;
    } else if (type === "Condition") {
      return ConditionIcon;
    } else if (type === "Promise") {
      return PromiseIcon;
    } else if (type === "Security") {
      return SecurityIcon;
    } else if (type === "Loop") {
      return LoopIcon;
    } else if (type === "Transaction") {
      return TransactionIcon;
    } else if (type === "JSON") {
      return JsonIcon;
    } else if (type === "Identifier") {
      return IdentifierIcon;
    } else if (type === "HTTP") {
      return HttpIcon;
    } else if (type === "Iterator") {
      return LoopIcon;
    } else if (type === "Provider") {
      return ProviderIcon;
    } else if (type === "Schema") {
      return SchemaIcon
    } else if (type === "Math") {
      return MathIcon
    } else if (type === "Action") {
      return ActionIcon
    } else if (type === "Repository") {
      return RepositoryIcon
    } else if (type === "Subscription") {
      return SubscriptionIcon
    } else if (type === "SMTP") {
      return SMTPIcon
    } else if (type === "WorkFlow") {
      return WorkFlowIcon
    } else if (type === "Cache") {
      return CacheIcon
    } else if (type === "Entity") {
      return EntityTaskIcon
    } else if (type === "ORM") {
      return ORMIcon
    } else if (type === "Filter") {
      return FilterIcon
    } else if (type === "Trino") {
      return TrinoIcon
    } else if (type === "MinIO") {
      return MinIOIcon
    } else if (type === "Azure") {
      return AzureIcon
    } else if (type === "Variable") {
      return VariableIcon
    } else if (type === "Validator") {
      return ValidatorIcon
    } else if (type === "Export") {
      return ExportIcon
    } else if (type === 'Template') {
      return TemplateIcon
    }else if (type === 'UIComponent') {
      return TemplateIcon
    } else if (type === 'Keycloak') {
      return KeycloakIcon
    }
    else {
      return TaskIcon;
    }
  },
};
