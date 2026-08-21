import SubmitButton from "@components/ui/form/SubmitButton";
import { showError } from "@components/ui/toast/toastNotification";
import { zodResolver } from "@hookform/resolvers/zod";
import enlivenLogo from "@images/enliven-logo.svg";
import mailIcon from "@images/mail-icon-16.svg";
import mailSpotLogo from "@images/mailspot-login-logo.svg";
import passwordHideIcon from "@images/password-hide-icon-16.svg";
import lockIcon from "@images/password-icon-16.svg";
import passwordShowIcon from "@images/password-show-icon-16.svg";
import successfullyIcon from "@images/successfully-icon-red.svg";
import { loginUser } from "@services/login/loginService";
import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { loginSchema, type LoginFormValues } from "./login.schema";
import { pageStyles, usePageStylesheet } from "@hooks/usePageStyleSheet";

export const AUTH_STORAGE_KEYS = ["email", "token", "username", "id"] as const;

export const REMEMBERED_EMAIL_KEY = "rememberedEmail";
export const getAuthStorage = (): Storage =>
    localStorage.getItem("token") ? localStorage : sessionStorage;

const LoginPage = () => {
    const navigate = useNavigate();
    const cssLoaded = usePageStylesheet([pageStyles.headerCss, pageStyles.signInCss]);
    const [showPassword, setShowPassword] = useState(true);

    const redirectToRegister = () => {
        navigate('/register');
    }

    const redirectToForgot = () => {
        navigate("/forgot");
    }

    const togglePasswordVisibility = () => {
        setShowPassword(!showPassword);
    };

    const rememberedEmail = localStorage.getItem(REMEMBERED_EMAIL_KEY) ?? "";

    const {
        control,
        handleSubmit,
        reset,
        formState: { errors },
    } = useForm<LoginFormValues>({
        resolver: zodResolver(loginSchema),
        mode: "onSubmit",
        defaultValues: {
            email: "",
            password: "",
            rememberMe: !!rememberedEmail,
        },
    });

    useEffect(() => {
        if (rememberedEmail) {
            reset({
                email: rememberedEmail,
                password: "",
                rememberMe: true,
            });
        }
    }, []);

    const onSubmit = async (data: LoginFormValues) => {
        try {
            const response = await loginUser(data);
            if (response.statusCode === 200) {
                const { email, token, username, id } = response.data;

                // Pick the right storage based on the checkbox
                // const storage = data.rememberMe ? localStorage : sessionStorage;

                // Always clear both storages first to avoid stale data from a
                // previous login with the opposite "remember me" setting
                AUTH_STORAGE_KEYS.forEach((key) => {
                    localStorage.removeItem(key);
                    sessionStorage.removeItem(key);
                });

                localStorage.setItem("email", email);
                localStorage.setItem("token", token);
                localStorage.setItem("username", username);
                localStorage.setItem("id", id);
                navigate('/mail/INBOX');

                if (data.rememberMe) {
                    localStorage.setItem(REMEMBERED_EMAIL_KEY, email);
                } else {
                    localStorage.removeItem(REMEMBERED_EMAIL_KEY);
                }

                // Force page reload to ensure proper initialization
                window.location.reload();
            }
            else {
                showError(response.data?.data?.error || response.data?.error || response.message || "Something went wrong!")
            }
        } catch (error: any) {
            console.log('LOGIN ERROR:', error);
            if (error?.isRateLimit) {
                showError(error.message || "Too many requests. Please try again later.");
            } else {
                showError(error.message || "Invalid credentials or something went wrong!");
            }
        }

    };

    if (!cssLoaded) {
        return null;
    }

    return (
        <div className="login-main">
            <div className="row m-0">
                <div className="col-md-6 p-0 d-md-block d-none">
                    <div className="login-main-gradiant">
                        <div className="login-left"></div>
                        <div className="login-right"></div>
                        <div className="login-main-content-section">
                            <span className="login-title">Your inbox, supercharged. Your team, unstoppable.</span>
                        </div>
                    </div>
                </div>
                <div className="col-md-6 p-0">
                    <div className="login-main-right-section h-100vh overflow-auto h-100vh align-items-center">
                        <div className="login-box-main mt-0">
                            <a className="brand-logo-login">
                                <img src={mailSpotLogo} alt="" />
                            </a>
                            <form
                                onSubmit={(e) => {
                                    e.preventDefault();
                                }}
                            >
                                <div className="form-group">
                                    <label className="control-label required">Email</label>
                                    <div className="input-group2 icon-left2">
                                        <div className="input-control">
                                            <div className="input-icon-add">
                                                <Controller
                                                    name="email"
                                                    control={control}
                                                    render={({ field }) => (
                                                        <input type="text" id="email"
                                                            className="form-control"
                                                            placeholder="Enter your email"
                                                            {...field} />
                                                    )}
                                                />
                                                <img src={mailIcon} alt="" className="input-icon-1" />
                                            </div>
                                        </div>
                                    </div>
                                    {errors.email &&
                                        <span className="invalid-feedback" style={{ display: 'block' }}>
                                            {errors.email.message}
                                        </span>
                                    }
                                </div>
                                <div className="form-group">
                                    <div className="d-flex align-items-center justify-content-between">
                                        <label className="control-label required">Password</label>
                                        <a href="#"
                                            className="link-ap"
                                            onClick={redirectToForgot}
                                            tabIndex={-1}
                                        >Forgot?</a>
                                    </div>
                                    <div className="input-group2 icon-left2 icon-right2 password-show-hide">
                                        <div className="input-control">
                                            <div className="input-icon-add">
                                                <Controller
                                                    name="password"
                                                    control={control}
                                                    render={({ field }) => (
                                                        <input type={showPassword ? "password" : "text"} id="password"
                                                            className="form-control"
                                                            maxLength={25}
                                                            placeholder="Enter your password"
                                                            {...field} />
                                                    )}
                                                />
                                                <img src={lockIcon} alt="" className="input-icon-1" />
                                                <img src={showPassword ? passwordHideIcon : passwordShowIcon}
                                                    alt={showPassword ? "Hide Password" : "Show Password"}
                                                    className="input-icon-2" id="togglePassword" style={{ cursor: "pointer" }}
                                                    onClick={togglePasswordVisibility} />
                                            </div>
                                        </div>
                                    </div>
                                    {errors.password &&
                                        <span className="invalid-feedback" style={{ display: 'block' }}>
                                            {errors.password.message}
                                        </span>
                                    }
                                </div>
                                <div className="form-group d-flex align-items-center">
                                    <div className="mail-received-check-btn me-2">
                                        <div className="checkbox-custom table-check">
                                            <Controller
                                                name="rememberMe"
                                                control={control}
                                                render={({ field }) => (
                                                    <input type="checkbox" id="rememberMe"
                                                        className="form-control"
                                                        checked={field.value}
                                                        onChange={field.onChange}
                                                        onBlur={field.onBlur}
                                                        ref={field.ref} />
                                                )}
                                            />
                                            <label htmlFor="rememberMe" className="label-text"></label>
                                        </div>
                                    </div>
                                    <label htmlFor="rememberMe" className="control-label m-0 all-day-chaeck">
                                        Remember me
                                    </label>
                                </div>
                                <div className="successfully-error-box error d-none" id="loginError-box">
                                    <div className="status-message">
                                        <img src={successfullyIcon} alt="" className="me-2" />
                                        <span id="loginError"></span>
                                    </div>
                                </div>
                                <div className="login-btn">
                                    <SubmitButton
                                        type="submit"
                                        className="btn-new w-100 loading-spinner"
                                        onClick={handleSubmit(onSubmit)}
                                    >
                                        Login
                                    </SubmitButton>
                                </div>
                            </form>
                            <hr />
                            <div className="d-flex align-items-center justify-content-between">
                                <p className="mb-0">Don't have an account?</p>
                                <a href="#" className="link-ap" onClick={redirectToRegister}>Register</a>
                            </div>
                        </div>
                    </div>
                    <div className="power-by-box">
                        <span className="powered-sec">
                            Powered by
                            <a href="#" className="ms-2">
                                <img src={enlivenLogo} alt="" />
                            </a>
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default LoginPage;