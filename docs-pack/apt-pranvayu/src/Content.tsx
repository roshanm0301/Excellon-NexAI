import { Navigate, Route, Routes } from "react-router-dom";
import appInfo from "./app-info";
import routes from "./app-routes";
import { SideNavOuterToolbar as SideNavBarLayout } from "./layouts";
import { ProfilePage } from "./pages";
import { ChangePasswordForm, ResetPasswordForm } from "./pages/auth";
import { ListNotification } from "./pages/header/listNotification";
import { ViewNotification } from "./pages/header/viewNotification";
import { useAppSelector } from "./store/customHooks";
import SingleCardWithoutHeader from "./layouts/single-card/single-card-without-header";
import AuthRouteGuard from "./components/guards/AuthRouteGuard";

export default function Content() {
  let navigationList = useAppSelector((state) => state.role.navigationList)

  const authorizedRoutes = routes.map(route => {
    const matchedData = navigationList?.find((navigationRoute: any) => route.path.includes(navigationRoute.path));
    if (matchedData) {
      return {
        path: route.path,
        element: route.element,
        matchedData: matchedData
      };
    }
    return null;
  }).filter(obj => obj !== null);

  return (
    <AuthRouteGuard>
      <SideNavBarLayout title={appInfo.title}>
        <Routes>
          {authorizedRoutes?.map((item: any) => (
            <Route key={item.path} path={item.path} element={item.element} />
          ))}
          <Route path='/user/reset-password/:id' element={
          <SingleCardWithoutHeader title="Reset Password">
            <ResetPasswordForm />
          </SingleCardWithoutHeader>
          } />
          <Route path='/change-password' element={<ChangePasswordForm />} />
          <Route path="/list-notification" element={<ListNotification />} />
          <Route path='/view-notification/:id' element={<ViewNotification />} />
          <Route path='/profile' element={<ProfilePage />} />
          <Route path="/" element={<Navigate to="/dashboard" />} />
        </Routes>
      </SideNavBarLayout>
    </AuthRouteGuard>
  );
}
