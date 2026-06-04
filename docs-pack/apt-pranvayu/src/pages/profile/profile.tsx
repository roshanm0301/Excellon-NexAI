import { useEffect, useState } from "react";
import AvatarIcon from "../../assets/avatar-image.png";
import { DXForm } from "../../components/atoms";
import { getUserByIdentityId } from "../../redux/actions";
import { useAppDispatch, useAppSelector } from "../../store/customHooks";
import "./profile.scss";

export default function Profile() {
  const dispatch = useAppDispatch();

  const [employee, setEmployee] = useState();
  const navigationList = useAppSelector((state) => state.role.navigationList);
  const { user } = useAppSelector((state) => state.oidcAuth);

  useEffect(() => {
    (async () => {
      const result: any = await dispatch(getUserByIdentityId(user?.user?.userId));
      setEmployee({ ...result, DefaultRole: navigationList[0]?.Role });
    })();
  }, [user]);

  return (
    <>
      <div className={"content-block dx-card responsive-paddings"}>
        <div className={"form-avatar"}>
          <img
            alt={""}
            src={AvatarIcon}
          />
        </div>
        <DXForm
          id={"form"}
          disabled
          formData={employee}
          stylingMode="outlined"
          labelLocation={"top"}
          items={[
            {
              itemType: "group",
              colCount: 2,
              items: [
                {
                  label: { text: "First Name" },
                  dataField: "FirstName",
                },
                {
                  label: { text: "Last Name" },
                  dataField: "LastName",
                },
                {
                  label: { text: "Email" },
                  dataField: "Email",
                },
                {
                  label: { text: "MobileNo" },
                  dataField: "MobileNo",
                },
                {
                  label: { text: "User Name" },
                  dataField: "Username",
                },
                {
                  label: { text: "Role" },
                  dataField: "DefaultRole",
                },
              ]
            },
          ]}
        />
      </div>
    </>
  );
}
