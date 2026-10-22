import React from "react";
import { Link } from 'react-router-dom';

export default function NotAuthorizedPage() {
    return (
        <>
            <div className="misc-wrapper">
                <h2 className="mb-2 mx-2">You are not authorized! 🔐</h2>
                <p className="mb-4 mx-2">You don&#39;t have permission to access this page. Go Home!</p>
                <Link aria-label='Go to Home Page' to="/" className="btn btn-primary">Back to home</Link>
                <div className="mt-4">
                    <img
                        src="/assets/img/illustrations/girl-with-laptop-light.png"
                        alt="girl-doing-yoga-light"
                        aria-label="Girl doing yoga light"
                        width={500}
                        className="img-fluid"
                        data-app-dark-img="illustrations/girl-doing-yoga-dark.png"
                        data-app-light-img="illustrations/girl-doing-yoga-light.png" />
                </div>
            </div>
        </>
    )
}