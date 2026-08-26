import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useState, type FormEvent } from 'react';
import { Controller, useForm } from 'react-hook-form';
import SimpleBar from 'simplebar-react';

import { useAccount } from '@context/AccountContext';
import BaseModal from '@components/ui/BaseModal';
import InteractiveIcon from '@components/ui/InteractiveIcon';
import Select2Wrapper from '@components/ui/form/Select2Wrapper';
import SubmitButton from '@components/ui/form/SubmitButton';

import arrowPointingOutIcon from '@images/arrows-pointing-out-icon.svg';
import arrowPointingOutIconHover from '@images/arrows-pointing-out-icon-hover.svg';
import CloseIcon from '@images/close-icon.svg';
import CloseIconHover from '@images/close-icon-hover.svg';
import passwordShowIcon from '@images/password-show-icon-16.svg';
import passwordHideIcon from '@images/password-hide-icon-16.svg';
import lockIcon from '@images/password-icon-16.svg';
import lockIconfocuse from '@images/password-icon-16-blue.svg';
import serverIcon from '@images/server-icon-16.svg';
import serverIconfocuse from '@images/server-icon-16-blue.svg';
import recommendedIcon from '@images/recommended-icon-16.svg';
import mailIcon from '@images/mail-icon-16.svg';
import mailIconfocuse from '@images/mail-icon-16-blue.svg';
import successfullyIcon from '@images/successfully-icon-green.svg';

import type { ImapConfig, SmtpConfig } from '@services/accounts/accountService';

import {
  emailStepSchema,
  passwordStepSchema,
  externalStepSchema,
  type EmailStepValues,
  type PasswordStepValues,
  type ExternalStepValues,
} from './linkAccount.schema';

type LinkStep = 'email' | 'password' | 'external' | 'linkSuccess';

const SECURITY_OPTIONS = [
  { label: 'SSL / TLS (recommended)', value: 'tls' },
  { label: 'STARTTLS', value: 'startls' },
  { label: 'None', value: 'None' },
];

// AddAccountModal - email check + link wizard
interface AddAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentEmail: string;
  onSuccess?: () => void;
  /** When set, skip the email step and prompt for this mailbox's platform password. */
  reauthEmail?: string | null;
}

export const AddAccountModal = ({
  isOpen,
  onClose,
  currentEmail,
  onSuccess,
  reauthEmail,
}: AddAccountModalProps) => {
  const { checkEmail, linkMailspot, linkExternal, switchAccount } = useAccount();

  const [step, setStep] = useState<LinkStep>('email');
  const [checkError, setCheckError] = useState('');
  const [linkedEmail, setLinkedEmail] = useState('');
  const [linkedAccountId, setLinkedAccountId] = useState('');
  const [focused, setFocused] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const emailForm = useForm<EmailStepValues>({
    resolver: zodResolver(emailStepSchema),
    defaultValues: { email: '' },
  });

  const passwordForm = useForm<PasswordStepValues>({
    resolver: zodResolver(passwordStepSchema),
    defaultValues: { password: '' },
  });

  const externalForm = useForm<ExternalStepValues>({
    resolver: zodResolver(externalStepSchema),
    defaultValues: {
      imapHost: '',
      imapPort: '993',
      imapPassword: '',
      imapSecureType: 'tls',
      imapService: '',
      smtpHost: '',
      smtpPort: '465',
      smtpPassword: '',
      smtpSecureType: 'tls',
      smtpUsername: '',
    },
  });

  const resetAll = () => {
    setStep('email');
    setCheckError('');
    setLinkedEmail('');
    setLinkedAccountId('');
    emailForm.reset();
    passwordForm.reset();
    externalForm.reset();
  };

  const handleClose = () => {
    resetAll();
    onClose();
  };

  useEffect(() => {
    if (!isOpen) return;
    if (reauthEmail) {
      setStep('password');
      setLinkedEmail(reauthEmail);
      setCheckError('');
      setShowPassword(false);
      passwordForm.reset();
      return;
    }
    setStep('email');
    setLinkedEmail('');
    setLinkedAccountId('');
    setCheckError('');
    setShowPassword(false);
    emailForm.reset();
    passwordForm.reset();
    externalForm.reset();
  }, [isOpen, reauthEmail]); // forms reset only when the modal opens or re-auth target changes

  const handleCheckEmail = async () => {
    const ok = await emailForm.trigger('email');
    if (!ok) return;

    const email = emailForm.getValues('email');
    setCheckError('');

    if (email.toLowerCase() === currentEmail.toLowerCase()) {
      emailForm.setError('email', { message: 'Cannot link your own account' });
      return;
    }

    const result = await checkEmail(email);
    if (!result) return;

    setLinkedEmail(email);

    if (!result.exists) {
      setCheckError('This email is not registered in MailSpot.');
      return;
    }

    if (result.accountType === 'mailspot') {
      setStep('password');
    } else {
      externalForm.setValue('smtpUsername', email);
      setStep('external');
    }
  };

  const handleLinkPassword = async () => {
    const ok = await passwordForm.trigger('password');
    if (!ok) return;
    const success = await linkMailspot(linkedEmail, passwordForm.getValues('password'));
    if (success) {
      onSuccess?.();
      if (reauthEmail) {
        handleClose();
        return;
      }
      setStep('linkSuccess');
    }
  };

  const handleLinkExternal = async () => {
    const ok = await externalForm.trigger();
    if (!ok) return;
    const data = externalForm.getValues();
    const imap: ImapConfig = {
      host: data.imapHost,
      port: Number(data.imapPort),
      password: data.imapPassword,
      secureType: data.imapSecureType,
      service: data.imapService || undefined,
    };
    const smtp: SmtpConfig = {
      host: data.smtpHost,
      port: Number(data.smtpPort),
      password: data.smtpPassword,
      secureType: data.smtpSecureType,
      username: data.smtpUsername,
    };
    const success = await linkExternal(linkedEmail, imap, smtp);
    if (success) {
      setStep('linkSuccess');
      onSuccess?.();
    }
  };

  const handleSwitchToLinked = async () => {
    if (linkedAccountId) await switchAccount(linkedAccountId);
    handleClose();
  };

  const submitStep = (action: () => void | Promise<void>) => (e: FormEvent) => {
    e.preventDefault();
    void action();
  };

  const stepTitles: Record<LinkStep, string> = {
    email: 'Add Account',
    password: 'Enter Password',
    external: 'IMAP / SMTP Setup',
    linkSuccess: 'Account Linked!',
  };

  return (
      <BaseModal
        isOpen={isOpen}
        onClose={handleClose}
        zIndex={1060}
        closeOnBackdrop={false}
        closeOnEsc={true}
        showBackdrop={true}
        draggable={true}
        dragHandleSelector=".drag-handle"
        width="min(100vw, 498px)"
      >
        <div className="password-change-modal" role="dialog" aria-modal="true">
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">

              {/* Header */}
              <div className="modal-header drag-handle">
                <button className="expand-btn btn hover-link icon-hover-effect drag-handle-btn">
                  <InteractiveIcon
                    defaultIcon={arrowPointingOutIcon}
                    hoverIcon={arrowPointingOutIconHover}
                    activeIcon=""
                    isActive={false}
                    alt=""
                    className="interactive-icon hover-image"
                    renderAs="img"
                    tooltip="Move"
                  />
                </button>
                <h5 className="modal-title modal-title-center ms-1">
                  {stepTitles[step]}
                </h5>
                <button
                  type="button"
                  className="btn-close hover-link btn icon-hover-effect"
                  onClick={handleClose}
                >
                  <InteractiveIcon
                    defaultIcon={CloseIcon}
                    hoverIcon={CloseIconHover}
                    activeIcon=""
                    isActive={false}
                    alt=""
                    className="interactive-icon hover-image"
                    renderAs="img"
                    tooltip="Close"
                  />
                </button>
              </div>

              {/* Body */}
              <div className="modal-body p-0">
                <SimpleBar className="changePasswordModalSimpleBar" autoHide={false} forceVisible="y">
                  <div className="p-16">

                    {/* Success */}
                    {step === 'linkSuccess' && (
                      <div className="text-center py-3">
                        <img src={successfullyIcon} alt="success" width={56} className="mb-3" />
                        <p className="fw-semibold mb-1">Account linked successfully!</p>
                        <p className="text-muted small mb-3">{linkedEmail}</p>
                        <div className="d-flex align-items-center justify-content-center gap-2">
                          {linkedAccountId && (
                            <button
                              className="btn-new btn-new-bg"
                              onClick={handleSwitchToLinked}
                            >
                              Switch to account
                            </button>
                          )}
                          <button className="btn-new" onClick={handleClose}>
                            Stay here
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Email step */}
                    {step === 'email' && (
                      <form onSubmit={submitStep(handleCheckEmail)}>
                        <div className="form-group form-row">
                          <label className="control-label">Email address</label>
                          <div className="input-control">
                            <div className="input-icon-add">
                              <Controller
                                name="email"
                                control={emailForm.control}
                                render={({ field }) => (
                                  <input
                                    {...field}
                                    type="email"
                                    className="form-control"
                                    placeholder="colleague@company.com"
                                    autoFocus
                                    onFocus={() => setFocused('email')}
                                    onBlur={() => setFocused(null)}
                                  />
                                )}
                              />
                              <img
                                src={focused === 'email' ? mailIconfocuse : mailIcon}
                                alt=""
                                className="input-icon-1"
                              />
                            </div>
                          </div>
                          {emailForm.formState.errors.email && (
                            <div className="invalid-feedback d-block">
                              {emailForm.formState.errors.email.message}
                            </div>
                          )}
                          {checkError && !emailForm.formState.errors.email && (
                            <div className="invalid-feedback d-block">{checkError}</div>
                          )}
                        </div>

                        <div className="d-flex align-items-center justify-content-between mt-2">
                          <button type="button" className="btn-new me-3" onClick={handleClose}>
                            Cancel
                          </button>
                          <SubmitButton
                            className="btn-new loading-spinner"
                            onClick={handleCheckEmail}
                          >
                            Next
                          </SubmitButton>
                        </div>
                      </form>
                    )}

                    {/* Password step */}
                    {step === 'password' && (
                      <form onSubmit={submitStep(handleLinkPassword)}>
                        <p className="text-muted small mb-3">
                          {reauthEmail ? (
                            <>
                              This mailbox was signed out. Enter the password for{' '}
                              <strong>{linkedEmail}</strong> to use it again.
                            </>
                          ) : (
                            <>
                              <strong>{linkedEmail}</strong> is a MailSpot account. Enter its
                              password to link it.
                            </>
                          )}
                        </p>
                        
                        <div className="form-group">
                          <div className="d-flex align-items-center justify-content-between">
                            <label className="control-label">Password</label>
                          </div>
                          <div className="input-group2 icon-right2 password-show-hide">
                            <div className="input-control">
                              <div className="input-icon-add">
                                <Controller
                                  name="password"
                                  control={passwordForm.control}
                                  render={({ field }) => (
                                    <input
                                      {...field}
                                      type={showPassword ? 'text' : 'password'}
                                      className="form-control"
                                      placeholder="Enter password"
                                      autoFocus
                                      onFocus={() => setFocused('password')}
                                      onBlur={() => setFocused(null)}
                                    />
                                  )}
                                />
                                <img
                                  src={focused === 'password' ? lockIconfocuse : lockIcon}
                                  alt=""
                                  className="input-icon-1"
                                />
                                <img
                                  src={showPassword ? passwordShowIcon : passwordHideIcon}
                                  alt={showPassword ? 'Hide' : 'Show'}
                                  className="input-icon-2"
                                  onClick={() => setShowPassword((p) => !p)}
                                  style={{ cursor: 'pointer' }}
                                />
                              </div>
                            </div>
                          </div>
                          {passwordForm.formState.errors.password && (
                            <div className="invalid-feedback d-block">
                              {passwordForm.formState.errors.password.message}
                            </div>
                          )}
                        </div>

                        <div className="d-flex align-items-center justify-content-between mt-2">
                          <button
                            type="button"
                            className="btn-new me-3"
                            onClick={() => (reauthEmail ? handleClose() : setStep('email'))}
                          >
                            {reauthEmail ? 'Cancel' : 'Back'}
                          </button>
                          <SubmitButton
                            className="btn-new loading-spinner"
                            onClick={handleLinkPassword}
                          >
                            {reauthEmail ? 'Sign in' : 'Link Account'}
                          </SubmitButton>
                        </div>
                      </form>
                    )}

                    {/* External IMAP/SMTP step */}
                    {step === 'external' && (
                      <form onSubmit={submitStep(handleLinkExternal)}>
                        <p className="text-muted small mb-3">
                          Configure IMAP and SMTP for <strong>{linkedEmail}</strong>.
                        </p>

                        {/* IMAP */}
                        <div className="form-group">
                          <label className="control-label">IMAP Password</label>
                          <div className="input-group2 icon-right2 password-show-hide">
                            <div className="input-control">
                              <div className="input-icon-add">
                                <input
                                  type="password"
                                  className="form-control"
                                  placeholder="App password"
                                  {...externalForm.register('imapPassword')}
                                  onFocus={() => setFocused('imapPassword')}
                                  onBlur={() => setFocused(null)}
                                />
                                <img
                                  src={focused === 'imapPassword' ? lockIconfocuse : lockIcon}
                                  alt=""
                                  className="input-icon-1"
                                />
                              </div>
                            </div>
                          </div>
                          {externalForm.formState.errors.imapPassword && (
                            <div className="invalid-feedback d-block mb-2">
                              {externalForm.formState.errors.imapPassword.message}
                            </div>
                          )}
                        </div>

                        <div className="d-flex align-items-center">
                          <div className="form-group me-3 w-100">
                            <label className="control-label">IMAP Server</label>
                            <div className="input-group2 input-group-re-size">
                              <div className="input-control">
                                <div className="input-icon-add">
                                  <input
                                    type="text"
                                    className="form-control"
                                    placeholder="imap.gmail.com"
                                    {...externalForm.register('imapHost')}
                                    onFocus={() => setFocused('imapHost')}
                                    onBlur={() => setFocused(null)}
                                  />
                                  <img
                                    src={focused === 'imapHost' ? serverIconfocuse : serverIcon}
                                    alt=""
                                    className="input-icon-1"
                                  />
                                </div>
                              </div>
                            </div>
                            {externalForm.formState.errors.imapHost && (
                              <div className="invalid-feedback d-block mb-2">
                                {externalForm.formState.errors.imapHost.message}
                              </div>
                            )}
                          </div>
                          <div className="form-group input-group-re-size-2">
                            <label className="control-label">Port</label>
                            <div className="input-group2">
                              <div className="input-control">
                                <input
                                  type="text"
                                  className="form-control"
                                  placeholder="993"
                                  {...externalForm.register('imapPort')}
                                />
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="form-group automatically-inf-details">
                          <label className="control-label">IMAP Security Type</label>
                          <div className="input-icon-add">
                            <Controller
                              name="imapSecureType"
                              control={externalForm.control}
                              render={({ field }) => (
                                <Select2Wrapper
                                  value={field.value || null}
                                  onChange={field.onChange}
                                  options={SECURITY_OPTIONS}
                                  isMulti={false}
                                />
                              )}
                            />
                            <img src={recommendedIcon} alt="" className="input-icon-1" />
                          </div>
                        </div>

                        {/* SMTP */}
                        <div className="form-group">
                          <label className="control-label">SMTP Password</label>
                          <div className="input-group2 icon-right2 password-show-hide">
                            <div className="input-control">
                              <div className="input-icon-add">
                                <input
                                  type="password"
                                  className="form-control"
                                  placeholder="SMTP Password"
                                  {...externalForm.register('smtpPassword')}
                                  onFocus={() => setFocused('smtpPassword')}
                                  onBlur={() => setFocused(null)}
                                />
                                <img
                                  src={focused === 'smtpPassword' ? lockIconfocuse : lockIcon}
                                  alt=""
                                  className="input-icon-1"
                                />
                              </div>
                            </div>
                          </div>
                          <span className="sub-input-label">Leave blank if same as IMAP Password</span>
                          {externalForm.formState.errors.smtpPassword && (
                            <div className="invalid-feedback d-block mb-2">
                              {externalForm.formState.errors.smtpPassword.message}
                            </div>
                          )}
                        </div>

                        <div className="form-group form-row">
                          <label className="control-label">SMTP Username</label>
                          <div className="input-control">
                            <div className="input-icon-add">
                              <input
                                type="text"
                                className="form-control"
                                placeholder="your@email.com"
                                {...externalForm.register('smtpUsername')}
                                onFocus={() => setFocused('smtpUsername')}
                                onBlur={() => setFocused(null)}
                              />
                              <img
                                src={focused === 'smtpUsername' ? mailIconfocuse : mailIcon}
                                alt=""
                                className="input-icon-1"
                              />
                            </div>
                          </div>
                          {externalForm.formState.errors.smtpUsername && (
                            <div className="invalid-feedback d-block">
                              {externalForm.formState.errors.smtpUsername.message}
                            </div>
                          )}
                        </div>

                        <div className="d-flex align-items-center">
                          <div className="form-group me-3 w-100">
                            <label className="control-label">SMTP Server</label>
                            <div className="input-group2 input-group-re-size">
                              <div className="input-control">
                                <div className="input-icon-add">
                                  <input
                                    type="text"
                                    className="form-control"
                                    placeholder="smtp.gmail.com"
                                    {...externalForm.register('smtpHost')}
                                    onFocus={() => setFocused('smtpHost')}
                                    onBlur={() => setFocused(null)}
                                  />
                                  <img
                                    src={focused === 'smtpHost' ? serverIconfocuse : serverIcon}
                                    alt=""
                                    className="input-icon-1"
                                  />
                                </div>
                              </div>
                            </div>
                            {externalForm.formState.errors.smtpHost && (
                              <div className="invalid-feedback d-block mb-2">
                                {externalForm.formState.errors.smtpHost.message}
                              </div>
                            )}
                          </div>
                          <div className="form-group input-group-re-size-2">
                            <label className="control-label">Port</label>
                            <div className="input-group2">
                              <div className="input-control">
                                <input
                                  type="text"
                                  className="form-control"
                                  placeholder="465"
                                  {...externalForm.register('smtpPort')}
                                />
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="form-group automatically-inf-details"> 
                          <label className="control-label">SMTP Security Type</label>
                          <div className="input-icon-add">
                            <Controller
                              name="smtpSecureType"
                              control={externalForm.control}
                              render={({ field }) => (
                                <Select2Wrapper
                                  value={field.value || null}
                                  onChange={field.onChange}
                                  options={SECURITY_OPTIONS}
                                  isMulti={false}
                                />
                              )}
                            />
                            <img src={recommendedIcon} alt="" className="input-icon-1" />
                          </div>
                        </div>

                        <div className="d-flex align-items-center justify-content-between mt-2">
                          <button
                            type="button"
                            className="btn-new me-3"
                            onClick={() => setStep('email')}
                          >
                            Back
                          </button>
                          <SubmitButton
                            className="btn-new loading-spinner"
                            onClick={handleLinkExternal}
                          >
                            Link Account
                          </SubmitButton>
                        </div>
                      </form>
                    )}
                  </div>
                </SimpleBar>
              </div>
            </div>
          </div>
        </div>
      </BaseModal>
  );
};
