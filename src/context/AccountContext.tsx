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
  type LinkedAccount,
  type PrimaryAccount,
  type CheckEmailResponse,
  type ImapConfig,
  type SmtpConfig,
} from '@services/accounts/accountService';
import { setActiveAccountId as setApiActiveAccountId } from '@services/apiService';

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

      setPrimaryAccount(primary);
      setLinkedAccounts(linked);

      const storedActiveId = sessionStorage.getItem(ACTIVE_ACCOUNT_ID_KEY);
      const allAccountIds = [primary.id, ...linked.map((a) => a.id)];

      if (storedActiveId && allAccountIds.includes(storedActiveId)) {
        const account =
          storedActiveId === primary.id
            ? primary
            : linked.find((a) => a.id === storedActiveId);
        if (account) {
          setActiveId(account.id, account.email);
          // Restore non-primary active account on the backend
          if (storedActiveId !== primary.id) {
            try {
              await switchAccountApi(storedActiveId);
            } catch {
              // Fall back to primary if restore fails
              setActiveId(primary.id, primary.email);
            }
          }
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

      const allAccounts = primaryAccount
        ? [primaryAccount, ...linkedAccounts]
        : linkedAccounts;
      if (!allAccounts.some((a) => a.id === accountId)) return false;

      setIsSwitchingAccount(true);

      try {
        await switchAccountApi(accountId);
        return true;
      } catch (err: any) {
        showError(err?.message || 'Failed to switch account');
        setIsSwitchingAccount(false);
        return false;
      }
    },
    [activeAccountId, isSwitchingAccount, primaryAccount, linkedAccounts]
  );

  const prepareMailboxForAccount = useCallback((accountId: string | null) => {
    setApiActiveAccountId(accountId);
  }, []);

  const commitActiveAccount = useCallback(
    (accountId: string, email: string) => {
      setActiveId(accountId, email);
    },
    [setActiveId]
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
        await linkMailspotAccount(email, password);
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
