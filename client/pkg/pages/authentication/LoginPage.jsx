import React, { Component, useState, useEffect } from "react";
import { Link, useNavigate } from 'react-router-dom';
import { Form } from "react-bootstrap";
import { jwtDecode } from "jwt-decode";
import axios from "axios";

import LoadingPage from "../misc/LoadingPage.jsx";
import { GoogleLogin, googleLogout, GoogleOAuthProvider, useGoogleLogin } from "@react-oauth/google";
import { AuthWrapper } from "./AuthWrapper.jsx";
import { ReCaptchaComponent } from "../../components/recaptcha/Recaptcha.jsx";
import { NotifyModal } from "../../components/modal/notice/NotifyModal.jsx";
import apiHandler from "../../utils/apiHandler.jsx";
import { GoogleOAuthButton } from "../../components/button/GoogleOAuthButton.jsx";

export default function LoginPage({ checker }) {
    const [validated, setValidated] = useState(false);
    const [formData, setFormData] = useState({
        username: "",
        password: "",
    });
    const [errors, setErrors] = useState({});
    const [showPassword, setShowPassword] = useState(false);
    const [captchaVerified, setCaptchaVerified] = useState(false);
    const [error, setError] = useState(null);
    const [showSuccess, setShowSuccess] = useState(false);
    const [showError, setShowError] = useState(false);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    // Điều hướng dựa trên role
    const handleNavigate = (role) => {
        if (role === 1) {
            navigate("/admin");
        } else if (role === 0) {
            navigate("/user");
        } else {
            navigate("/auth/error");
        }
    };

    // Kiểm tra token hiện có (nếu đăng nhập trước đó)
    const handleCheck = () => {
        const token = localStorage.getItem("token");
        if (token) {
            try {
                const decoded = jwtDecode(token);
                handleNavigate(decoded.role);
            } catch (error) {
                console.error("Invalid token:", error);
                localStorage.removeItem("token");
                navigate("/auth/login");
            }
        }
    };

    useEffect(() => {
        handleCheck();
    }, []);

    // Hàm validate cho các trường đăng nhập
    const validateField = (name, value) => {
        let errorMsg = "";
        switch (name) {
            case "username": {
                // Username: 5-15 characters, only lowercase letters and numbers, must start with a letter, no spaces or special characters
                const usernameRegex = /^[a-z][a-z0-9]{4,14}$/;
                if (!value) {
                    errorMsg = "Username is required";
                } else if (!usernameRegex.test(value)) {
                    errorMsg =
                        "Username must be 5-15 characters, only lowercase letters and numbers, start with a letter, and contain no spaces or special characters";
                }
                break;
            }
            case "password": {
                // Password: at least 8 characters, contains at least 1 uppercase letter, 1 lowercase letter, 1 number, 1 special character, no spaces
                const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d\s])[^\s]{8,}$/;
                if (!value) {
                    errorMsg = "Password is required";
                } else if (!passwordRegex.test(value)) {
                    errorMsg =
                        "Password must be at least 8 characters long, contain at least 1 uppercase letter, 1 lowercase letter, 1 number, 1 special character, and no spaces";
                }
                break;
            }
            default:
                break;
        }
        return errorMsg;
    };

    // Xử lý thay đổi input
    const handleChange = (event) => {
        const { name, value } = event.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
        // Validate ngay khi người dùng nhập
        setErrors((prev) => ({ ...prev, [name]: validateField(name, value) }));
    };

    // Validate khi rời input (onBlur)
    const handleBlur = (event) => {
        const { name, value } = event.target;
        setErrors((prev) => ({ ...prev, [name]: validateField(name, value) }));
    };

    // Xử lý submit form
    const handleSubmit = async (event) => {
        event.preventDefault();
        const form = event.currentTarget;
        // Validate toàn bộ các trường
        const newErrors = {};
        Object.keys(formData).forEach((key) => {
            newErrors[key] = validateField(key, formData[key]);
        });
        setErrors(newErrors);

        // Nếu có lỗi, không submit
        const isValid = Object.values(newErrors).every((err) => err === "");
        if (!isValid) {
            setValidated(true);
            return;
        }

        // Kiểm tra lại captcha nếu cần (bỏ comment nếu bạn sử dụng)
        if (!captchaVerified) {
            setError("Please verify the captcha before submitting.");
            setShowError(true);
            return;
        }

        setLoading(true);
        try {
            const response = await apiHandler.post("/authentication/login", {
                username: formData.username,
                password: formData.password,
            });

            if (response.data.token) {
                const token = response.data.token;
                localStorage.setItem("token", token);
                const decoded = jwtDecode(token);
                setShowSuccess(true);
                await checker();
                handleNavigate(decoded.role);
            }
        } catch (err) {
            setError(err.response?.data?.message || "Login failed");
            setShowError(true);
        } finally {
            setLoading(false);
        }
        setValidated(true);
    };

    // Xử lý đăng nhập với Google
    const handleGoogleLogin = async (response) => {
        setLoading(true);
        try {
            const merge = jwtDecode(response.credential);
            const fetchRes = await apiHandler.post("/authentication/login-google", {
                merge,
                token: response.credential,
            });
            if (fetchRes.data.token) {
                const token = fetchRes.data.token;
                localStorage.setItem("token", token);
                const decoded = jwtDecode(token);
                setShowSuccess(true);
                await checker();
                handleNavigate(decoded.role);
            } else {
                setError("Google Login failed.");
                setShowError(true);
            }
        } catch (err) {
            setError("An error occurred during Google Login.");
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <LoadingPage />;

    return (
        <>
            <AuthWrapper>
                <h4 className="mb-2">Welcome to Cipher! 👋</h4>
                <p className="mb-4">
                    Please sign-in to your account and start the adventure
                </p>
                <Form
                    id="formAuthentication"
                    className="mb-3"
                    noValidate
                    validated={validated}
                    onSubmit={handleSubmit}
                >
                    {/* Username Field */}
                    <div className="mb-3">
                        <label htmlFor="username" className="form-label">
                            Username
                        </label>
                        <input
                            type="text"
                            className={`form-control ${errors.username ? "is-invalid" : ""}`}
                            id="username"
                            name="username"
                            value={formData.username}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            placeholder="Enter your username"
                            required
                        />
                        {errors.username ? (
                            <div className="invalid-feedback">{errors.username}</div>
                        ) : (
                            <div className="valid-feedback">Nice!</div>
                        )}
                    </div>

                    {/* Password Field */}
                    <div className="mb-3 form-password-toggle">
                        <label className="form-label" htmlFor="password">
                            Password
                        </label>
                        <div className="input-group has-validation">
                            <input
                                type={showPassword ? "text" : "password"}
                                autoComplete="true"
                                className={`form-control ${errors.password ? "is-invalid" : ""}`}
                                id="password"
                                name="password"
                                value={formData.password}
                                onChange={handleChange}
                                onBlur={handleBlur}
                                placeholder="Enter your password"
                                minLength={8}
                                required
                            />
                            <span
                                className="input-group-text cursor-pointer"
                                onClick={() => setShowPassword(!showPassword)}
                            >
                                <i
                                    className={`icon-base ${showPassword ? "bx bx-show" : "bx bx-hide"
                                        }`}
                                ></i>
                            </span>
                            {errors.password ? (
                                <div className="invalid-feedback">{errors.password}</div>
                            ) : (
                                <div className="valid-feedback">Not bad!</div>
                            )}
                        </div>
                    </div>

                    {/* Remember Me and Forgot Password */}
                    <div className="mb-3">
                        <div className="d-flex justify-content-between">
                            <div className="form-check">
                                <input
                                    className="form-check-input"
                                    type="checkbox"
                                    id="remember-me"
                                    name="rememberMe"
                                // checked={formData.remember}
                                />
                                <label className="form-check-label" htmlFor="remember-me">
                                    Remember Me
                                </label>
                            </div>
                            <Link aria-label="Go to Forgot Password Page" to="/auth/forgot-password">
                                <small>Forgot Password?</small>
                            </Link>
                        </div>
                    </div>

                    {/* Submit Button */}
                    <div className="mb-3">
                        <button
                            aria-label="Click me"
                            className="btn btn-primary d-grid w-100"
                            type="submit"
                        >
                            Log in
                        </button>
                    </div>
                    <div className="mb-3">
                        <ReCaptchaComponent
                            onSuccess={() => setCaptchaVerified(true)}
                            onError={() => setCaptchaVerified(false)}
                        />
                    </div>
                </Form>
                <p className="text-center">
                    <span>New on our platform? </span>
                    <Link
                        aria-label="Go to Register Page"
                        to="/auth/register"
                        className="registration-link"
                    >
                        <span>Create an account</span>
                    </Link>
                </p>

                <div className="divider my-6">
                    <div className="divider-text">or</div>
                </div>

                <div className="d-flex justify-content-center">
                    <GoogleLogin
                        onSuccess={handleGoogleLogin}
                        onError={() => setShowError(true)}
                        logo_alignment="center"
                        type="icon"
                        shape="circle"
                    />
                </div>
            </AuthWrapper>

            <NotifyModal
                type="success"
                title="Login Successful"
                message="You have logged in successfully."
                show={showSuccess}
                onHide={() => setShowSuccess(false)}
            />
            <NotifyModal
                type="danger"
                title="Login Failed"
                message={error}
                show={showError}
                onHide={() => setShowError(false)}
            />
        </>
    );
}

function LoginPage0({ checker }) {
    // const [modalShow, setModalShow] = useState(false);
    const [check, setCheck] = useState(false);
    const [validated, setValidated] = useState(false);
    const [formData, setFormData] = useState({
        username: '',
        password: ''
    });
    const [showPassword, setShowPassword] = useState(false);

    const [captchaVerified, setCaptchaVerified] = useState(false); // New state

    const [formGoogle, setFormGoogle] = useState(null);

    const [error, setError] = useState(null);
    const [showSuccess, setShowSuccess] = useState(false);  // trạng thái cho NotifySuccess
    const [showError, setShowError] = useState(false);  // trạng thái cho NotifyError
    const [loading, setLoading] = useState(false);  // Thêm trạng thái loading
    const navigate = useNavigate();
    // let role = null;

    const handleNavigate = (role) => {
        if (role === 1) {
            navigate("/admin");
        } else if (role === 0) {
            navigate("/user");
        } else {
            navigate("/auth/error");
        }
    };

    const handleCheck = () => {
        const token = localStorage.getItem("token");
        if (token) {
            try {
                const decoded = jwtDecode(token);
                // const role = decoded.role || null;

                handleNavigate(decoded.role); // Chuyển hướng nếu token hợp lệ
            } catch (error) {
                console.error("Invalid token:", error);
                localStorage.removeItem("token");
                navigate("/auth/login");
            }
        }
    };

    const handleChange = (event) => {
        setFormData({ ...formData, [event.target.name]: event.target.value });
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        const form = event.currentTarget;

        if (!captchaVerified) {
            setError("Please verify the captcha before submitting.");
            setShowError(true)
            return;
        }

        if (!form.checkValidity()) {
            event.stopPropagation();
            setValidated(true);
            return;
        }

        setLoading(true);
        try {
            const response = await apiHandler.post("/authentication/login", {
                username: formData.username,
                password: formData.password,
            });

            if (response.data.token) {
                const token = response.data.token;
                localStorage.setItem("token", token);

                const decoded = jwtDecode(token);
                // const role = decoded.role || null;

                setShowSuccess(true);
                await checker(); // Cập nhật trạng thái trong App
                handleNavigate(decoded.role);
            }
        } catch (error) {
            setError(error.response?.data?.message || "Login failed");
            setShowError(true);
        } finally {
            setLoading(false);
        }

        setValidated(true);
    };

    const handleGoogleLogin = async (response) => {
        setLoading(true);
        try {
            const merge = jwtDecode(response.credential);

            const fetch = await apiHandler.post("/authentication/login-google", {
                merge,
                token: response.credential,
            });

            if (fetch.data.token) {
                const token = fetch.data.token;
                localStorage.setItem("token", token);

                const decoded = jwtDecode(token);
                // role = decoded.role || null;

                setShowSuccess(true);
                await checker(); // Cập nhật trạng thái trong App
                handleNavigate(decoded.role);
            } else {
                setError("Google Login failed.");
            }
        } catch (err) {
            setError("An error occurred during Google Login.");
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleLogout = () => {

    }

    // const handleGoogle = useGoogleLogin({
    //     onSuccess: handleGoogleLogin,
    //     onError: () => setShowError(true),
    // })

    useEffect(() => {
        handleCheck();
    }, []);

    if (loading) return <LoadingPage />

    return (
        <>
            <AuthWrapper>
                <h4 className="mb-2">Welcome to Cipher! 👋</h4>
                <p className="mb-4">Please sign-in to your account and start the adventure</p>
                <Form id="formAuthentication" className="mb-3" noValidate
                    validated={validated} onSubmit={handleSubmit}>
                    <div className="mb-3">
                        <label htmlFor="username" className="form-label">Username</label>
                        <input
                            type="text"
                            className="form-control"
                            id="username"
                            value={formData.username}
                            onChange={handleChange}
                            name="username"
                            placeholder="Enter your username"
                            required
                        // autoFocus
                        />
                        {/*<div className="valid-feedback">*/}
                        {/*    Looks good!*/}
                        {/*</div>*/}
                        {/*<div className="invalid-feedback">*/}
                        {/*    Please enter your username.*/}
                        {/*</div>*/}
                    </div>
                    <div className="mb-3 form-password-toggle">
                        <label className="form-label" htmlFor="password">Password</label>
                        {/*<div className="d-flex justify-content-between">*/}
                        {/*    <label className="form-label" htmlFor="password">Password</label>*/}
                        {/*    <Link aria-label="Go to Forgot Password Page" to="/auth/forgot-password">*/}
                        {/*        <small>Forgot Password?</small>*/}
                        {/*    </Link>*/}
                        {/*</div>*/}
                        <div className="input-group">
                            {/* input-group-merge */}
                            <input
                                type={showPassword ? "text" : "password"}
                                autoComplete="true"
                                id="password"
                                value={formData.password}
                                minLength={8}
                                onChange={handleChange}
                                className="form-control"
                                name="password"
                                placeholder="&#xb7;&#xb7;&#xb7;&#xb7;&#xb7;&#xb7;&#xb7;&#xb7;&#xb7;&#xb7;&#xb7;&#xb7;"
                                aria-describedby="password"
                                required
                            />
                            <span
                                className="input-group-text cursor-pointer"
                                onClick={() => setShowPassword(!showPassword)}
                            >
                                <i className={`icon-base ${showPassword ? "bx bx-show" : "bx bx-hide"}`}></i>
                            </span>
                        </div>
                        <div className="valid-feedback">
                            Make sure enter correct password!
                        </div>
                        <div className="invalid-feedback">
                            Please enter your correct password.
                        </div>
                    </div>
                    <div className="mb-3">
                        <div className="d-flex justify-content-between">
                            <div className="form-check">
                                <input
                                    className="form-check-input"
                                    type="checkbox"
                                    id="remember-me"
                                    name="rememberMe"
                                // checked={formData.rememberMe}
                                // onChange={handleChange}
                                />
                                <label className="form-check-label" htmlFor="remember-me"> Remember Me </label>
                            </div>
                            <Link aria-label="Go to Forgot Password Page" to="/auth/forgot-password">
                                <small>Forgot Password?</small>
                            </Link>
                        </div>
                    </div>
                    <div className="mb-3">
                        <button
                            aria-label='Click me'
                            className="btn btn-primary d-grid w-100"
                            type="submit"
                            onClick={() => setCheck(true)}
                        >
                            Log in
                        </button>
                    </div>

                    {/* <div className="mb-3">
                        <ReCaptchaComponent
                            onSuccess={() => setCaptchaVerified(true)}
                            onError={() => setCaptchaVerified(false)}
                        />
                    </div> */}
                </Form>

                <p className="text-center">
                    <span>New on our platform? </span>
                    <Link aria-label="Go to Register Page" to='/auth/register' className="registration-link">
                        <span>Create an account</span>
                    </Link>
                </p>

                <div className="divider my-6">
                    <div className="divider-text">or</div>
                </div>
                {/*<div className="text-center mb-3">or log in with</div>*/}
                {/*<div className="row d-flex justify-content-center flex-wrap">*/}
                {/*    <div className="col-lg-12">*/}
                {/*        <div className="d-flex justify-content-center w-100"*/}
                {/*             style={{minWidth: '120px'}}>*/}

                {/*        </div>*/}
                {/*    </div>*/}
                {/*</div>*/}
                <div className="d-flex justify-content-center">
                    {/*<button className="btn btn-sm btn-icon rounded-circle me-2" style={{color: '#0866ff'}}>*/}
                    {/*    <i className="icon-base bx bxl-facebook-circle bx-sm"></i>*/}
                    {/*</button>*/}
                    {/*<button className="btn btn-sm btn-icon rounded-circle me-2" style={{color: '#1da1f2'}}>*/}
                    {/*    <i className="icon-base bx bxl-twitter bx-sm"></i>*/}
                    {/*</button>*/}
                    {/*<button className="btn btn-sm btn-icon rounded-circle me-2" style={{color: '#384551'}}>*/}
                    {/*    <i className="icon-base bx bxl-github bx-sm"></i>*/}
                    {/*</button>*/}
                    {/*<button*/}
                    {/*    className="btn btn-sm btn-icon rounded-circle"*/}
                    {/*    style={{color: '#dd4b39'}}*/}
                    {/*>*/}
                    {/*    <i className="icon-base bx bxl-google bx-sm"></i>*/}
                    {/*</button>*/}
                    {/*<GoogleOAuthProvider clientId={CLIENT_ID}>*/}
                    {/*    <button*/}
                    {/*        className="btn btn-sm btn-icon rounded-circle"*/}
                    {/*        // onClick={() => handleGoogle}*/}
                    {/*        style={{color: '#dd4b39'}}*/}
                    {/*    >*/}
                    {/*        <i className="icon-base bx bxl-google bx-sm"></i>*/}
                    {/*    </button>*/}
                    {/*    <GoogleOAuthButton/>*/}
                    {/*</GoogleOAuthProvider>*/}
                    <GoogleLogin
                        onSuccess={handleGoogleLogin}
                        onError={() => setShowError(true)}
                        logo_alignment="center"
                        type="icon"
                        shape="circle"
                    />
                </div>
            </AuthWrapper>

            <NotifyModal
                type="success"
                title="Login Successful"
                message="You have logged in successfully."
                show={showSuccess}  // truyền showSuccess vào NotifySuccess
                onHide={() => setShowSuccess(false)}  // đóng khi người dùng click
            />
            <NotifyModal
                type="danger"
                title="Login Failed"
                message={error}
                show={showError}  // truyền showError vào NotifyError
                onHide={() => setShowError(false)}  // đóng khi người dùng click
            />
        </>
    )
}