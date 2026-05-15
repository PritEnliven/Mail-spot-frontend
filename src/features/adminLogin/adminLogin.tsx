import mailSpotLogo from "@images/mailspot-login-logo.svg";
import mailIcon from "@images/mail-icon-16.svg";
import lockIcon from "@images/password-icon-16.svg";
import passwordShowIcon from "@images/password-show-icon-16.svg";
import passwordHideIcon from "@images/password-hide-icon-16.svg";
import enlivenLogo from "@images/enliven-logo.svg";
import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { adminLoginSchema, type AdminLoginFormValues } from "./adminLogin.schema";
import { adminLogin } from "@services/adminService/adminService";
import { useNavigate } from "react-router-dom";
import { zodResolver } from "@hookform/resolvers/zod";
import SubmitButton from "@components/ui/form/SubmitButton";
import { usePageStylesheet, pageStyles } from "@hooks/usePageStyleSheet";
import { showSuccess, showError } from "@components/ui/toast/toastNotification";

const LoginPage = () => {
    usePageStylesheet([pageStyles.adminCss, pageStyles.headerCss, pageStyles.signInCss]);

    const navigate = useNavigate();
    const [showPassword, setShowPassword] = useState(false);

    const togglePasswordVisibility = () => {
        setShowPassword(!showPassword);
    };

    const onSubmit = async (data: AdminLoginFormValues) => {
        console.log('SUBMITTED DATA:', data);
        try {
            const response = await adminLogin(data);
            if (response.statusCode === 200) {
                console.log('LOGIN RESPONSE:', response);
                localStorage.setItem("adminToken", response.data.token);
                localStorage.setItem("username", response.data.username);
                localStorage.setItem("id", response.data.id);
                showSuccess("Login successful!");
                navigate('/admin/dashboard');
            }
            else {
                console.log('error', response.message);
                showError(response.message || "Login failed. Please check your credentials.");
            }
        } catch (error) {
            console.log('LOGIN ERROR:', error);
            showError("Login failed. Please try again.");
        }
    };

    const {
        control,
        handleSubmit,
        formState: { errors },
    } = useForm<AdminLoginFormValues>({
        resolver: zodResolver(adminLoginSchema),
        mode: "onSubmit",
        defaultValues: {
            username: "",
            password: "",
            rememberMe: false,
        },
    });

    return (
        <div className="admin-login">
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
                    <div className="login-main-right-section h-100vh align-items-center">
                        <div className="login-box-main mt-0">
                            <a href="javascript:;" className="brand-logo-login">
                                <img src={mailSpotLogo} alt="" />
                            </a>
                            <form onSubmit={handleSubmit(onSubmit)}>
                                <div className="form-group">
                                    <label className="control-label required">Username</label>
                                    <div className="input-group2 icon-left2">
                                        <div className="input-control">
                                            <div className="input-icon-add">
                                                <Controller
                                                    name="username"
                                                    control={control}
                                                    render={({ field }) => (
                                                        <input type="text" id="username"
                                                            className="form-control"
                                                            placeholder="Enter your username"
                                                            {...field} />
                                                    )}
                                                />
                                                <img src={mailIcon} alt="" className="input-icon-1" />
                                            </div>
                                        </div>
                                    </div>
                                    {errors.username &&
                                        <span className="invalid-feedback" style={{ display: 'block' }}>
                                            {errors.username.message}
                                        </span>
                                    }
                                </div>
                                <div className="form-group">
                                    <div className="d-flex align-items-center justify-content-between">
                                        <label className="control-label required">Password</label>
                                    </div>
                                    <div className="input-group2 icon-left2 icon-right2 password-show-hide">
                                        <div className="input-control">
                                            <div className="input-icon-add">
                                                <Controller
                                                    name="password"
                                                    control={control}
                                                    render={({ field }) => (
                                                        <input type={showPassword ? "text" : "password"} id="password"
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
                                <div className="login-btn">
                                    <SubmitButton className="btn-new btn-new-bg w-100"
                                        onClick={handleSubmit(onSubmit)}
                                    >Login</SubmitButton>
                                </div>
                            </form>
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
        </div >
    );
}

export default LoginPage;