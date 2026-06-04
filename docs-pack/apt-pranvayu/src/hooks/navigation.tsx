import React, { useEffect } from 'react';
import { useNavigation } from '../redux/actions';
import { useAppDispatch } from '../store/customHooks';

function withNavigationWatcher(Component: React.ElementType, path: string) {
  const WrappedComponent = function (props: Record<string, unknown>) {
    const dispatch = useAppDispatch();

    useEffect(() => {
     const FetchData=async() => {
        dispatch(useNavigation(path));
      }
      FetchData();
    }, [path]);

    return <Component {...props} />;
  }
  return <WrappedComponent />;
}

export {
  withNavigationWatcher
};

