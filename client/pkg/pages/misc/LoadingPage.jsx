import React from "react";
import {AuthWrapper} from "../authentication/AuthWrapper.jsx";

export default function LoadingPage() {
    return (
        <>
            <AuthWrapper>
                <h4 className="mb-2">Loading...</h4>
                <p className="mb-4">Please, Wait a moment. We are on Processing.</p>
            </AuthWrapper>
        </>
    )
}
