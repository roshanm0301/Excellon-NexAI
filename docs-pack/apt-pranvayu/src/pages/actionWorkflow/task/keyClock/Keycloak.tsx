import { DXSelect } from "../../../../components/atoms";
import { useStepEditor } from "../../../../react";
import {
	KeyCloakAuth,
	KeyCloakUserFind,
	KeyCloakUserCreate,
	KeyCloakUserUpdate,
	KeyCloakUserResetPassword,
	KeyCloakUserSendVerifyEmail,
	KeyCloakUserAddRealmRole,
	KeyCloakUserListRealmRoles,
	KeyCloakUserListGroups,
	KeyCloakGroupFind,
	KeyCloakGroupCreate,
	KeyCloakGroupUpdate,
	KeyCloakGroupAddUser,
	KeyCloakRoleFind,
	KeyCloakRoleCreate,
	KeyCloakRoleUpdate,
	KeyCloakClientFind,
	KeyCloakClientCreate,
	KeyCloakClientUpdate,
} from ".";


export const KeyCloakTask = () => {
	const items: any[] = [
		"Select KeyCloak method",
		"Auth",
		"UserFind",
		"UserCreate",
		"UserUpdate",
		"UserResetPassword",
		"UserSendVerifyEmail",
		"UserAddRealmRole",
		"UserListRealmRoles",
		"UserListGroups",
		"GroupFind",
		"GroupCreate",
		"GroupUpdate",
		"GroupAddUser",
		"RoleFind",
		"RoleCreate",
		"RoleUpdate",
		"ClientFind",
		"ClientCreate",
		"ClientUpdate"
	];
	const { properties, setProperty } = useStepEditor();

	const onValueChanged = (value: any) => {
		debugger
		if (value !== "Select UI Component type") setProperty("type", value);
	};

	const render = () => {
		switch (properties["type"]) {
			case "Auth":
				return <KeyCloakAuth />;
			case "UserFind":
				return <KeyCloakUserFind />;
			case "UserCreate":
				return <KeyCloakUserCreate />;
			case "UserUpdate":
				return <KeyCloakUserUpdate />;
			case "UserResetPassword":
				return <KeyCloakUserResetPassword />;
			case "UserSendVerifyEmail":
				return <KeyCloakUserSendVerifyEmail />;
			case "UserAddRealmRole":
				return <KeyCloakUserAddRealmRole />;
			case "UserListRealmRoles":
				return <KeyCloakUserListRealmRoles />;
			case "UserListGroups":
				return <KeyCloakUserListGroups />;
			case "GroupFind":
				return <KeyCloakGroupFind />;
			case "GroupCreate":
				return <KeyCloakGroupCreate />;
			case "GroupUpdate":
				return <KeyCloakGroupUpdate />;
			case "GroupAddUser":
				return <KeyCloakGroupAddUser />;
			case "RoleFind":
				return <KeyCloakRoleFind />;
			case "RoleCreate":
				return <KeyCloakRoleCreate />;
			case "RoleUpdate":
				return <KeyCloakRoleUpdate />;
			case "ClientFind":
				return <KeyCloakClientFind />;
			case "ClientCreate":
				return <KeyCloakClientCreate />;
			case "ClientUpdate":
				return <KeyCloakClientUpdate />;
			default:
				return <h4 className={"content-block"}>Select KeyClock method</h4>;
		}
	};

	return (
		<>
			<DXSelect
				items={items}
				value={properties["type"] || "Select UI Component Type"}
				onValueChange={onValueChanged}
			/>
			<br></br>
			{/* Based on document type render the relevant component */}
			{render()}
		</>
	);
};
