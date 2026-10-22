import { useState, useEffect } from "react";

const useStaticVariable = () => {
    const [config, setConfig] = useState({
        port: process.env.PORT || 5172,
        apiUrl: process.env.API_URL || 'http://localhost',
        token: localStorage.getItem('token') || '',
        env: process.env.NODE_ENV || 'development',
    });

    // Phương thức lấy token từ localStorage
    const getToken = () => config.token;

    // Phương thức lưu token vào localStorage
    const setToken = (token) => {
        setConfig((prevConfig) => {
            const updatedConfig = { ...prevConfig, token };
            localStorage.setItem('token', token);
            return updatedConfig;
        });
    };

    // Phương thức lấy URL API
    const getApiUrl = () => config.apiUrl;

    // Phương thức lấy port
    const getPort = () => config.port;

    // Phương thức kiểm tra môi trường
    const getEnv = () => config.env;

    return { getToken, setToken, getApiUrl, getPort, getEnv };
};

export default useStaticVariable;
