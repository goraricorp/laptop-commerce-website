import React, { useState, useEffect, Component } from 'react';
import { BrowserRouter, Route, Router, Routes } from "react-router-dom";
import { } from 'react-bootstrap';
import axios from "axios";

import { AddressManagement } from "../pages/information/AddressManagement.jsx";
import { VoucherWallet } from "../pages/information/VoucherWallet.jsx";
import PreviewPage from "../pages/dashboard/PreviewPage.jsx";
import { OrderHistory } from "../pages/information/OrderHistory.jsx";
import ProfilePage from "../pages/account/ProfilePage.jsx";
import { OrderDetails } from "../pages/information/OrderDetails.jsx";
import ErrorPage from "../pages/misc/ErrorPage.jsx";
import NotAuthorizedPage from "../pages/misc/NotAuthorizedPage.jsx";
import Scroll from "../layouts/Scroll.jsx";

export const UserRoutes = () => {
    return (
        <Routes>
            <Route path="/" element={<PreviewPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/address" element={<AddressManagement />} />
            <Route path="/voucher" element={<VoucherWallet />} />
            <Route path="/order" element={<OrderHistory />} />
            <Route path="/bill" element={<OrderDetails />} />
            <Route path="/rating" element={<NotAuthorizedPage />} />

            <Route path="*" element={<ErrorPage />} />
        </Routes>
    )
}
