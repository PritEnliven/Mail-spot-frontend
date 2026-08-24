import { useState, useCallback, useEffect, type MouseEvent } from 'react';
import { createPortal } from 'react-dom';
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
import { isLinkedAccountSignedOut } from '@services/accounts/accountService';
import moreActionIcon from '@images/ellipsis-vertical-icon.svg';
import moreActionIconHover from '@images/ellipsis-vertical-icon-hover.svg';
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
  const [reauthEmail, setReauthEmail] = useState<string | null>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [menuPos, setMenuPos] = useState({ top: 0, left: 0 });

  const visibleAccounts = linkedAccounts.filter((a) => a.id !== activeAccountId);
  const showPrimary = primaryAccount && primaryAccount.id !== activeAccountId;

  const activeEmail =
    primaryAccount?.id === activeAccountId
      ? primaryAccount.email
      : linkedAccounts.find((a) => a.id === activeAccountId)?.email || '';

  const handleSwitch = async (accountId: string) => {
    const account = linkedAccounts.find((a) => a.id === accountId);
    if (isLinkedAccountSignedOut(account)) {
      setReauthEmail(account!.email);
      setAddModalOpen(true);
      return;
    }
    const ok = await switchToAccount(accountId);
    if (ok) onAccountSwitch?.();
  };

  const openAddAccount = () => {
    setReauthEmail(null);
    setAddModalOpen(true);
  };

  const closeAddModal = () => {
    setAddModalOpen(false);
    setReauthEmail(null);
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
            console.error('Failed to reload mailbox after remove.', err);
            prepareMailboxForAccount(activeAccountId);
          }
        }
      },
    });
  };

  const handleAddSuccess = useCallback(async () => {
    await fetchLinkedAccounts();
    setAddModalOpen(false);
    setReauthEmail(null);
  }, [fetchLinkedAccounts]);

  const closeMoreMenu = useCallback(() => setOpenMenuId(null), []);

  const toggleMoreMenu = (accountId: string, event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();
    if (openMenuId === accountId) {
      setOpenMenuId(null);
      return;
    }
    const rect = event.currentTarget.getBoundingClientRect();
    const menuWidth = 160;
    const left = Math.min(rect.right - menuWidth, window.innerWidth - menuWidth - 8);
    setMenuPos({
      top: rect.bottom + 4,
      left: Math.max(8, left),
    });
    setOpenMenuId(accountId);
  };

  useEffect(() => {
    if (!openMenuId) return;

    const onPointerDown = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      if (target?.closest('.add-account-more-menu') || target?.closest('.add-account-more-btn')) {
        return;
      }
      setOpenMenuId(null);
    };

    document.addEventListener('mousedown', onPointerDown);
    window.addEventListener('resize', closeMoreMenu);
    window.addEventListener('scroll', closeMoreMenu, true);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      window.removeEventListener('resize', closeMoreMenu);
      window.removeEventListener('scroll', closeMoreMenu, true);
    };
  }, [openMenuId, closeMoreMenu]);

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
        {visibleAccounts.map((account) => {
          const signedOut = isLinkedAccountSignedOut(account);
          return (
            <div
              key={account.id}
              className={`add-account-item${signedOut ? ' is-signed-out' : ''}`}
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
                    {signedOut && (
                      <span className="ms-1 add-account-signed-out">Signed out</span>
                    )}
                  </p>
                  <p className="add-account-email">{account.email}</p>
                </div>
              </div>

              <button
                type="button"
                className="add-account-more-btn hover-link d-flex align-items-center icon-hover-effect btn btn-link p-0 border-0"
                onClick={(e) => toggleMoreMenu(account.id, e)}
                aria-haspopup="menu"
                aria-expanded={openMenuId === account.id}
              >
                <InteractiveIcon
                  defaultIcon={moreActionIcon}
                  hoverIcon={moreActionIconHover}
                  activeIcon=""
                  isActive={false}
                  alt="More"
                  className="interactive-icon hover-image"
                  renderAs="img"
                  tooltip="More"
                />
              </button>
            </div>
          );
        })}

        <button
          className="add-account-btn"
          onClick={openAddAccount}
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

      {openMenuId &&
        createPortal(
          <div
            className="dropdown-menu show add-account-more-menu react-dropdown"
            role="menu"
            style={{ top: menuPos.top, left: menuPos.left }}
            onMouseDown={(e) => e.stopPropagation()}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              className="dropdown-item justify-content-start"
              role="menuitem"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleUnlinkConfirmed(openMenuId);
                setOpenMenuId(null);
              }}
            >
              <InteractiveIcon
                defaultIcon={trashIcon}
                hoverIcon={trashIconHover}
                activeIcon=""
                isActive={false}
                alt=""
                className="interactive-icon hover-image"
                renderAs="img"
                tooltip=""
              />
              <span className="d-flex align-items-center ms-3">Remove account</span>
            </button>
          </div>,
          document.body
        )}

      <AddAccountModal
        isOpen={addModalOpen}
        onClose={closeAddModal}
        currentEmail={activeEmail}
        reauthEmail={reauthEmail}
        onSuccess={handleAddSuccess}
      />
    </>
  );
};

export default AccountSwitcher;
