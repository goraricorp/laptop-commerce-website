import React, {useEffect, useState} from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button, Form, Nav, Navbar } from "react-bootstrap";
import axios from "axios";
import getGreetingMessage from "../utils/greetingHandler.jsx";

import Notification from "../components/bar-elements/Notification.jsx";
import Message from "../components/bar-elements/Message.jsx";
import Basket from "../components/bar-elements/Basket.jsx";
import Overside from "./Overside.jsx";
import apiHandler from "../utils/apiHandler.jsx";

export default function Outbar({ children }) {
    useEffect(() => {
        Main();
    },[])

    const [showModalHeader, setShowModalHeader] = useState(false);
    const [submit, setSubmit] = useState({search: ""});

    const navigate = useNavigate();

    const [auth, setAuth] = useState({
        isAuthenticated: false,
        role: null,
    });
    const [loading, setLoading] = useState(true); // Thêm trạng thái loading
    const token = localStorage.getItem("token");

    const authenticationCheck = async () => {
        const token = localStorage.getItem("token");
        if (!token) {
            setLoading(false);
            return;
        }

        try {
            const response = await apiHandler.get(
                "/authentication/check",
                {
                    headers: {Authorization: `Bearer ${token}`},
                }
            );
            setAuth({
                isAuthenticated: true,
                role: response.data.role,
            });
        } catch (error) {
            setAuth({
                isAuthenticated: false,
                role: null,
            });
            localStorage.removeItem("token");
            navigate("/auth/error");
        } finally {
            setLoading(false); // Dừng loading sau khi fetch
        }
    };

    const handleLogout = async () => {
        const token = localStorage.getItem("token");
        try {
            await apiHandler.post(
                "/authentication/logout",
                {},
                {
                    headers: {Authorization: `Bearer ${token}`},
                }
            );
            localStorage.removeItem("token"); // Xóa JWT
            setShowModalHeader(false);
            navigate("/auth/login");
        } catch (error) {
            console.error("Logout failed", error);
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
        authenticationCheck();
    }, []);

    return (
        <>
            <nav
                className="light bg-body-tertiary layout-navbar container-xxl navbar navbar-expand-xl navbar-detached align-items-center bg-navbar-theme mb-4">
                <div className="layout-menu-toggle navbar-nav align-items-xl-center me-3 me-xl-0 d-xl-none">
                    <a aria-label='toggle for sidebar' className="nav-item nav-link px-0 me-xl-4" href="#">
                        <i className="bx bx-menu bx-sm"></i>
                    </a>
                </div>

                {/*<Overside/>*/}
                {children}

                <div className="navbar-nav-right d-flex align-items-center" id="navbar-collapse">
                    <ul className="navbar-nav flex-row align-items-center ms-auto">
                        {/*<div className="navbar-nav align-items-center">*/}
                        {/*    <div className="nav-item navbar-search-wrapper mb-0">*/}
                        {/*        <a className="nav-item nav-link search-toggler px-0" href="#">*/}
                        {/*            /!*<i className="bx bx-search bx-md"></i>*!/*/}
                        {/*            <span*/}
                        {/*                className="d-none d-md-inline-block text-muted fw-normal ms-4">Search (Ctrl+/)</span>*/}
                        {/*        </a>*/}
                        {/*    </div>*/}
                        {/*</div>*/}

                        {/*{getGreetingMessage('from Bill')}*/}

                        <Form className="d-flex" onSubmit={handleSearch}>
                            <input
                                className="form-control search-input container-xxl border-0 tt-input me-2"
                                placeholder="Search..."
                                aria-label="Search..."
                                autoComplete="off"
                                spellCheck="false"
                                type="search"
                                dir="auto"
                                name="search"
                                value={submit.search}
                                onChange={handleChange}
                            />
                            {/*<Form.Control*/}
                            {/*    type="search"*/}
                            {/*    placeholder="Search"*/}
                            {/*    className="me-2"*/}
                            {/*    aria-label="Search"*/}
                            {/*    name="search"*/}
                            {/*    value={submit.search}*/}
                            {/*    onChange={handleChange}*/}
                            {/*/>*/}
                            {/*<Button as={Link} to={'/search'} variant="outline-primary">*/}
                            {/*    <i className="bx bx-search"></i>*/}
                            {/*</Button>*/}
                            <li className="nav-item navbar-search-wrapper me-3 me-xl-2">
                                <Button as={Link} to={'/search'} className="nav-link search-toggler" variant="link">
                                    <i className="bx bx-search bx-sm"></i>
                                </Button>
                            </li>
                        </Form>
                        {/*<li className="nav-item navbar-search-wrapper me-3 me-xl-2">*/}
                        {/*    <a className="nav-link search-toggler" href="#">*/}
                        {/*        <i className="bx bx-search bx-sm"></i>*/}
                        {/*    </a>*/}
                        {/*</li>*/}
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
                                        data-language="sp"
                                        data-text-direction="ltr"
                                    >
                                        <span>Spanish</span>
                                    </Link>
                                </li>
                                <li>
                                    <Link
                                        className="dropdown-item"
                                        to="#"
                                        data-language="it"
                                        data-text-direction="ltr"
                                    >
                                        <span>Italian</span>
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
                                        data-language="vi"
                                        data-text-direction="rtl"
                                    >
                                        <span>Vietnamese</span>
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
                                            {/*<span className="badge bg-label-primary me-2">8 New</span>*/}
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
                                    <ul className="list-group list-group-flush">

                                    </ul>
                                </li>
                                <li className="border-top">
                                    <div className="d-grid p-4">
                                        <a className="btn btn-primary d-flex" href="#">
                                            <small className="align-middle"> You do not have notifications </small>
                                        </a>
                                    </div>
                                </li>
                            </ul>
                        </li>
                        <li className="nav-item dropdown-shortcuts navbar-dropdown dropdown me-3 me-xl-2">
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
                                            {/*<span className="badge bg-label-primary me-2">8 Items</span>*/}
                                            <Link to="/search" className="dropdown-notifications-all p-2"
                                                  data-bs-toggle="tooltip"
                                                  data-bs-placement="top" aria-label="Find product"
                                                  data-bs-original-title="Find product">
                                                <i className="bx bx-cart-download bx-sm text-heading"></i>
                                            </Link>
                                        </div>
                                    </div>
                                </li>
                                <li className="dropdown-notifications-list scrollable-container ps">
                                    <ul className="list-group list-group-flush">

                                    </ul>
                                </li>
                                <li className="border-top">
                                    <div className="d-grid p-4">
                                        <Link className="btn btn-primary d-flex" to={"/user/cart"}>
                                            <small className="align-middle"> Nothing in here now! </small>
                                        </Link>
                                    </div>
                                </li>
                            </ul>
                        </li>
                        <li className="nav-item navbar-dropdown dropdown-user dropdown me-3 me-xl-2">
                            <a
                                aria-label="dropdown profile avatar"
                                className="nav-link dropdown-toggle hide-arrow"
                                href="#"
                                data-bs-toggle="dropdown"
                            >
                                {/*<div className="avatar avatar-online">*/}
                                {/*    <img*/}
                                {/*        src="../assets/img/avatars/1.png"*/}
                                {/*        className="w-px-40 h-auto rounded-circle"*/}
                                {/*        alt="avatar"*/}
                                {/*        aria-label="Avatar Image"*/}
                                {/*    />*/}
                                {/*</div>*/}
                                <span className="position-relative">
                                <i className="bx bx-user bx-sm"></i>
                                <span
                                    className="badge rounded-pill bg-danger badge-dot badge-notifications border"></span>
                            </span>
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
                                                <div className="avatar">
                                                <span className="avatar-initial rounded-circle bg-label-primary">
                                                    JG
                                                </span>
                                                </div>
                                            </div>
                                            <div className="flex-grow-1">
                                                <span className="fw-medium d-block">Unknown</span>
                                                <small className="text-muted">Anonymous</small>
                                            </div>
                                        </div>
                                    </a>
                                </li>
                                <li>
                                    <div className="dropdown-divider"></div>
                                </li>
                                <li>
                                    <Link
                                        to={"/auth/login"}
                                        aria-label="go to profile"
                                        className="dropdown-item"
                                    >
                                    <span className="align-middle"><i
                                        className="bx bx-log-in bx-sm me-2"></i>Login</span>
                                    </Link>
                                </li>
                                <li>
                                    <Link
                                        to={"/auth/register"}
                                        aria-label="address"
                                        className="dropdown-item"
                                    >
                                    <span className="align-middle"><i
                                        className="bx bx-door-open bx-sm me-2"></i>Register</span>
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
                            </ul>
                        </li>
                    </ul>
                </div>

                {/*<div className="navbar-search-wrapper search-input-wrapper container-xxl d-none">*/}
                {/*    <span className="twitter-typeahead container-xxl">*/}
                {/*        <input type="text" className="form-control search-input border-0 container-xxl tt-input"*/}
                {/*               placeholder="Search..."*/}
                {/*               aria-label="Search..." autoComplete="off" spellCheck="false" dir="auto"/>*/}
                {/*        <div className="tt-menu navbar-search-suggestion ps">*/}
                {/*            <div className="tt-dataset tt-dataset-pages"></div>*/}
                {/*            <div className="tt-dataset tt-dataset-files"></div>*/}
                {/*            <div className="tt-dataset tt-dataset-members"></div>*/}
                {/*        </div>*/}
                {/*    </span>*/}
                {/*    <i className="bx bx-x bx-md search-toggler cursor-pointer"></i>*/}
                {/*</div>*/}
            </nav>
        </>
    )
}