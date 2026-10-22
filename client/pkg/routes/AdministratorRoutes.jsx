import React, { useState, useEffect, Component } from 'react';
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { } from 'react-bootstrap';
import axios from "axios";

///////////////////////////////////////

import { WithoutMenuPage } from "../pages/others/layouts/WithoutMenuPage";
import { WithoutNavbarPage } from "../pages/others/layouts/WithoutNavbarPage";
import { ContainerPage } from "../pages/others/layouts/ContainerPage";
import { FluidPage } from "../pages/others/layouts/FluidPage";
import { BlankPage } from "../pages/others/layouts/BlankPage";

// import { LoginPage } from "../pages/authentication/LoginPage";
// import { RegisterPage } from "../pages/authentication/RegisterPage";
// import { ForgotPasswordPage } from "../pages/authentication/ForgotPasswordPage";
import AccountPage from "../pages/account/AccountPage";
import ConnectionsPage from "../pages/account/ConnectionsPage";
import NotificationPage from "../pages/account/NotificationPage";
import ErrorPage from "../pages/misc/ErrorPage";
import MaintenancePage from "../pages/misc/MaintenancePage.jsx";

import { AccordionPage } from "../pages/others/user-interface/AccordionPage";
import { AlertPage } from "../pages/others/user-interface/AlertPage";
import { BadgesPage } from "../pages/others/user-interface/BadgePage";
import { ButtonPage } from "../pages/others/user-interface/ButtonPage";
import { CarouselPage } from "../pages/others/user-interface/CarouselPage";
import { CardsPage } from "../pages/others/user-interface/CardsPage";
import { CollapsePage } from "../pages/others/user-interface/CollapsePage";
import { DropdownPage } from "../pages/others/user-interface/DropdownPage";
import { FooterPage } from "../pages/others/user-interface/FooterPage";
import { ListGroupPage } from "../pages/others/user-interface/ListGroupPage";
import { ModalPage } from "../pages/others/user-interface/ModalPage";
import { NavbarPage } from "../pages/others/user-interface/NavbarPage";
import { OffcanvasPage } from "../pages/others/user-interface/OffcanvasPage";
import { PaginationBreadcrumbsPage } from "../pages/others/user-interface/PaginationBreadcrumbsPage";
import { ProgressPage } from "../pages/others/user-interface/ProgressPage";
import { SpinnersPage } from "../pages/others/user-interface/SpinnersPage";
import { TabsPillPage } from "../pages/others/user-interface/TabsPillPage";
import { ToastPage } from "../pages/others/user-interface/ToastPage";
import { TooltipPopoverPage } from "../pages/others/user-interface/TooltipPopoverPage";
import { TypographyPage } from "../pages/others/user-interface/TypographyPage";

import { BoxiconsPage } from "../pages/others/icons/BoxiconPage";

import { BasicInputPage } from "../pages/others/form-element/BasicInputPage";
import { InputGroupPage } from "../pages/others/form-element/InputGroupPage";
import { HorizontalFormPage } from "../pages/others/form-layout/HorizontalFormPage";
import { VerticalFormPage } from "../pages/others/form-layout/VerticalFormPage";
import { TablesPage } from "../pages/others/TablesPage.jsx";
import DashboardPage from "../pages/dashboard/DashboardPage.jsx";

import { PerfectScrollbarPage } from "../pages/others/extended-ui/PerfectScrollbar";
import { TextDividerPage } from "../pages/others/extended-ui/TextDividerPage";

import Category from "../pages/management/Category"
import UserManagement from "../pages/management/UserManagement"
import ProductName from "../pages/management/ProductName"
import ProductConfiguration from "../pages/management/ProductConfiguration"
import ProductAccessory from "../pages/management/ProductAccessory"
import ProductDescription from "../pages/management/ProductDescription"
import ProductColor from "../pages/management/ProductColor"
import ProfilePage from "../pages/account/ProfilePage.jsx";
import Voucher from '../pages/management/Voucher.jsx';
///////////////////////////////////////

export const AdministratorRoutes = () => {
    // const [isAuthenticated, setIsAuthenticated] = useState(false);
    // const [userRole, setUserRole] = useState(null);
    //
    // useEffect(() => {
    //     const token = localStorage.getItem('token');
    //     if (token) {
    //         axios.get('/api/auth/check', { headers: { Authorization: token } })
    //             .then(response => {
    //                 setIsAuthenticated(true);
    //                 setUserRole(response.data.role);
    //                 console.log(response.data.role)
    //             })
    //             .catch(() => {
    //                 setIsAuthenticated(false);
    //             });
    //     }
    // }, []);
    return (
        <Routes>
            <Route path="/" element={<DashboardPage />} />

            <Route path="/layout/without-menu" element={<WithoutMenuPage />} />
            <Route path="/layout/without-navbar" element={<WithoutNavbarPage />} />
            <Route path="/layout/container" element={<ContainerPage />} />
            <Route path="/layout/fluid" element={<FluidPage />} />
            <Route path="/layout/fluid" element={<FluidPage />} />
            <Route path="/layout/blank" element={<BlankPage />} />

            <Route path="/ui/accordion" element={<AccordionPage />} />
            <Route path="/ui/alerts" element={<AlertPage />} />
            <Route path="/ui/badges" element={<BadgesPage />} />
            <Route path="/ui/buttons" element={<ButtonPage />} />
            <Route path="/ui/cards" element={<CardsPage />} />
            <Route path="/ui/carousel" element={<CarouselPage />} />
            <Route path="/ui/collapse" element={<CollapsePage />} />
            <Route path="/ui/dropdown" element={<DropdownPage />} />
            <Route path="/ui/footer" element={<FooterPage />} />
            <Route path="/ui/list-group" element={<ListGroupPage />} />
            <Route path="/ui/modals" element={<ModalPage />} />
            <Route path="/ui/navbar" element={<NavbarPage />} />
            <Route path="/ui/offcanvas" element={<OffcanvasPage />} />
            <Route path="/ui/pagination-breadcrumbs" element={<PaginationBreadcrumbsPage />} />
            <Route path="/ui/progress" element={<ProgressPage />} />
            <Route path="/ui/spinners" element={<SpinnersPage />} />
            <Route path="/ui/tabs-pills" element={<TabsPillPage />} />
            <Route path="/ui/toasts" element={<ToastPage />} />
            <Route path="/ui/tooltips-popovers" element={<TooltipPopoverPage />} />
            <Route path="/ui/typography" element={<TypographyPage />} />


            {/*<Route path="/auth/login" element={<LoginPage />} />*/}
            {/*<Route path="/auth/register" element={<RegisterPage />} />*/}
            {/*<Route path="/auth/forgot-password" element={<ForgotPasswordPage />} />*/}

            <Route path="/account/settings" element={<AccountPage />} />
            <Route path="/account/notifications" element={<NotificationPage />} />
            <Route path="/account/connections" element={<ConnectionsPage />} />

            <Route path="/misc/error" element={<ErrorPage />} />
            <Route path="/misc/under-maintenance" element={<MaintenancePage />} />

            <Route path="/extended-ui/perfect-scrollbar" element={<PerfectScrollbarPage />} />
            <Route path="/extended-ui/text-divider" element={<TextDividerPage />} />

            <Route path="/boxicons" element={<BoxiconsPage />} />

            <Route path="/form/basic-inputs" element={<BasicInputPage />} />
            <Route path="/form/input-groups" element={<InputGroupPage />} />

            <Route path="/form-layout/horizontal-form" element={<HorizontalFormPage />} />
            <Route path="/form-layout/vertical-form" element={<VerticalFormPage />} />

            <Route path="/tables" element={<TablesPage />} />
            {/*<Route path="/profile-old" element={<AccountPage />} />*/}
            <Route path="/profile" element={<ProfilePage />} />

            <Route path="/users" element={<UserManagement />} />
            <Route path="/categories" element={<Category />} />
            <Route path="/voucher" element={<Voucher />} />
            <Route path="/product/name" element={<ProductName />} />
            <Route path="/product/accessory" element={<ProductAccessory />} />
            <Route path="/product/configurarion" element={<ProductConfiguration />} />
            <Route path="/product/color" element={<ProductColor />} />
            <Route path="/product/description" element={<ProductDescription />} />

            <Route path="*" element={<ErrorPage />} />
        </Routes>
    )
}