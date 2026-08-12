import { zodResolver } from '@hookform/resolvers/zod';
import { useState, useCallback } from 'react';
import { Controller, useForm } from 'react-hook-form';
import SimpleBar from 'simplebar-react';

import { useAccount } from '@context/AccountContext';
import BaseModal from '@components/ui/BaseModal';
import InteractiveIcon from '@components/ui/InteractiveIcon';
import Select2Wrapper from '@components/ui/form/Select2Wrapper';
import SubmitButton from '@components/ui/form/SubmitButton';
import { showError, showSuccess } from '@components/ui/toast/toastNotification';

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
import recommendedIconfocuse from '@images/recommended-icon-16-blue.svg';
import mailIcon from '@images/mail-icon-16.svg';
import mailIconfocuse from '@images/mail-icon-16-blue.svg';
import nameIcon from '@images/name-icon-16.svg';
import nameIconfocuse from '@images/name-icon-16-blue.svg';
import successfullyIcon from '@images/successfully-icon-green.svg';

import {
  checkUserExists,
  verifyImapConnection,
  verifySmtpConnection,
  registerUser,
  type RegisterPayload,
} from '@services/register/registerService';
import type { ImapConfig, SmtpConfig } from '@services/accounts/accountService';

import {
  emailStepSchema,
  passwordStepSchema,
  externalStepSchema,
  createAccountSchema,
  type EmailStepValues,
  type PasswordStepValues,
  type ExternalStepValues,
  type CreateAccountValues,
} from './linkAccount.schema';

type LinkStep = 'email' | 'password' | 'external' | 'linkSuccess';
type CreateStep = 'basic' | 'imap' | 'smtp' | 'createSuccess';

const SECURITY_OPTIONS = [
  { label: 'SSL / TLS (recommended)', value: 'tls' },
  { label: 'STARTTLS', value: 'startls' },
  { label: 'None', value: 'None' },
];

// ─────────────────────────────────────────────────────────────
// CreateAccountModal
// ─────────────────────────────────────────────────────────────
interface CreateAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  prefillEmail?: string;
  onSuccess: () => void;
}

export const CreateAccountModal = ({
  isOpen,
  onClose,
  prefillEmail = '',
  onSuccess,
}: CreateAccountModalProps) => {
  const [step, setStep] = useState<CreateStep>('basic');
  const [focused, setFocused] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showImapPw, setShowImapPw] = useState(false);
  const [showSmtpPw, setShowSmtpPw] = useState(false);

  const {
    control,
    trigger,
    getValues,
    setValue,
    formState: { errors },
    reset,
  } = useForm<CreateAccountValues>({
    resolver: zodResolver(createAccountSchema),
    defaultValues: {
      name: '',
      email: prefillEmail,
      password: '',
      imapServer: '',
      imapPort: '993',
      imapPassword: '',
      imapSecureType: 'tls',
      smtpHost: '',
      smtpPort: '465',
      smtpPassword: '',
      smtpSecureType: 'tls',
      smtpUsername: prefillEmail,
    },
  });

  const stepTitles: Record<CreateStep, string> = {
    basic: 'Create New Account',
    imap: 'IMAP Configuration',
    smtp: 'SMTP Configuration',
    createSuccess: 'Account Created',
  };

  const handleClose = () => {
    reset();
    setStep('basic');
    onClose();
  };

  const handleNext = async () => {
    if (step === 'basic') {
      const ok = await trigger(['name', 'email', 'password']);
      if (!ok) return;
      const existsRes = await checkUserExists(getValues('email'));
      if (existsRes?.statusCode !== 200) {
        showError(existsRes?.data?.data?.message || 'Email already registered');
        return;
      }
      setValue('smtpUsername', getValues('email'));
      setStep('imap');
    } else if (step === 'imap') {
      const ok = await trigger(['imapServer', 'imapPort', 'imapPassword', 'imapSecureType']);
      if (!ok) return;
      setStep('smtp');
    } else if (step === 'smtp') {
      const ok = await trigger(['smtpHost', 'smtpPort', 'smtpSecureType', 'smtpUsername']);
      if (!ok) return;
      await handleRegister();
    }
  };

  const handleRegister = async () => {
    try {
      const v = getValues();
      const payload: RegisterPayload = {
        email: { email: v.email, name: v.name, platformPassword: v.password },
        imap: {
          imapPassword: v.imapPassword,
          imapServer: v.imapServer,
          imapHost: v.imapServer,
          imapPort: Number(v.imapPort),
          secureType: v.imapSecureType,
        },
        smtp: {
          smtpUsername: v.smtpUsername || v.email,
          smtpPassword: v.smtpPassword || v.imapPassword,
          smtpHost: v.smtpHost,
          smtpPort: Number(v.smtpPort),
          smtpSecureType: v.smtpSecureType,
        },
      };

      const imapRes = await verifyImapConnection(payload);
      if (imapRes?.statusCode !== 200) {
        showError('IMAP verification failed. Please check your IMAP settings.');
        setStep('imap');
        return;
      }

      const smtpRes = await verifySmtpConnection(payload.smtp);
      if (smtpRes?.statusCode !== 200) {
        showError('SMTP verification failed. Please check your SMTP settings.');
        setStep('smtp');
        return;
      }

      const registerRes = await registerUser(payload);
      if (registerRes?.statusCode !== 200) {
        showError(registerRes?.data?.error || 'Registration failed');
        return;
      }

      showSuccess('Account created successfully');
      setStep('createSuccess');
      onSuccess();
    } catch (err: any) {
      showError(err?.message || 'Something went wrong during registration');
    }
  };

  const stepIndex = { basic: 1, imap: 2, smtp: 3, createSuccess: 3 }[step];

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={handleClose}
      zIndex={1070}
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

                  {/* Progress bar */}
                  {step !== 'createSuccess' && (
                    <div className="d-flex gap-2 mb-3">
                      {[1, 2, 3].map((s) => (
                        <div
                          key={s}
                          style={{
                            flex: 1,
                            height: 3,
                            borderRadius: 2,
                            background: stepIndex >= s ? '#3B69FF' : '#E0E0E0',
                            transition: 'background 0.3s',
                          }}
                        />
                      ))}
                    </div>
                  )}

                  {/* ── Success ── */}
                  {step === 'createSuccess' && (
                    <div className="text-center py-3">
                      <img src={successfullyIcon} alt="success" width={56} className="mb-3" />
                      <p className="fw-semibold mb-1">Account created successfully!</p>
                      <p className="text-muted small mb-3">
                        The new account has been added to your profile.
                      </p>
                      <div className="d-flex align-items-center justify-content-center">
                        <button className="btn-new btn-new-bg" onClick={handleClose}>
                          Done
                        </button>
                      </div>
                    </div>
                  )}

                  {/* ── Step 1: Basic ── */}
                  {step === 'basic' && (
                    <>
                      <div className="form-group form-row">
                        <label className="control-label">Full Name</label>
                        <div className="input-control">
                          <div className="input-icon-add">
                            <Controller
                              name="name"
                              control={control}
                              render={({ field }) => (
                                <input
                                  {...field}
                                  type="text"
                                  className="form-control"
                                  placeholder="John Doe"
                                  onFocus={() => setFocused('name')}
                                  onBlur={() => setFocused(null)}
                                />
                              )}
                            />
                            <img
                              src={focused === 'name' ? nameIconfocuse : nameIcon}
                              alt=""
                              className="input-icon-1"
                            />
                          </div>
                        </div>
                        {errors.name && (
                          <div className="invalid-feedback d-block">{errors.name.message}</div>
                        )}
                      </div>

                      <div className="form-group form-row">
                        <label className="control-label">Email</label>
                        <div className="input-control">
                          <div className="input-icon-add">
                            <Controller
                              name="email"
                              control={control}
                              render={({ field }) => (
                                <input
                                  {...field}
                                  type="email"
                                  className="form-control"
                                  placeholder="email@example.com"
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
                        {errors.email && (
                          <div className="invalid-feedback d-block">{errors.email.message}</div>
                        )}
                      </div>

                      <div className="form-group form-row">
                        <label className="control-label">Password</label>
                        <div className="input-group2 icon-right2 password-show-hide">
                          <div className="input-control">
                            <div className="input-icon-add">
                              <Controller
                                name="password"
                                control={control}
                                render={({ field }) => (
                                  <input
                                    {...field}
                                    type={showPassword ? 'text' : 'password'}
                                    className="form-control"
                                    placeholder="Min 8 chars, uppercase & number"
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
                        {errors.password && (
                          <div className="invalid-feedback d-block">{errors.password.message}</div>
                        )}
                      </div>
                    </>
                  )}

                  {/* ── Step 2: IMAP ── */}
                  {step === 'imap' && (
                    <>
                      <div className="form-group">
                        <div className="d-flex align-items-center justify-content-between">
                          <label className="control-label">IMAP Password</label>
                        </div>
                        <div className="input-group2 icon-right2 password-show-hide">
                          <div className="input-control">
                            <div className="input-icon-add">
                              <Controller
                                name="imapPassword"
                                control={control}
                                render={({ field }) => (
                                  <input
                                    {...field}
                                    type={showImapPw ? 'text' : 'password'}
                                    className="form-control"
                                    placeholder="App password"
                                    onFocus={() => setFocused('imapPassword')}
                                    onBlur={() => setFocused(null)}
                                  />
                                )}
                              />
                              <img
                                src={focused === 'imapPassword' ? lockIconfocuse : lockIcon}
                                alt=""
                                className="input-icon-1"
                              />
                              <img
                                src={showImapPw ? passwordShowIcon : passwordHideIcon}
                                alt={showImapPw ? 'Hide' : 'Show'}
                                className="input-icon-2"
                                onClick={() => setShowImapPw((p) => !p)}
                                style={{ cursor: 'pointer' }}
                              />
                            </div>
                          </div>
                        </div>
                        {errors.imapPassword && (
                          <div className="invalid-feedback d-block mb-2">{errors.imapPassword.message}</div>
                        )}
                      </div>

                      <div className="d-flex align-items-center">
                        <div className="form-group me-3 w-100">
                          <label className="control-label">IMAP Server</label>
                          <div className="input-group2 input-group-re-size">
                            <div className="input-control">
                              <div className="input-icon-add">
                                <Controller
                                  name="imapServer"
                                  control={control}
                                  render={({ field }) => (
                                    <input
                                      {...field}
                                      type="text"
                                      className="form-control"
                                      placeholder="imap.gmail.com"
                                      onFocus={() => setFocused('imapServer')}
                                      onBlur={() => setFocused(null)}
                                    />
                                  )}
                                />
                                <img
                                  src={focused === 'imapServer' ? serverIconfocuse : serverIcon}
                                  alt=""
                                  className="input-icon-1"
                                />
                              </div>
                            </div>
                          </div>
                          {errors.imapServer && (
                            <div className="invalid-feedback d-block mb-2">{errors.imapServer.message}</div>
                          )}
                        </div>
                        <div className="form-group input-group-re-size-2">
                          <label className="control-label">Port</label>
                          <div className="input-group2">
                            <div className="input-control">
                              <Controller
                                name="imapPort"
                                control={control}
                                render={({ field }) => (
                                  <input
                                    {...field}
                                    type="text"
                                    className="form-control"
                                    placeholder="993"
                                  />
                                )}
                              />
                            </div>
                          </div>
                          {errors.imapPort && (
                            <div className="invalid-feedback d-block mb-2">{errors.imapPort.message}</div>
                          )}
                        </div>
                      </div>

                      <div className="form-group automatically-inf-details">
                        <label className="control-label">Security Type</label>
                        <div className="input-icon-add">
                          <Controller
                            name="imapSecureType"
                            control={control}
                            render={({ field }) => (
                              <Select2Wrapper
                                value={field.value || null}
                                onChange={field.onChange}
                                options={SECURITY_OPTIONS}
                                isMulti={false}
                              />
                            )}
                          />
                          <img
                            src={focused === 'imapSecureType' ? recommendedIconfocuse : recommendedIcon}
                            alt=""
                            className="input-icon-1"
                          />
                        </div>
                      </div>
                    </>
                  )}

                  {/* ── Step 3: SMTP ── */}
                  {step === 'smtp' && (
                    <>
                      <div className="form-group">
                        <div className="d-flex align-items-center justify-content-between">
                          <label className="control-label">SMTP Password</label>
                        </div>
                        <div className="input-group2 icon-right2 password-show-hide">
                          <div className="input-control">
                            <div className="input-icon-add">
                              <Controller
                                name="smtpPassword"
                                control={control}
                                render={({ field }) => (
                                  <input
                                    {...field}
                                    type={showSmtpPw ? 'text' : 'password'}
                                    className="form-control"
                                    placeholder="SMTP Password"
                                    onFocus={() => setFocused('smtpPassword')}
                                    onBlur={() => setFocused(null)}
                                  />
                                )}
                              />
                              <img
                                src={focused === 'smtpPassword' ? lockIconfocuse : lockIcon}
                                alt=""
                                className="input-icon-1"
                              />
                              <img
                                src={showSmtpPw ? passwordShowIcon : passwordHideIcon}
                                alt={showSmtpPw ? 'Hide' : 'Show'}
                                className="input-icon-2"
                                onClick={() => setShowSmtpPw((p) => !p)}
                                style={{ cursor: 'pointer' }}
                              />
                            </div>
                          </div>
                        </div>
                        <span className="sub-input-label">Leave blank if same as IMAP Password</span>
                        {errors.smtpPassword && (
                          <div className="invalid-feedback d-block mb-2">{errors.smtpPassword.message}</div>
                        )}
                      </div>

                      <div className="form-group form-row">
                        <label className="control-label">SMTP Username</label>
                        <div className="input-control">
                          <div className="input-icon-add">
                            <Controller
                              name="smtpUsername"
                              control={control}
                              render={({ field }) => (
                                <input
                                  {...field}
                                  type="text"
                                  className="form-control"
                                  placeholder="your@email.com"
                                  onFocus={() => setFocused('smtpUsername')}
                                  onBlur={() => setFocused(null)}
                                />
                              )}
                            />
                            <img
                              src={focused === 'smtpUsername' ? mailIconfocuse : mailIcon}
                              alt=""
                              className="input-icon-1"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="d-flex align-items-center">
                        <div className="form-group me-3 w-100">
                          <label className="control-label">SMTP Server</label>
                          <div className="input-group2 input-group-re-size">
                            <div className="input-control">
                              <div className="input-icon-add">
                                <Controller
                                  name="smtpHost"
                                  control={control}
                                  render={({ field }) => (
                                    <input
                                      {...field}
                                      type="text"
                                      className="form-control"
                                      placeholder="smtp.gmail.com"
                                      onFocus={() => setFocused('smtpHost')}
                                      onBlur={() => setFocused(null)}
                                    />
                                  )}
                                />
                                <img
                                  src={focused === 'smtpHost' ? serverIconfocuse : serverIcon}
                                  alt=""
                                  className="input-icon-1"
                                />
                              </div>
                            </div>
                          </div>
                          {errors.smtpHost && (
                            <div className="invalid-feedback d-block mb-2">{errors.smtpHost.message}</div>
                          )}
                        </div>
                        <div className="form-group input-group-re-size-2">
                          <label className="control-label">Port</label>
                          <div className="input-group2">
                            <div className="input-control">
                              <Controller
                                name="smtpPort"
                                control={control}
                                render={({ field }) => (
                                  <input
                                    {...field}
                                    type="text"
                                    className="form-control"
                                    placeholder="465"
                                  />
                                )}
                              />
                            </div>
                          </div>
                          {errors.smtpPort && (
                            <div className="invalid-feedback d-block mb-2">{errors.smtpPort.message}</div>
                          )}
                        </div>
                      </div>

                      <div className="form-group automatically-inf-details">
                        <label className="control-label">Security Type</label>
                        <div className="input-icon-add">
                          <Controller
                            name="smtpSecureType"
                            control={control}
                            render={({ field }) => (
                              <Select2Wrapper
                                value={field.value || null}
                                onChange={field.onChange}
                                options={SECURITY_OPTIONS}
                                isMulti={false}
                              />
                            )}
                          />
                          <img
                            src={focused === 'smtpSecureType' ? recommendedIconfocuse : recommendedIcon}
                            alt=""
                            className="input-icon-1"
                          />
                        </div>
                      </div>
                    </>
                  )}

                  {/* Footer buttons */}
                  {step !== 'createSuccess' && (
                    <div className="d-flex align-items-center justify-content-between mt-2">
                      <button
                        type="button"
                        className="btn-new me-3"
                        onClick={step === 'basic' ? handleClose : () => setStep(step === 'smtp' ? 'imap' : 'basic')}
                      >
                        {step === 'basic' ? 'Cancel' : '← Back'}
                      </button>
                      <SubmitButton
                        className="btn-new loading-spinner"
                        onClick={handleNext}
                      >
                        {step === 'smtp' ? 'Create Account' : 'Next →'}
                      </SubmitButton>
                    </div>
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

// ─────────────────────────────────────────────────────────────
// AddAccountModal — email check + link wizard
// ─────────────────────────────────────────────────────────────
interface AddAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentEmail: string;
  onSuccess?: () => void;
}

export const AddAccountModal = ({
  isOpen,
  onClose,
  currentEmail,
  onSuccess,
}: AddAccountModalProps) => {
  const { checkEmail, linkMailspot, linkExternal, switchAccount } = useAccount();

  const [step, setStep] = useState<LinkStep>('email');
  const [emailNotFound, setEmailNotFound] = useState(false);
  const [checkError, setCheckError] = useState('');
  const [linkedEmail, setLinkedEmail] = useState('');
  const [linkedAccountId, setLinkedAccountId] = useState('');
  const [focused, setFocused] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);

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
    setEmailNotFound(false);
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

  const handleCheckEmail = async () => {
    const ok = await emailForm.trigger('email');
    if (!ok) return;

    const email = emailForm.getValues('email');
    setCheckError('');
    setEmailNotFound(false);

    if (email.toLowerCase() === currentEmail.toLowerCase()) {
      emailForm.setError('email', { message: 'Cannot link your own account' });
      return;
    }

    const result = await checkEmail(email);
    if (!result) return;

    setLinkedEmail(email);

    if (!result.exists) {
      setEmailNotFound(true);
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
      setStep('linkSuccess');
      onSuccess?.();
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

  const handleCreateSuccess = useCallback(() => {
    setShowCreateModal(false);
    onSuccess?.();
    handleClose();
  }, [onSuccess]);

  const stepTitles: Record<LinkStep, string> = {
    email: 'Add Account',
    password: 'Enter Password',
    external: 'IMAP / SMTP Setup',
    linkSuccess: 'Account Linked!',
  };

  return (
    <>
      <BaseModal
        isOpen={isOpen && !showCreateModal}
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

                    {/* ── Success ── */}
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

                    {/* ── Email step ── */}
                    {step === 'email' && (
                      <>
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
                          {emailNotFound && (
                            <span className="sub-input-label">
                              Not in MailSpot?{' '}
                              <button
                                type="button"
                                className="btn btn-link p-0"
                                style={{ fontSize: 'inherit', verticalAlign: 'baseline' }}
                                onClick={() => setShowCreateModal(true)}
                              >
                                Create account
                              </button>
                            </span>
                          )}
                        </div>

                        <div className="d-flex align-items-center justify-content-between mt-2">
                          <button type="button" className="btn-new me-3" onClick={handleClose}>
                            Cancel
                          </button>
                          <div className="d-flex gap-2">
                            <button
                              type="button"
                              className="btn-new"
                              onClick={() => setShowCreateModal(true)}
                            >
                              Create account
                            </button>
                            <SubmitButton
                              className="btn-new loading-spinner"
                              onClick={handleCheckEmail}
                            >
                              Next →
                            </SubmitButton>
                          </div>
                        </div>
                      </>
                    )}

                    {/* ── Password step ── */}
                    {step === 'password' && (
                      <>
                        <p className="text-muted small mb-3">
                          <strong>{linkedEmail}</strong> is a MailSpot account. Enter its
                          platform password to link it.
                        </p>
                        <div className="form-group">
                          <div className="d-flex align-items-center justify-content-between">
                            <label className="control-label">Platform Password</label>
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
                            onClick={() => setStep('email')}
                          >
                            ← Back
                          </button>
                          <SubmitButton
                            className="btn-new loading-spinner"
                            onClick={handleLinkPassword}
                          >
                            Link Account
                          </SubmitButton>
                        </div>
                      </>
                    )}

                    {/* ── External IMAP/SMTP step ── */}
                    {step === 'external' && (
                      <>
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
                            ← Back
                          </button>
                          <SubmitButton
                            className="btn-new loading-spinner"
                            onClick={handleLinkExternal}
                          >
                            Link Account
                          </SubmitButton>
                        </div>
                      </>
                    )}

                  </div>
                </SimpleBar>
              </div>

            </div>
          </div>
        </div>
      </BaseModal>

      {showCreateModal && (
        <CreateAccountModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          prefillEmail={emailForm.getValues('email')}
          onSuccess={handleCreateSuccess}
        />
      )}
    </>
  );
};
