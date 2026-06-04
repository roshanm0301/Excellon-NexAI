import React, { useState, useEffect, createContext, useContext, useCallback } from 'react';
import { useNavigate } from 'react-router';
import { getUser, signIn as sendSignInRequest } from '../api/auth';
import { WHO_AMI_DATA } from '../redux/actions';
import { useAppDispatch } from '../store/customHooks';
import type { User, AuthContextType } from '../types';

function AuthProvider(props: React.PropsWithChildren<unknown>) {
  const [user, setUser] = useState<User>();
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  // useEffect(() => {
  //   (async function () {
  //     const result = await getUser();
  //     if (result.isOk) {
  //       setUser(result.data);
  //     }

  //     setLoading(false);
  //   })();
  // }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    const result = await sendSignInRequest(email, password);
    if (result.isOk) {
      setUser(result.data);
    }

    return result;
  }, []);

  const signOut = useCallback(() => {
    navigate(`/configurations`);
    localStorage.clear();
    //setUser(undefined);
    dispatch({ type: WHO_AMI_DATA, payload: null });
  }, []);


  return (
    <AuthContext.Provider value={{ user, signIn, signOut, loading }} {...props} />
  );
}

const AuthContext = createContext<AuthContextType>({ loading: false } as AuthContextType);
const useAuth = () => useContext(AuthContext);

export { AuthProvider, useAuth }
