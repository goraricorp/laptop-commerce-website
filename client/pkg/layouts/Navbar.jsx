import React, { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button, ButtonToolbar, Form, Nav } from "react-bootstrap";
import axios from "axios";
import { jwtDecode } from "jwt-decode";

import getGreetingMessage from '../utils/greetingHandler.jsx';
import Notification from "../components/bar-elements/Notification.jsx";
import Message from "../components/bar-elements/Message.jsx";
import Basket from "../components/bar-elements/Basket.jsx";
import { ConfirmModal } from "../components/modal/notice/ConfirmModal.jsx";
import apiHandler from "../utils/apiHandler.jsx";
import usePerfectScrollbar from "../hooks/usePerfectScrollbar.jsx";

export default function Navbar({ children }) {
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

    useEffect(() => {
        Main();

        useLoad();
    },[])

    usePerfectScrollbar("#navbar-notification");

    const [account, setAccount] = useState({});
    const [showModal, setShowModal] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();

    const token = localStorage.getItem("token");

    const useLoad = async () => {
        if (token) {
            try {
                // const decoded = jwtDecode(token);

                const response = await apiHandler.get('/account/get-info', {
                    headers: {Authorization: `Bearer ${token}`}
                });

                setAccount(response.data);
                // console.log(response.data);
            } catch (error) {
                console.error("Invalid token:", error);
            }
        } else {
            // navigate("/auth/login");
        }
    }

    const handleLogout = async () => {
        if (token) {
            try {
                await apiHandler.post("/authentication/logout", {}, {
                    headers: { Authorization: `Bearer ${token}` },
                });

                localStorage.removeItem("token"); // Xóa JWT
                setShowModal(false);
                navigate("/auth/login");
            } catch (error) {
                // console.error("Logout failed", error);
            }
        } else {
            navigate("/auth/login");
        }
    };

    return (
        <>
            <nav
                className="light bg-body-tertiary layout-navbar container-xxl navbar navbar-expand-xl navbar-detached align-items-center bg-navbar-theme"
                id="navbar-collapse">
                {/*<div className="d-flex align-items-xl-center">*/}
                {/*    <ul className="navbar-nav flex-row align-items-center ms-auto">*/}
                {/*    </ul>*/}
                {/*    <button className="navbar-toggler" type="button" data-bs-toggle="collapse"*/}
                {/*            data-bs-target="#navbarNav" aria-controls="navbarNav" aria-expanded="false"*/}
                {/*            aria-label="Toggle navigation">*/}
                {/*        <span className="navbar-toggler-icon"></span>*/}
                {/*    </button>*/}
                {/*</div>*/}

                <div className="layout-menu-toggle navbar-nav align-items-xl-center me-3 me-xl-0 d-xl-none">
                    <a aria-label='toggle for sidebar' className="nav-item nav-link px-0 me-xl-4" href="#">
                        <i className="bx bx-menu bx-sm"></i>
                    </a>
                </div>

                <div className="navbar-nav-right d-flex align-items-center" id="navbar-collapse">

                    {children}

                    <ul className="navbar-nav flex-row align-items-center ms-auto">
                        {/*<li className="nav-item navbar-search-wrapper me-3 me-xl-2">*/}
                        {/*    <a className="nav-link search-toggler" href="#">*/}
                        {/*        <i className="bx bx-search bx-sm"></i>*/}
                        {/*    </a>*/}
                        {/*</li>*/}
                        <Form className="d-flex"> {/* onSubmit={handleSearch} */}
                            <input
                                className="form-control search-input container-xxl border-0 tt-input me-2"
                                placeholder="Search..."
                                aria-label="Search..."
                                autoComplete="off"
                                spellCheck="false"
                                type="search"
                                dir="auto"
                                name="search"
                                // value={submit.search}
                                // onChange={handleChange}
                            />
                            <li className="nav-item navbar-search-wrapper me-3 me-xl-2">
                                <Button as={Link} to={'/search'} className="nav-link search-toggler" variant="link">
                                    <i className="bx bx-search bx-sm"></i>
                                </Button>
                            </li>
                        </Form>
                        <li className="nav-item dropdown-style-switcher dropdown me-3 me-xl-2">
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
                        <li className="nav-item dropdown-style-switcher dropdown me-3 me-xl-2">
                            <a className="nav-link dropdown-toggle hide-arrow" href="#" data-bs-toggle="dropdown">
                                <i className="bx bx-sun bx-sm"></i>
                            </a>
                            <ul className="dropdown-menu dropdown-menu-end dropdown-styles">
                                <li>
                                    <Link className="dropdown-item" to="#" data-theme="light">
                                        <span className="align-middle"><i
                                            className="bx bx-sun bx-sm me-2"></i>Light</span>
                                    </Link>
                                </li>
                                <li>
                                    <Link className="dropdown-item" to="#" data-theme="dark">
                                        <span className="align-middle"><i
                                            className="bx bx-moon bx-sm me-2"></i>Dark</span>
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
                        <li className="nav-item dropdown-shortcuts navbar-dropdown dropdown me-3 me-xl-2">
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
                                            <a href="#" className="dropdown-notifications-all p-2"
                                               data-bs-toggle="tooltip"
                                               data-bs-placement="top" aria-label="Mark all as read"
                                               data-bs-original-title="Mark all as read">
                                                <i className="bx bx-envelope-open bx-sm text-heading"></i>
                                            </a>
                                        </div>
                                    </div>
                                </li>
                                <li className="dropdown-notifications-list scrollable-container ps">
                                    <ul
                                        className="list-group list-group-flush"
                                        id="#navbar-notification"
                                        style={{height: "50vh"}}
                                    >
                                        {notifies.map((noty, index) => (
                                            <Notification key={index} notify={noty}/>
                                        ))}
                                        {messages.map((mess, index) => (
                                            <Message key={index} message={mess}/>
                                        ))}
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
                        <li className="nav-item dropdown-shortcuts navbar-dropdown dropdown me-3 me-xl-2">
                            <a className="nav-link dropdown-toggle hide-arrow" href="/admin" data-bs-toggle="dropdown"
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
                                            <i className="bx bx-plus-circle bx-sm text-heading"></i>
                                        </a>
                                    </div>
                                </div>
                                <div className="dropdown-shortcuts-list scrollable-container ps">
                                    <div className="row row-bordered overflow-visible g-0">
                                        <div className="dropdown-shortcuts-item col p-4">
                                            <div className="d-flex justify-content-center align-items-center user-name">
                                                <div className="avatar-wrapper mb-3">
                                                    <div className="avatar avatar-md">
                                                        <span
                                                            className="avatar-initial rounded-circle bg-label-secondary">
                                                            <i className="bx bx-calendar bx-sm text-heading"></i>
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                            {/*<span className="dropdown-shortcuts-icon rounded-circle mb-3">*/}
                                            {/*    <i className="bx bx-calendar bx-26px text-heading"></i>*/}
                                            {/*</span>*/}
                                            <span className="d-block text-center fw-semibold text-body"> Calendar </span>
                                            <small className="d-block text-center">Appointments</small>
                                        </div>
                                        <div className="dropdown-shortcuts-item col p-4">
                                            <div className="d-flex justify-content-center align-items-center user-name">
                                                <div className="avatar-wrapper mb-3">
                                                    <div className="avatar avatar-md">
                                                        <span
                                                            className="avatar-initial rounded-circle bg-label-secondary">
                                                            <i className="bx bx-food-menu bx-sm text-heading"></i>
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                            <span className="d-block text-center fw-semibold text-body"> Invoice App </span>
                                            <small className="d-block text-center">Manage Accounts</small>
                                        </div>
                                    </div>
                                    <div className="row row-bordered overflow-visible g-0">
                                        <div className="dropdown-shortcuts-item col p-4">
                                            <div className="d-flex justify-content-center align-items-center user-name">
                                                <div className="avatar-wrapper mb-3">
                                                    <div className="avatar avatar-md">
                                                        <span
                                                            className="avatar-initial rounded-circle bg-label-secondary">
                                                            <i className="bx bx-user bx-sm text-heading"></i>
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                            <span className="d-block text-center fw-semibold text-body"> User App </span>
                                            <small className="d-block text-center">Manage Users</small>
                                        </div>
                                        <div className="dropdown-shortcuts-item col p-4">
                                            <div className="d-flex justify-content-center align-items-center user-name">
                                                <div className="avatar-wrapper mb-3">
                                                    <div className="avatar avatar-md">
                                                        <span
                                                            className="avatar-initial rounded-circle bg-label-secondary">
                                                            <i className="bx bx-check-shield bx-sm text-heading"></i>
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                            <span className="d-block text-center fw-semibold text-body"> Role Based </span>
                                            <small className="d-block text-center">Permission</small>
                                        </div>
                                    </div>
                                    <div className="row row-bordered overflow-visible g-0">
                                        <div className="dropdown-shortcuts-item col p-4">
                                            <div className="d-flex justify-content-center align-items-center user-name">
                                                <div className="avatar-wrapper mb-3">
                                                    <div className="avatar avatar-md">
                                                        <span
                                                            className="avatar-initial rounded-circle bg-label-secondary">
                                                            <i className="bx bx-pie-chart-alt-2 bx-sm text-heading"></i>
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                            <span
                                                className="d-block text-center fw-semibold text-body"> Dashboard </span>
                                            <small className="d-block text-center">Statistics</small>
                                        </div>
                                        <div className="dropdown-shortcuts-item col p-4">
                                            <div className="d-flex justify-content-center align-items-center user-name">
                                                <div className="avatar-wrapper mb-3">
                                                    <div className="avatar avatar-md">
                                                        <span
                                                            className="avatar-initial rounded-circle bg-label-secondary">
                                                            <i className="bx bx-cog bx-sm text-heading"></i>
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                            <span
                                                className="d-block text-center fw-semibold text-body"> Setting </span>
                                            <small className="d-block text-center">Account Settings</small>
                                        </div>
                                    </div>
                                    <div className="row row-bordered overflow-visible g-0">
                                        <div className="dropdown-shortcuts-item col p-4">
                                            <div className="d-flex justify-content-center align-items-center user-name">
                                                <div className="avatar-wrapper mb-3">
                                                    <div className="avatar avatar-md">
                                                        <span
                                                            className="avatar-initial rounded-circle bg-label-secondary">
                                                            <i className="bx bx-help-circle bx-sm text-heading"></i>
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                            <span
                                                className="d-block text-center fw-semibold text-body"> FAQs </span>
                                            <small className="d-block text-center">FAQs &amp; Articles</small>
                                        </div>
                                        <div className="dropdown-shortcuts-item col p-4">
                                            <div className="d-flex justify-content-center align-items-center user-name">
                                                <div className="avatar-wrapper mb-3">
                                                    <div className="avatar avatar-md">
                                                        <span
                                                            className="avatar-initial rounded-circle bg-label-secondary">
                                                            <i className="bx bx-window-open bx-sm text-heading"></i>
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                            <span
                                                className="d-block text-center fw-semibold text-body"> Modals </span>
                                            <small className="d-block text-center">Useful Popups</small>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </li>
                        <li className="nav-item navbar-search-wrapper me-3 me-xl-2">
                            <Link className="nav-link search-toggler" to="/">
                                <i className="bx bx-home bx-sm"></i>
                            </Link>
                        </li>
                        <li className="nav-item navbar-dropdown dropdown-user dropdown me-3 me-xl-2">
                            <a
                                aria-label="dropdown profile avatar"
                                className="nav-link dropdown-toggle hide-arrow"
                                href="#"
                                data-bs-toggle="dropdown"
                            >
                                <div className="avatar avatar-online">
                                    <img
                                        src={account.avatar}
                                        className="w-px-40 h-auto rounded-circle"
                                        alt="avatar"
                                        aria-label="Avatar Image"
                                    />
                                </div>
                            </a>
                            <ul className="dropdown-menu dropdown-menu-end">
                                <li>
                                    <Link
                                        aria-label="go to profile"
                                        className="dropdown-item"
                                        to={"/admin"}
                                    >
                                        <div className="d-flex">
                                            <div className="flex-shrink-0 me-3">
                                                <div className="avatar avatar-online">
                                                    <img
                                                        src={account.avatar}
                                                        className="w-px-40 h-auto rounded-circle"
                                                        alt="avatar"
                                                        aria-label="Avatar Image"
                                                    />
                                                </div>
                                            </div>
                                            <div className="flex-grow-1">
                                                <span
                                                    className="fw-medium d-block">{`${account.lastname}`}</span>{/*${account.firstname}*/}
                                                <small className="text-muted">Administrator</small>
                                            </div>
                                        </div>
                                    </Link>
                                </li>
                                <li>
                                    <div className="dropdown-divider"></div>
                                </li>
                                {/*<li>*/}
                                {/*    <Link*/}
                                {/*        to={"/admin"}*/}
                                {/*        aria-label="dashboard"*/}
                                {/*        className="dropdown-item"*/}
                                {/*    >*/}
                                {/*        <span className="align-middle"><i*/}
                                {/*            className="bx bxs-dashboard bx-sm me-2"></i>Dashboard</span>*/}
                                {/*    </Link>*/}
                                {/*</li>*/}
                                <li>
                                    <Link
                                        to={"/admin/profile"}
                                        aria-label="go to profile"
                                        className="dropdown-item"
                                    >
                                    <span className="align-middle"><i
                                        className="bx bx-user bx-sm me-2"></i>Profile</span>
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
                                        onClick={() => setShowModal(true)}
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
                </div>
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
                show={showModal}
                onHide={() => setShowModal(false)}
                onSave={handleLogout}
                title="Log out"
                message="Do you want to log out?"
                button="Log out"
                type="primary"
            />
        </>
    );
}