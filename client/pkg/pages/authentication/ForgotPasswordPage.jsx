import React, { Component, useState, useEffect } from "react";
import { Link, useNavigate } from 'react-router-dom';
import { Button, Container, FloatingLabel, Form, Image, Col, Row, Card } from "react-bootstrap";
import axios from "axios";

import LoadingPage from "../misc/LoadingPage.jsx";
import { AuthWrapper } from "./AuthWrapper.jsx";
import { ReCaptchaComponent } from "../../components/recaptcha/Recaptcha.jsx";
import apiHandler from "../../utils/apiHandler.jsx";
import { NotifyModal } from "../../components/modal/notice/NotifyModal.jsx";

export default function ForgotPasswordPage() {
    const [validated, setValidated] = useState(false);
    const [formData, setFormData] = useState({
        email: "",
    });
    const [errors, setErrors] = useState({});
    const [error, setError] = useState(null);
    const [showSuccess, setShowSuccess] = useState(false);
    const [showError, setShowError] = useState(false);
    const [loading, setLoading] = useState(false);
    const [captchaVerified, setCaptchaVerified] = useState(false); // nếu sử dụng captcha
    const navigate = useNavigate();

    // Hàm validate cho email
    const validateField = (name, value) => {
        let errorMsg = "";
        if (name === "email") {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!value) {
                errorMsg = "Email is required";
            } else if (!emailRegex.test(value)) {
                errorMsg = "Invalid email address";
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

    // Validate khi rời input
    const handleBlur = (event) => {
        const { name, value } = event.target;
        setErrors((prev) => ({ ...prev, [name]: validateField(name, value) }));
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        // Validate email
        const emailError = validateField("email", formData.email);
        setErrors({ email: emailError });
        if (emailError) {
            setValidated(true);
            return;
        }
        // Nếu có sử dụng captcha, uncomment phần dưới đây:
        if (!captchaVerified) {
            setError("Please verify the captcha before submitting.");
            setShowError(true);
            return;
        }

        setLoading(true);
        try {
            const response = await apiHandler.post("/authentication/forgot-password", {
                email: formData.email,
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
                <h4 className="mb-2">Forgot Password? 🔒</h4>
                <p className="mb-4">
                    Enter your email and we&#39;ll send you instructions to reset your password.
                </p>
                <Form
                    id="formAuthentication"
                    className="mb-3"
                    noValidate
                    validated={validated}
                    onSubmit={handleSubmit}
                >
                    <div className="mb-3">
                        <label htmlFor="email" className="form-label">
                            Email
                        </label>
                        <div className="input-group has-validation">
                            <input
                                type="text"
                                className={`form-control ${errors.email ? "is-invalid" : ""}`}
                                id="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                onBlur={handleBlur}
                                placeholder="Enter your email"
                                autoFocus
                                required
                            />
                            {errors.email ? (
                                <div className="invalid-feedback">{errors.email}</div>
                            ) : (
                                <div className="valid-feedback">Make sure your email is correctly!</div>
                            )}
                        </div>
                    </div>
                    <div className="mb-3">
                        <button
                            aria-label="Send Reset Link"
                            className="btn btn-primary d-grid w-100"
                            type="submit"
                        >
                            Send Reset Link
                        </button>
                    </div>
                    {/* Nếu sử dụng reCAPTCHA, uncomment phần sau */}
                    <div className="mb-3">
                        <ReCaptchaComponent
                            onSuccess={() => setCaptchaVerified(true)}
                            onError={() => setCaptchaVerified(false)}
                        />
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
                title="Request Successful"
                message="Instructions have been sent to your email."
                show={showSuccess}
                onHide={() => {
                    setShowSuccess(false);
                    navigate("/auth/login");
                }}
            />
            <NotifyModal
                type="danger"
                title="Request Failed"
                message={error}
                show={showError}
                onHide={() => setShowError(false)}
            />
        </>
    );
}

function ForgotPasswordPageOld() {
    const [check, setCheck] = useState(false);
    const [validated, setValidated] = useState(false);
    const [formData, setFormData] = useState({
        email: '',
    });

    const [error, setError] = useState(null);
    const [showSuccess, setShowSuccess] = useState(false);  // trạng thái cho NotifySuccess
    const [showError, setShowError] = useState(false);  // trạng thái cho NotifyError
    const [loading, setLoading] = useState(false);  // Thêm trạng thái loading
    const navigate = useNavigate();

    const [captchaVerified, setCaptchaVerified] = useState(false); // New state

    const handleChange = (event) => {
        setFormData({ ...formData, [event.target.name]: event.target.value });
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        const form = event.currentTarget;

        // if (!captchaVerified) {
        //     setError("Please verify the captcha before submitting.");
        //     setShowError(true)
        //     return;
        // }

        if (form.checkValidity() === false) {
            event.stopPropagation();
        } else {
            setLoading(true);
            try {
                // console.log(1)
                const response = await apiHandler.post('/authentication/forgot-password', {
                    email: formData.email
                });
                setShowSuccess(true);
            } catch (error) {
                setError(error.response ? error.response.data.message : 'Reset password failed');
                setShowError(true);
            } finally {
                setLoading(false);
            }
            setValidated(true);
        }
    };

    // useEffect(() => {
    //     authenticationCheck();
    // }, [navigate]);

    if (loading) return <LoadingPage />

    return (
        <>
            <AuthWrapper>
                <h4 className="mb-2">Forgot Password? 🔒</h4>
                <p className="mb-4">Enter your email and we&#39;ll send you instructions to reset your password</p>
                <Form id="formAuthentication" className="mb-3" noValidate validated={validated} onSubmit={handleSubmit}>
                    <div className="mb-3">
                        <label htmlFor="email" className="form-label">Email</label>
                        <input
                            type="text"
                            className="form-control"
                            id="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            placeholder="Enter your email"
                            autoFocus />
                    </div>
                    <div className="mb-3">
                        <button
                            aria-label='Click me'
                            className="btn btn-primary d-grid w-100"
                            type="submit"
                            onClick={() => setCheck(true)}
                        >
                            Send Reset Link
                        </button>
                    </div>
                    {/*<div className="mb-3">*/}
                    {/*    <ReCaptchaComponent*/}
                    {/*        onSuccess={() => setCaptchaVerified(true)}*/}
                    {/*        onError={() => setCaptchaVerified(false)}*/}
                    {/*    />*/}
                    {/*</div>*/}
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
                title="Request Successful"
                message="You have request in successfully."
                show={showSuccess}  // truyền showSuccess vào NotifySuccess
                onHide={() => {
                    setShowSuccess(false);
                    navigate('/auth/login');
                }}  // đóng khi người dùng click
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