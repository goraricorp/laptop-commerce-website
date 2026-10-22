import React, { useState } from 'react';
import ReCAPTCHA from 'react-google-recaptcha';
import axios from "axios";
import apiHandler from "../../utils/apiHandler.jsx";

// import './recaptcha.css';

export const ReCaptchaComponent = ({ onSuccess, onError }) => {
    const [isVerifying, setIsVerifying] = useState(false);
    const [verificationResult, setVerificationResult] = useState(null);

    const handleChange = async (token) => {
        if (!token) return;

        setIsVerifying(true);

        try {
            const response = await apiHandler.post(
                "/recaptcha/verify-captcha",
                { captcha: token },
                { headers: { "Content-Type": "application/json" } }
            );

            setIsVerifying(false);

            if (response.data.success) {
                setVerificationResult("success");
                if (onSuccess) onSuccess(response.data); // Callback khi thành công
            } else {
                setVerificationResult("failed");
                if (onError) onError(response.data); // Callback khi thất bại
            }
        } catch (error) {
            setIsVerifying(false);
            setVerificationResult("error");

            if (onError) {
                if (error.response) {
                    // Lỗi từ server (có response)
                    onError(error.response.data);
                } else {
                    // Lỗi mạng hoặc request bị hủy
                    onError({ message: "Network error or request failed" });
                }
            }
        }
    };

    const showVerificationResult = () => {
        if (verificationResult === null) {
            return (
                <span className="d-flex justify-content-center align-items-center">
                    <i className='bx bx-help-circle text-primary me-1'></i>
                    <span>Not Verification!</span>
                </span>
            );
        } else if (verificationResult === 'success') {
            return (
                <span className="d-flex justify-content-center align-items-center">
                    <i className='bx bx-check-circle text-success me-1'></i>
                    <span>Verification Successful!</span>
                </span>
            );
        } else if (verificationResult === 'failed') {
            return (
                <span className="d-flex justify-content-center align-items-center">
                    <i className='bx bx-x-circle text-danger me-1'></i>
                    <span>Verification Failed!</span>
                </span>
            );
        } else if (verificationResult === 'error') {
            return (
                <span className="d-flex justify-content-center align-items-center">
                    <i className='bx bx-error-circle text-warning me-1'></i>
                    <span>An error occurred.</span>
                </span>
            );
        } else if (isVerifying) {
            return (
                <span className="d-flex justify-content-center align-items-center">
                    <i className='bx bx-check-circle text-success me-1'></i>
                    <span>Verifying ...</span>
                </span>
            );
        }
    }

    return (
        <div className="card p-3 w-100">
            <div className="row d-flex justify-content-center flex-wrap">
                <div className="col-lg-12">
                    <div className="d-flex justify-content-center w-100">
                        <div className="">
                            {/*style={{transform:"scale(1.165)", transformOrigin:"0 0"}}*/}
                            <ReCAPTCHA
                                id="recaptcha-custom"
                                sitekey={"6LfaA50qAAAAAGbL3FubZuwBEaLuDMAfEPjN48lX"}
                                onChange={handleChange}
                                // style={{width: '100%'}}
                                isolated
                                className="w-100 my-2"
                            />
                            <div className="d-flex justify-content-center">
                                {showVerificationResult()}
                                {/*{isVerifying && <p>Verifying...</p>}*/}
                                {/*/!*{verificationResult && <p>✅ Verification Successful!</p>}*!/*/}
                                {/*{verificationResult === 'success' && <p><i className='bx bx-check-circle text-success'></i> Verification Successful!</p>}*/}
                                {/*{verificationResult === 'failed' && <p><i className='bx bx-x-circle text-danger'></i> Verification Failed!</p>}*/}
                                {/*{verificationResult === 'error' && <p><i className='bx bx-error-circle text-warning'></i> An error occurred.</p>}*/}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
