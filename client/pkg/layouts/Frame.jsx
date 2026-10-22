import React, { useEffect, useState } from 'react';
import { useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import Header from './Header';
import Footer from './Footer';
import Copyright from './Copyright.jsx';
import Transitionbar from "./Transitionbar.jsx";
import Outbar from "./Outbar.jsx";
import Overside from "./Overside.jsx";
import Navbar from "./Navbar.jsx";
import Activitybar from "./Activitybar.jsx";
import getGreetingMessage from "../utils/greetingHandler.jsx";
import axios from "axios";
import { renderComponentByRole } from "../utils/renderHandler.jsx";

export default function Frame({ children, role }) {
    useEffect(() => {
        Main();

        authentication();
    }, [])


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

    return (
        <>
            <div className="mb-4">
                {renderComponentByRole(auth.role)}
            </div>
            <div>
                {children}
            </div>
            <Footer/>
        </>
    );
};