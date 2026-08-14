import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAccount } from '@context/AccountContext';
import { useMailUI } from '@context/MailUIContext';
import { useMailData } from '@context/MailDataContext';
import { useContacts } from '@context/ContactsContext';
import { AddAccountModal } from '@components/ui/Modals/LinkAccount/LinkAccountModal';
import InteractiveIcon from '@components/ui/InteractiveIcon';
import {
  getAccountInitials,
  usePerformAccountSwitch,
} from '@hooks/usePerformAccountSwitch';
import trashIcon from '@images/trash-icon.svg';
import trashIconHover from '@images/trash-icon-hover.svg';

interface AccountSwitcherProps {
  onAccountSwitch?: () => void;
}

const AccountSwitcher = ({ onAccountSwitch }: AccountSwitcherProps) => {
  const {
    primaryAccount,
    linkedAccounts,
    activeAccountId,
    unlinkAccount,
    fetchLinkedAccounts,
    prepareMailboxForAccount,
    commitActiveAccount,
  } = useAccount();

  const { openModal } = useMailUI();
  const { reloadForAccountSwitch } = useMailData();
  const { fetchContacts } = useContacts();
  const navigate = useNavigate();
  const { isSwitchingAccount, switchToAccount, applyActiveProfile } =
    usePerformAccountSwitch();

  const [addModalOpen, setAddModalOpen] = useState(false);

  const visibleAccounts = linkedAccounts.filter((a) => a.id !== activeAccountId);
  const showPrimary = primaryAccount && primaryAccount.id !== activeAccountId;

  const activeEmail =
    primaryAccount?.id === activeAccountId
      ? primaryAccount.email
      : linkedAccounts.find((a) => a.id === activeAccountId)?.email || '';

  const handleSwitch = async (accountId: string) => {
    const ok = await switchToAccount(accountId);
    if (ok) onAccountSwitch?.();
  };

  const handleUnlinkConfirmed = (accountId: string) => {
    openModal('confirmDelete', {
      onConfirm: async () => {
        const wasActive = accountId === activeAccountId;
        await unlinkAccount(accountId);
        if (wasActive && primaryAccount) {
          try {
            prepareMailboxForAccount(primaryAccount.id);
            navigate('/mail/INBOX', { replace: true });
            await reloadForAccountSwitch();
            await fetchContacts();
            commitActiveAccount(primaryAccount.id, primaryAccount.email);
            applyActiveProfile(primaryAccount.id);
          } catch (err) {
            console.error('Failed to reload mailbox after unlink', err);
            prepareMailboxForAccount(activeAccountId);
          }
        }
      },
    });
  };

  const handleAddSuccess = useCallback(async () => {
    await fetchLinkedAccounts();
    setAddModalOpen(false);
  }, [fetchLinkedAccounts]);

  return (
    <>
      <div className="add-account-section">
        <p className="add-account-label">Accounts</p>

        {isSwitchingAccount && (
          <div className="d-flex align-items-center gap-2 mb-2 px-1">
            <span
              className="spinner-border spinner-border-sm text-primary"
              style={{ width: 14, height: 14 }}
            />
            <span className="small text-muted">Switching account…</span>
          </div>
        )}

        {/* Primary row — shown only when primary is not the active account */}
        {showPrimary && (
          <div
            className="add-account-item"
            style={{
              cursor: isSwitchingAccount ? 'not-allowed' : 'pointer',
              opacity: isSwitchingAccount ? 0.6 : 1,
            }}
            onClick={() => handleSwitch(primaryAccount!.id)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && handleSwitch(primaryAccount!.id)}
          >
            <span className="mail-profile-label">
              {getAccountInitials(primaryAccount!.email, primaryAccount!.username)}
            </span>
            <div className="add-account-info">
              <p className="add-account-name">
                {primaryAccount!.username || primaryAccount!.email.split('@')[0]}
                <span
                  className="ms-1 add-account-primary">
                  Primary
                </span>
              </p>
              <p className="add-account-email">{primaryAccount!.email}</p>
            </div>
          </div>
        )}

        {/* Linked accounts (excluding active) */}
        {visibleAccounts.map((account) => (
          <div
            key={account.id}
            className="add-account-item"
          >
            <div
              className="add-account-item-main"
              style={{
                cursor: isSwitchingAccount ? 'not-allowed' : 'pointer',
                opacity: isSwitchingAccount ? 0.6 : 1,
              }}
              onClick={() => handleSwitch(account.id)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && handleSwitch(account.id)}
            >
              <span className="mail-profile-label">
                {getAccountInitials(account.email, account.username)}
              </span>
              <div className="add-account-info">
                <p className="add-account-name">
                  {account.username || account.email.split('@')[0]}
                </p>
                <p className="add-account-email">{account.email}</p>
              </div>
            </div>

            <button
              className="btn p-0 border-0 icon-hover-effect"
              title="Unlink account"
              onClick={(e) => {
                e.stopPropagation();
                handleUnlinkConfirmed(account.id);
              }}
            >
              <InteractiveIcon
                defaultIcon={trashIcon}
                hoverIcon={trashIconHover}
                activeIcon=""
                isActive={false}
                alt="Unlink"
                className="interactive-icon hover-image"
                renderAs="img"
                tooltip="Unlink account"
              />
            </button>
          </div>
        ))}

        <button
          className="add-account-btn"
          onClick={() => setAddModalOpen(true)}
          disabled={isSwitchingAccount}
        >
          <div className="add-account-icon-box">
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#757575"
              strokeWidth="2"
            >
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
          </div>
          <span>Add account</span>
        </button>
      </div>

      <AddAccountModal
        isOpen={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        currentEmail={activeEmail}
        onSuccess={handleAddSuccess}
      />
    </>
  );
};

export default AccountSwitcher;
