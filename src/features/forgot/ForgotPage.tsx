import { useState } from "react";
import mailSpotLogo from "@images/mailspot-login-logo.svg";
import mailIcon from "@images/mail-icon-16.svg";
import chevronLeftIconBig from "@images/chevron-left-icon-big.svg";
import lockIcon from "@images/password-icon-16.svg";
import passwordShowIcon from "@images/password-show-icon-16.svg";
import passwordHideIcon from "@images/password-hide-icon-16.svg";
import enlivenLogo from "@images/enliven-logo.svg";

// focuse
import mailIconfocuse from "@images/mail-icon-16-blue.svg"
import lockIconfocuse from "@images/password-icon-16-blue.svg"

import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ForgotPageSchema, type ForgotPageFormValues } from "./ForgotPage.schema";
import "@assets/styles/header-main-style.css";
import "@assets/styles/sign-in-style.css";
import SubmitButton from "@components/ui/form/SubmitButton";
import { resetPassword, verifyEmailAndSentMail, verifyOtp } from "@services/forgotPassword/forgotPasswordService";
import { showError, showSuccess } from "@components/ui/toast/toastNotification";
import type { Response } from "@models/Response";
import { useNavigate } from "react-router-dom";

const STEPS = {
  EMAIL: 1,
  OTP: 2,
  NEW_PASSWORD: 3,
} as const;

type Step = (typeof STEPS)[keyof typeof STEPS];

const stepTitles: Record<Step, string> = {
  1: "Enter your mailspot mail",
  2: "Enter your OTP",
  3: "Reset password",
};

const ForgotPage = () => {
  const naviate = useNavigate();
  const [currentStep, setCurrentStep] = useState<Step>(STEPS.EMAIL);
  const [showPassword, setShowPassword] = useState(false);
  const [showSmtpPassword, setShowSmtpPassword] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [maskedEmail, setMaskedEmail] = useState<string>("");
  const [resetToken, setResetToken] = useState<string>("");

  const {
    control,
    trigger,
    getValues,
    setValue,
    formState: { errors },
  } = useForm<ForgotPageFormValues>({
    resolver: zodResolver(ForgotPageSchema),
    mode: "onTouched",
    defaultValues: {
      email: "",
      otp: "",
      password: "",
      confirmPassword: "",
    },
  });

  const redirectToLogin = () => {
    naviate("/login");
  }

  const goToNext = async () => {
    let isValid = false;

    if (currentStep === STEPS.EMAIL) {
      isValid = await trigger(["email"]);
      if (!isValid) return;
      const email = getValues("email");
      setMaskedEmail(email.replace(/(.)(.*)(@.*)/, "$1****$3"));
      const payload = {
        email: email
      }
      const response: Response = await verifyEmailAndSentMail(payload);
      if (response.statusCode === 200) {
        showSuccess("Email verified successfully");
        setCurrentStep(STEPS.OTP);
      } else {
        showError(response.data.data.message || "Email verification failed!");
      }
    }
    else if (currentStep === STEPS.OTP) {
      isValid = await trigger(["otp"]);
      // TODO: Verify OTP via API

      console.log("Verifying OTP:", getValues("otp"));
      const payload = {
        email: getValues('email'),
        action: 'forgotPassword' as const,
        code: getValues("otp")
      }
      const response: Response = await verifyOtp(payload);
      if (response.statusCode === 200) {
        showSuccess("OTP verified successfully");
        // Store token from response
        if (response.data?.token) {
          setResetToken(response.data.token);
        }
        setCurrentStep(STEPS.NEW_PASSWORD);
      } else {
        showError(response.data?.data?.message || "OTP verification failed!");
      }
      setCurrentStep(STEPS.NEW_PASSWORD);
    }
    else if (currentStep === STEPS.NEW_PASSWORD) {
      isValid = await trigger(["password", "confirmPassword"]);
      const password = getValues("password");

      if (!isValid) {
        console.log(errors);
        return;
      }

      if (!password) {
        showError("Password is required");
        return;
      }

      const payload = {
        email: getValues("email"),
        password,
        token: resetToken
      };
      const response: Response = await resetPassword(payload);

      if (response.statusCode === 200) {
        showSuccess("Password reset successfully");
        setTimeout(() => {
          naviate("/login")
        }, 2000);
        // TODO: Redirect to login page
        // window.location.href = '/';
      } else {
        showError(response.data?.data?.message || "Password reset failed!");
      }
      console.log("Resetting password with:", getValues());
    }
  };

  const goToPrev = () => {
    if (currentStep > STEPS.EMAIL && currentStep) {
      setCurrentStep((prev) => (prev - 1) as Step);
    }
  };

  const getProgressClass = (step: number) => (currentStep >= step ? "active" : "");

  const onOtpChange = (index: number, value: string) => {
    if (value.length === 1 && index < 5) {
      const nextInput = document.getElementById(`otp-${index + 1}`);
      nextInput?.focus();
    }
    const currentOtp = getValues("otp") || "";
    const newOtp = currentOtp.slice(0, index) + value + currentOtp.slice(index + 1);
    setValue("otp", newOtp.slice(0, 6), { shouldValidate: true });
  };

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

                {/* ────────────── Step 1 ────────────── */}
                <div className={`form-step ${currentStep === 1 ? "active" : ""}`}>

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
                      <div className="invalid-feedback d-block mb-2">{errors.email.message}</div>
                    )}
                  </div>

                  <div className="login-btn d-flex align-items-center">
                    <SubmitButton
                      className="btn-new w-100 next-step loading-spinner"
                      onClick={goToNext}
                    >Send</SubmitButton>
                  </div>

                  <hr />
                  <div className="d-flex align-items-center justify-content-between">
                    <p className="mb-0">Like your password reset information sent to</p>
                    <a href="javascript:;" className="link-ap" onClick={redirectToLogin}>Login</a>
                  </div>
                </div>

                {/* ────────────── Step 2 - IMAP ────────────── */}
                {currentStep === STEPS.OTP && (
                  <div className="form-group">
                    <label className="control-label justify-content-center ">A code has been sent to <b className="text-black mgl-5 ms-2" id="masktedEmail">{maskedEmail}</b></label>
                    <div id="otp1" className="otp-input-cls d-flex justify-content-center  mb-4">
                      {[...Array(6)].map((_, index) => (
                        <Controller
                          key={index}
                          name="otp"
                          control={control}
                          render={() => (
                            <input
                              id={`otp-${index}`}
                              type="text"
                              maxLength={1}
                              inputMode="numeric"
                              pattern="[0-9]*"
                              className="text-center form-control otp-input"
                              value={(getValues("otp") || "")[index] || ""}
                              onChange={(e) => onOtpChange(index, e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === "Backspace" && !e.currentTarget.value && index > 0) {
                                  document.getElementById(`otp-${index - 1}`)?.focus();
                                }
                              }}
                            />
                          )}
                        />
                      ))}
                    </div>
                    {errors.otp && (
                      <div className="invalid-feedback d-block mb-2">{errors.otp.message}</div>
                    )}
                    <div className="login-btn d-flex align-items-center">
                      <button
                        type="button"
                        className="btn-new border-none w-100 prev-step me-3"
                        onClick={goToPrev}
                      >
                        <img src={chevronLeftIconBig} alt="" className="me-2" />
                        Back
                      </button>
                      <SubmitButton
                        className="btn-new w-100 next-step loading-spinner"
                        onClick={goToNext}
                      >Send</SubmitButton>
                    </div>

                    <hr />
                    <div className="d-flex align-items-center justify-content-between">
                      <p className="mb-0">Like your password reset information sent to</p>
                      <a href="javascript:;" className="link-ap" onClick={redirectToLogin}>Login</a>
                    </div>
                  </div>
                )}




                {/* ────────────── Step 3 - SMTP ────────────── */}
                <div className={`form-step ${currentStep === 3 ? "active" : ""}`}>

                  {/* Password */}
                  <div className="form-group">
                    <label className="control-label required">New Password</label>
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
                                placeholder="New Password"
                                onFocusCapture={() => setFocusedField("passsword")}
                                onBlurCapture={() => setFocusedField(null)}
                              />
                            )}
                          />
                          <img src={focusedField === "password" ? lockIconfocuse : lockIcon} alt={focusedField === "name" ? "Hide" : "Show"} className="input-icon-1"
                          />
                          <img
                            src={showPassword ? passwordShowIcon : passwordHideIcon}
                            alt={showPassword ? "Hide" : "Show"}
                            className="input-icon-2"
                            onClick={() => setShowPassword(!showPassword)}
                            style={{ cursor: "pointer" }}
                          />
                        </div>
                      </div>
                    </div>
                    {errors.password && (
                      <div className="invalid-feedback d-block mb-2">{errors.password.message}</div>
                    )}
                  </div>


                  {/* confirmPassword Password */}
                  <div className="form-group">
                    <label className="control-label required">Confirm Password</label>
                    <div className="input-group2 icon-right2 password-show-hide">
                      <div className="input-control">
                        <div className="input-icon-add">
                          <Controller
                            name="confirmPassword"
                            control={control}
                            render={({ field }) => (
                              <input
                                {...field}
                                type={showSmtpPassword ? "text" : "Password"}
                                className="form-control"
                                placeholder="Confirm Password"
                                onFocusCapture={() => setFocusedField("confirmPassword")}
                                onBlurCapture={() => setFocusedField(null)}
                              />
                            )}
                          />
                          <img src={focusedField === "confirmPassword" ? lockIconfocuse : lockIcon} alt={focusedField === "name" ? "Hide" : "Show"} className="input-icon-1"
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
                    {errors.confirmPassword && (
                      <div className="invalid-feedback d-block mb-2">{errors.confirmPassword.message}</div>
                    )}
                  </div>

                  <div className="login-btn d-flex align-items-center">
                    <button type="button" className="btn-new border-none w-100 prev-step me-3" onClick={goToPrev} >
                      <img src={chevronLeftIconBig} alt="" className="me-2" />
                      Back
                    </button>
                    <SubmitButton className="btn-new w-100 loading-spinner" onClick={goToNext} >Reset password</SubmitButton>
                  </div>

                  <hr />
                  <div className="d-flex align-items-center justify-content-between">
                    <p className="mb-0">Like your password reset information sent to </p>
                    <a href="javascript:;" className="link-ap" onClick={redirectToLogin}>Login</a>
                    
                  </div>
                </div>
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

export default ForgotPage;