import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { showError, showSuccess } from '@components/ui/toast/toastNotification';
import {
  getLinkedAccounts,
  checkEmailForLink,
  linkMailspotAccount,
  linkExternalAccount,
  switchAccountApi,
  unlinkAccountApi,
  isLinkedAccountSignedOut,
  type LinkedAccount,
  type PrimaryAccount,
  type CheckEmailResponse,
  type ImapConfig,
  type SmtpConfig,
} from '@services/accounts/accountService';
import { setActiveAccountId as setApiActiveAccountId, getActiveAccountId as getApiActiveAccountId } from '@services/apiService';

const ACTIVE_ACCOUNT_ID_KEY = 'activeAccountId';
const ACTIVE_ACCOUNT_EMAIL_KEY = 'activeAccountEmail';

interface AccountContextType {
  primaryAccount: PrimaryAccount | null;
  linkedAccounts: LinkedAccount[];
  activeAccountId: string | null;
  activeAccountEmail: string | null;
  isSwitchingAccount: boolean;
  isLoadingAccounts: boolean;
  fetchLinkedAccounts: () => Promise<void>;
  /** Call backend switch API only — does not update visible account state */
  switchAccount: (accountId: string) => Promise<boolean>;
  /** Set x-active-account-id for mailbox API calls during reload */
  prepareMailboxForAccount: (accountId: string | null) => void;
  /** Persist active account in UI + session after switch + reload succeed */
  commitActiveAccount: (accountId: string, email: string) => void;
  endAccountSwitch: () => void;
  unlinkAccount: (accountId: string) => Promise<void>;
  /** Drop a linked account locally (socket revoke) and fall back to primary if needed */
  removeRevokedAccount: (accountId: string, switchedToPrimary?: boolean) => void;
  /** Mark a linked account signed out (password change). Does not remove the row. Returns true if mailbox should snap to primary. */
  markAccountSignedOut: (accountId: string, switchedToPrimary?: boolean) => boolean;
  checkEmail: (email: string) => Promise<CheckEmailResponse | null>;
  linkMailspot: (email: string, password: string) => Promise<boolean>;
  linkExternal: (email: string, imap: ImapConfig, smtp: SmtpConfig) => Promise<boolean>;
}

const AccountContext = createContext<AccountContextType | undefined>(undefined);

export const AccountProvider = ({ children }: { children: ReactNode }) => {
  const [primaryAccount, setPrimaryAccount] = useState<PrimaryAccount | null>(null);
  const [linkedAccounts, setLinkedAccounts] = useState<LinkedAccount[]>([]);
  const [activeAccountId, setActiveAccountIdState] = useState<string | null>(
    () => sessionStorage.getItem(ACTIVE_ACCOUNT_ID_KEY)
  );
  const [activeAccountEmail, setActiveAccountEmailState] = useState<string | null>(
    () => sessionStorage.getItem(ACTIVE_ACCOUNT_EMAIL_KEY)
  );
  const [isSwitchingAccount, setIsSwitchingAccount] = useState(false);
  const [isLoadingAccounts, setIsLoadingAccounts] = useState(false);
  const accountsFetchIdRef = useRef(0);
  const activeAccountIdRef = useRef(activeAccountId);
  const primaryAccountRef = useRef(primaryAccount);
  const lastSignedOutSnapRef = useRef<{ accountId: string; at: number } | null>(null);

  activeAccountIdRef.current = activeAccountId;
  primaryAccountRef.current = primaryAccount;

  const setActiveId = useCallback((id: string | null, email: string | null) => {
    setActiveAccountIdState(id);
    setActiveAccountEmailState(email);
    setApiActiveAccountId(id);
    if (id) {
      sessionStorage.setItem(ACTIVE_ACCOUNT_ID_KEY, id);
    } else {
      sessionStorage.removeItem(ACTIVE_ACCOUNT_ID_KEY);
    }
    if (email) {
      sessionStorage.setItem(ACTIVE_ACCOUNT_EMAIL_KEY, email);
    } else {
      sessionStorage.removeItem(ACTIVE_ACCOUNT_EMAIL_KEY);
    }
  }, []);

  // Sync stored activeAccountId to apiService on mount
  useEffect(() => {
    const storedId = sessionStorage.getItem(ACTIVE_ACCOUNT_ID_KEY);
    if (storedId) setApiActiveAccountId(storedId);
  }, []);

  const fetchLinkedAccounts = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!token) return;

    const fetchId = ++accountsFetchIdRef.current;
    setIsLoadingAccounts(true);
    try {
      const res = await getLinkedAccounts();
      if (fetchId !== accountsFetchIdRef.current) return;

      const primary = res.primary_account;
      const linked = res.linked_accounts || [];
      if (!primary?.id) return;

      setPrimaryAccount(primary);
      setLinkedAccounts(linked);

      const storedActiveId = sessionStorage.getItem(ACTIVE_ACCOUNT_ID_KEY);
      const storedLinked = linked.find((a) => a.id === storedActiveId);

      if (storedActiveId && storedActiveId === primary.id) {
        setActiveId(primary.id, primary.email);
      } else if (storedActiveId && storedLinked && !isLinkedAccountSignedOut(storedLinked)) {
        try {
          await switchAccountApi(storedActiveId);
          if (fetchId !== accountsFetchIdRef.current) return;
          setActiveId(storedLinked.id, storedLinked.email);
        } catch {
          setActiveId(primary.id, primary.email);
        }
      } else {
        setActiveId(primary.id, primary.email);
      }
    } catch (err) {
      console.error('fetchLinkedAccounts error', err);
    } finally {
      if (fetchId === accountsFetchIdRef.current) {
        setIsLoadingAccounts(false);
      }
    }
  }, [setActiveId]);

  // Auto-fetch on mount when a session token is present
  useEffect(() => {
    if (localStorage.getItem('token')) {
      fetchLinkedAccounts();
    }
  }, []);

  const switchAccount = useCallback(
    async (accountId: string): Promise<boolean> => {
      if (accountId === activeAccountId || isSwitchingAccount) return false;

      const target = linkedAccounts.find((a) => a.id === accountId);
      if (isLinkedAccountSignedOut(target)) return false;

      const allAccounts = primaryAccount
        ? [primaryAccount, ...linkedAccounts]
        : linkedAccounts;
      if (!allAccounts.some((a) => a.id === accountId)) return false;

      setIsSwitchingAccount(true);

      try {
        await switchAccountApi(accountId);
        return true;
      } catch (err: any) {
        setIsSwitchingAccount(false);
        if (err?.isLinkedAccountSignedOut) {
          return false;
        }
        showError(err?.message || 'Failed to switch account');
        return false;
      }
    },
    [activeAccountId, isSwitchingAccount, primaryAccount, linkedAccounts]
  );

  const prepareMailboxForAccount = useCallback((accountId: string | null) => {
    if (accountId && isLinkedAccountSignedOut(linkedAccounts.find((a) => a.id === accountId))) {
      setApiActiveAccountId(primaryAccount?.id ?? null);
      return;
    }
    setApiActiveAccountId(accountId);
  }, [linkedAccounts, primaryAccount]);

  const commitActiveAccount = useCallback(
    (accountId: string, email: string) => {
      if (isLinkedAccountSignedOut(linkedAccounts.find((a) => a.id === accountId))) {
        return;
      }
      setActiveId(accountId, email);
    },
    [linkedAccounts, setActiveId]
  );

  const endAccountSwitch = useCallback(() => {
    setIsSwitchingAccount(false);
  }, []);

  const unlinkAccount = useCallback(
    async (accountId: string) => {
      try {
        await unlinkAccountApi(accountId);

        if (accountId === activeAccountId && primaryAccount) {
          await switchAccountApi(primaryAccount.id);
        }

        await fetchLinkedAccounts();
        showSuccess('Account unlinked successfully');
      } catch (err: any) {
        showError(err?.message || 'Failed to unlink account');
        throw err;
      }
    },
    [activeAccountId, primaryAccount, fetchLinkedAccounts]
  );

  const removeRevokedAccount = useCallback(
    (accountId: string, switchedToPrimary = false) => {
      setLinkedAccounts((prev) => prev.filter((a) => a.id !== accountId));

      const wasActive = accountId === activeAccountId;
      if ((switchedToPrimary || wasActive) && primaryAccount) {
        setActiveId(primaryAccount.id, primaryAccount.email);
      }
    },
    [activeAccountId, primaryAccount, setActiveId]
  );

  const markAccountSignedOut = useCallback(
    (accountId: string, switchedToPrimary = false): boolean => {
      setLinkedAccounts((prev) =>
        prev.map((a) =>
          a.id === accountId ? { ...a, isSignedOut: true, isActive: false } : a
        )
      );

      const currentActiveId = activeAccountIdRef.current;
      const primary = primaryAccountRef.current;
      const needsSnap = switchedToPrimary || currentActiveId === accountId;

      if (!primary) {
        if (currentActiveId === accountId) {
          setActiveId(null, null);
        }
        return false;
      }

      const now = Date.now();
      const lastSnap = lastSignedOutSnapRef.current;
      const recentlySnapped =
        lastSnap?.accountId === accountId && now - lastSnap.at < 2000;

      if (!needsSnap) {
        if (getApiActiveAccountId() === accountId) {
          setActiveId(primary.id, primary.email);
        }
        return false;
      }

      lastSignedOutSnapRef.current = { accountId, at: now };
      const alreadyOnPrimary = currentActiveId === primary.id;
      setActiveId(primary.id, primary.email);
      return !alreadyOnPrimary && !recentlySnapped;
    },
    [setActiveId]
  );

  const checkEmail = useCallback(
    async (email: string): Promise<CheckEmailResponse | null> => {
      try {
        return await checkEmailForLink(email);
      } catch (err: any) {
        showError(err?.message || 'Failed to check email');
        return null;
      }
    },
    []
  );

  const linkMailspot = useCallback(
    async (email: string, password: string): Promise<boolean> => {
      try {
        const res = await linkMailspotAccount(email, password);
        const existing = linkedAccounts.find(
          (a) => a.email.toLowerCase() === email.toLowerCase()
        );

        if (existing) {
          setLinkedAccounts((prev) =>
            prev.map((a) =>
              a.email.toLowerCase() === email.toLowerCase()
                ? {
                    ...a,
                    isSignedOut: false,
                    ...(res?.account
                      ? {
                          id: res.account.id,
                          email: res.account.email,
                          username: res.account.username,
                        }
                      : {}),
                  }
                : a
            )
          );
          showSuccess(res?.message || 'Account signed in successfully');
          return true;
        }

        showSuccess(res?.message || 'Account linked successfully');
        await fetchLinkedAccounts();
        return true;
      } catch (err: any) {
        showError(err?.error || err?.message || 'Failed to link account');
        return false;
      }
    },
    [fetchLinkedAccounts, linkedAccounts]
  );

  const linkExternal = useCallback(
    async (email: string, imap: ImapConfig, smtp: SmtpConfig): Promise<boolean> => {
      try {
        await linkExternalAccount(email, imap, smtp);
        showSuccess('Account linked successfully');
        await fetchLinkedAccounts();
        return true;
      } catch (err: any) {
        showError(err?.message || 'Failed to link account');
        return false;
      }
    },
    [fetchLinkedAccounts]
  );

  return (
    <AccountContext.Provider
      value={{
        primaryAccount,
        linkedAccounts,
        activeAccountId,
        activeAccountEmail,
        isSwitchingAccount,
        isLoadingAccounts,
        fetchLinkedAccounts,
        switchAccount,
        prepareMailboxForAccount,
        commitActiveAccount,
        endAccountSwitch,
        unlinkAccount,
        removeRevokedAccount,
        markAccountSignedOut,
        checkEmail,
        linkMailspot,
        linkExternal,
      }}
    >
      {children}
    </AccountContext.Provider>
  );
};

export const useAccount = (): AccountContextType => {
  const ctx = useContext(AccountContext);
  if (!ctx) throw new Error('useAccount must be used within AccountProvider');
  return ctx;
};

/** Clear all account session data on logout */
export const clearAccountSession = () => {
  sessionStorage.removeItem(ACTIVE_ACCOUNT_ID_KEY);
  sessionStorage.removeItem(ACTIVE_ACCOUNT_EMAIL_KEY);
  setApiActiveAccountId(null);
};
