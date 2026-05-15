import "@assets/styles/header-main-style.css";
import "@assets/styles/sign-in-style.css";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Select2Wrapper from "@components/ui/form/Select2Wrapper";
import mailSpotLogo from "@images/mailspot-login-logo.svg";
import nameIcon from "@images/name-icon-16.svg";
import mailIcon from "@images/mail-icon-16.svg";
import errorIcon16 from "@images/error-icon-16.svg";
import chevronLeftIconBig from "@images/chevron-left-icon-big.svg";
import lockIcon from "@images/password-icon-16.svg";
import passwordShowIcon from "@images/password-show-icon-16.svg";
import passwordHideIcon from "@images/password-hide-icon-16.svg";
import successfullyIcon from "@images/successfully-icon-green.svg";
import enlivenLogo from "@images/enliven-logo.svg";
import serverIcon from "@images/server-icon-16.svg";
import recommendedIcon from "@images/recommended-icon-16.svg"

// focuse
import nameIconfocuse from "@images/name-icon-16-blue.svg"
import mailIconfocuse from "@images/mail-icon-16-blue.svg"
import lockIconfocuse from "@images/password-icon-16-blue.svg"
import serverIconfocuse from "@images/server-icon-16-blue.svg"
import recommendedIconfocuse from "@images/recommended-icon-16-blue.svg"

import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { RegisterPageSchema, type RegisterPageFormValues } from "./RegisterPage.schema";
import {
  checkUserExists,
  verifyImapConnection,
  verifySmtpConnection,
  registerUser,
  fetchAndStoreEmails,
} from "@services/register/registerService";
import type { RegisterPayload } from "@services/register/registerService";

import { showError, showSuccess } from "@components/ui/toast/toastNotification";
import SubmitButton from "@components/ui/form/SubmitButton";

const STEPS = {
  BASIC: 1,
  IMAP: 2,
  SMTP: 3,
  SUCCESS: 4,
} as const;

type Step = (typeof STEPS)[keyof typeof STEPS];

const stepTitles: Record<Step, string> = {
  1: "Create your mailspot account",
  2: "IMAP Configuration",
  3: "SMTP Configuration",
  4: "Account Created",
};

const RegisterPage = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState<Step>(STEPS.BASIC);

  const [showPassword, setShowPassword] = useState(false);
  const [showImapPassword, setShowImapPassword] = useState(false);
  const [showSmtpPassword, setShowSmtpPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const {
    control,
    trigger,
    handleSubmit,
    getValues,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<RegisterPageFormValues>({
    resolver: zodResolver(RegisterPageSchema),
    mode: "onSubmit",
    defaultValues: {
      name: "",
      email: "",
      password: "",
      imapEmail: "",
      imapPassword: "",
      imapServer: "",
      imapPort: "",
      smtpUsername: "",
      smtpPassword: "",
      smtpHost: "",
      smtpPort: "",
    },
  });

  const redirectToLogin = () => {
    navigate("/login");
  };

  const buildRegisterPayload = (): RegisterPayload => {
    const v = getValues();

    return {
      email: {
        email: v.email,
        name: v.name,
        platformPassword: v.password,
      },
      imap: {
        imapPassword: v.imapPassword ?? "",
        imapServer: v.imapServer ?? "",
        imapHost: v.imapServer ?? "",
        imapPort: Number(v.imapPort) || 0,
        secureType: v.secureType ?? "",
      },
      smtp: {
        smtpUsername: v.smtpUsername ?? "",
        smtpPassword: v.smtpPassword ?? v.imapPassword ?? "",
        smtpHost: v.smtpHost ?? "",
        smtpPort: Number(v.smtpPort) || 0,
        smtpSecureType: v.smtpSecurityType ?? "",
      },
    };
  };

  const handleFinalSubmission = async () => {
    try {
      setLoading(true);
      const payload = buildRegisterPayload();

      const imapRes = await verifyImapConnection(payload);
      if (imapRes?.statusCode !== 200) {
        showError("IMAP verification failed");
        return;
      }
      else {
        showSuccess("IMAP verification successful");
      }

      const smtpRes = await verifySmtpConnection(payload.smtp);
      if (smtpRes?.statusCode !== 200) {
        alert(smtpRes?.message || "SMTP verification failed");
        showError("SMTP verification failed");
        return;
      }
      else {
        showSuccess("SMTP verification successful");
      }

      const registerRes = await registerUser(payload);
      if (registerRes?.statusCode !== 200) {
        showError(registerRes?.data?.error || "Registration failed");
        return;
      }
      else {
        showSuccess("Registration successful");
      }

      const { token, email } = registerRes.data;
      localStorage.setItem("token", token);
      localStorage.setItem("email", email);

      setCurrentStep(STEPS.SUCCESS);

      const fetchAndStoreEmailsRes = await fetchAndStoreEmails(email, token);
      if (fetchAndStoreEmailsRes?.statusCode !== 200) {
        showError(fetchAndStoreEmailsRes?.message || "Failed to fetch and store emails");
        return;
      }
      else {
        showSuccess("Emails fetched and stored successfully");
      }

      setTimeout(() => {
        window.location.href = "/home";
      }, 2000);
    } catch (err) {
      console.error(err);
      alert("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const goToNext = async () => {
    let isValid = false;

    if (currentStep === STEPS.BASIC) {
      isValid = await trigger(["name", "email", "password"]);
      if (!isValid) return;
      setValue("imapEmail", getValues("email"));
      setValue("smtpUsername", getValues("email"));

      const existsRes = await checkUserExists(getValues("email"));
      if (existsRes?.statusCode !== 200) {
        showError(existsRes?.message || "Email already exists");
        return;
      }

      setCurrentStep(STEPS.IMAP);
      return;
    } else if (currentStep === STEPS.IMAP) {
      isValid = await trigger(["imapEmail", "imapPassword", "imapServer", "imapPort", "secureType"]);
      if (!isValid) return;

      setCurrentStep(STEPS.SMTP);
      return;
    } else if (currentStep === STEPS.SMTP) {
      console.log(getValues());
      isValid = await trigger(["smtpUsername", "smtpHost", "smtpPort", "smtpSecurityType"]);
      if (!isValid) return;
      await handleFinalSubmission();
      return;
    }
  };

  const goToPrev = () => {
    if (currentStep > STEPS.BASIC) {
      setCurrentStep((prev) => (prev - 1) as Step);
    }
  };

  const getProgressClass = (step: number) => (currentStep >= step ? "active" : "");

  const [focusedField, setFocusedField] = useState<string | null>(null);

  return (
    <div className="login-main register">
      <div className="row m-0">
        {/* Left gradient side - unchanged */}
        <div className="col-md-6 p-0 d-md-block d-none">
          <div className="login-main-gradiant">
            <div className="login-left"></div>
            <div className="login-right"></div>
            <div className="login-main-content-section">
              <span className="login-title">Your inbox, supercharged. Your team, unstoppable.</span>
            </div>
          </div>
        </div>

        <div className="col-md-6 p-0 position-relative overflow-auto power-add h-100vh">
          <div>
            <div className="progress-line-wrapper">
              <div className={`progress-segment ${getProgressClass(1)}`} id="step1"></div>
              <div className={`progress-segment ${getProgressClass(2)}`} id="step2"></div>
              <div className={`progress-segment ${getProgressClass(3)}`} id="step3"></div>
            </div>

            <div className="d-flex align-items-center justify-content-center">
              <nav aria-label="breadcrumb" className="breadcrumb-sec">
                <ol className="breadcrumb">
                  <li className="breadcrumb-item">Register</li>
                  <li className="breadcrumb-item active" aria-current="page" id="stepTitle">
                    {stepTitles[currentStep]}
                  </li>
                </ol>
              </nav>
            </div>

            <div className="login-main-right-section">
              <div className="login-box-main">
                <div className="d-flex align-items-center justify-content-between brand-logo-login">
                  <a href="javascript:;">
                    <img src={mailSpotLogo} alt="" />
                  </a>
                  <div id="stepCounter">
                    <span className="stepCounter-active">{Math.min(currentStep, 3)}</span> / 3
                  </div>
                </div>

                <form onSubmit={handleSubmit((data) => console.log("Submitted:", data))}>
                  {/* ────────────── Step 1 ────────────── */}
                  <div className={`form-step ${currentStep === 1 ? "active" : ""}`}>
                    {/* Name */}
                    <div className="form-group">
                      <label className="control-label required">Name</label>
                      <div className="input-group2">
                        <div className="input-control">
                          <div className="input-icon-add ">
                            <Controller
                              name="name"
                              control={control}
                              render={({ field }) => (
                                <input
                                  {...field}
                                  type="text"
                                  className="form-control"
                                  placeholder="Name"
                                  id="UserName"
                                  onFocus={() => setFocusedField("username")}
                                  onBlur={() => setFocusedField(null)}
                                />
                              )}
                            />
                            <img src={focusedField === "username" ? nameIconfocuse : nameIcon} alt={focusedField === "name" ? "Hide" : "Show"} className="input-icon-1"
                            />
                          </div>
                        </div>
                      </div>
                      {errors.name && (
                        <span className="error-input-text">
                          <img src={errorIcon16} alt="" width="16" height="16" className="me-2" />
                          {errors.name.message}
                        </span>
                      )}
                    </div>

                    {/* Email */}
                    <div className="form-group">
                      <label className="control-label required">Email</label>
                      <div className="input-group2">
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
                                  placeholder="Email"
                                  id="UserEmail"
                                  onFocus={() => setFocusedField("useremail")}
                                  onBlur={() => setFocusedField(null)}
                                />
                              )}
                            />
                            <img src={focusedField === "useremail" ? mailIconfocuse : mailIcon} alt={focusedField === "name" ? "Hide" : "Show"} className="input-icon-1"
                            />
                          </div>
                        </div>
                      </div>
                      {errors.email && (
                        <span className="error-input-text">
                          <img src={errorIcon16} alt="" width="16" height="16" className="me-2" />
                          {errors.email.message}
                        </span>
                      )}
                    </div>

                    {/* Password - Step 1 */}
                    <div className="form-group">
                      <label className="control-label required">Create Mailspot Password</label>
                      <div className="input-group2 icon-right2 password-show-hide">
                        <div className="input-control">
                          <div className="input-icon-add">
                            <Controller
                              name="password"
                              control={control}
                              render={({ field }) => (
                                <input
                                  {...field}
                                  type={showPassword ? "text" : "password"}
                                  className="form-control"
                                  placeholder="Password"
                                  id="CreatePassword"
                                  onFocus={() => setFocusedField("userPassword")}
                                  onBlur={() => setFocusedField(null)}
                                />
                              )}
                            />
                            <img src={focusedField === "userPassword" ? lockIconfocuse : lockIcon} alt={focusedField === "name" ? "Hide" : "Show"} className="input-icon-1"
                            />
                            <img
                              src={showPassword ? passwordShowIcon : passwordHideIcon}
                              alt={showPassword ? "Hide password" : "Show password"}
                              className="input-icon-2"
                              onClick={() => setShowPassword(!showPassword)}
                              style={{ cursor: "pointer" }}
                            />
                          </div>
                        </div>
                      </div>
                      {errors.password && (
                        <span className="error-input-text">
                          <img src={errorIcon16} alt="" width="16" height="16" className="me-2" />
                          {errors.password.message}
                        </span>
                      )}
                    </div>

                    <div className="form-group d-flex align-items-center justify-content-center automatically-inf-details">
                      <p className="control-label mb-0">We'll automatically detect your email provider settings</p>
                    </div>

                    <div className="login-btn d-flex align-items-center">
                      <button
                        type="button"
                        className="btn-new btn-new-bg w-100 next-step"
                        onClick={goToNext}
                        disabled={isSubmitting}
                      >
                        Next step
                        <div className="btn-loader" id="loginLoader">
                          <div data-loader="circle-side"></div>
                        </div>
                      </button>
                    </div>

                    <hr />
                    <div className="d-flex align-items-center justify-content-between">
                      <p className="mb-0">Already have an account?</p>
                      <a href="javascript:;" className="link-ap" onClick={redirectToLogin}>Login</a>
                    </div>
                  </div>

                  {/* ────────────── Step 2 - IMAP ────────────── */}
                  <div className={`form-step ${currentStep === 2 ? "active" : ""}`}>
                    {/* IMAP Email - unchanged except error display */}
                    <div className="form-group">
                      <label className="control-label required">Email</label>
                      <div className="input-group2">
                        <div className="input-control">
                          <div className="input-icon-add">
                            <Controller
                              name="imapEmail"
                              control={control}
                              render={({ field }) => (
                                <input
                                  {...field}
                                  type="email"
                                  className="form-control"
                                  placeholder="Email"
                                  onFocus={() => setFocusedField("IMAPmailIcon")}
                                  onBlur={() => setFocusedField(null)}
                                />
                              )}
                            />
                            <img src={focusedField === "IMAPmailIcon" ? mailIconfocuse : mailIcon} alt={focusedField === "name" ? "Hide" : "Show"} className="input-icon-1"
                            />
                          </div>
                        </div>
                      </div>
                      {errors.imapEmail && (
                        <span className="error-input-text">
                          <img src={errorIcon16} alt="" width="16" height="16" className="me-2" />
                          {errors.imapEmail.message}
                        </span>
                      )}
                    </div>

                    {/* IMAP Password with toggle */}
                    <div className="form-group">
                      <label className="control-label required">Password</label>
                      <div className="input-group2 icon-right2 password-show-hide">
                        <div className="input-control">
                          <div className="input-icon-add">
                            <Controller
                              name="imapPassword"
                              control={control}
                              render={({ field }) => (
                                <input
                                  {...field}
                                  type={showImapPassword ? "text" : "password"}
                                  className="form-control"
                                  placeholder="Password"
                                  onFocus={() => setFocusedField("IMAPPassword")}
                                  onBlur={() => setFocusedField(null)}
                                />
                              )}
                            />
                            <img src={focusedField === "IMAPPassword" ? lockIconfocuse : lockIcon} alt={focusedField === "name" ? "Hide" : "Show"} className="input-icon-1"
                            />
                            <img
                              src={showImapPassword ? passwordShowIcon : passwordHideIcon}
                              alt={showImapPassword ? "Hide" : "Show"}
                              className="input-icon-2"
                              onClick={() => setShowImapPassword(!showImapPassword)}
                              style={{ cursor: "pointer" }}
                            />
                          </div>
                        </div>
                      </div>
                      <span className="sub-input-label">
                        *Gmail or Google Workspace(G Suite) Enter App Password
                      </span>
                      {errors.imapPassword && (
                        <span className="error-input-text">
                          <img src={errorIcon16} alt="" width="16" height="16" className="me-2" />
                          {errors.imapPassword.message}
                        </span>
                      )}
                    </div>

                    {/* IMAP Server + Port */}
                    <div className="d-flex align-items-start w-100">
                      <div className="form-group me-3">
                        <label className="control-label required">IMAP Server</label>
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
                                    placeholder="IMAP Server"
                                    id="imapServer"
                                    onFocus={() => setFocusedField("imapServer")}
                                    onBlur={() => setFocusedField(null)}
                                  />
                                )}
                              />
                              <img src={focusedField === "imapServer" ? serverIconfocuse : serverIcon} alt={focusedField === "name" ? "Hide" : "Show"} className="input-icon-1"
                              />
                            </div>
                          </div>
                        </div>
                        {errors.imapServer && (
                          <span className="error-input-text">
                            <img src={errorIcon16} alt="" width="16" height="16" className="me-2" />
                            <span className="error-text">{errors.imapServer.message}</span>
                          </span>
                        )}
                      </div>

                      <div className="form-group">
                        <label className="control-label required">Port</label>
                        <div className="input-group2 input-group-re-size-2">
                          <div className="input-control">
                            <Controller
                              name="imapPort"
                              control={control}
                              render={({ field }) => (
                                <input
                                  {...field}
                                  type="text"
                                  className="form-control"
                                  placeholder="Port"
                                  id="Port"
                                />
                              )}
                            />
                          </div>
                        </div>
                        {errors.imapPort && (
                          <span className="error-input-text">
                            <img src={errorIcon16} alt="" width="16" height="16" className="me-2" />
                            <span className="error-text">{errors.imapPort.message}</span>
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Security Type */}
                    <div className="form-group automatically-inf-details">
                      <label className="control-label required">Security Type</label>
                      <div className="input-icon-add" onFocusCapture={() => setFocusedField("imapRecommended")}
                        onBlurCapture={() => setFocusedField(null)}>
                        <Controller
                          name="secureType"
                          control={control}
                          render={({ field }) => (
                            <Select2Wrapper
                              value={field.value || null}
                              onChange={field.onChange}
                              options={[
                                { label: "SSL / TLS (recommended)", value: "tls" },
                                { label: "STARTTLS", value: "startls" },
                                { label: "None", value: "None" },
                              ]}
                              isMulti={false}
                            />
                          )}
                        />
                        <img src={focusedField === "imapRecommended" ? recommendedIconfocuse : recommendedIcon} alt={focusedField === "name" ? "Hide" : "Show"} className="input-icon-1"
                        />
                      </div>
                      {errors.secureType && (
                        <span className="error-input-text">
                          <img src={errorIcon16} alt="" width="16" height="16" className="me-2" />
                          <span className="error-text">{errors.secureType.message}</span>
                        </span>
                      )}
                    </div>

                    <div className="login-btn d-flex align-items-center">
                      <button
                        type="button"
                        className="btn-new border-none w-100 prev-step me-3"
                        onClick={goToPrev}
                      >
                        <img src={chevronLeftIconBig} alt="" className="me-2" />
                        Back
                      </button>
                      <button type="button" className="btn-new btn-new-bg w-100 next-step" onClick={goToNext}>Next step</button>
                    </div>

                    <hr />
                    <div className="d-flex align-items-center justify-content-between">
                      <p className="mb-0">Already have an account?</p>
                      <a href="javascript:;" className="link-ap">Login</a>
                    </div>
                  </div>

                  {/* ────────────── Step 3 - SMTP ────────────── */}
                  <div className={`form-step ${currentStep === 3 ? "active" : ""}`}>
                    {/* SMTP Email */}
                    <div className="form-group">
                      <label className="control-label required">Email</label>
                      <div className="input-group2">
                        <div className="input-control">
                          <div className="input-icon-add">
                            <Controller
                              name="smtpUsername"
                              control={control}
                              render={({ field }) => (
                                <input
                                  {...field}
                                  type="smtpUsername"
                                  className="form-control"
                                  placeholder="Email"
                                  onFocus={() => setFocusedField("smtpUsername")}
                                  onBlur={() => setFocusedField(null)}
                                />
                              )}
                            />
                            <img src={focusedField === "smtpUsername" ? mailIconfocuse : mailIcon} alt={focusedField === "name" ? "Hide" : "Show"} className="input-icon-1"
                            />
                          </div>
                        </div>
                      </div>
                      {errors.imapEmail && (
                        <span className="error-input-text">
                          <img src={errorIcon16} alt="" width="16" height="16" className="me-2" />
                          {errors.imapEmail.message}
                        </span>
                      )}
                    </div>
                    {/* SMTP Password with toggle */}
                    <div className="form-group">
                      <label className="control-label required">SMTP Password</label>
                      <div className="input-group2 icon-right2 password-show-hide">
                        <div className="input-control">
                          <div className="input-icon-add">
                            <Controller
                              name="smtpPassword"
                              control={control}
                              render={({ field }) => (
                                <input
                                  {...field}
                                  type={showSmtpPassword ? "text" : "password"}
                                  className="form-control"
                                  placeholder="SMTP Password"
                                  onFocusCapture={() => setFocusedField("smtppassword")}
                                  onBlurCapture={() => setFocusedField(null)}
                                />
                              )}
                            />
                            <img src={focusedField === "smtppassword" ? lockIconfocuse : lockIcon} alt={focusedField === "name" ? "Hide" : "Show"} className="input-icon-1"
                            />
                            <img
                              src={showSmtpPassword ? passwordShowIcon : passwordHideIcon}
                              alt={showSmtpPassword ? "Hide" : "Show"}
                              className="input-icon-2"
                              onClick={() => setShowSmtpPassword(!showSmtpPassword)}
                              style={{ cursor: "pointer" }}
                            />
                          </div>
                        </div>
                      </div>
                      <span className="sub-input-label">Leave blank if same as IMAP Password</span>
                      {errors.smtpPassword && (
                        <span className="error-input-text">
                          <img src={errorIcon16} alt="" width="16" height="16" className="me-2" />
                          {errors.smtpPassword.message}
                        </span>
                      )}
                    </div>

                    {/* SMTP Server + Port */}
                    <div className="d-flex align-items-start w-100">
                      <div className="form-group me-3">
                        <label className="control-label required">SMTP Server</label>
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
                                    placeholder="SMTP Server"
                                    id="smtpHost"
                                    onFocus={() => setFocusedField("smtpHost")}
                                    onBlur={() => setFocusedField(null)}
                                  />
                                )}
                              />
                              <img src={focusedField === "smtpHost" ? serverIconfocuse : serverIcon} alt={focusedField === "name" ? "Hide" : "Show"} className="input-icon-1"
                              />
                            </div>
                          </div>
                        </div>
                        {errors.imapServer && (
                          <span className="error-input-text">
                            <img src={errorIcon16} alt="" width="16" height="16" className="me-2" />
                            <span className="error-text">{errors.imapServer.message}</span>
                          </span>
                        )}
                      </div>

                      <div className="form-group">
                        <label className="control-label required">Port</label>
                        <div className="input-group2 input-group-re-size-2">
                          <div className="input-control">
                            <Controller
                              name="smtpPort"
                              control={control}
                              render={({ field }) => (
                                <input
                                  {...field}
                                  type="text"
                                  className="form-control"
                                  placeholder="Port"
                                  id="Port"
                                />
                              )}
                            />
                          </div>
                        </div>
                        {errors.imapPort && (
                          <span className="error-input-text">
                            <img src={errorIcon16} alt="" width="16" height="16" className="me-2" />
                            <span className="error-text">{errors.imapPort.message}</span>
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Security Type */}
                    <div className="form-group automatically-inf-details">
                      <label className="control-label required">Security Type</label>
                      <div className="input-icon-add" onFocusCapture={() => setFocusedField("smtpSecurityType")}
                        onBlurCapture={() => setFocusedField(null)}>
                        <Controller
                          name="smtpSecurityType"
                          control={control}
                          render={({ field }) => (
                            <Select2Wrapper
                              value={field.value || null}
                              onChange={field.onChange}
                              options={[
                                { label: "SSL / TLS (recommended)", value: "tls" },
                                { label: "STARTTLS", value: "startls" },
                                { label: "None", value: "None" },
                              ]}
                              isMulti={false}
                            />
                          )}
                        />
                        <img src={focusedField === "smtpSecurityType" ? recommendedIconfocuse : recommendedIcon} alt={focusedField === "name" ? "Hide" : "Show"} className="input-icon-1"
                        />
                      </div>
                      {errors.secureType && (
                        <span className="error-input-text">
                          <img src={errorIcon16} alt="" width="16" height="16" className="me-2" />
                          <span className="error-text">{errors.secureType.message}</span>
                        </span>
                      )}
                    </div>

                    <div className="login-btn d-flex align-items-center">
                      <button
                        type="button"
                        className="btn-new border-none w-100 prev-step me-3"
                        onClick={goToPrev}
                      >
                        <img src={chevronLeftIconBig} alt="" className="me-2" />
                        Back
                      </button>
                      <SubmitButton className="btn-new loading-spinner"
                        onClick={goToNext}
                      >Finish</SubmitButton>
                    </div>

                    <hr />
                    <div className="d-flex align-items-center justify-content-between">
                      <p className="mb-0">Already have an account?</p>
                      <a href="javascript:;" className="link-ap">Login</a>
                    </div>
                  </div>

                  {/* Success screen */}
                  {currentStep === 4 && (
                    <div className="form-step active">
                      <div className="successfully-error-box success">
                        <div className="status-icon" id="successIcon">
                          <svg className="status-svg" viewBox="0 0 52 52">
                            <path fill="none" stroke-linecap="round" stroke-linejoin="round"
                              d="M14 27l8 8 16-16" />
                          </svg>
                        </div>
                        <div className="status-message d-flex align-items-start justify-content-center">
                          <img src={successfullyIcon} alt="" className="me-2" />
                          <div className="text-center">
                            <span className="d-block">Registration completed successfully!</span>
                            <span className="d-block">IMAP & SMTP Configuration Completed</span>
                          </div>
                        </div>
                        <div className="loading-box " id="fetchAndStoreEmailsSection">
                          <div
                            className="loading-message d-flex align-items-center justify-content-center">
                            <div className="loading-icon me-3">
                              <div className="spinner"></div>
                            </div>
                            Loading data, please wait...
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </form>
              </div>
            </div>
          </div>

          <div className="power-by-box">
            <span className="powered-sec">
              Powered by
              <a href="javascript:;" className="ms-2"><img src={enlivenLogo} alt="" /></a>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;