import userManagementIconHover from "@images/add-pesion-icon-active.svg";
import userManagementIcon from "@images/add-pesion-icon.svg";
import settingsIconHover from "@images/setting-icon-active.svg";
import settingsIcon from "@images/setting-icon.svg";
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

interface AdminSettingsType {
    userId: string | null;
    role: string;
    isAdmin: boolean;
}

const sidebarOptions = [
    {
        id: 'userManagement',
        label: 'User Management',
        icon: userManagementIcon,
        activeIcon: userManagementIconHover,
        boxKey: 'userManagement'
    },
    {
        id: 'settings',
        label: 'Settings',
        icon: settingsIcon,
        activeIcon: settingsIconHover,
        boxKey: 'settings'
    }
]


interface ProfileContextType {
    profileName: string;
    setProfileName: (name: string) => void;
    profileEmail: string;
    setProfileEmail: (email: string) => void;
    profileInitial: string;
    setProfileInitial: (initial: string) => void;
    updateProfile: (name: string, email: string) => void;
    isSidebarOpen: boolean;
    setIsSidebarOpen: (open: boolean) => void;
    adminSidebarItems: any;
    setAdminSidebarItems: (items: any) => void;
    adminBoxTitle: string;
    setAdminBoxTitle: (title: string) => void;
    settingPayLoad: AdminSettingsType | null;
    setSettingPayLoad: (payLoad: AdminSettingsType | {
        userId: string;
        role: string;
        isAdmin: boolean | true;
    }) => void;
}

const AdminContext = createContext<ProfileContextType | undefined>(undefined);

export const AdminProvider = ({ children }: { children: ReactNode }) => {
    const [profileName, setProfileName] = useState("Admin");
    const [profileEmail, setProfileEmail] = useState("admin@example.com");
    const [profileInitial, setProfileInitial] = useState("AD");
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [adminSidebarItems, setAdminSidebarItems] = useState(sidebarOptions);
    const [adminBoxTitle, setAdminBoxTitle] = useState('User Management');
    const [settingPayLoad, setSettingPayLoad] = useState<AdminSettingsType | null>({
        userId: null,
        role : 'admin',
        isAdmin: true
    });

    useEffect(() => {
        if (profileName) {
            const names = profileName.split(' ');
            const initial = names.length > 1
                ? `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase()
                : profileName.slice(0, 2).toUpperCase();
            setProfileInitial(initial);
        }
    }, [profileName]);

    const updateProfile = (name: string, email: string) => {
        setProfileName(name);
        setProfileEmail(email);
    };

    return (
        <AdminContext.Provider
            value={{
                profileName,
                setProfileName,
                profileEmail,
                setProfileEmail,
                profileInitial,
                setProfileInitial,
                updateProfile,
                isSidebarOpen,
                setIsSidebarOpen,
                adminSidebarItems,
                setAdminSidebarItems,
                adminBoxTitle,
                setAdminBoxTitle,
                settingPayLoad,
                setSettingPayLoad,
            }}
        >
            {children}
        </AdminContext.Provider>
    );
};

export const useAdmin = (): ProfileContextType => {
    const context = useContext(AdminContext);
    if (!context) {
        throw new Error('useProfile must be used within a ProfileProvider');
    }
    return context;
};