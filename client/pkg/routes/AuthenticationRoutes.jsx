import { Route, Routes } from "react-router-dom";
import LoginPage from "../pages/authentication/LoginPage.jsx";
import RegisterPage from "../pages/authentication/RegisterPage.jsx";
import ForgotPasswordPage from "../pages/authentication/ForgotPasswordPage.jsx";
import ResetPasswordPage from "../pages/authentication/ResetPasswordPage.jsx";
import ChangePasswordPage from '../pages/authentication/ChangePasswordPage.jsx';
import NotAuthorizedPage from "../pages/misc/NotAuthorizedPage.jsx";
import ErrorPage from "../pages/misc/ErrorPage.jsx";
import MaintenancePage from "../pages/misc/MaintenancePage.jsx";
import LoadingPage from "../pages/misc/LoadingPage.jsx";
import WaitingPage from "../pages/misc/WaitingPage.jsx";
import ComingPage from "../pages/misc/ComingPage.jsx";

export const AuthenticationRoutes = () => {
    return (
        <Routes>
            {/*<Route path="/login" element={<LoginPage />} />*/}
            {/*<Route path="/register" element={<RegisterPage />} />*/}
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />
            <Route path="/change-password" element={<ChangePasswordPage />} />
            {/*<Route path="/500" element={<ServerError />} />*/}
            <Route path="/error" element={<ErrorPage />} />
            <Route path="/loading" element={<LoadingPage />} />
            <Route path="/waiting" element={<WaitingPage />} />
            <Route path="/coming" element={<ComingPage />} />
            <Route path="/notauthorized" element={<NotAuthorizedPage />} />
            <Route path="/maintenance" element={<MaintenancePage />} />
            {/*<Route path="/coming-soon" element={<ComingSoon />} />*/}

            <Route path="*" element={<ErrorPage />} />
        </Routes>
    );
}