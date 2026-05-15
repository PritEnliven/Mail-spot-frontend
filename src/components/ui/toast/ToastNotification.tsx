import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import closeIcon from "@images/close-icon.svg";
import successIcon from "@images/checkmark-badge-icon.svg";
import errorIcon from "@images/multiplication-sign-icon.svg";
import infoIcon from "@images/alert-icon.svg";

const AppToast = () => {
    return (
        <ToastContainer
            icon={({ type }) => {
                switch (type) {
                    case "success":
                        return <img src={successIcon} />;
                    case "error":
                        return <img src={errorIcon} />;
                    case "info":
                        return <img src={infoIcon} />;
                    case "warning":
                        return <img src={errorIcon} />;
                    default:
                        return null;
                }
            }}
            closeButton={({ closeToast }) => (
                <button className="btn Toastify__close-button" onClick={closeToast}>
                    <img src={closeIcon} />
                </button>
            )}
            position="top-right"
            autoClose={8000}
            hideProgressBar={false}
            newestOnTop
            closeOnClick
            rtl={false}
            pauseOnFocusLoss
            draggable
            pauseOnHover
            theme="dark"
            limit={3}
        />
    );
};

export default AppToast;
