import { useEffect } from "react";
import { pranwayuDefaultConfig, shrushtiDefaultConfig } from "../../config";
import { useAppDispatch, useAppSelector } from "../../store/customHooks";
import { setLocalData } from "../../utility/utils";
import "./auth.scss";
import { login } from "../../redux/actions/oidcAuthActions";
import { subscriptionIdentification } from "../../redux/actions";

export const LoginForm = () => {
  const dispatch = useAppDispatch();
  const isProduct = useAppSelector((state) => state.auth.isProduct);
  const { user } = useAppSelector(state => state.oidcAuth);

  // Set product specific config once on mount
  // useEffect(() => {
  //   if (isProduct === "Pranwayu") {
  //     setLocalData("CONFIG_DATA", pranwayuDefaultConfig);
  //     dispatch({ type: "CONFIG_DATA", payload: pranwayuDefaultConfig });
  //   } else { // default Srushti / others
  //     setLocalData("CONFIG_DATA", shrushtiDefaultConfig);
  //     dispatch({ type: "CONFIG_DATA", payload: shrushtiDefaultConfig });
  //   }
  //   // eslint-disable-next-line react-hooks/exhaustive-deps
  // }, []);


  // comment above code because landing page remove
  useEffect(() => {
    dispatch(subscriptionIdentification("Pranwayu"));
    setLocalData("CONFIG_DATA", pranwayuDefaultConfig);
    dispatch({ type: "CONFIG_DATA", payload: pranwayuDefaultConfig });
    setLocalData("IS_BASE_PRODUCT", "Pranwayu");
  }, [])

  if (user) return null; // Logged in; navigation handled elsewhere.

  return (
    <div className="login-form">
      <div className="idp-buttons vertical-stack">
        <button
          type="button"
          onClick={() => dispatch<any>(login())}
          className="idp-btn"
        >
          Login with SSO
        </button>
      </div>
    </div>
  );
};
