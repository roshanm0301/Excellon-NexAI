import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import TenantIcon from "../../assets/icon-tenant.svg";
import { subscriptionIdentification } from "../../redux/actions";
import { useAppDispatch } from "../../store/customHooks";
import {
  localDataKey,
  removeLocalData,
  setLocalData,
} from "../../utility/utils";
import "./auth.scss";

export const LandingPage = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  useEffect(() => {
    removeLocalData(localDataKey);
  }, []);

  const onPranVayuClick = () => {
    dispatch(subscriptionIdentification("Pranwayu"));
    setLocalData("IS_BASE_PRODUCT", "Pranwayu");
    navigate(`/login`);
  };

  const onShristiClick = () => {
    dispatch(subscriptionIdentification("Srishti"));
    setLocalData("IS_BASE_PRODUCT", "Srishti");
    navigate(`/login`);
  };
  return (
    <div className="landing-page-container">
      <div className="landing-page-card-item">
        <b className="card-text">Login with Pranvayu</b>
        <div className="square">
          <button
            type="button"
            className="square-div"
            onClick={onPranVayuClick}
            aria-label="Login with Pranvayu"
          >
            <img alt="Pranvayu" width={25} src={TenantIcon} />
            <b className="title">Pranvayu</b>
          </button>
        </div>
      </div>

      <div className="landing-page-card-item">
        <b className="card-text">Login with Srishti</b>
        <div className="square">
          <button
            type="button"
            className="square-div"
            onClick={onShristiClick}
            aria-label="Login with Srishti"
          >
            <img alt="Srishti" width={25} src={TenantIcon} />
            <b className="title">Srishti</b>
          </button>
        </div>
      </div>
    </div>
  );
};
