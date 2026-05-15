import mailSpotLogo from "@images/mailspot-login-logo.svg";
import mailIcon from "@images/mail-icon-16.svg";
import lockIcon from "@images/password-icon-16.svg";
import passwordShowIcon from "@images/password-show-icon-16.svg";
import passwordHideIcon from "@images/password-hide-icon-16.svg";
import successfullyIcon from "@images/successfully-icon-red.svg";
import enlivenLogo from "@images/enliven-logo.svg";
import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { loginSchema, type LoginFormValues } from "./login.schema";
import { loginUser } from "@services/login/loginService";
import { useNavigate } from "react-router-dom";
import { zodResolver } from "@hookform/resolvers/zod";
import "@assets/styles/header-main-style.css";
import "@assets/styles/sign-in-style.css";
import SubmitButton from "@components/ui/form/SubmitButton";
import { showError } from "@components/ui/toast/toastNotification";

const LoginPage = () => {
    // useEffect(() => {
    //     import("@assets/styles/sign-in-style.css");
    // }, []);

    const navigate = useNavigate();
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

    const onSubmit = async (data: LoginFormValues) => {
        console.log('SUBMITTED DATA:', data);
        try {
            const response = await loginUser(data);
            if (response.statusCode === 200) {
                console.log('LOGIN RESPONSE:', response);
                localStorage.setItem("email", response.data.email);
                localStorage.setItem("token", response.data.token);
                localStorage.setItem("username", response.data.username);
                localStorage.setItem("id", response.data.id);
                navigate('/mail/INBOX');
                // Force page reload to ensure proper initialization
                window.location.reload();
            }
            else {
                showError(response.data.data.error  || "Something went wrong!")
            }
        } catch (error) {
            console.log('LOGIN ERROR:', error);
        }

    };

    const {
        control,
        handleSubmit,
        formState: { errors },
    } = useForm<LoginFormValues>({
        resolver: zodResolver(loginSchema),
        mode: "onSubmit",
        defaultValues: {
            email: "",
            password: "",
            rememberMe: false,
        },
    });

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
                            <a href="javascript:;" className="brand-logo-login">
                                <img src={mailSpotLogo} alt="" />
                            </a>
                            <form onSubmit={handleSubmit(onSubmit)}>
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
                                        <a href="javascript:;" className="link-ap" onClick={redirectToForgot}>Forgot?</a>
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
                                <a href="javascript:;" className="link-ap" onClick={redirectToRegister}>Register</a>
                            </div>
                        </div>
                    </div>
                    <div className="power-by-box">
                        <span className="powered-sec">
                            Powered by
                            <a href="javascript:;" className="ms-2">
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