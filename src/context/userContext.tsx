import { createContext, useContext, type ReactNode, useState, useEffect } from "react";

interface ProfileContextType {
    profileName: string;
    setProfileName: (name: string) => void;
    profileEmail: string;
    setProfileEmail: (email: string) => void;
    profileInitial: string;
    setProfileInitial: (initial: string) => void;
    updateProfile: (name: string, email: string) => void;
}

const ProfileContext = createContext<ProfileContextType | undefined>(undefined);

export const ProfileProvider = ({ children }: { children: ReactNode }) => {
    const [profileName, setProfileName] = useState("John Doe");
    const [profileEmail, setProfileEmail] = useState("john.doe@example.com");
    const [profileInitial, setProfileInitial] = useState("JD");

    // Update initial whenever name changes
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
        <ProfileContext.Provider
            value={{
                profileName,
                setProfileName,
                profileEmail,
                setProfileEmail,
                profileInitial,
                setProfileInitial,
                updateProfile
            }}
        >
            {children}
        </ProfileContext.Provider>
    );
};

export const useProfile = (): ProfileContextType => {
    const context = useContext(ProfileContext);
    if (!context) {
        throw new Error('useProfile must be used within a ProfileProvider');
    }
    return context;
};