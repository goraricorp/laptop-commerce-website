import React, { useState, useEffect, Component } from 'react';
import { BrowserRouter, Route, Router, Routes } from "react-router-dom";

import NotAuthorizedPage from "../pages/misc/NotAuthorizedPage.jsx";
import Scroll from "../layouts/Scroll.jsx";

export const ProtectedRoutes = () => {
    return (
        <Routes>
            <Route path="/" element={<NotAuthorizedPage />} />
        </Routes>
    )
}
