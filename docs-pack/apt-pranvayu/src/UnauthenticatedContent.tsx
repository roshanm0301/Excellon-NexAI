import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { SingleCard } from './layouts';
import { ChangePasswordForm, CreateAccountForm, LandingPage, LoginForm, ResetPasswordForm } from './pages/auth';
import SubscriptionConfiguration from './pages/subscription-configuration/subscription-configuration';
import { ForgetPasswordForm } from './pages/auth/ForgetPassword';
import Callback from './pages/auth/Callback';

export default function UnauthenticatedContent() {

  return (
    <Routes>
      <Route path='/' element={<Navigate to={'/login'} />}></Route>
      <Route path='/callback' element={<Callback />} />
      <Route
        path='/login'
        element={
          <SingleCard title="Sign In">
            <LoginForm />
          </SingleCard>
        }
      />
      <Route
        path='/create-account'
        element={
          <SingleCard title="Sign Up">
            <CreateAccountForm />
          </SingleCard>
        }
      />
      <Route
        path='/pranwayu' // pranwayu
        element={
          <SingleCard title="Subscription Details">
            <SubscriptionConfiguration />
          </SingleCard>
        }
      />
      {/* <Route
        path='/landing-page' // pranwayu
        element={
          <SingleCard title="Product Configuration">
            <LandingPage />
          </SingleCard>
        }
      /> */}
      <Route
        path='/forget-password'
        element={
          <SingleCard title="Forget Password">
            <ForgetPasswordForm />
          </SingleCard>
        }
      />
      <Route
        path='/reset-password/:userName'
        element={
          <SingleCard title="Reset Password">
            <ResetPasswordForm />
          </SingleCard>
        }
      />
      <Route path='*' element={<Navigate to={'/landing-page'} />}></Route>
    </Routes>
  );
}
