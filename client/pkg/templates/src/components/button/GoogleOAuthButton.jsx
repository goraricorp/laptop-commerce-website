import { GoogleOAuthProvider, useGoogleLogin } from "@react-oauth/google";
import React from "react";
import { jwtDecode } from "jwt-decode";

// const CLIENT_ID = import.meta.env.REACT_APP_GOOGLE_OAUTH_CLIENT_ID; // Có thể thay bằng process.env.REACT_APP_GOOGLE_OAUTH_CLIENT_ID nếu dùng dotenv

export const GoogleOAuthButton = () => {
    const login = useGoogleLogin({
        onSuccess: (response) => {
            console.log(response);
        },
        onError: (error) => {
            console.error(error);
        },
        flow: 'implicit'
    });

    return (
        <>
            <button
                className="btn btn-sm btn-icon rounded-circle"
                onClick={() => login()}
                style={{color: '#dd4b39'}}
            >
                <i className="icon-base bx bxl-google bx-sm"></i>
            </button>
        </>
    )
}