import React, { Component, useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Form } from "react-bootstrap";

import axios from "axios";
import { AuthWrapper } from "./AuthWrapper.jsx";
import { GoogleLogin } from "@react-oauth/google";
import { jwtDecode } from "jwt-decode";
import { ReCaptchaComponent } from "../../components/recaptcha/Recaptcha.jsx";
import { NotifyModal } from "../../components/modal/notice/NotifyModal.jsx";
import apiHandler from "../../utils/apiHandler.jsx";
import { GoogleOAuthButton } from "../../components/button/GoogleOAuthButton.jsx";
import LoadingPage from "../misc/LoadingPage.jsx";

export default function RegisterPage({ checker }) {
    const [validated, setValidated] = useState(false);
    const [formData, setFormData] = useState({
        email: "",
        username: "",
        password: "",
        retypepass: "",
        firstname: "",
        lastname: "",
        phone: "",
        terms: false,
    });
    const [errors, setErrors] = useState({});
    const [showTypePassword, setShowTypePassword] = useState(false);
    const [showVerifyPassword, setShowVerifyPassword] = useState(false);
    const [captchaVerified, setCaptchaVerified] = useState(false);
    const [error, setError] = useState(null);
    const [showSuccess, setShowSuccess] = useState(false);
    const [showError, setShowError] = useState(false);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    // Hàm điều hướng dựa vào role
    const handleNavigate = (role) => {
        if (role === 1) {
            navigate("/admin");
        } else if (role === 0) {
            navigate("/user");
        } else {
            navigate("/auth/error");
        }
    };

    // Hàm validate cho từng trường
    const validateField = (name, value) => {
        let errorMsg = "";
        switch (name) {
            case "email": {
                // Email chuẩn
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (!emailRegex.test(value)) {
                    // errorMsg = "Email không hợp lệ";
                    errorMsg = "Invalid email address";
                }
                break;
            }
            case "username": {
                // Username: từ 5-15 ký tự, chỉ chứa chữ thường và số, không bắt đầu bằng số, không có khoảng trắng hay ký tự đặc biệt
                const usernameRegex = /^[a-z][a-z0-9]{4,14}$/;
                if (!usernameRegex.test(value)) {
                    // errorMsg = "Username từ 5-15 ký tự, chỉ chứa chữ thường và số, không bắt đầu bằng số, không chứa ký tự đặc biệt hoặc khoảng trắng";
                    errorMsg = "Username must be 5-15 characters, only lowercase letters and numbers, start with a letter, and contain no spaces or special characters";
                }
                break;
            }
            case "password": {
                // Password: tối thiểu 8 ký tự, chứa ít nhất 1 chữ hoa, 1 chữ thường, 1 số, 1 ký tự đặc biệt, không chứa khoảng trắng
                const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d\s])[^\s]{8,}$/;
                if (!passwordRegex.test(value)) {
                    // errorMsg = "Password phải có ít nhất 8 ký tự, 1 chữ hoa, 1 chữ thường, 1 số, 1 ký tự đặc biệt và không chứa khoảng trắng";
                    errorMsg = "Password must be at least 8 characters long, contain at least 1 uppercase letter, 1 lowercase letter, 1 number, 1 special character, and no spaces";
                }
                break;
            }
            case "retypepass": {
                // const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d\s])[^\s]{8,}$/;
                if (!value) {
                    errorMsg = "Confirm password cannot be empty";
                } else if (value !== formData.password) {
                    // errorMsg = "Password nhập lại không khớp";
                    errorMsg = "Passwords do not match";
                }
                break;
            }
            case "firstname": {
                // Firstname: ít nhất 1 ký tự, chỉ chứa chữ cái (không chứa số, ký tự đặc biệt hoặc khoảng trắng)
                const nameRegex = /^[A-Za-z]+(?:\s[A-Za-z]+)*$/;
                if (!nameRegex.test(value)) {
                    // errorMsg = "Firstname không được chứa ký tự đặc biệt, số hoặc khoảng trắng";
                    errorMsg = "Firstname must only contain letters (no numbers, special characters)";
                }
                break;
            }
            case "lastname": {
                // Lastname: điều kiện tương tự firstname
                const nameRegex = /^[A-Za-z]+(?:\s[A-Za-z]+)*$/;
                if (!nameRegex.test(value)) {
                    // errorMsg = "Lastname không được chứa ký tự đặc biệt, số hoặc khoảng trắng";
                    // errorMsg = "Must only contain letters and single spaces between words, with no leading or trailing spaces";
                    errorMsg = "Lastname must only contain letters (no numbers, special characters)";
                }
                break;
            }
            case "phone": {
                // Phone: đúng 10 chữ số, không chứa ký tự khác
                const phoneRegex = /^\d{10}$/;
                if (!phoneRegex.test(value)) {
                    // errorMsg = "Số điện thoại phải gồm 10 chữ số";
                    errorMsg = "Phone number must be exactly 10 digits";
                }
                break;
            }
            case "terms": {
                if (!value) {
                    // errorMsg = "Bạn phải đồng ý với privacy policy & terms";
                    errorMsg = "You must agree to the privacy policy & terms";
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
        const { name, value, type, checked } = event.target;
        const fieldValue = type === "checkbox" ? checked : value;
        setFormData((prev) => ({ ...prev, [name]: fieldValue }));
        // Nếu có giá trị, validate luôn
        setErrors((prev) => ({ ...prev, [name]: validateField(name, fieldValue) }));
    };

    // Validate khi rời input
    const handleBlur = (event) => {
        const { name, value, type, checked } = event.target;
        const fieldValue = type === "checkbox" ? checked : value;
        setErrors((prev) => ({ ...prev, [name]: validateField(name, fieldValue) }));
    };

    // Xử lý submit form
    const handleSubmit = async (event) => {
        event.preventDefault();
        // Validate tất cả các trường
        const newErrors = {};
        Object.keys(formData).forEach((key) => {
            newErrors[key] = validateField(key, formData[key]);
        });
        setErrors(newErrors);

        // Kiểm tra nếu có lỗi nào
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

        // Nếu password và retypepass khớp (đã được validate ở trên)
        if (formData.password !== formData.retypepass) {
            setError("Password is not match!");
            setShowError(true);
            return;
        }

        setLoading(true);
        try {
            const response = await apiHandler.post("/authentication/register", formData);
            if (response.status === 201) {
                setShowSuccess(true);
                // Sau 2 giây chuyển trang
                // setTimeout(() => navigate("/auth/login"), 2000);
            }
        } catch (err) {
            setError(err.response ? err.response.data.message : "Registration failed");
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
            const fetchRes = await apiHandler.post("/authentication/login-google", {
                merge,
                token: response.credential,
            });
            if (fetchRes.data.token) {
                const token = fetchRes.data.token;
                localStorage.setItem("token", token);
                const decoded = jwtDecode(token);
                setShowSuccess(true);
                // Gọi hàm checker nếu cần cập nhật trạng thái trong App
                await checker();
                handleNavigate(decoded.role);
            } else {
                setError("Google Login failed.");
                setShowError(true);
            }
        } catch (err) {
            setError(err.response ? err.response.data.error : "Google Login error");
            setShowError(true);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <LoadingPage />;

    return (
        <>
            <AuthWrapper>
                <h4 className="mb-2">Adventure starts here 🚀</h4>
                <p className="mb-4">Make your app management easy and fun!</p>

                <Form
                    id="formAuthentication"
                    className="mb-3"
                    noValidate
                    validated={validated}
                    onSubmit={handleSubmit}
                >
                    {/* Email */}
                    <div className="mb-3">
                        <label htmlFor="email" className="form-label">
                            Email address
                        </label>
                        <div className="input-group has-validation">
                            <span className="input-group-text">
                                <i className="bx bx-at"></i>
                            </span>
                            <input
                                required
                                type="email"
                                name="email"
                                placeholder="email@email.com"
                                value={formData.email}
                                onChange={handleChange}
                                onBlur={handleBlur}
                                className={`form-control ${errors.email && "is-invalid"}`}
                                aria-label="Email"
                                aria-describedby="basic-addon11"
                            />
                            {errors.email ? (
                                <div className="invalid-feedback">{errors.email}</div>
                            ) : (
                                <div className="valid-feedback">Look good!</div>
                            )}
                        </div>
                    </div>

                    {/* Username */}
                    <div className="mb-3">
                        <label htmlFor="username" className="form-label">
                            Username
                        </label>
                        <div className="input-group has-validation">
                            <span className="input-group-text">
                                <i className="bx bx-user"></i>
                            </span>
                            <input
                                type="text"
                                name="username"
                                placeholder="username"
                                value={formData.username}
                                onChange={handleChange}
                                onBlur={handleBlur}
                                required
                                className={`form-control ${errors.username && "is-invalid"}`}
                                aria-label="Username"
                            />
                            {errors.username ? (
                                <div className="invalid-feedback">{errors.username}</div>
                            ) : (
                                <div className="valid-feedback">Nice!</div>
                            )}
                        </div>
                    </div>

                    {/* Password */}
                    <div className="mb-3">
                        <label htmlFor="password" className="form-label">
                            Password
                        </label>
                        <div className="input-group has-validation">
                            <input
                                required
                                name="password"
                                type={showTypePassword ? "text" : "password"}
                                placeholder="Enter password"
                                minLength={8}
                                value={formData.password}
                                onChange={handleChange}
                                onBlur={handleBlur}
                                className={`form-control ${errors.password && "is-invalid"}`}
                                aria-label="Password"
                            />
                            <span
                                className="input-group-text cursor-pointer"
                                onClick={() => setShowTypePassword(!showTypePassword)}
                            >
                                <i className={showTypePassword ? "bx bx-show" : "bx bx-hide"}></i>
                            </span>
                            {errors.password ? (
                                <div className="invalid-feedback">{errors.password}</div>
                            ) : (
                                <div className="valid-feedback">Nice!</div>
                            )}
                        </div>
                    </div>

                    {/* Verify Password */}
                    <div className="mb-3">
                        <label htmlFor="retypepass" className="form-label">
                            Verify Password
                        </label>
                        <div className="input-group has-validation">
                            <input
                                required
                                type={showVerifyPassword ? "text" : "password"}
                                name="retypepass"
                                placeholder="Retype password"
                                minLength={8}
                                value={formData.retypepass}
                                onChange={handleChange}
                                onBlur={handleBlur}
                                className={`form-control ${errors.retypepass && "is-invalid"}`}
                                aria-label="Verify Password"
                            />
                            <span
                                className="input-group-text cursor-pointer"
                                onClick={() => setShowVerifyPassword(!showVerifyPassword)}
                            >
                                <i className={showVerifyPassword ? "bx bx-show" : "bx bx-hide"}></i>
                            </span>
                            {errors.retypepass ? (
                                <div className="invalid-feedback">{errors.retypepass}</div>
                            ) : (
                                <div className="valid-feedback">Nice!</div>
                            )}
                        </div>
                    </div>

                    {/* Firstname */}
                    <div className="mb-3">
                        <label htmlFor="firstname" className="form-label">
                            Firstname
                        </label>
                        <div className="input-group has-validation">
                            <input
                                required
                                type="text"
                                name="firstname"
                                placeholder="First name"
                                value={formData.firstname}
                                onChange={handleChange}
                                onBlur={handleBlur}
                                className={`form-control ${errors.firstname && "is-invalid"}`}
                                aria-label="Firstname"
                            />
                            {errors.firstname ? (
                                <div className="invalid-feedback">{errors.firstname}</div>
                            ) : (
                                <div className="valid-feedback">Beautiful name!</div>
                            )}
                        </div>
                    </div>

                    {/* Lastname */}
                    <div className="mb-3">
                        <label htmlFor="lastname" className="form-label">
                            Lastname
                        </label>
                        <div className="input-group has-validation">
                            <input
                                required
                                type="text"
                                name="lastname"
                                placeholder="Last name"
                                value={formData.lastname}
                                onChange={handleChange}
                                onBlur={handleBlur}
                                className={`form-control ${errors.lastname && "is-invalid"}`}
                                aria-label="Lastname"
                            />
                            {errors.lastname ? (
                                <div className="invalid-feedback">{errors.lastname}</div>
                            ) : (
                                <div className="valid-feedback">Beautiful name!</div>
                            )}
                        </div>
                    </div>

                    {/* Phone */}
                    <div className="mb-3">
                        <label htmlFor="phone" className="form-label">
                            Phone
                        </label>
                        <div className="input-group has-validation">
                            <span className="input-group-text">
                                <i className="bx bx-phone"></i>
                            </span>
                            <input
                                required
                                type="text"
                                name="phone"
                                placeholder="Phone"
                                value={formData.phone}
                                onChange={handleChange}
                                onBlur={handleBlur}
                                minLength={10}
                                maxLength={10}
                                className={`form-control ${errors.phone && "is-invalid"}`}
                                aria-label="Phone"
                            />
                            {errors.phone ? (
                                <div className="invalid-feedback">{errors.phone}</div>
                            ) : (
                                <div className="valid-feedback">Look good!</div>
                            )}
                        </div>
                    </div>

                    {/* Terms checkbox */}
                    <div className="mb-3">
                        <div className="form-check">
                            <input
                                required
                                type="checkbox"
                                className="form-check-input"
                                id="terms-conditions"
                                name="terms"
                                checked={formData.terms}
                                onChange={handleChange}
                                onBlur={handleBlur}
                            />
                            <label className="form-check-label" htmlFor="terms-conditions">
                                I agree to{" "}
                                <a aria-label="privacy policy and terms" href="#">
                                    privacy policy & terms
                                </a>
                            </label>
                            {errors.terms && (
                                <div className="invalid-feedback d-block">{errors.terms}</div>
                            )}
                        </div>
                    </div>

                    {/* Submit button */}
                    <div className="mb-3">
                        <button
                            aria-label="Click me"
                            className="btn btn-primary d-grid w-100"
                            type="submit"
                        >
                            Register
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
                    <span>Already have an account? </span>
                    <Link aria-label="Go to Login Page" to="/auth/login" className="registration-link">
                        <span>Sign in instead</span>
                    </Link>
                </p>

                <p className="text-center">
                    <span>Already have an account?</span>
                    <Link aria-label="Go to Login Page" to="/auth/login"
                        className="d-flex align-items-center justify-content-center">
                        <i className="bx bx-chevron-left scaleX-n1-rtl bx-sm"></i>
                        Back to login
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
                title="Registration successful"
                message="You have registered successfully!"
                show={showSuccess}
                onHide={() => {
                    setShowSuccess(false);
                    navigate("/auth/login");
                }}
            />
            <NotifyModal
                type="danger"
                title="Registration Failed!"
                message={error}
                show={showError}
                onHide={() => setShowError(false)}
            />
        </>
    );
}

function RegisterPage0({ checker }) {
    const [validated, setValidated] = useState(false);
    const [formData, setFormData] = useState({
        username: '',
        password: '',
        retypepass: '',
        email: '',
        firstname: '',
        lastname: '',
        phone: ''
    });

    const [showTypePassword, setShowTypePassword] = useState(false);
    const [showVerifyPassword, setShowVerifyPassword] = useState(false);

    const [captchaVerified, setCaptchaVerified] = useState(false); // New state

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

    const handleChange = (event) => {
        setFormData({ ...formData, [event.target.name]: event.target.value });
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        const form = event.currentTarget;

        // if (!captchaVerified) {
        //     // alert('Please verify the captcha before submitting.');
        //     setError("Please verify the captcha before submitting.");
        //     setShowError(true)
        //     return;
        // }

        if (!form.checkValidity()) {
            event.stopPropagation();
            setValidated(true);
            return;
        }

        // if (!form.checkValidity()) {
        //     event.preventDefault();
        //     event.stopPropagation();
        // } else {
        //     event.preventDefault();
        //
        //
        // }

        if (formData.password === formData.retypepass) {
            setLoading(true);

            try {
                const response = await apiHandler.post('/authentication/register', formData);

                if (response.status === 201) {
                    setShowSuccess(true)
                    // navigate('/login');  // Redirect to login after successful registration
                    // setTimeout(() => navigate('/login'), 2000);
                }
            } catch (error) {
                // console.log(error)
                setError(error.response ? error.response.data.message : 'Registration failed');
                setShowError(true);
            } finally {
                setLoading(false);
            }
        } else {
            setLoading(false);
            setError('Password is not match!');
            setShowError(true);
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
            setError(response.data.error);
            // console.error(err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <LoadingPage />

    return (
        <>
            <AuthWrapper>
                <h4 className="mb-2">Adventure starts here 🚀</h4>
                <p className="mb-4">Make your app management easy and fun!</p>

                <Form id="formAuthentication" className="mb-3" noValidate validated={validated} onSubmit={handleSubmit}>
                    <div className="mb-3">
                        <label htmlFor="email" className="form-label">Email address</label>
                        <div className="input-group has-validation">
                            <span className="input-group-text">
                                <i className='bx bx-at'></i>
                            </span>
                            <input
                                required
                                type="email"
                                name="email"
                                placeholder="email@email.com"
                                value={formData.email}
                                onChange={handleChange}
                                className="form-control"
                                aria-label="Username"
                                aria-describedby="basic-addon11"
                            />
                            <div className="invalid-feedback">
                                Looks good!
                            </div>
                        </div>
                    </div>
                    <div className="mb-3">
                        <label htmlFor="username" className="form-label">Username</label>
                        <div className="input-group has-validation">
                            <span className="input-group-text">
                                <i className='bx bx-user'></i>
                            </span>
                            <input
                                type="text"
                                name="username"
                                min={5}
                                max={15}
                                placeholder="username"
                                value={formData.username}
                                onChange={handleChange}
                                aria-describedby="inputGroupPrepend"
                                required
                                className="form-control"
                                aria-label="Username"
                            />
                            <div className="invalid-feedback">
                                Looks good!
                            </div>
                        </div>
                    </div>
                    <div className="mb-3">
                        <label htmlFor="username" className="form-label">Password</label>
                        <div className="input-group has-validation">
                            <input
                                required
                                name="password"
                                type={showTypePassword ? "text" : "password"}
                                placeholder="&#xb7;&#xb7;&#xb7;&#xb7;&#xb7;&#xb7;&#xb7;&#xb7;&#xb7;&#xb7;&#xb7;&#xb7;"
                                minLength={8}
                                value={formData.password}
                                onChange={handleChange}
                                aria-describedby="inputGroupPrepend"
                                className="form-control"
                                aria-label="Password"
                            />
                            <span
                                className="input-group-text cursor-pointer"
                                onClick={() => setShowTypePassword(!showTypePassword)}
                            >
                                <i className={showTypePassword ? "bx bx-show" : "bx bx-hide"}></i>
                            </span>
                            <div className="invalid-feedback">
                                Looks good!
                            </div>
                        </div>
                    </div>
                    <div className="mb-3">
                        <label htmlFor="username" className="form-label">Verify Password</label>
                        <div className="input-group has-validation">
                            <input
                                required
                                type={showVerifyPassword ? "text" : "password"}
                                name="retypepass"
                                minLength={8}
                                value={formData.retypepass}
                                onChange={handleChange}
                                aria-describedby="inputGroupPrepend"
                                placeholder="&#xb7;&#xb7;&#xb7;&#xb7;&#xb7;&#xb7;&#xb7;&#xb7;&#xb7;&#xb7;&#xb7;&#xb7;"
                                className="form-control"
                                aria-label="Password"
                            />
                            <span
                                className="input-group-text cursor-pointer"
                                onClick={() => setShowVerifyPassword(!showVerifyPassword)}
                            >
                                <i className={showVerifyPassword ? "bx bx-show" : "bx bx-hide"}></i>
                            </span>
                            <div className="invalid-feedback">
                                Looks good!
                            </div>
                        </div>
                    </div>
                    <div className="mb-3">
                        <label htmlFor="firstname" className="form-label">Firstname</label>
                        <div className="input-group has-validation">
                            <input
                                required
                                type="text"
                                name="firstname"
                                placeholder="First name"
                                value={formData.firstname}
                                onChange={handleChange}
                                aria-describedby="inputGroupPrepend"
                                className="form-control"
                                aria-label="Firstname"
                            />
                        </div>
                    </div>
                    <div className="mb-3">
                        <label htmlFor="lastname" className="form-label">Lastname</label>
                        <div className="input-group has-validation">
                            <input
                                required
                                type="text"
                                name="lastname"
                                placeholder="Last name"
                                value={formData.lastname}
                                onChange={handleChange}
                                aria-describedby="inputGroupPrepend"
                                className="form-control"
                                aria-label="Lastname"
                            />
                        </div>
                    </div>
                    <div className="mb-3">
                        <label htmlFor="phone" className="form-label">Phone</label>
                        <div className="input-group has-validation">
                            <span className="input-group-text">
                                <i className='bx bx-phone'></i>
                            </span>
                            <input
                                required
                                type="text"
                                name="phone"
                                placeholder="Phone"
                                value={formData.phone}
                                onChange={handleChange}
                                minLength={10}
                                maxLength={10}
                                aria-describedby="inputGroupPrepend"
                                className="form-control"
                                aria-label="Phone"
                            />
                            <div className="invalid-feedback">
                                Looks good!
                            </div>
                        </div>
                    </div>
                    <div className="mb-3">
                        <div className="form-check">
                            <input
                                required
                                type="checkbox"
                                className="form-check-input"
                                id="terms-conditions"
                                name="terms"
                                value={formData.terms}
                                onChange={handleChange}
                            />
                            <label className="form-check-label" htmlFor="terms-conditions">
                                I agree to
                                <a aria-label="pricacy policy and terms" href="#"> privacy policy & terms</a>
                            </label>
                        </div>
                    </div>
                    <div className="mb-3">
                        <button
                            aria-label='Click me'
                            className="btn btn-primary d-grid w-100"
                            type="submit"
                        >
                            Register
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
                    <span>Already have an account? </span>
                    <Link aria-label="Go to Login Page" to='/auth/login' className="registration-link">
                        <span>Sign in instead</span>
                    </Link>
                </p>

                <p className="text-center">
                    <span>Already have an account?</span>
                    <Link aria-label="Go to Login Page" to="/auth/login"
                        className="d-flex align-items-center justify-content-center">
                        <i className="bx bx-chevron-left scaleX-n1-rtl bx-sm"></i>
                        Back to login
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
                {/*            <GoogleLogin*/}
                {/*                onSuccess={handleGoogleLogin}*/}
                {/*                onError={() => false}*/}
                {/*                style={{width: '100%'}}*/}
                {/*            />*/}
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
                    {/*<GoogleOAuthButton/>*/}

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
                title="'Registration successful'"
                message="You have register in successfully."
                show={showSuccess}  // truyền showSuccess vào NotifySuccess
                onHide={() => {
                    setShowSuccess(false)
                    navigate('/auth/login');
                }}  // đóng khi người dùng click
            />
            <NotifyModal
                type="danger"
                title="Registration Failed"
                message={error}
                show={showError}  // truyền showError vào NotifyError
                onHide={() => setShowError(false)}  // đóng khi người dùng click
            />
        </>
    )
}
