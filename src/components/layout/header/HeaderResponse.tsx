
import InteractiveIcon from "@components/ui/InteractiveIcon";
import { useProfile } from "@context/userContext";
import changePasswordIconHover from "@images/change-password-icon-hover.svg";
import changePasswordIcon from "@images/change-password-icon.svg";
import changePasswordNewIconHover from "@images/change-password-new-icon-hover.svg";
import changePasswordNewIcon from "@images/change-password-new-icon.svg";
import closeIconHover from '@images/close-icon-hover.svg';
import closeIcon from '@images/close-icon.svg';
import enlivenLogo from "@images/enliven-logo.svg";
import { default as logoutIcon, default as logoutIconHover } from "@images/logout-icon.svg";
import { getUserDetail } from "@services/user/userService";
import { logoutUser } from "@services/login/loginService";
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useContacts, useMailData, useMailUI } from '../../../context/index';

const Header = () => {
    const navigate = useNavigate();
    const { profileName, setProfileName, profileEmail, setProfileEmail, profileInitial, setProfileInitial } = useProfile();
    const [isFilterDropdownOpen, setIsFilterDropdownOpen] = useState(false);
    const [searchText,] = useState("");
    const { openModal, closeModal, activeModals, } = useMailUI();
    const { socketId } = useMailData();
    const { fetchContacts } = useContacts();
    const [isSearchResultDropdownOpen, setIsSearchResultDropdownOpen] = useState(false);

    useEffect(() => {
        fetchContacts();
    }, []);

    const handleLogout = async () => {
        const currentSocketId = localStorage.getItem('socketId') ?? socketId;
        await logoutUser(currentSocketId);
        localStorage.clear();
        navigate('/login');
    };

    const openChangeImapSmtpPasswordModal = async () => {
        const response = await getUserDetail(profileEmail);
        if (response?.statusCode === 200) {
            const userData = {
                imapPassword: response.data.imapPassword,
                imapServer: response.data.imapHost,
                imapPort: response.data.imapPort,
                imapSecurityType: response.data.imapSecureType,
                smtpPassword: response.data.smtpPassword,
                smtpServer: response.data.smtpHost,
                smtpPort: response.data.smtpPort,
                smtpSecurityType: response.data.smtpSecureType,
                smtpHost: response.data.smtpHost
            }
            //check if changePassword modal is open then close it
            const changePasswordModal = activeModals.find((modal) => modal.type === 'changePassword');
            if (changePasswordModal) {
                closeModal(changePasswordModal.id);
            }
            openModal('changeImapSmtpPassword', userData)
        }
    }

    const openChangePasswordModal = () => {
        openModal('changePassword')
    }

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as Element;
            const headerComponent = target.closest('.mail-details-header');
            const flatpickrCalendar = target.closest('.flatpickr-calendar');

            const filterDropdown = document.getElementById('filterEmailFormSection');
            const isInsideFilterDropdown = !!filterDropdown && filterDropdown.contains(target);

            const searchDropdown = document.getElementById('searchEmailDropdown1');
            const isInsideSearchDropdown = !!searchDropdown && searchDropdown.contains(target);

            if (flatpickrCalendar) return;

            if (isFilterDropdownOpen && !isInsideFilterDropdown) {
                setIsFilterDropdownOpen(false);
            }

            if (isSearchResultDropdownOpen && !isInsideSearchDropdown && !headerComponent) {
                setIsSearchResultDropdownOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isFilterDropdownOpen, isSearchResultDropdownOpen]);

    useEffect(() => {
        // Load profile data from localStorage on component mount
        const storedName = localStorage.getItem('username');
        const storedEmail = localStorage.getItem('email');

        if (storedName) {
            setProfileName(storedName);
            const initial = storedName.charAt(0).toUpperCase();
            setProfileInitial(initial);
        }
        if (storedEmail) {
            setProfileEmail(storedEmail);
        }

    }, []);

    useEffect(() => {
        if (searchText.length > 0) {
            setIsFilterDropdownOpen(false);
        }
    }, [searchText]);

    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const profileRef = useRef<any>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as Node;
            const isInsideProfileDropdown = profileRef.current && profileRef.current.contains(target);

            if (isProfileOpen && !isInsideProfileDropdown) {
                setIsProfileOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isProfileOpen]);

    return (
        <div className="mail-profile-dropdown" ref={profileRef}>

            {/* Toggle */}
            <div
                className="btn btn-secondary dropdown-toggle d-flex align-items-center"
                onClick={() => setIsProfileOpen(!isProfileOpen)}
            >
                <div className="d-block" id="profileBox">
                    <span className="mail-profile-name d-block text-end" id="profileName">
                        {profileName}
                    </span>
                    <span className="mail-profile-id d-block text-end" id="profileEmail">
                        {profileEmail}
                    </span>
                </div>
                <span className="mail-profile-label" id="profileInitial">
                    {profileInitial}
                </span>
            </div>

            {/* Menu */}
            {isProfileOpen && (
                <div className="dropdown-menu dropdown-menu-lg-end mail-profile-box p-0 show">
                    <button
                        className="mail-profile-close-btn-mobile btn icon-hover-effect"
                        onClick={() => setIsProfileOpen(false)}
                    >
                        <InteractiveIcon
                            defaultIcon={closeIcon}
                            hoverIcon={closeIconHover}
                            activeIcon=""
                            isActive={false}
                            alt=""
                            className="interactive-icon hover-image"
                            renderAs="img"
                            tooltip=""
                        />
                    </button>
<div className="profile-sec-new-box">
                            <div className="profile-sec-people">
                                <div className="profile-sec-people-sub">
                                    <div className="profile-sec-image mb-3" id="profileInitial1">
                                        {profileInitial}
                                    </div>
                                    <span className="profile-sec-people-sub-mail-profile-name d-block text-center"
                                        id="profileName1"> {profileName}</span>
                                    <span className="profile-sec-people-sub-mail-profile-id d-block copy-text text-center"
                                        id="profileEmail1"> {profileEmail}</span>
                                </div>
                            </div>
                            <ul className="profile-link-list">
                                <li className="profile-link-items">
                                    <a href="javascript:;" className="profile-link hover-link" onClick={openChangeImapSmtpPasswordModal}>
                                        <InteractiveIcon
                                            defaultIcon={changePasswordNewIcon}
                                            hoverIcon={changePasswordNewIconHover}
                                            activeIcon=""
                                            isActive={false}
                                            alt=""
                                            className="interactive-icon hover-image"
                                            renderAs="img"
                                            tooltip=""
                                        />Change IMAP/SMTP Configuration</a>
                                </li>
                                <li className="profile-link-items">
                                    <a href="javascript:;" className="profile-link hover-link" onClick={openChangePasswordModal}>
                                        <InteractiveIcon
                                            defaultIcon={changePasswordIcon}
                                            hoverIcon={changePasswordIconHover}
                                            activeIcon=""
                                            isActive={false}
                                            alt=""
                                            className="interactive-icon hover-image"
                                            renderAs="img"
                                            tooltip=""
                                        />Change password</a>
                                </li>
                                <li className="profile-link-items">
                                    <a href="javascript:;" className="profile-link hover-link" onClick={handleLogout}>
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
                                    <a href="javascript:;" className="ms-2">
                                        <img src={enlivenLogo} alt="" />
                                    </a>
                                </span>
                            </div>
                        </div>
                </div>
            )}
        </div>
    );
};

export default Header;
