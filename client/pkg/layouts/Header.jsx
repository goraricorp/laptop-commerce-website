import React, { Component, useEffect, useState } from "react";
// import ReactDOM from 'react-dom/client';
import { Link, useNavigate } from "react-router-dom";
import { Navbar } from "react-bootstrap";
import axios from "axios";
import { jwtDecode } from "jwt-decode";

import Message from "../components/bar-elements/Message.jsx";
import Basket from "../components/bar-elements/Basket.jsx";
import Notification from "../components/bar-elements/Notification.jsx";
import { ConfirmModal } from "../components/modal/notice/ConfirmModal.jsx";
import apiHandler from "../utils/apiHandler.jsx";

const notifies = [
    { id: 1, title: "Congratulation Lettie 🎉", content: "Won the monthly best seller gold badge", time: "1h ago" },
    { id: 2, title: "CPU is running high", content: "CPU Utilization Percent is currently at 88.63%,", time: "12h" },
    { id: 3, title: "Monthly report is generated", content: "July monthly financial report is generated", time: "1d" },
    { id: 4, title: "Whoo! You have new order 🛒", content: "ACME Inc. made new order $1,154", time: "1 day ago" },
    { id: 5, title: "Application has been approved 🚀", content: "Your ABC project application has been approved.", time: "2 days ago" },
]

const messages = [
    { id: 1, title: "Charles Franklin", content: "Accepted your connection", time: "1h ago" },
    { id: 2, title: "New Message ✉️", content: "You have new message from Natalie", time: "12hr ago" },
    { id: 3, title: "Send connection request", content: "Peter sent you connection request", time: "1h ago" },
    { id: 4, title: "New message from Jane", content: "Your have new message from Jane", time: "1 day ago" },
    { id: 5, title: "Japtor", content: "Your ABC project application has been approved.", time: "2 days ago" },
]

const baskets = [
    { id: 1, name: "Name", description: "Accepted your connection", quantity: 3 },
    { id: 2, name: "Keychron K2 Max", description: "You have new message from Natalie", quantity: 4 },
    { id: 3, name: "MacBook Pro 16' M4 Pro", description: "New Arrived", quantity: 2 },
    { id: 4, name: "DELL Precision 16' 5690", description: "Best Workstation", quantity: 1 },
    { id: 5, name: "Japtor", description: "Your ABC project application has been approved.", quantity: 2 },
]

export default function Header() {
    const [showModalHeader, setShowModalHeader] = useState(false);
    const [submit, setSubmit] = useState({search: ""});

    const navigate = useNavigate();

    const [auth, setAuth] = useState({
        isAuthenticated: false,
        role: null,
    });
    const [loading, setLoading] = useState(true); // Thêm trạng thái loading
    const token = localStorage.getItem("token");

    const authentication = async () => {
        setLoading(true);

        if (!token) {
            setAuth({ isAuthenticated: false, role: null });
            setLoading(false);
            return;
        }

        try {
            const decoded = jwtDecode(token);

            const currentTime = Date.now() / 1000; // thời gian hiện tại (tính bằng giây)
            if (decoded.exp < currentTime) {
                throw new Error('Token expired');
            }

            setAuth({
                isAuthenticated: true,
                role: decoded.role,
            });
        } catch (error) {
            setAuth({ isAuthenticated: false, role: null });
            localStorage.removeItem('token');
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = async () => {
        if (token) {
            try {
                await apiHandler.post(
                    "/authentication/logout",
                    {},
                    {
                        headers: { Authorization: `Bearer ${token}` },
                    }
                );

                localStorage.removeItem("token"); // Xóa JWT
                // setShowModal(false);
                navigate("/auth/login");
            } catch (error) {
                // console.error("Logout failed", error);
            }
        } else {
            navigate("/auth/login");
        }
    };

    const handleSearch = (event) => {
        try {
            event.preventDefault();
            navigate(`/search?search=${submit.search}`);
            setTimeout(() => {
                window.location.reload();
            }, 50);
            // console.log("tìm kiếm thành công");
        } catch (error) {
            // console.log("tìm kiếm ko thành công", error);
        }
    };

    const handleChange = (event) => {
        setSubmit({...submit, [event.target.name]: event.target.value});
    };

    useEffect(() => {

    }, []);

    return (
        <>
            <nav
                className="light bg-body-tertiary layout-navbar container-xxl navbar navbar-expand-xl navbar-detached align-items-center bg-navbar-theme mb-4">

                <ul className="navbar-nav flex-row align-items-center ms-auto">

                    <Overside/>

                    <li className="nav-item navbar-search-wrapper me-2 me-xl-0">
                        <a className="nav-link search-toggler" href="#">
                            <i className="bx bx-search bx-sm"></i>
                        </a>
                    </li>
                    <li className="nav-item dropdown-style-switcher dropdown me-2 me-xl-0">
                        <a
                            className="nav-link dropdown-toggle hide-arrow"
                            href="#"
                            data-bs-toggle="dropdown"
                        >
                            <i className="bx bx-globe bx-sm"></i>
                        </a>
                        <ul className="dropdown-menu dropdown-menu-end">
                            <li>
                                <Link
                                    className="dropdown-item active"
                                    to="#"
                                    data-language="en"
                                    data-text-direction="ltr"
                                >
                                    <span>English</span>
                                </Link>
                            </li>
                            <li>
                                <Link
                                    className="dropdown-item"
                                    to="#"
                                    data-language="fr"
                                    data-text-direction="ltr"
                                >
                                    <span>French</span>
                                </Link>
                            </li>
                            <li>
                                <Link
                                    className="dropdown-item"
                                    to="#"
                                    data-language="ar"
                                    data-text-direction="rtl"
                                >
                                    <span>Arabic</span>
                                </Link>
                            </li>
                            <li>
                                <Link
                                    className="dropdown-item"
                                    to="#"
                                    data-language="de"
                                    data-text-direction="ltr"
                                >
                                    <span>German</span>
                                </Link>
                            </li>
                        </ul>
                    </li>
                    <li className="nav-item dropdown-style-switcher dropdown me-2 me-xl-0">
                        <a className="nav-link dropdown-toggle hide-arrow" href="#" data-bs-toggle="dropdown">
                            <i className="bx bx-sun bx-sm"></i>
                        </a>
                        <ul className="dropdown-menu dropdown-menu-end dropdown-styles">
                            <li>
                                <Link className="dropdown-item" to="#" data-theme="light">
                                    <span className="align-middle"><i className="bx bx-sun bx-sm me-2"></i>Light</span>
                                </Link>
                            </li>
                            <li>
                                <Link className="dropdown-item" to="#" data-theme="dark">
                                    <span className="align-middle"><i className="bx bx-moon bx-sm me-2"></i>Dark</span>
                                </Link>
                            </li>
                            <li>
                                <Link className="dropdown-item" to="#" data-theme="system">
                                    <span className="align-middle"><i
                                        className="bx bx-desktop bx-sm me-2"></i>System</span>
                                </Link>
                            </li>
                        </ul>
                    </li>
                    <li className="nav-item dropdown-shortcuts navbar-dropdown dropdown me-2 me-xl-0">
                        <a className="nav-link dropdown-toggle hide-arrow" href="#" data-bs-toggle="dropdown"
                           data-bs-auto-close="outside"
                           aria-expanded="false">
                            <i className="bx bx-grid-alt bx-sm"></i>
                        </a>
                        <div className="dropdown-menu dropdown-menu-end p-0" style={{width: 352}}>
                            <div className="dropdown-menu-header border-bottom">
                                <div className="dropdown-header d-flex align-items-center py-3">
                                    <h6 className="mb-0 me-auto">Shortcuts</h6>
                                    <a href="#" className="dropdown-shortcuts-add py-2" data-bs-toggle="tooltip"
                                       data-bs-placement="top"
                                       aria-label="Add shortcuts" data-bs-original-title="Add shortcuts">
                                        <i className="bx bx-plus-circle text-heading"></i>
                                    </a>
                                </div>
                            </div>
                            <div className="dropdown-shortcuts-list scrollable-container ps">
                                <div className="row row-bordered overflow-visible g-0">
                                    <div className="dropdown-shortcuts-item col">
                                        <span className="dropdown-shortcuts-icon rounded-circle mb-3">
                                            <i className="bx bx-calendar bx-26px text-heading"></i>
                                        </span>
                                        <a href="#" className="stretched-link"> Calendar </a>
                                        <small>Appointments</small>
                                    </div>
                                    <div className="dropdown-shortcuts-item col">
                                        <span className="dropdown-shortcuts-icon rounded-circle mb-3">
                                            <i className="bx bx-food-menu bx-26px text-heading"></i>
                                        </span>
                                        <a href="#" className="stretched-link"> Invoice App </a>
                                        <small>Manage Accounts</small>
                                    </div>
                                </div>
                                <div className="row row-bordered overflow-visible g-0">
                                    <div className="dropdown-shortcuts-item col">
                                        <span className="dropdown-shortcuts-icon rounded-circle mb-3">
                                            <i className="bx bx-user bx-26px text-heading"></i>
                                        </span>
                                        <a href="#" className="stretched-link"> User App </a>
                                        <small>Manage Users</small>
                                    </div>
                                    <div className="dropdown-shortcuts-item col">
                                        <span className="dropdown-shortcuts-icon rounded-circle mb-3">
                                            <i className="bx bx-check-shield bx-26px text-heading"></i>
                                        </span>
                                        <a href="#" className="stretched-link"> Role Management </a>
                                        <small>Permission</small>
                                    </div>
                                </div>
                                <div className="row row-bordered overflow-visible g-0">
                                    <div className="dropdown-shortcuts-item col">
                                        <span className="dropdown-shortcuts-icon rounded-circle mb-3">
                                            <i className="bx bx-pie-chart-alt-2 bx-26px text-heading"></i>
                                        </span>
                                        <a href="#" className="stretched-link"> Dashboard </a>
                                        <small>User Dashboard</small>
                                    </div>
                                    <div className="dropdown-shortcuts-item col">
                                        <span className="dropdown-shortcuts-icon rounded-circle mb-3">
                                            <i className="bx bx-cog bx-26px text-heading"></i>
                                        </span>
                                        <a href="#" className="stretched-link"> Setting </a>
                                        <small>Account Settings</small>
                                    </div>
                                </div>
                                <div className="row row-bordered overflow-visible g-0">
                                    <div className="dropdown-shortcuts-item col">
                                        <span className="dropdown-shortcuts-icon rounded-circle mb-3">
                                            <i className="bx bx-help-circle bx-26px text-heading"></i>
                                        </span>
                                        <a href="#" className="stretched-link"> FAQs </a>
                                        <small>FAQs &amp; Articles</small>
                                    </div>
                                    <div className="dropdown-shortcuts-item col">
                                        <span className="dropdown-shortcuts-icon rounded-circle mb-3">
                                            <i className="bx bx-window-open bx-26px text-heading"></i>
                                        </span>
                                        <a href="#" className="stretched-link"> Modals </a>
                                        <small>Useful Popups</small>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </li>
                    <li className="nav-item dropdown-shortcuts navbar-dropdown dropdown me-2 me-xl-0">
                        <a className="nav-link dropdown-toggle hide-arrow" href="#" data-bs-toggle="dropdown"
                           data-bs-auto-close="outside"
                           aria-expanded="false">
                            <span className="position-relative">
                                <i className="bx bx-bell bx-sm"></i>
                                <span
                                    className="badge rounded-pill bg-danger badge-dot badge-notifications border"></span>
                            </span>
                        </a>
                        <ul className="dropdown-menu dropdown-menu-end p-0" style={{width: 352}}>
                            <li className="dropdown-menu-header border-bottom">
                                <div className="dropdown-header d-flex align-items-center py-3">
                                    <h6 className="mb-0 me-auto">Notification</h6>
                                    <div className="d-flex align-items-center h6 mb-0">
                                        <span className="badge bg-label-primary me-2">10 New</span>
                                        <a href="#" className="dropdown-notifications-all p-2" data-bs-toggle="tooltip"
                                           data-bs-placement="top" aria-label="Mark all as read"
                                           data-bs-original-title="Mark all as read">
                                            <i className="bx bx-envelope-open text-heading"></i>
                                        </a>
                                    </div>
                                </div>
                            </li>
                            <li className="dropdown-notifications-list scrollable-container ps">
                                <ul className="list-group list-group-flush">
                                    {
                                        notifies.map((noty, index) => (
                                            <Notification key={index} notify={noty}/>
                                        ))
                                    }
                                    {
                                        messages.map((mess, index) => (
                                            <Message key={index} message={mess}/>
                                        ))
                                    }
                                </ul>
                            </li>
                            <li className="border-top">
                                <div className="d-grid p-4">
                                    <a className="btn btn-primary d-flex" href="#">
                                        <small className="align-middle"> View all notifications </small>
                                    </a>
                                </div>
                            </li>
                        </ul>
                    </li>
                    <li className="nav-item dropdown-shortcuts navbar-dropdown dropdown me-2 me-xl-0">
                        <a className="nav-link dropdown-toggle hide-arrow" href="#" data-bs-toggle="dropdown"
                           data-bs-auto-close="outside"
                           aria-expanded="false">
                            <span className="position-relative">
                                <i className="bx bx-cart bx-sm"></i>
                                <span
                                    className="badge rounded-pill bg-danger badge-dot badge-notifications border"></span>
                            </span>
                        </a>
                        <ul className="dropdown-menu dropdown-menu-end p-0" style={{width: 352}}>
                            <li className="dropdown-menu-header border-bottom">
                                <div className="dropdown-header d-flex align-items-center py-3">
                                    <h6 className="mb-0 me-auto">Cart</h6>
                                    <div className="d-flex align-items-center h6 mb-0">
                                        <span className="badge bg-label-primary me-2">8 Items</span>
                                        <a href="#" className="dropdown-notifications-all p-2" data-bs-toggle="tooltip"
                                           data-bs-placement="top" aria-label="Find product"
                                           data-bs-original-title="Find product">
                                            <i className="bx bx-cart-download bx-sm text-heading"></i>
                                        </a>
                                    </div>
                                </div>
                            </li>
                            <li className="dropdown-notifications-list scrollable-container ps">
                                <ul className="list-group list-group-flush">
                                    {
                                        baskets.map((bask, index) => (
                                            <Basket key={index} bask={bask}/>
                                        ))
                                    }
                                </ul>
                            </li>
                            <li className="border-top">
                                <div className="d-grid p-4">
                                    <Link className="btn btn-primary d-flex" to={"/user/cart"}>
                                        <small className="align-middle"> View full cart </small>
                                    </Link>
                                </div>
                            </li>
                        </ul>
                    </li>
                    <li className="nav-item navbar-dropdown dropdown-user dropdown me-2 me-xl-0">
                        <a
                            aria-label="dropdown profile avatar"
                            className="nav-link dropdown-toggle hide-arrow"
                            href="#"
                            data-bs-toggle="dropdown"
                        >
                            <div className="avatar avatar-online">
                                <img
                                    src="../assets/img/avatars/1.png"
                                    className="w-px-40 h-auto rounded-circle"
                                    alt="avatar"
                                    aria-label="Avatar Image"
                                />
                            </div>
                        </a>
                        <ul className="dropdown-menu dropdown-menu-end">
                            <li>
                                <a
                                    aria-label="go to profile"
                                    className="dropdown-item"
                                    href="#"
                                >
                                    <div className="d-flex">
                                        <div className="flex-shrink-0 me-3">
                                            <div className="avatar avatar-online">
                                                <img
                                                    src="../assets/img/avatars/1.png"
                                                    className="w-px-40 h-auto rounded-circle"
                                                    alt="avatar"
                                                    aria-label="Avatar Image"
                                                />
                                            </div>
                                        </div>
                                        <div className="flex-grow-1">
                                            <span className="fw-medium d-block">Schweitzenburg</span>
                                            <small className="text-muted">Administrator</small>
                                        </div>
                                    </div>
                                </a>
                            </li>
                            <li>
                                <div className="dropdown-divider"></div>
                            </li>
                            <li>
                                <Link
                                    to={"/user/profile"}
                                    aria-label="go to profile"
                                    className="dropdown-item"
                                >
                                    <span className="align-middle"><i
                                        className="bx bx-user bx-sm me-2"></i>Profile</span>
                                </Link>
                            </li>
                            <li>
                                <Link
                                    to={"/user/address"}
                                    aria-label="address"
                                    className="dropdown-item"
                                >
                                    <span className="align-middle"><i
                                        className="bx bx-location-plus bx-sm me-2"></i>Address</span>
                                </Link>
                            </li>
                            <li>
                                <Link
                                    to={"/user/order"}
                                    aria-label="bill"
                                    className="dropdown-item"
                                >
                                    <span className="align-middle"><i
                                        className="bx bx-receipt bx-sm me-2"></i>Bill</span>
                                </Link>
                            </li>
                            <li>
                                <div className="dropdown-divider"></div>
                            </li>
                            <li>
                                <Link
                                    to={"/faq"}
                                    aria-label="faq"
                                    className="dropdown-item"
                                >
                                    <span className="align-middle"><i
                                        className="bx bx-help-circle bx-sm me-2"></i>FAQ</span>
                                </Link>
                            </li>
                            <li>
                                <div className="dropdown-divider"></div>
                            </li>
                            <li>
                                <Link
                                    onClick={() => setShowModalHeader(true)}
                                    variant="light"
                                    aria-label="click to log out"
                                    className="dropdown-item"
                                    to={"#"}
                                >
                                    <span className="align-middle"><i className="bx bx-power-off bx-sm me-2"></i>Log Out</span>
                                </Link>
                            </li>
                        </ul>
                    </li>
                </ul>
                <div className="navbar-search-wrapper search-input-wrapper container-xxl d-none">
                    <span className="twitter-typeahead container-xxl">
                        <input type="text" className="form-control search-input border-0 container-xxl tt-input"
                               placeholder="Search..."
                               aria-label="Search..." autoComplete="off" spellCheck="false" dir="auto"/>
                        <div className="tt-menu navbar-search-suggestion ps">
                            <div className="tt-dataset tt-dataset-pages"></div>
                            <div className="tt-dataset tt-dataset-files"></div>
                            <div className="tt-dataset tt-dataset-members"></div>
                        </div>
                    </span>
                    <i className="bx bx-x bx-md search-toggler cursor-pointer"></i>
                </div>
            </nav>
            <ConfirmModal
                show={showModalHeader}
                onHide={() => setShowModalHeader(false)}
                onSave={handleLogout}
                title="Log out"
                message="Do you want to log out?"
                button="Log out"
                type="primary"
            />
        </>
    );
};
