import React, { Component, useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Button, Container, FloatingLabel, Form, Image, Col, Row, Card } from "react-bootstrap";
import axios from "axios";

import LoadingPage from "../misc/LoadingPage.jsx";
import { AuthWrapper } from "./AuthWrapper.jsx";
import { NotifyModal } from "../../components/modal/notice/NotifyModal.jsx";
import apiHandler from "../../utils/apiHandler.jsx";

export default function ChangePasswordPage() {
    const [validated, setValidated] = useState(false);
    const [formData, setFormData] = useState({
        oldPassword: "",
        newPassword: "",
        retypePassword: "",
        username: "",
    });
    const [errors, setErrors] = useState({});
    const [error, setError] = useState(null);
    const [showOldPassword, setShowOldPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showVerifyPassword, setShowVerifyPassword] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    const [showError, setShowError] = useState(false);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();

    // Hàm validate từng trường
    const validateField = (name, value) => {
        let errorMsg = "";
        switch (name) {
            case "oldPassword": {
                if (!value) {
                    errorMsg = "Old Password is required";
                } else if (value.length < 8) {
                    errorMsg = "Old Password must be at least 8 characters";
                }
                break;
            }
            case "newPassword": {
                // Phải chứa ít nhất 1 chữ hoa, 1 chữ thường, 1 số, 1 ký tự đặc biệt và không chứa khoảng trắng
                const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d\s])[^\s]{8,}$/;
                if (!value) {
                    errorMsg = "New Password is required";
                } else if (!passwordRegex.test(value)) {
                    errorMsg =
                        "New Password must be at least 8 characters, contain at least 1 uppercase letter, 1 lowercase letter, 1 number, 1 special character and no spaces";
                }
                break;
            }
            case "retypePassword": {
                if (!value) {
                    errorMsg = "Confirm Password cannot be empty";
                } else if (value !== formData.newPassword) {
                    errorMsg = "Passwords do not match";
                }
                break;
            }
            default:
                break;
        }
        return errorMsg;
    };

    // Cập nhật formData và validate khi người dùng nhập
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

    // Lấy username từ thông tin tài khoản
    const fetchData = async () => {
        try {
            const token = localStorage.getItem("token");
            if (!token) {
                // Nếu không có token, có thể chuyển hướng về login
                return;
            }
            const response = await apiHandler.get("/account/get-info", {
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = response.data;
            setFormData((prev) => ({
                ...prev,
                username: data.username,
            }));
        } catch (error) {
            setError("Error fetching user data");
        }
    };

    // Xử lý submit form: Validate tất cả các trường trước khi gọi API
    const handleSubmit = async (event) => {
        event.preventDefault();
        const newErrors = {};
        ["oldPassword", "newPassword", "retypePassword"].forEach((key) => {
            newErrors[key] = validateField(key, formData[key]);
        });
        setErrors(newErrors);
        const isValid = Object.values(newErrors).every((err) => err === "");
        if (!isValid) {
            setValidated(true);
            return;
        }
        setLoading(true);
        try {
            const response = await apiHandler.post("/authentication/change-password", {
                oldPassword: formData.oldPassword,
                newPassword: formData.newPassword,
                retypePassword: formData.retypePassword,
                username: formData.username,
            });
            setShowSuccess(true);
            // Nếu cần điều hướng sau khi thay đổi mật khẩu thành công, ví dụ:
            // setTimeout(() => navigate('/user'), 500);
        } catch (err) {
            setError(err.response ? err.response.data.message : "Change password failed");
            setShowError(true);
        } finally {
            setLoading(false);
        }
        setValidated(true);
    };

    useEffect(() => {
        fetchData();
    }, []);

    if (loading) return <LoadingPage />;

    return (
        <>
            <AuthWrapper>
                <h4 className="mb-2">Change Password 🔒</h4>
                <p className="mb-4">
                    Enter your new password. We&#39;ll send instructions to change your password.
                </p>
                <Form
                    id="formAuthentication"
                    className="mb-3"
                    noValidate
                    validated={validated}
                    onSubmit={handleSubmit}
                >
                    {/* Old Password */}
                    <div className="mb-3">
                        <label htmlFor="oldPassword" className="form-label">
                            Old Password
                        </label>
                        <div className="input-group has-validation">
                            <input
                                required
                                name="oldPassword"
                                type={showOldPassword ? "text" : "password"}
                                placeholder="••••••••••••"
                                minLength={8}
                                value={formData.oldPassword || ""}
                                onChange={handleChange}
                                onBlur={handleBlur}
                                className={`form-control ${errors.oldPassword ? "is-invalid" : ""}`}
                                aria-label="Old Password"
                            />
                            <span
                                className="input-group-text cursor-pointer"
                                onClick={() => setShowOldPassword(!showOldPassword)}
                            >
                                <i className={showOldPassword ? "bx bx-show" : "bx bx-hide"}></i>
                            </span>
                            {errors.oldPassword ? (
                                <div className="invalid-feedback">{errors.oldPassword}</div>
                            ) : (
                                <div className="valid-feedback">Make sure your password correctly!</div>
                            )}
                        </div>
                    </div>
                    {/* New Password */}
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
                    {/* Retype Password */}
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
                            aria-label="Change Password"
                            className="btn btn-primary d-grid w-100"
                            type="submit"
                        >
                            Change Password
                        </button>
                    </div>
                </Form>
                <div className="text-center">
                    <Link
                        aria-label="Go to Account Page"
                        to="/user"
                        className="d-flex align-items-center justify-content-center"
                    >
                        <i className="bx bx-chevron-left scaleX-n1-rtl bx-sm"></i>
                        Back to profile
                    </Link>
                </div>
            </AuthWrapper>

            <NotifyModal
                type="success"
                title="Change Password Successful"
                message="Your password has been changed successfully."
                show={showSuccess}
                onHide={() => {
                    setShowSuccess(false);
                    navigate("/user");
                }}
            />
            <NotifyModal
                type="danger"
                title="Change Password Failed"
                message={error}
                show={showError}
                onHide={() => setShowError(false)}
            />
        </>
    );
}

function ChangePasswordPageOld() {
    const [check, setCheck] = useState(false);
    const [validated, setValidated] = useState(false);
    const [formData, setFormData] = useState({
        oldPassword: '',
        newPassword: '',
        retypePassword: '',
        username: ''
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

    const fetchData = async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                // navigate('/login');
                return;
            }

            const response = await apiHandler.get('/account/get-info', {
                headers: { Authorization: `Bearer ${token}` }
            });

            const data = response.data;
            setFormData({
                username: data.username
            });
        } catch (error) {
            setError('Error fetching user data');
        }
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        const form = event.currentTarget;

        if (formData.newPassword !== formData.retypePassword) {
            event.stopPropagation();
            setError("Password do not match.");
            setShowError(true);
            return;
        } else if (form.checkValidity() === false) {
            event.stopPropagation();
            setError("Make sure your password is more than 8 characters.");
            setShowError(true);
            return;
        } else if (!formData.oldPassword || !formData.newPassword || !formData.retypePassword) {
            event.stopPropagation();
            setError("Please fill in all the fields.");
            setShowError(true);
            return;
        } else {
            setLoading(true);
            try {
                const response = await apiHandler.post('/authentication/change-password', {
                    oldPassword: formData.oldPassword,
                    newPassword: formData.newPassword,
                    retypePassword: formData.retypePassword,
                    username: formData.username,
                });
                setShowSuccess(true);
                // navigate('/auth/login');
            } catch (error) {
                setError(error.response ? error.response.data.message : 'Change password failed');
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
        fetchData()
    }, []);

    if (loading) return <LoadingPage />

    return (
        <>
            <AuthWrapper>
                <h4 className="mb-2">Change Password? 🔒</h4>
                <p className="mb-4">Enter your new password and we&#39;ll instructions to change your password</p>
                <Form id="formAuthentication" className="mb-3" noValidate validated={validated} onSubmit={handleSubmit}>
                    <div className="mb-3">
                        <label htmlFor="oldPassword" className="form-label">Old Password</label>
                        <div className="input-group">
                            <input
                                required
                                name="oldPassword"
                                type="password"
                                placeholder="&#xb7;&#xb7;&#xb7;&#xb7;&#xb7;&#xb7;&#xb7;&#xb7;&#xb7;&#xb7;&#xb7;&#xb7;"
                                minLength={8}
                                value={formData.oldPassword || ''}
                                onChange={handleChange}
                                aria-describedby="inputGroupPrepend"
                                className="form-control"
                                aria-label="Password"
                            />
                            <span className="input-group-text cursor-pointer"><i className="bx bx-hide"></i></span>
                        </div>
                    </div>
                    <div className="mb-3">
                        <label htmlFor="newPassword" className="form-label">New Password</label>
                        <div className="input-group">
                            <input
                                required
                                type="password"
                                name="newPassword"
                                minLength={8}
                                onChange={handleChange}
                                // setFormData=formData.newPassword
                                value={formData.newPassword || ''}
                                aria-describedby="inputGroupPrepend"
                                placeholder="&#xb7;&#xb7;&#xb7;&#xb7;&#xb7;&#xb7;&#xb7;&#xb7;&#xb7;&#xb7;&#xb7;&#xb7;"
                                className="form-control"
                                aria-label="Password"
                            />
                            <span className="input-group-text cursor-pointer"><i className="bx bx-hide"></i></span>
                        </div>
                    </div>
                    <div className="mb-3">
                        <label htmlFor="retypePassword" className="form-label">Retype Password</label>
                        <div className="input-group">
                            <input
                                required
                                type="password"
                                name="retypePassword"
                                minLength={8}
                                onChange={handleChange}
                                value={formData.retypePassword || ''}
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
                            Change Password
                        </button>
                    </div>
                </Form>
                <div className="text-center">
                    <Link aria-label="Go to Login Page" to="/user"
                        className="d-flex align-items-center justify-content-center">
                        <i className="bx bx-chevron-left scaleX-n1-rtl bx-sm"></i>
                        Back to login
                    </Link>
                </div>
            </AuthWrapper>

            <NotifyModal
                type="success"
                title="Change password Successful"
                message="You have Change password successfully."
                show={showSuccess}  // truyền showSuccess vào NotifySuccess
                onHide={() => {
                    setShowSuccess(false)
                    // console.log(1)
                    setTimeout(() => {
                        navigate('/user'); // Điều hướng sau một khoảng thời gian
                    }, 500)
                }}  // đóng khi người dùng click
            />
            <NotifyModal
                type="danger"
                title="Change password Failed"
                message={error}
                show={showError}  // truyền showError vào NotifyError
                onHide={() => setShowError(false)}  // đóng khi người dùng click
            />
        </>
    )
}