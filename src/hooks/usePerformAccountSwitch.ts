import { useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAccount } from '@context/AccountContext';
import { useMailUI } from '@context/MailUIContext';
import { useMailData } from '@context/MailDataContext';
import { useContacts } from '@context/ContactsContext';
import { useProfile } from '@context/userContext';
import { isLinkedAccountSignedOut, type LinkedAccount, type PrimaryAccount } from '@services/accounts/accountService';

export type SwitchableAccount = PrimaryAccount | LinkedAccount;

export const getAccountInitials = (email: string, username?: string): string => {
  const name = username || email.split('@')[0];
  const parts = name.split(/[\s._-]/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
};

export function usePerformAccountSwitch() {
  const {
    primaryAccount,
    linkedAccounts,
    activeAccountId,
    isSwitchingAccount,
    switchAccount,
    prepareMailboxForAccount,
    commitActiveAccount,
    endAccountSwitch,
  } = useAccount();

  const { activeModals, closeModal } = useMailUI();
  const { reloadForAccountSwitch } = useMailData();
  const { fetchContacts } = useContacts();
  const { updateProfile, setProfileInitial } = useProfile();
  const navigate = useNavigate();

  const allAccounts = useMemo<SwitchableAccount[]>(
    () => (primaryAccount ? [primaryAccount, ...linkedAccounts] : linkedAccounts),
    [primaryAccount, linkedAccounts]
  );

  const applyActiveProfile = useCallback(
    (accountId: string) => {
      const account = allAccounts.find((a) => a.id === accountId);
      if (!account) return;
      const name = account.username || account.email.split('@')[0];
      updateProfile(name, account.email);
      setProfileInitial(getAccountInitials(account.email, account.username));
    },
    [allAccounts, updateProfile, setProfileInitial]
  );

  const switchToAccount = useCallback(
    async (accountId: string): Promise<boolean> => {
      if (isSwitchingAccount) return false;

      const account = allAccounts.find((a) => a.id === accountId);
      if (!account || isLinkedAccountSignedOut(account)) return false;

      const ok = await switchAccount(accountId);
      if (!ok) return false;

      try {
        prepareMailboxForAccount(accountId);

        activeModals
          .filter((m) => m.type === 'compose')
          .forEach((m) => closeModal(m.id));

        navigate('/mail/INBOX', { replace: true });
        await reloadForAccountSwitch();
        await fetchContacts();

        commitActiveAccount(accountId, account.email);
        applyActiveProfile(accountId);
        return true;
      } catch (err) {
        console.error('Failed to reload mailbox after account switch', err);
        prepareMailboxForAccount(activeAccountId);
        return false;
      } finally {
        endAccountSwitch();
      }
    },
    [
      isSwitchingAccount,
      allAccounts,
      switchAccount,
      prepareMailboxForAccount,
      activeModals,
      closeModal,
      navigate,
      reloadForAccountSwitch,
      fetchContacts,
      commitActiveAccount,
      applyActiveProfile,
      activeAccountId,
      endAccountSwitch,
    ]
  );

  const switchByOffset = useCallback(
    async (offset: number): Promise<boolean> => {
      if (isSwitchingAccount || allAccounts.length < 2) return false;
      const currentIndex = allAccounts.findIndex((a) => a.id === activeAccountId);
      const fromIndex = currentIndex >= 0 ? currentIndex : 0;
      const len = allAccounts.length;
      let nextIndex = (fromIndex + offset + len) % len;
      for (let i = 0; i < len; i++) {
        const next = allAccounts[nextIndex];
        if (next && next.id !== activeAccountId && !isLinkedAccountSignedOut(next)) {
          return switchToAccount(next.id);
        }
        nextIndex = (nextIndex + offset + len) % len;
      }
      return false;
    },
    [isSwitchingAccount, allAccounts, activeAccountId, switchToAccount]
  );

  return {
    allAccounts,
    activeAccountId,
    isSwitchingAccount,
    switchToAccount,
    switchByOffset,
    applyActiveProfile,
  };
}
