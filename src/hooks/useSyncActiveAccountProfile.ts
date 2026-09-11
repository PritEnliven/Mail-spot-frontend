import { useEffect } from 'react';
import { useAccount } from '@context/AccountContext';
import { useProfile } from '@context/userContext';
import { getAccountInitials } from '@hooks/usePerformAccountSwitch';

/**
 * Keep header profile in sync with the active mailbox account.
 * On reload, localStorage still holds the primary login identity, while
 * sessionStorage + AccountContext hold the currently active linked account.
 */
export function useSyncActiveAccountProfile() {
    const {
        activeAccountId,
        primaryAccount,
        linkedAccounts,
        isLoadingAccounts,
    } = useAccount();
    const { updateProfile, setProfileInitial } = useProfile();

    useEffect(() => {
        if (isLoadingAccounts) return;

        const account =
            (primaryAccount?.id === activeAccountId ? primaryAccount : null)
            ?? linkedAccounts.find((item) => item.id === activeAccountId)
            ?? null;

        if (account) {
            const name = account.username || account.email.split('@')[0];
            updateProfile(name, account.email);
            setProfileInitial(getAccountInitials(account.email, account.username));
            return;
        }

        // Fallback before linked-accounts resolve: prefer session active email.
        const storedActiveEmail = sessionStorage.getItem('activeAccountEmail');
        const storedName = localStorage.getItem('username');
        const storedEmail = localStorage.getItem('email');

        if (storedActiveEmail) {
            const isPrimaryLogin = storedEmail === storedActiveEmail;
            const name = isPrimaryLogin && storedName
                ? storedName
                : storedActiveEmail.split('@')[0];
            updateProfile(name, storedActiveEmail);
            setProfileInitial(getAccountInitials(storedActiveEmail, isPrimaryLogin ? storedName ?? undefined : undefined));
            return;
        }

        if (storedName || storedEmail) {
            if (storedName) {
                updateProfile(storedName, storedEmail || '');
                setProfileInitial(getAccountInitials(storedEmail || storedName, storedName));
            } else if (storedEmail) {
                updateProfile(storedEmail.split('@')[0], storedEmail);
                setProfileInitial(getAccountInitials(storedEmail));
            }
        }
    }, [
        activeAccountId,
        primaryAccount,
        linkedAccounts,
        isLoadingAccounts,
        updateProfile,
        setProfileInitial,
    ]);
}
