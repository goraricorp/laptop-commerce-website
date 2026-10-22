import React from 'react';
import { Route, Navigate } from 'react-router-dom';
import { useAuthentication } from '../hooks/useAuthentication.jsx';

export default function Protected({ children, isAllowed, redirectTo }) {
    if (!isAllowed) {
        return <Navigate to={redirectTo} />;
    }
    return children;
};

const Protected0 = ({ component: Component, roles, ...rest }) => {
    const { user } = useAuthentication();

    return (
        <Route {...rest} render={(props) => {
            if (!user) {
                return <Navigate to='/auth/login' />;
            }

            if (roles && !roles.includes(user.role)) {
                return <Navigate to='/' />;
            }

            return <Component {...props} />;
        }} />
    );
};
