import { withNavigationWatcher } from './hooks/navigation';
import { ActionWorkflowContainer } from './pages/actionWorkflow';
import { AddEditApplicationContainer } from './pages/application';
import ApplicationList from './pages/application/application.list';
import Approval from './pages/approval/approval';
import ApprovalTreeView from './pages/approval/approval.tree.view';
import ViewApprovalRequest from './pages/approval/viewApprovalRequest';
import Dashboard from './pages/dashboard/dashboard';
import AddEditProviderContainer from './pages/provider/provider.addEditContainer';
import ProviderList from './pages/provider/provider.list';
import PendingRequest from './pages/request/request';
import ViewRequest from './pages/request/viewRequest';
import AddEditRoleContainer from './pages/role/role.addEditContainer';
import RoleList from './pages/role/role.list';
import { AddEditSchemaContainer } from './pages/schema/schema.addEdit.container';
import { SchemaList } from './pages/schema/schema.list';
import { AddEditSubscription, PublishRequest, SubscriptionList, SubscriptionOnBoardContainer } from './pages/subscription';
import UserList from './pages/usermanagement/user.managementList';
import { ErrorLog } from './pages/errorLogComponent';
import { ErrorDashBoard } from './pages/errorLogComponent/errorDashboard';
import { ErrorLogManage } from './pages/manageErrorLog';
import { ManageMessageLog } from './pages/manageMessageLog';
import { MessageLog } from './pages/messageLogComponent';
import { ViewFile } from './pages/schema/history.ViewFile';
import SchemaTreeView from './pages/schema/schema.treeview';
import { ViewHistory } from './pages/schema/viewHistory';
import { SilverSchemaList } from './pages/silverSchema';
import { SilverSchemaAddEdit } from './pages/silverSchema/silverSchema.addEdit';
import SubscriptionSettingContainer from './pages/subscription/subscription.setting.container';
import AddEditUser from './pages/usermanagement/user.addEditUser';
import { GoldSchemaList } from './pages/goldSchema';
import { GoldSchemaAddEdit } from './pages/goldSchema/goldSchema.addEdit';
import { TemplateList } from './pages/template/template.list';

const routes = [
    {
        path: '/dashboard',
        element: Dashboard
    },
    {
        path: '/request/view-request/schema/edit-action/:SchemaId/:id',
        element: ActionWorkflowContainer
    },
    {
        path: '/schema',
        element: SchemaList
    },
    {
        path: '/schema/add-schema',
        element: AddEditSchemaContainer
    },
    {
        path: '/schema/edit-schema/:id',
        element: AddEditSchemaContainer
    },
    {
        path: '/silver',
        element: SilverSchemaList
    },
    {
        path: '/silver/add',
        element: SilverSchemaAddEdit
    },
    {
        path: '/silver/edit/:id',
        element: SilverSchemaAddEdit
    },
    {
        path: '/gold',
        element: GoldSchemaList
    },
    {
        path: '/gold/add',
        element: GoldSchemaAddEdit
    },
    {
        path: '/gold/edit/:id',
        element: GoldSchemaAddEdit
    },
    {
        path: '/schema/add-action/:SchemaId',
        element: ActionWorkflowContainer
    },
    {
        path: '/schema/clone-action/:SchemaId',
        element: ActionWorkflowContainer
    },
    {
        path: '/schema/edit-action/:SchemaId/:id',
        element: ActionWorkflowContainer
    },
    {
        path: '/schema/workflow-editor',
        element: SchemaTreeView
    },
    {
        path: '/role',
        element: RoleList
    },
    {
        path: '/role/add-role',
        element: AddEditRoleContainer
    },
    {
        path: '/role/edit-role/:id',
        element: AddEditRoleContainer
    },
    {
        path: '/role/role-edit-for-pranvayu/:id',
        element: AddEditRoleContainer
    },
    {
        path: '/subscription',
        element: SubscriptionList
    },
    {
        path: '/subscription/add-subscription',
        element: AddEditSubscription
    },
    {
        path: '/subscription/clone-subscription/:id',
        element: AddEditSubscription
    },
    {
        path: '/subscription/publish-request',
        element: PublishRequest
    },
    {
        path: '/subscription/subscription-onboard',
        element: SubscriptionOnBoardContainer
    },
    {
        path: '/subscription/edit-subscription-onboard/:id',
        element: SubscriptionOnBoardContainer
    },
    {
        path: '/subscription/subscription-setting/:id',
        element: SubscriptionSettingContainer
    },
    {
        path: '/approval',
        element: Approval
    },
    {
        path: '/approval/:id',
        element: Approval
    },
    {
        path: "/request",
        element: PendingRequest,
    },
    {
        path: '/request/view-approval-request/:id',
        element: ViewApprovalRequest
    },
    {
        path: '/approval/view-request/:id',
        element: ViewRequest
    },
    {
        path: '/request/view-request/:id',
        element: ViewRequest
    },
    {
        path: "/user",
        element: UserList,
    },
    {
        path: "/user/add-user",
        element: AddEditUser,
    },
    {
        path: '/user/edit-user/:id',
        element: AddEditUser
    },
    {
        path: "/application",
        element: ApplicationList,
    },
    {
        path: '/application/add-application',
        element: AddEditApplicationContainer
    },
    {
        path: '/application/edit-application/:id',
        element: AddEditApplicationContainer
    },
    {
        path: '/provider',
        element: ProviderList
    },
    {
        path: '/provider/add-provider',
        element: AddEditProviderContainer
    },
    {
        path: '/provider/edit-provider/:id',
        element: AddEditProviderContainer
    },
    {
        path: '/error-log',
        element: ErrorLog
    }, {
        path: '/logs',
        element: ErrorDashBoard
    },
    {
        path: '/message-log',
        element: MessageLog
    },
    {
        path: '/manage-error-log',
        element: ErrorLogManage
    }, {
        path: '/manage-message-log',
        element: ManageMessageLog
    },
    {
        path: '/approval-tree-view/:id',
        element: ApprovalTreeView
    },
    {
        path: '/history-schema',
        element: ViewHistory
    },
    {
        path: '/history-action',
        element: ViewHistory
    },
    {
        path: '/schema/history-view-file/:id',
        element: ViewFile
    },
    {
        path: '/template',
        element: TemplateList
    },
    {
        path: '/template/add-template',
        element: ActionWorkflowContainer
    },
    {
        path: '/template/add-template',
        element: ActionWorkflowContainer
    },
    {
        path: '/template/edit-template/:id',
        element: ActionWorkflowContainer
    },
];

export default routes.map(route => {
    return {
        ...route,
        element: withNavigationWatcher(route.element, route.path)
    };
});
