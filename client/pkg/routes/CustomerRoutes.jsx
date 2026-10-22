import React, { useState, useEffect, Component } from 'react';
import { BrowserRouter, Route, Router, Routes } from "react-router-dom";
import { } from 'react-bootstrap';
import axios from "axios";

import CartList from "../pages/payment/CartList.jsx";
import OrderPreview from '../pages/payment/OrderPreview.jsx';
import CheckOutPage from "../pages/payment/CheckoutPage.jsx";
import OrderSuccess from "../pages/payment/OrderSuccess.jsx";
import ErrorPage from "../pages/misc/ErrorPage.jsx";
import Scroll from "../layouts/Scroll.jsx";
import PurchasePage from "../pages/payment/PurchasePage.jsx";

export const CustomerRoutes = () => {
    return (
        <Routes>
            <Route path="/cart" element={<CartList />} />
            <Route path="/purchase" element={<PurchasePage />} />
            <Route path="/order" element={<OrderPreview />} />
            <Route path="/checkout" element={<CheckOutPage />} />
            <Route path="/success" element={<OrderSuccess />} />

            <Route path="*" element={<ErrorPage />} />
        </Routes>
    )
}
