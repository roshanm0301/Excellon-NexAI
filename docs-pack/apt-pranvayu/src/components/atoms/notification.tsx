import { useSelector } from "react-redux";
import { clearNotification } from "../../redux/actions/authAction";
import { RootState } from "../../store/store";
import { useAppDispatch } from "../../store/customHooks";
import { Toast } from "devextreme-react/toast";

export default function Notification() {
  const dispatch = useAppDispatch();
  const notification = useSelector(
    (state: RootState) => state.auth.notification
  );

  const handleClose = () => {
    dispatch(clearNotification(true));
  };

  if (!notification.isOpen) return null;

  return (
    <Toast
      height={25}
      width="20vw"
      position="bottom right"
      visible={notification.isOpen}
      message={notification.message}
      type={notification.type}
      onHiding={handleClose}
      displayTime={2000}
    />
  );
}