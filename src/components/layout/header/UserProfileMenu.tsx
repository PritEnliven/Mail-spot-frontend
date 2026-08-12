import InteractiveIcon from '@components/ui/InteractiveIcon';
import { useMailUI } from '@context/MailUIContext';
import { useMailData } from '@context/MailDataContext';
import { useProfile } from '@context/userContext';
import { useScreen } from '@context/ScreenContext';
import { AUTH_STORAGE_KEYS } from '@features/login/Login';
import changePasswordIconHover from '@images/change-password-icon-hover.svg';
import changePasswordIcon from '@images/change-password-icon.svg';
import changePasswordNewIconHover from '@images/change-password-new-icon-hover.svg';
import changePasswordNewIcon from '@images/change-password-new-icon.svg';
import closeIconHover from '@images/close-icon-hover.svg';
import closeIcon from '@images/close-icon.svg';
import enlivenLogo from '@images/enliven-logo.svg';
import { default as logoutIcon } from '@images/logout-icon.svg';
import { getUserDetail } from '@services/user/userService';
import { logoutUser } from '@services/login/loginService';
import { getSocket, disconnectSocket } from '@services/socket/socket';
import { verifyBoxName } from '@utils/emailUtil';
import { useEffect, useState } from 'react';
import { Dropdown } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';

const computeInitials = (name: string): string => {
    const parts = name.trim().split(/\s+/);
    return parts.length > 1
        ? `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
        : name.slice(0, 2).toUpperCase();
};

interface ActionRowProps {
    icon: string;
    iconHover: string;
    label: string;
    onClick: (e: React.MouseEvent) => void;
    danger?: boolean;
}

const ActionRow = ({ icon, iconHover, label, onClick, danger }: ActionRowProps) => {
    const [hovered, setHovered] = useState(false);
    return (
        <li style={{ listStyle: 'none' }}>
            <a
                href="#"
                className="profile-link hover-link"
                style={{
                    display: 'flex', alignItems: 'center',
                    padding: '11px 24px', gap: 14, textDecoration: 'none',
                    color: danger ? (hovered ? '#dc2626' : '#374151') : '#374151',
                    transition: 'color 0.15s',
                }}
                onMouseEnter={() => setHovered(true)}
                onMouseLeave={() => setHovered(false)}
                onClick={onClick}
            >
                <span style={{ width: 20, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <InteractiveIcon
                        defaultIcon={icon} hoverIcon={iconHover}
                        activeIcon="" isActive={false} alt=""
                        className="interactive-icon hover-image"
                        renderAs="img" tooltip=""
                        customStyle={{ width: 18, height: 18 }}
                    />
                </span>
                <span style={{ fontSize: '0.85rem', fontWeight: 500 }}>{label}</span>
            </a>
        </li>
    );
};

const UserProfileMenu = () => {
    const navigate = useNavigate();
    const { profileName, setProfileName, profileEmail, setProfileEmail, setProfileInitial, profileInitial } = useProfile();
    const { openModal, closeModal, activeModals } = useMailUI();
    const { boxName } = useMailData();
    const { isMobile } = useScreen();
    const [isOpen, setIsOpen] = useState(false);
    const isCalendar = verifyBoxName(boxName, 'calendar');

    useEffect(() => {
        const name = localStorage.getItem('username');
        const email = localStorage.getItem('email');
        if (name) {
            setProfileName(name);
            setProfileInitial(computeInitials(name));
        }
        if (email) setProfileEmail(email);
    }, [setProfileEmail, setProfileInitial, setProfileName]);

    const handleLogout = async () => {
        try {
            const socket = await getSocket();
            await logoutUser(socket.id ?? null);
        } catch {
            // proceed regardless
        } finally {
            disconnectSocket();
            AUTH_STORAGE_KEYS.forEach(key => {
                localStorage.removeItem(key);
                sessionStorage.removeItem(key);
            });
            navigate('/login');
        }
    };

    const openImapSmtpModal = async (e: React.MouseEvent) => {
        e.preventDefault();
        const response = await getUserDetail(profileEmail);
        if (response?.statusCode === 200) {
            const d = response.data;
            const existing = activeModals.find(m => m.type === 'changePassword');
            if (existing) closeModal(existing.id);
            openModal('changeImapSmtpPassword', {
                imapPassword: d.imapPassword, imapServer: d.imapHost, imapPort: d.imapPort,
                imapSecurityType: d.imapSecureType, smtpPassword: d.smtpPassword,
                smtpServer: d.smtpHost, smtpPort: d.smtpPort, smtpSecurityType: d.smtpSecureType,
                smtpHost: d.smtpHost,
            });
        }
    };

    const openPasswordModal = (e: React.MouseEvent) => {
        e.preventDefault();
        openModal('changePassword');
    };

    return (
        <Dropdown
            className="mail-profile-dropdown"
            show={isOpen}
            onToggle={next => {
                if (isMobile && !next) return;
                setIsOpen(next);
            }}
        >
            <Dropdown.Toggle className="btn btn-secondary dropdown-toggle d-flex align-items-center">
                <div className={`d-block${isCalendar ? ' calendar-header-profile-text' : ''}`} id="profileBox">
                    <span className="mail-profile-name d-block text-end" id="profileName">{profileName}</span>
                    <span className="mail-profile-id d-block text-end" id="profileEmail">{profileEmail}</span>
                </div>
                <span className="mail-profile-label" id="profileInitial">{profileInitial}</span>
            </Dropdown.Toggle>

            <Dropdown.Menu
                className="dropdown-menu dropdown-menu-lg-end mail-profile-box p-0"
                style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', maxHeight: '90vh', width: 300 }}
            >
                {/* Mobile close button */}
                <button type="button" className="mail-profile-close-btn-mobile btn icon-hover-effect"
                    onClick={() => setIsOpen(false)}>
                    <InteractiveIcon defaultIcon={closeIcon} hoverIcon={closeIconHover}
                        activeIcon="" isActive={false} alt=""
                        className="interactive-icon hover-image" renderAs="img" tooltip="" />
                </button>

                {/* Top — gradient avatar block */}
                <div style={{
                    background: 'radial-gradient(circle at 50% -20%, #f0f7ff 0%, #ffffff 70%)',
                    padding: '2rem 1.5rem 1.5rem',
                    display: 'flex', flexDirection: 'column', alignItems: 'center',
                    borderBottom: '1px solid #e5e7eb', flexShrink: 0,
                }}>
                    <div style={{
                        width: 88, height: 88, borderRadius: 16,
                        background: '#dbeafe', border: '1px solid #bfdbfe',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        marginBottom: 14, boxShadow: '0 1px 4px rgba(59,130,246,0.15)',
                    }}>
                        <span style={{ fontSize: '2rem', fontWeight: 300, color: '#3b82f6', letterSpacing: '0.05em', userSelect: 'none' }}>
                            {profileInitial}
                        </span>
                    </div>
                    <p style={{ margin: '0 0 4px', fontWeight: 500, fontSize: '1rem', color: '#1f2937' }}>
                        {profileName}
                    </p>
                    <p style={{ margin: 0, fontSize: '0.78rem', color: '#6b7280' }}>
                        {profileEmail}
                    </p>
                </div>

                {/* Middle — action list */}
                <div style={{ background: '#f9fafb' }}>
                    <ul style={{ listStyle: 'none', margin: 0, padding: '6px 0' }}>
                        <ActionRow
                            icon={changePasswordNewIcon} iconHover={changePasswordNewIconHover}
                            label="Change IMAP/SMTP Configuration" onClick={openImapSmtpModal}
                        />
                        <ActionRow
                            icon={changePasswordIcon} iconHover={changePasswordIconHover}
                            label="Change password" onClick={openPasswordModal}
                        />
                        <ActionRow
                            icon={logoutIcon} iconHover={logoutIcon}
                            label="Logout"
                            onClick={e => { e.preventDefault(); handleLogout(); }}
                            danger
                        />
                    </ul>
                </div>

                {/* Footer */}
                <div className="profile-footer d-flex align-items-center justify-content-between"
                    style={{ background: '#f9fafb', borderTop: '1px dashed #e5e7eb', flexShrink: 0 }}>
                    <span className="mailspot-version-number">V 1.0</span>
                    <span className="powered-sec">
                        Powered by
                        <a href="#" className="ms-2">
                            <img src={enlivenLogo} alt="Enliven" />
                        </a>
                    </span>
                </div>
            </Dropdown.Menu>
        </Dropdown>
    );
};

export default UserProfileMenu;
