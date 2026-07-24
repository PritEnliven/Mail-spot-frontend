import InteractiveIcon from "@components/ui/InteractiveIcon";
import { AUTH_STORAGE_KEYS } from "@features/login/Login";
import enlivenLogo from "@images/enliven-logo.svg";
import { default as logoutIcon, default as logoutIconHover } from "@images/logout-icon.svg";
import { useNavigate } from "react-router-dom";

interface adminHeaderProps {
    title: string;
}

const AdminHeader = ({ title }: adminHeaderProps) => {
    const navigate = useNavigate();
    const logout = () => {
        // Clear only auth keys, preserve rememberedEmail
        AUTH_STORAGE_KEYS.forEach((key) => {
            localStorage.removeItem(key);
            sessionStorage.removeItem(key);
        });
        navigate('/admin/login');
    }
    return (
        <div className="mail-details-header d-flex align-items-center justify-content-between">
            <div className="d-flex align-items-center">
                <h2 className="box-title">{title}</h2>
            </div>
            <div className="btn-group mail-profile-dropdown">
                <button
                    className="btn btn-secondary dropdown-toggle d-flex align-items-center justify-content-end"
                    type="button"
                    data-bs-toggle="dropdown"
                >
                    <div className="d-block">
                        <span className="mail-profile-name d-block text-end m-0">
                            MailSpot-Admin
                        </span>
                    </div>
                    <span className="mail-profile-label d-none">M</span>
                    <span className="mail-profile-label">M</span>
                </button>
                <ul
                    className="dropdown-menu dropdown-menu-lg-end mail-profile-box p-0"
                    style={{}}
                >
                    <div className="profile-sec-new-box">
                        <div className="profile-sec-people">
                            <div className="profile-sec-people-sub">
                                <div className="profile-sec-image mb-3">M</div>
                                <span className="mail-profile-name d-block text-center">
                                    MailSpot-Admin
                                </span>
                            </div>
                        </div>
                        <ul className="profile-link-list">
                            <li className="profile-link-items">
                                <a className="profile-link" onClick={logout}>
                                    <InteractiveIcon
                                        defaultIcon={logoutIcon}
                                        hoverIcon={logoutIconHover}
                                        activeIcon=""
                                        isActive={false}
                                        alt=""
                                        className="interactive-icon hover-image"
                                        renderAs="img"
                                        tooltip=""
                                    />Logout</a>
                            </li>
                        </ul>
                        <div className="profile-footer d-flex align-items-center justify-content-between">
                            <span className="mailspot-version-number">V 1.0</span>
                            <span className="powered-sec">
                                Powered by
                                <a href="#" className="ms-2">
                                    <img src={enlivenLogo} alt="" />
                                </a>
                            </span>
                        </div>
                    </div>
                </ul>
            </div>
        </div>
    );
};

export default AdminHeader;