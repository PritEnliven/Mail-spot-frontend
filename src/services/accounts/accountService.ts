import { getData, postData, deleteData } from '../apiService';

export interface LinkedAccount {
  id: string;
  email: string;
  username: string;
  isActive: boolean;
  /** True when this linked mailbox needs a platform password re-auth. Default false. */
  isSignedOut?: boolean;
}

export const isLinkedAccountSignedOut = (
  account: { isSignedOut?: boolean } | null | undefined
): boolean => account?.isSignedOut === true;

export const normalizeLinkedAccount = (account: LinkedAccount): LinkedAccount => {
  const isSignedOut = account.isSignedOut === true;
  return {
    ...account,
    isSignedOut,
    isActive: isSignedOut ? false : Boolean(account.isActive),
  };
};

export interface LinkMailspotResponse {
  message?: string;
  account?: {
    id: string;
    email: string;
    username: string;
  };
  isSignedOut?: boolean;
}

export interface PrimaryAccount {
  id: string;
  email: string;
  username: string;
  isActive: boolean;
}

export interface LinkedAccountsResponse {
  linked_accounts: LinkedAccount[];
  primary_account: PrimaryAccount;
}

export interface CheckEmailResponse {
  exists: boolean;
  accountType: 'mailspot' | 'external';
}

export interface ImapConfig {
  host: string;
  port: number;
  password: string;
  secureType: 'tls' | 'ssl' | 'none';
  service?: string;
}

export interface SmtpConfig {
  host: string;
  port: number;
  password: string;
  secureType: 'tls' | 'ssl' | 'none';
  username: string;
}

/** Unwrap backend envelope: { statusCode, data: {...} } → {...} */
const unwrap = (res: any) => res?.data ?? res;

export const getLinkedAccounts = async (): Promise<LinkedAccountsResponse> => {
  const data = unwrap(await getData('accounts/linked'));
  return {
    primary_account: data?.primary_account,
    linked_accounts: (data?.linked_accounts || []).map(normalizeLinkedAccount),
  };
};

export const checkEmailForLink = async (email: string): Promise<CheckEmailResponse> =>
  unwrap(await postData('accounts/check-email', { email }));

export const linkMailspotAccount = async (
  email: string,
  password: string
): Promise<LinkMailspotResponse> => unwrap(await postData('accounts/link', { email, password }));

export const linkExternalAccount = async (
  email: string,
  imap_config: ImapConfig,
  smtp_config: SmtpConfig
) => unwrap(await postData('accounts/link', { email, imap_config, smtp_config }));

export const switchAccountApi = async (userId: string) =>
  unwrap(await postData('accounts/switch', { userId }));

export const unlinkAccountApi = (userId: string) =>
  deleteData(`accounts/link/${userId}`, {});
