import { createContext, useContext, useState } from "react";

const Context = createContext();

export const Provider = ({ children }) => {
    const [auth, setAuth] = useState({
        isAuthenticated: false,
        role: null,
    });

    return (
        <Context.Provider value={{ auth, setAuth }}>
            {children}
        </Context.Provider>
    );
};

export const useAuth = () => useContext(Context);
