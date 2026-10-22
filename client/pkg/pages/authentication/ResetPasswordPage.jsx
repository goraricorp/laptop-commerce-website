import React, { Component, useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Button, Container, FloatingLabel, Form, Image, Col, Row, Card } from "react-bootstrap";
import axios from "axios";

import LoadingPage from "../misc/LoadingPage.jsx";
import { AuthWrapper } from "./AuthWrapper.jsx";
import { NotifyModal } from "../../components/modal/notice/NotifyModal.jsx";
import apiHandler from "../../utils/apiHandler.jsx";

export default function ResetPasswordPage() {
    const [validated, setValidated] = useState(false);
    const [formData, setFormData] = useState({
        newPassword: "",
        retypePassword: "",
    });
    const [errors, setErrors] = useState({});
    const [error, setError] = useState(null);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showVerifyPassword, setShowVerifyPassword] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false); // trạng thái NotifySuccess
    const [showError, setShowError] = useState(false);       // trạng thái NotifyError
    const [loading, setLoading] = useState(false);
    const [token, setToken] = useState("");
    const navigate = useNavigate();
    const location = useLocation();

    // Hàm validate từng trường
    const validateField = (name, value) => {
        let errorMsg = "";
        if (name === "newPassword") {
            // Regex: ít nhất 8 ký tự, 1 chữ hoa, 1 chữ thường, 1 số, 1 ký tự đặc biệt, không chứa khoảng trắng
            const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d\s])[^\s]{8,}$/;
            if (!value) {
                errorMsg = "New password is required";
            } else if (!passwordRegex.test(value)) {
                errorMsg =
                    "Password must be at least 8 characters, contain 1 uppercase, 1 lowercase, 1 number, 1 special character and no spaces";
            }
        } else if (name === "retypePassword") {
            if (!value) {
                errorMsg = "Confirm password is required";
            } else if (value !== formData.newPassword) {
                errorMsg = "Passwords do not match";
            }
        }
        return errorMsg;
    };

    // Cập nhật formData và validate khi nhập
    const handleChange = (event) => {
        const { name, value } = event.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
        setErrors((prev) => ({ ...prev, [name]: validateField(name, value) }));
    };

    // Validate khi người dùng rời input
    const handleBlur = (event) => {
        const { name, value } = event.target;
        setErrors((prev) => ({ ...prev, [name]: validateField(name, value) }));
    };

    // Lấy token từ URL query string
    useEffect(() => {
        const queryParams = new URLSearchParams(location.search);
        const tokenFromUrl = queryParams.get("token");
        setToken(tokenFromUrl);
    }, [location]);

    const handleSubmit = async (event) => {
        event.preventDefault();
        // Validate toàn bộ các trường
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
        setLoading(true);
        try {
            const response = await apiHandler.post("/authentication/reset-password", {
                token: token,
                newPassword: formData.newPassword,
            });
            setShowSuccess(true);
        } catch (err) {
            setError(err.response ? err.response.data.message : "Reset password failed");
            setShowError(true);
        } finally {
            setLoading(false);
        }
        setValidated(true);
    };

    if (loading) return <LoadingPage />;

    return (
        <>
            <AuthWrapper>
                <h4 className="mb-2">Reset Password 🔒</h4>
                <p className="mb-4">
                    Enter your new password and we&#39;ll send instructions to reset your password.
                </p>
                <Form
                    id="formAuthentication"
                    className="mb-3"
                    noValidate
                    validated={validated}
                    onSubmit={handleSubmit}
                >
                    {/* New Password Field */}
                    <div className="mb-3">
                        <label htmlFor="newPassword" className="form-label">
                            New Password
                        </label>
                        <div className="input-group has-validation">
                            <input
                                required
                                name="newPassword"
                                type={showNewPassword ? "text" : "password"}
                                placeholder="••••••••••••"
                                minLength={8}
                                value={formData.newPassword || ""}
                                onChange={handleChange}
                                onBlur={handleBlur}
                                className={`form-control ${errors.newPassword ? "is-invalid" : ""}`}
                                aria-label="New Password"
                            />
                            <span
                                className="input-group-text cursor-pointer"
                                onClick={() => setShowNewPassword(!showNewPassword)}
                            >
                                <i className={showNewPassword ? "bx bx-show" : "bx bx-hide"}></i>
                            </span>
                            {errors.newPassword ? (
                                <div className="invalid-feedback">{errors.newPassword}</div>
                            ) : (
                                <div className="valid-feedback">Look good!</div>
                            )}
                        </div>
                    </div>
                    {/* Confirm Password Field */}
                    <div className="mb-3">
                        <label htmlFor="retypePassword" className="form-label">
                            Confirm New Password
                        </label>
                        <div className="input-group has-validation">
                            <input
                                required
                                name="retypePassword"
                                type={showVerifyPassword ? "text" : "password"}
                                placeholder="••••••••••••"
                                minLength={8}
                                value={formData.retypePassword || ""}
                                onChange={handleChange}
                                onBlur={handleBlur}
                                className={`form-control ${errors.retypePassword ? "is-invalid" : ""}`}
                                aria-label="Confirm New Password"
                            />
                            <span
                                className="input-group-text cursor-pointer"
                                onClick={() => setShowVerifyPassword(!showVerifyPassword)}
                            >
                                <i className={showVerifyPassword ? "bx bx-show" : "bx bx-hide"}></i>
                            </span>
                            {errors.retypePassword ? (
                                <div className="invalid-feedback">{errors.retypePassword}</div>
                            ) : (
                                <div className="valid-feedback">Look good!</div>
                            )}
                        </div>
                    </div>
                    <div className="mb-3">
                        <button
                            aria-label="Reset Password"
                            className="btn btn-primary d-grid w-100"
                            type="submit"
                        >
                            Reset Password
                        </button>
                    </div>
                </Form>
                <div className="text-center">
                    <Link
                        aria-label="Go to Login Page"
                        to="/auth/login"
                        className="d-flex align-items-center justify-content-center"
                    >
                        <i className="bx bx-chevron-left scaleX-n1-rtl bx-sm"></i>
                        Back to login
                    </Link>
                </div>
            </AuthWrapper>

            <NotifyModal
                type="success"
                title="Reset Password Successful"
                message="Your password has been reset successfully."
                show={showSuccess}
                onHide={() => {
                    setShowSuccess(false);
                    navigate("/auth/login");
                }}
            />
            <NotifyModal
                type="danger"
                title="Reset Password Failed"
                message={error}
                show={showError}
                onHide={() => setShowError(false)}
            />
        </>
    );
}

function ResetPasswordPageOld() {
    const [check, setCheck] = useState(false);
    const [validated, setValidated] = useState(false);
    const [formData, setFormData] = useState({
        email: '',
    });

    const [error, setError] = useState(null);
    const [showSuccess, setShowSuccess] = useState(false);  // trạng thái cho NotifySuccess
    const [showError, setShowError] = useState(false);  // trạng thái cho NotifyError
    const [loading, setLoading] = useState(false);  // Thêm trạng thái loadings
    const navigate = useNavigate();
    const location = useLocation();
    const [token, setToken] = useState('');
    const handleChange = (event) => {
        setFormData({ ...formData, [event.target.name]: event.target.value });
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        const form = event.currentTarget;
        if (formData.password !== formData.retypePassword) {
            event.stopPropagation();
            setError("Password do not match.");
            setShowError(true);
            return;
        } else if (form.checkValidity() === false) {
            event.stopPropagation();
            setError("Make sure your new password is more than 8 characters.");
            setShowError(true);
            return;
        }
        else {
            setLoading(true);
            try {
                const response = await apiHandler.post('/authentication/reset-password', {
                    token: token,
                    newPassword: formData.password
                });
                setShowSuccess(true);
                // navigate('/auth/login');

            } catch (error) {
                setError(error.response ? error.response.data.message : 'Reset password failed');
                setShowError(true);
            } finally {
                setLoading(false);
            }
        }
        setValidated(true);
    };

    // useEffect(() => {
    //     authenticationCheck();
    // }, [navigate]);
    useEffect(() => {
        // Lấy token từ URL query string
        const queryParams = new URLSearchParams(location.search);
        const tokenFromUrl = queryParams.get('token');
        setToken(tokenFromUrl);  // Lưu token vào state
    }, [location]);

    if (loading) return <LoadingPage/>

    return (
        <>
            <AuthWrapper>
                <h4 className="mb-2">Reset Password? 🔒</h4>
                <p className="mb-4">Enter your new password and we&#39;ll instructions to reset your password</p>
                <Form id="formAuthentication" className="mb-3" noValidate validated={validated} onSubmit={handleSubmit}>
                    <div className="mb-3">
                        <label htmlFor="password" className="form-label">New Password</label>
                        <div className="input-group">
                            <input
                                required
                                name="password"
                                type="password"
                                placeholder="&#xb7;&#xb7;&#xb7;&#xb7;&#xb7;&#xb7;&#xb7;&#xb7;&#xb7;&#xb7;&#xb7;&#xb7;"
                                minLength={8}
                                onChange={handleChange}
                                aria-describedby="inputGroupPrepend"
                                className="form-control"
                                aria-label="Password"
                            />
                            <span className="input-group-text cursor-pointer"><i className="bx bx-hide"></i></span>
                        </div>
                    </div>
                    <div className="mb-3">
                        <label htmlFor="retypePassword" className="form-label">Verify Password</label>
                        <div className="input-group">
                            <input
                                required
                                type="password"
                                name="retypePassword"
                                minLength={8}
                                onChange={handleChange}
                                aria-describedby="inputGroupPrepend"
                                placeholder="&#xb7;&#xb7;&#xb7;&#xb7;&#xb7;&#xb7;&#xb7;&#xb7;&#xb7;&#xb7;&#xb7;&#xb7;"
                                className="form-control"
                                aria-label="Password"
                            />
                            <span className="input-group-text cursor-pointer"><i className="bx bx-hide"></i></span>
                        </div>
                    </div>
                    <div className="mb-3"> {/* mt-5 */}
                        <button
                            aria-label='Click me'
                            className="btn btn-primary d-grid w-100"
                            type="submit"
                            onClick={() => setCheck(true)}
                        >
                            Reset Password
                        </button>
                    </div>
                </Form>
                <div className="text-center">
                    <Link aria-label="Go to Login Page" to="/auth/login"
                        className="d-flex align-items-center justify-content-center">
                        <i className="bx bx-chevron-left scaleX-n1-rtl bx-sm"></i>
                        Back to login
                    </Link>
                </div>
            </AuthWrapper>

            <NotifyModal
                type="success"
                title="Reset password Successful"
                message="You have reset password successfully."
                show={showSuccess}  // truyền showSuccess vào NotifySuccess
                onHide={() => {
                    setShowSuccess(false)
                    navigate('/auth/login');
                }}  // đóng khi người dùng click
            />
            <NotifyModal
                type="danger"
                title="Reset password Failed"
                message={error}
                show={showError}  // truyền showError vào NotifyError
                onHide={() => setShowError(false)}  // đóng khi người dùng click
            />
        </>
    )
}