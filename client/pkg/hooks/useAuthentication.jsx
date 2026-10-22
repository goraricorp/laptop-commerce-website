import React, { createContext, useContext, useState } from 'react';

const AuthenticationContext = createContext();

export const AuthenticationProvider = ({ children }) => {
    const [user, setUser] = useState(null);

    const login = (userData) => {
        // Implement login logic here (e.g., API call)
        setUser(userData);
    };

    const logout = () => {
        // Implement logout logic here
        setUser(null);
    };

    return (
        <AuthenticationContext.Provider value={{ user, login, logout }}>
            {children}
        </AuthenticationContext.Provider>
    );
};

export const useAuthentication = () => useContext(AuthenticationContext);