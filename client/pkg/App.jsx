import { useState, useEffect } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import axios from 'axios';

import Layout from "./layouts/Layout";
import Frame from "./layouts/Frame";
import Panel from "./layouts/Panel.jsx";

import { AdministratorRoutes } from "./routes/AdministratorRoutes.jsx";
import { UserRoutes } from "./routes/UserRoutes.jsx";
import { CustomerRoutes } from "./routes/CustomerRoutes.jsx";
import { ShareRoutes } from "./routes/ShareRoutes.jsx";
import LoadingPage from "./pages/misc/LoadingPage.jsx";
import LoginPage from "./pages/authentication/LoginPage.jsx";
import RegisterPage from "./pages/authentication/RegisterPage.jsx";
import { AuthenticationRoutes } from "./routes/AuthenticationRoutes.jsx";
import ErrorPage from "./pages/misc/ErrorPage.jsx";

import Protected from "./routes/Protected.jsx";
import viteLogo from "/vite.svg";
import reactLogo from "/react.svg";

export default function App() {
    const [auth, setAuth] = useState({
        isAuthenticated: false,
        role: null,
    });
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    const authentication = async () => {
        const token = localStorage.getItem('token');
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

    useEffect(() => {
        authentication();
    }, []);

    if (loading) return <LoadingPage />; // Hiển thị loading nếu đang tải

    return (
        <Routes>
            <Route
                path="/*"
                element={<Frame role={auth.role}><ShareRoutes /></Frame>}
            />

            <Route
                path="/auth/*"
                element={<AuthenticationRoutes />}
            />
            <Route
                path="/auth/login"
                element={<LoginPage checker={authentication} />}
            />
            <Route
                path="/auth/register"
                element={<RegisterPage checker={authentication} />}
            />

            <Route
                path="/user/*"
                element={
                    <Protected isAllowed={auth.isAuthenticated && auth.role === 0} redirectTo="/auth/notauthorized">
                        <Panel>
                            <UserRoutes />
                        </Panel>
                    </Protected>
                }
            />

            <Route
                path="/pay/*"
                element={
                    <Protected isAllowed={auth.isAuthenticated && auth.role === 0} redirectTo="/auth/notauthorized">
                        <Frame role={auth.role}>
                            <CustomerRoutes />
                        </Frame>
                    </Protected>
                }
            />

            <Route
                path="/admin/*"
                element={
                    <Protected isAllowed={auth.isAuthenticated && auth.role === 1} redirectTo="/auth/notauthorized">
                        <Layout>
                            <AdministratorRoutes />
                        </Layout>
                    </Protected>
                }
            />

            <Route path="*" element={<ErrorPage />} />
        </Routes>
    );
};

function Web() {
    const [count, setCount] = useState(0)

    return (
        <>
            <div>
                <a href="https://vite.dev" target="_blank">
                    <img src={viteLogo} className="logo" alt="Vite logo" />
                </a>
                <a href="https://react.dev" target="_blank">
                    <img src={reactLogo} className="logo react" alt="React logo" />
                </a>
            </div>
            <h1>Vite + React</h1>
            <div className="card">
                <button onClick={() => setCount((count) => count + 1)}>
                    count is {count}
                </button>
                <p>
                    Edit <code>src/App.jsx</code> and save to test HMR
                </p>
            </div>
            <p className="read-the-docs">
                Click on the Vite and React logos to learn more
            </p>
        </>
    )
}
