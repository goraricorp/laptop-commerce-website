import React, { createContext, useState, useContext } from 'react';
import apiHandler from "../utils/apiHandler.jsx";
import { jwtDecode } from "jwt-decode";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(null);

    const login = async (credentials) => {
        // credentials: { username, password }
        try {
            // Giả sử API đăng nhập trả về { user: { id, username, email, role }, token }
            const response = await apiHandler.post('/authentication/login', credentials);
            const data = response.data;
            setUser(jwtDecode(data.token));
            setToken(data.token);
            localStorage.setItem('token', data.token);
            return jwtDecode(data.token);
        } catch (error) {
            throw error;
        }
    };

    const logout = () => {
        setUser(null);
        setToken(null);
        localStorage.removeItem('token');
    };

    return (
        <AuthContext.Provider value={{ user, token, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
