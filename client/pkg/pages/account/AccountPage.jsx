import React, { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Form, Button } from "react-bootstrap";
import { AccountWrapper } from "../../components/wrapper/AccountWrapper";
import axios from "axios";
import { ConfirmModal } from "../../components/modal/notice/ConfirmModal.jsx";
import apiHandler from "../../utils/apiHandler.jsx";

export default function AccountPage({ onReload }) {
    const [validated, setValidated] = useState(false);
    const [formData, setFormData] = useState({
        username: "",
        email: "",
        firstname: "",
        lastname: "",
        phone: "",
        avatar: "",
    });
    const [errors, setErrors] = useState({});
    const [error, setError] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [showDeactive, setShowDeactive] = useState(false);

    const navigate = useNavigate();

    // Hàm validate các trường theo yêu cầu
    const validateField = (name, value) => {
        let errorMsg = "";
        switch (name) {
            case "email": {
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (!value) {
                    errorMsg = "Email is required";
                } else if (!emailRegex.test(value)) {
                    errorMsg = "Invalid email address";
                }
                break;
            }
            case "username": {
                // Username: 5-15 ký tự, chỉ chứa chữ thường và số, bắt đầu bằng chữ, không có khoảng trắng hoặc ký tự đặc biệt
                const usernameRegex = /^[a-z][a-z0-9]{4,14}$/;
                if (!value) {
                    errorMsg = "Username is required";
                } else if (!usernameRegex.test(value)) {
                    errorMsg =
                        "Username must be 5-15 characters, only lowercase letters and numbers, start with a letter, and contain no spaces or special characters";
                }
                break;
            }
            case "firstname": {
                // Cho phép chữ cái và khoảng trắng giữa các từ, nhưng không cho khoảng trắng ở đầu hoặc cuối
                const nameRegex = /^[A-Za-z]+(?:\s[A-Za-z]+)*$/;
                if (!value) {
                    errorMsg = "Firstname is required";
                } else if (!nameRegex.test(value)) {
                    errorMsg =
                        "Firstname must only contain letters and single spaces between words, with no leading or trailing spaces";
                }
                break;
            }
            case "lastname": {
                const nameRegex = /^[A-Za-z]+(?:\s[A-Za-z]+)*$/;
                if (!value) {
                    errorMsg = "Lastname is required";
                } else if (!nameRegex.test(value)) {
                    errorMsg =
                        "Lastname must only contain letters and single spaces between words, with no leading or trailing spaces";
                }
                break;
            }
            case "phone": {
                const phoneRegex = /^\d{10}$/;
                if (!value) {
                    errorMsg = "Phone number is required";
                } else if (!phoneRegex.test(value)) {
                    errorMsg = "Phone number must be exactly 10 digits";
                }
                break;
            }
            default:
                break;
        }
        return errorMsg;
    };

    // Xử lý thay đổi input và validate ngay khi nhập
    const handleChange = (event) => {
        const { name, value } = event.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
        setErrors((prev) => ({ ...prev, [name]: validateField(name, value) }));
    };

    // Xử lý khi người dùng rời input
    const handleBlur = (event) => {
        const { name, value } = event.target;
        setErrors((prev) => ({ ...prev, [name]: validateField(name, value) }));
    };

    // Lấy thông tin tài khoản từ API
    const getInformation = async () => {
        try {
            const token = localStorage.getItem("token");
            if (!token) {
                return;
            }
            const response = await apiHandler.get("/account/get-info", {
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = response.data;
            // Hàm loại bỏ tiền tố localhost nếu cần
            const removeLocalhostPrefix = (url) => {
                const prefix = "http://localhost:5172/";
                return url.startsWith(prefix) ? url.slice(prefix.length) : url;
            };
            const avatarUrl = removeLocalhostPrefix(data.avatar);
            setFormData({
                username: data.username,
                email: data.email,
                firstname: data.firstname,
                lastname: data.lastname,
                phone: data.phone,
                avatar: avatarUrl,
            });
        } catch (error) {
            setError("Error fetching user data");
        }
    };

    // Xử lý ảnh avatar (upload & reset)
    const getAvatar = () => {
        const fileInput = document.querySelector(".account-file-input");
        const resetFileInput = document.querySelector(".account-image-reset");
        const accountUserImage = document.getElementById("uploadedAvatar");
        if (accountUserImage && fileInput && resetFileInput) {
            const resetImage = accountUserImage.src;
            fileInput.onchange = () => {
                if (fileInput.files[0]) {
                    accountUserImage.src = window.URL.createObjectURL(fileInput.files[0]);
                }
            };
            resetFileInput.onclick = () => {
                fileInput.value = "";
                accountUserImage.src = resetImage;
            };
        }
    };

    // Xử lý lưu thay đổi thông tin
    const handleSaveChanges = async () => {
        try {
            const token = localStorage.getItem("token");
            const fileInput = document.getElementById("upload");
            const file = fileInput.files[0];
            const formDataToSend = new FormData();
            if (file) {
                formDataToSend.append("avatar", file);
            }
            formDataToSend.append("username", formData.username);
            formDataToSend.append("email", formData.email);
            formDataToSend.append("firstname", formData.firstname);
            formDataToSend.append("lastname", formData.lastname);
            formDataToSend.append("phone", formData.phone);

            const avatarResponse = file
                ? await apiHandler.post(`/account/upload-avatar`, formDataToSend, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "multipart/form-data",
                    },
                })
                : null;

            const userInfoResponse = await apiHandler.put(`/account/set-info`, formData, {
                headers: { Authorization: `Bearer ${token}` },
            });

            if (
                (avatarResponse && avatarResponse.status === 200) ||
                userInfoResponse.status === 200
            ) {
                if (avatarResponse) {
                    setFormData((prevData) => ({
                        ...prevData,
                        avatar: avatarResponse.data.avatarPath,
                    }));
                }
                setShowModal(false);
                onReload();
            }
        } catch (error) {
            setError(error.response ? error.response.data.message : "Update failed");
        }
    };

    // Xử lý submit form – validate toàn bộ các trường trước khi hiển thị ConfirmModal
    const handleInvalid = (event) => {
        event.preventDefault();
        event.stopPropagation();
        const newErrors = {};
        // Chỉ validate các trường có yêu cầu
        ["email", "username", "firstname", "lastname", "phone"].forEach((key) => {
            newErrors[key] = validateField(key, formData[key]);
        });
        setErrors(newErrors);
        const isValid = Object.values(newErrors).every((err) => err === "");
        if (isValid) {
            setShowModal(true);
        } else {
            setValidated(true);
        }
    };

    const handleDeactivate = async () => {
        try {
            const token = localStorage.getItem("token");
            const response = await apiHandler.post(`/authentication/deactivate`, null, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (response.status === 200) {
                localStorage.removeItem("token");
                // window.location.href = "/login";
                navigate("/auth/login")
            }
        } catch (error) {
            setError(error.response? error.response.data.message : "Deactivation failed");
        }
    }

    useEffect(() => {
        getInformation();
        getAvatar();
    }, []);

    return (
        <>
            <div className="card mb-4">
                <h5 className="card-header">Profile Details</h5>
                <div className="card-body">
                    <div className="d-flex align-items-start align-items-sm-center gap-4">
                        <img
                            src={formData.avatar}
                            alt="user-avatar"
                            className="d-block rounded"
                            height="100"
                            width="100"
                            aria-label="Account image"
                            id="uploadedAvatar"
                        />
                        <div className="button-wrapper">
                            <label
                                htmlFor="upload"
                                className="btn btn-primary me-3 mb-4"
                                tabIndex="0"
                            >
                                <span className="d-none d-sm-block">Upload new photo</span>
                                <i className="bx bx-sm bx-upload d-block d-sm-none"></i>
                                <input
                                    type="file"
                                    name="avatar"
                                    id="upload"
                                    className="account-file-input"
                                    hidden
                                    accept="image/png, image/jpeg"
                                />
                            </label>
                            <button
                                aria-label="Reset image"
                                type="button"
                                className="btn btn-outline-secondary account-image-reset mb-4"
                            >
                                <i className="bx bx-reset d-block d-sm-none"></i>
                                <span className="d-none d-sm-block">Reset</span>
                            </button>
                            <p className="text-muted mb-0">Allowed JPG or PNG.</p>
                        </div>
                    </div>
                </div>
                <hr className="my-0" />
                <div className="card-body">
                    <Form
                        id="formAccountSettings"
                        noValidate
                        validated={validated}
                        onSubmit={handleInvalid}
                    >
                        <div className="row">
                            <div className="mb-3 col-md-7">
                                <label htmlFor="email" className="form-label">
                                    Email Address
                                </label>
                                <div className="input-group has-validation">
                                    <span className="input-group-text">
                                        <i className="bx bx-at"></i>
                                    </span>
                                    <input
                                        required
                                        type="email"
                                        name="email"
                                        placeholder="mail@mail.com"
                                        className={`form-control ${
                                            errors.email ? "is-invalid" : ""
                                        }`}
                                        aria-label="Email"
                                        value={formData.email}
                                        onChange={handleChange}
                                        onBlur={handleBlur}
                                    />
                                    {errors.email ? (
                                        <div className="invalid-feedback">{errors.email}</div>
                                    ) : (
                                        <div className="valid-feedback">Make sure your email is correct!</div>
                                    )}
                                </div>
                            </div>
                            <div className="mb-3 col-md-5">
                                <label htmlFor="userName" className="form-label">
                                    Username
                                </label>
                                <div className="input-group has-validation">
                                    <span className="input-group-text">
                                        <i className="bx bx-user"></i>
                                    </span>
                                    <input
                                        required
                                        readOnly
                                        type="text"
                                        name="username"
                                        placeholder="username"
                                        className={`form-control ${
                                            errors.username ? "is-invalid" : ""
                                        }`}
                                        aria-label="Username"
                                        value={formData.username}
                                        onChange={handleChange}
                                        onBlur={handleBlur}
                                    />
                                    {errors.username ? (
                                        <div className="invalid-feedback">{errors.username}</div>
                                    ) : (
                                        <div className="valid-feedback">Nice!</div>
                                    )}
                                </div>
                            </div>
                            <div className="mb-3 col-md-4">
                                <label htmlFor="firstname" className="form-label">
                                    Firstname
                                </label>
                                <div className="input-group has-validation">
                                    <input
                                        required
                                        type="text"
                                        name="firstname"
                                        placeholder="firstname"
                                        className={`form-control ${
                                            errors.firstname ? "is-invalid" : ""
                                        }`}
                                        aria-label="Firstname"
                                        value={formData.firstname}
                                        onChange={handleChange}
                                        onBlur={handleBlur}
                                    />
                                    {errors.firstname ? (
                                        <div className="invalid-feedback">{errors.firstname}</div>
                                    ) : (
                                        <div className="valid-feedback">Beautiful name!</div>
                                    )}
                                </div>
                            </div>
                            <div className="mb-3 col-md-4">
                                <label htmlFor="lastname" className="form-label">
                                    Lastname
                                </label>
                                <div className="input-group has-validation">
                                    <input
                                        required
                                        type="text"
                                        name="lastname"
                                        placeholder="lastname"
                                        className={`form-control ${
                                            errors.lastname ? "is-invalid" : ""
                                        }`}
                                        aria-label="Lastname"
                                        value={formData.lastname}
                                        onChange={handleChange}
                                        onBlur={handleBlur}
                                    />
                                    {errors.lastname ? (
                                        <div className="invalid-feedback">{errors.lastname}</div>
                                    ) : (
                                        <div className="valid-feedback">Beautiful name!</div>
                                    )}
                                </div>
                            </div>
                            <div className="mb-3 col-md-4">
                                <label htmlFor="phone" className="form-label">
                                    Phone
                                </label>
                                <div className="input-group has-validation">
                                    <span className="input-group-text">
                                        <i className="bx bxs-phone"></i>
                                    </span>
                                    <input
                                        required
                                        type="text"
                                        name="phone"
                                        placeholder="phone"
                                        className={`form-control ${
                                            errors.phone ? "is-invalid" : ""
                                        }`}
                                        aria-label="Phone"
                                        minLength={10}
                                        maxLength={10}
                                        value={formData.phone}
                                        onChange={handleChange}
                                        onBlur={handleBlur}
                                    />
                                    {errors.phone ? (
                                        <div className="invalid-feedback">{errors.phone}</div>
                                    ) : (
                                        <div className="valid-feedback">Look good!</div>
                                    )}
                                </div>
                            </div>
                        </div>
                        <div className="mt-2">
                            <button
                                aria-label="Save changes"
                                type="submit"
                                className="btn btn-primary me-3"
                            >
                                Save changes
                            </button>
                            <button
                                aria-label="Cancel"
                                type="reset"
                                className="btn btn-outline-secondary"
                                onClick={getInformation}
                            >
                                Cancel
                            </button>
                        </div>
                    </Form>
                </div>
            </div>
            <div className="card">
                <h5 className="card-header">Action Account</h5>
                <div className="card-body">
                    <div className="mb-3 col-12 mb-0">
                        <div className="alert alert-warning">
                            <h6 className="alert-heading mb-1">
                                Are you sure you want to delete your account?
                            </h6>
                            <p className="mb-0">
                                Once you delete your account, there is no going back. Please be certain.
                            </p>
                        </div>
                    </div>
                    <form id="formAccountDeactivation" onSubmit={(e) => e.preventDefault()}>
                        <div className="form-check mb-3">
                            <input
                                className="form-check-input"
                                type="checkbox"
                                name="accountActivation"
                                id="accountActivation"
                            />
                            <label className="form-check-label" htmlFor="accountActivation">
                                I confirm my account deactivation
                            </label>
                        </div>
                        <Button
                            aria-label="Deactivate Account"
                            variant="danger"
                            className="btn btn-danger me-3 deactivate-account"
                            onClick={() => setShowDeactive(true)}
                        >
                            Deactivate Account
                        </Button>
                        <Button
                            aria-label="Change Password"
                            variant="warning"
                            as={Link}
                            to="/auth/change-password"
                            className="btn btn-warning me-3"
                        >
                            Change Password
                        </Button>
                    </form>
                </div>
            </div>
            <ConfirmModal
                type="primary"
                show={showModal}
                onHide={() => setShowModal(false)}
                onSave={handleSaveChanges}
            />
            <ConfirmModal
                type="warning"
                title="Deactivate Account"
                message="Are you sure you want to deactivate this account?"
                button="Deactivate"
                show={showDeactive}
                onHide={() => setShowDeactive(false)}
                onSave={handleDeactivate}
            />
        </>
    );
}

function AccountPage0({ onReload }) {
    const [validated, setValidated] = useState(false);
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        firstname: '',
        lastname: '',
        phone: '',
        avatar: ''
    });
    const [error, setError] = useState(null);
    const [showModal, setShowModal] = useState(false);

    const navigate = useNavigate();

    const getInformation = async () => {
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
            function removeLocalhostPrefix(url) {
                const prefix = 'http://localhost:5172/';
                return url.startsWith(prefix) ? url.slice(prefix.length) : url;
            }
            const avatarUrl = removeLocalhostPrefix(data.avatar);
            setFormData({
                username: data.username,
                email: data.email,
                firstname: data.firstname,
                lastname: data.lastname,
                phone: data.phone,
                avatar: avatarUrl
            });
        } catch (error) {
            setError('Error fetching user data');
        }
    };

    const getAvatar = () => {
        const deactivateAcc = document.querySelector('#formAccountDeactivation');

        // Update/reset user image of account page
        let accountUserImage = document.getElementById('uploadedAvatar');
        const fileInput = document.querySelector('.account-file-input');
        const resetFileInput = document.querySelector('.account-image-reset');

        if (accountUserImage) {
            const resetImage = accountUserImage.src;

            fileInput.onchange = () => {
                if (fileInput.files[0]) {
                    accountUserImage.src = window.URL.createObjectURL(fileInput.files[0]);
                }
            };
            resetFileInput.onclick = () => {
                fileInput.value = '';
                accountUserImage.src = resetImage;
            };
        }
    }


    const handleChange = (event) => {
        setFormData({ ...formData, [event.target.name]: event.target.value });
    };

    const handleSaveChanges = async () => {
        try {
            const token = localStorage.getItem('token');
            const fileInput = document.getElementById('upload');
            const file = fileInput.files[0];

            const formDataToSend = new FormData();

            if (file) {
                formDataToSend.append('avatar', file); // Đảm bảo file được thêm vào FormData
            }

            // Thêm các trường dữ liệu khác vào FormData, bao gồm cả thông tin người dùng
            formDataToSend.append('username', formData.username);
            formDataToSend.append('email', formData.email);
            formDataToSend.append('firstname', formData.firstname);
            formDataToSend.append('lastname', formData.lastname);
            formDataToSend.append('phone', formData.phone);

            // Gửi yêu cầu POST để upload avatar (nếu có thay đổi avatar)
            const avatarResponse = file ? await apiHandler.post(`/account/upload-avatar`, formDataToSend, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'multipart/form-data'
                }
            }) : null;

            // Gửi yêu cầu PUT để cập nhật thông tin người dùng (bao gồm cả trường hợp không thay đổi avatar)
            const userInfoResponse = await apiHandler.put(`/account/set-info`, formData, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if ((avatarResponse && avatarResponse.status === 200) || (userInfoResponse.status === 200)) {
                if (avatarResponse) {
                    setFormData((prevData) => ({
                        ...prevData,
                        avatar: avatarResponse.data.avatarPath,
                    }));
                }
                // console.log(formData.avatar);
                setShowModal(false);
                onReload();

            }
        } catch (error) {
            setError(error.response ? error.response.data.message : 'Update failed');
        }
    };
    const handleInvalid = (event) => {
        event.preventDefault();
        event.stopPropagation();

        const form = event.currentTarget;

        if (form.checkValidity() === false) {
            setValidated(true);
        } else {
            const allFieldsFilled = Object.values(formData).every(value => value.trim() !== "");

            if (allFieldsFilled) {
                setShowModal(true);
            } else {
                setValidated(true);
            }
        }
    };


    useEffect(() => {
        getInformation();
        getAvatar();
    }, []);

    return (
        <>
            <div className="card mb-4">
                <h5 className="card-header">Profile Details</h5>
                <div className="card-body">
                    <div className="d-flex align-items-start align-items-sm-center gap-4">
                        <img
                            src={formData.avatar}
                            alt="user-avatar"
                            className="d-block rounded"
                            height="100"
                            width="100"
                            aria-label="Account image"
                            id="uploadedAvatar"
                        />
                        <div className="button-wrapper">
                            <label htmlFor="upload" className="btn btn-primary me-3 mb-4" tabIndex="0">
                                <span className="d-none d-sm-block">Upload new photo</span>
                                <i className="bx bx-sm bx-upload d-block d-sm-none"></i>
                                <input
                                    type="file"
                                    name="avatar"
                                    id="upload"
                                    className="account-file-input"
                                    hidden
                                    accept="image/png, image/jpeg"
                                />
                            </label>
                            <button aria-label='Click me' type="button"
                                className="btn btn-outline-secondary account-image-reset mb-4">
                                <i className="bx bx-reset d-block d-sm-none"></i>
                                <span className="d-none d-sm-block">Reset</span>
                            </button>
                            <p className="text-muted mb-0">Allowed JPG or PNG.</p>
                        </div>
                    </div>
                </div>
                <hr className="my-0" />
                <div className="card-body">
                    <Form id="formAccountSettings" noValidate validated={validated} onSubmit={handleInvalid}>
                        <div className="row">
                            <div className="mb-3 col-md-7">
                                <label htmlFor="email" className="form-label">Email Address</label>
                                <div className="input-group">
                                    <span className="input-group-text">
                                        <i className='bx bx-at'></i>
                                    </span>
                                    <input
                                        required
                                        type="email"
                                        name="email"
                                        placeholder="mail@mail.com"
                                        className="form-control"
                                        aria-label="Username"
                                        value={formData.email}
                                        onChange={handleChange} />
                                </div>
                            </div>
                            <div className="mb-3 col-md-5">
                                <label htmlFor="userName" className="form-label">Username</label>
                                <div className="input-group">
                                    <span className="input-group-text">
                                        <i className='bx bx-user'></i>
                                    </span>
                                    <input
                                        required
                                        readOnly
                                        type="text"
                                        name="username"
                                        placeholder="username"
                                        className="form-control"
                                        aria-label="username"
                                        value={formData.username}
                                        onChange={handleChange} />
                                </div>
                            </div>
                            <div className="mb-3 col-md-4">
                                <label htmlFor="firstname" className="form-label">Firstname</label>
                                <div className="input-group">
                                    <input
                                        required
                                        type="text"
                                        name="firstname"
                                        placeholder="firstname"
                                        className="form-control"
                                        aria-label="firstname"
                                        value={formData.firstname}
                                        onChange={handleChange} />
                                </div>
                            </div>
                            <div className="mb-3 col-md-4">
                                <label htmlFor="lastname" className="form-label">Lastname</label>
                                <div className="input-group">
                                    <input
                                        required
                                        type="text"
                                        name="lastname"
                                        placeholder="lastname"
                                        className="form-control"
                                        aria-label="lastname"
                                        value={formData.lastname}
                                        onChange={handleChange} />
                                </div>
                            </div>
                            <div className="mb-3 col-md-4">
                                <label htmlFor="phone" className="form-label">Phone</label>
                                <div className="input-group">
                                    <span className="input-group-text">
                                        <i className='bx bxs-phone'></i>
                                    </span>
                                    <input
                                        required
                                        type="text"
                                        name="phone"
                                        placeholder="phone"
                                        className="form-control"
                                        aria-label="phone"
                                        minLength={10}
                                        maxLength={10}
                                        value={formData.phone}
                                        onChange={handleChange} />
                                </div>
                            </div>
                        </div>
                        <div className="mt-2">
                            <button aria-label='Click me' type="submit" className="btn btn-primary me-3">
                                Save changes
                            </button>
                            <button aria-label='Click me' type="reset"
                                className="btn btn-outline-secondary">Cancel
                            </button>
                        </div>
                    </Form>
                </div>
            </div>
            <div className="card">
                <h5 className="card-header">Action Account</h5>
                <div className="card-body">
                    <div className="mb-3 col-12 mb-0">
                        <div className="alert alert-warning">
                            <h6 className="alert-heading mb-1">Are you sure you want to delete your account?</h6>
                            <p className="mb-0">Once you delete your account, there is no going back. Please be
                                certain.</p>
                        </div>
                    </div>
                    <form id="formAccountDeactivation" onSubmit={() => false}>
                        <div className="form-check mb-3">
                            <input
                                className="form-check-input"
                                type="checkbox"
                                name="accountActivation"
                                id="accountActivation" />
                            <label className="form-check-label" htmlFor="accountActivation">
                                I confirm my account deactivation</label>
                        </div>
                        <button aria-label='Click me'
                            className="btn btn-danger me-3 deactivate-account">Deactivate Account
                        </button>
                        <Button aria-label='Click me'
                            variant="warning"
                            as={Link}
                            to="/auth/change-password"
                            className="btn btn-warning me-3">Change Password
                        </Button>
                    </form>
                </div>
            </div>

            <ConfirmModal
                type="primary"
                show={showModal}
                onHide={() => setShowModal(false)}
                onSave={handleSaveChanges}
            />
        </>
    )
}