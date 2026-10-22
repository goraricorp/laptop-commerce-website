import React, { Component, useState, useEffect } from "react";
import { useNavigate, useLocation, Link } from 'react-router-dom'
import Overview from "../../layouts/Overview.jsx";
import { formatDateTime } from "../../utils/formatHandler.jsx";

export default function OrderSuccess() {
    const location = useLocation();
    const navigate = useNavigate();

    const { cartData, prePrice, discount, voucher, totalPrice, userData, address } = location.state || {};

    // console.log(location.state)

    useEffect(() => {
        if (!location.state) {
            navigate('/pay/cart');
        }
    }, []);

    // useEffect(() => {
    //     if (location.state) {
    //         navigate(location.pathname, { replace: true, state: {} });
    //     }
    // }, [location, navigate]);

    return (
        <Overview>
            <div
                id="wizard-checkout"
                className="bs-stepper wizard-icons wizard-icons-example"
            >
                <div className="bs-stepper-content">
                    {/* border-top */}
                    <div
                        id="checkout-confirmation"
                        className="content fv-plugins-bootstrap5 fv-plugins-framework active dstepper-block"
                    >
                        <div className="row mb-4">
                            <div className="col-12 col-lg-8 mx-auto text-center mb-2">
                                <h4>Thank You! 😇</h4>
                                <p>
                                    Your order{" "}
                                    <a href="#" className="text-heading fw-medium">
                                        #
                                    </a>{" "}
                                    has been placed!
                                </p>
                                <p>
                                    We sent an email to{" "}
                                    <a
                                        // href="mailto:contact@gorth.org"
                                        className="text-heading fw-medium"
                                    >
                                        contact@gorth.org
                                    </a>{" "}
                                    with your order confirmation and receipt. If the email
                                    hasn't arrived within two minutes, please check your spam
                                    folder to see if the email was routed there.
                                </p>
                                <p>
                                    <span>
                                        <i className="bx bx-time-five me-1 text-heading align-top"></i>{" "}
                                        Time placed:&nbsp;
                                    </span>{" "}
                                    {/*25/05/2020 13:35pm*/}
                                    {formatDateTime(new Date())}
                                </p>
                            </div>
                            <div className="col-12">
                                <ul className="list-group list-group-horizontal-md">
                                    <li className="list-group-item flex-fill p-4 text-body">
                                        <h6 className="d-flex align-items-center gap-2">
                                            <i className="bx bx-map"></i> Shipping
                                        </h6>
                                        <address className="mb-0">
                                            {`${userData?.firstname} ${userData?.lastname}`}
                                            <br/>
                                            {address?.type},
                                            <br/>
                                            {`${address?.tower}, ${address?.street}`},
                                            <br/>
                                            {`${address?.district}`},
                                            <br/>
                                            {`${address?.city}, ${address?.state}`},
                                            <br/>
                                            {address?.country}
                                        </address>
                                        <p className="mb-0 mt-4">{userData?.phone}</p>
                                    </li>
                                    <li className="list-group-item flex-fill p-4 text-body">
                                        <h6 className="d-flex align-items-center gap-2">
                                            <i className="bx bx-credit-card"></i> Billing Address
                                        </h6>
                                        <address className="mb-0">
                                            {`${userData?.firstname} ${userData?.lastname}`}
                                            <br/>
                                            {address?.type},
                                            <br/>
                                            {`${address?.tower}, ${address?.street}`},
                                            <br/>
                                            {`${address?.district}`},
                                            <br/>
                                            {`${address?.city}, ${address?.state}`},
                                            <br/>
                                            {address?.country}
                                        </address>
                                        <p className="mb-0 mt-4">{userData?.phone}</p>
                                    </li>
                                    <li className="list-group-item flex-fill p-4 text-body">
                                        <h6 className="d-flex align-items-center gap-2">
                                            <i className="bx bxs-ship"></i> Shipping Method
                                        </h6>
                                        <p className="fw-medium mb-4">Preferred Method:</p>
                                        Standard Delivery
                                        <br/>
                                        (Normally 3-4 business days)
                                    </li>
                                </ul>
                            </div>
                        </div>

                        <div className="row">
                            <div className="col-xl-9 mb-4 mb-xl-0">
                                <ul className="list-group">
                                    {cartData?.map((item, index) => (
                                        <li key={index} className="list-group-item p-4">
                                            <div className="d-flex gap-4 flex-sm-row flex-column">
                                                <div className="flex-shrink-0">
                                                    <img
                                                        src={item?.product?.image}
                                                        alt="google home"
                                                        className="w-px-75"
                                                    />
                                                </div>
                                                <div className="flex-grow-1">
                                                    <div className="row">
                                                        <div className="col-md-8">
                                                            <a href="#">
                                                                <h6 className="mb-2">
                                                                    {`${item?.product?.brand} ${item?.product?.name}`}
                                                                </h6>
                                                            </a>
                                                            <div className="text-body mb-2 d-flex flex-wrap">
                                                                <span className="me-1">
                                                                    {`${item?.configuration?.cpu} |
                                                                    ${item?.configuration?.gpu} | 
                                                                    ${item?.configuration?.ram} GB |
                                                                    ${item?.configuration?.storage} GB |
                                                                    ${item?.configuration?.screen}' |
                                                                    ${item?.configuration?.resolution}`}
                                                                </span>
                                                            </div>
                                                        </div>
                                                        <div className="col-md-4">
                                                            <div className="text-md-end">
                                                                <div className="my-2 my-lg-4">
                                                                    <span
                                                                        className="text-primary">${item?.configuration.price}</span>
                                                                    <span
                                                                        className="text-body ms-2">x{item?.quantity}</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </li>
                                    ))}
                                    {/*<li className="list-group-item p-4">*/}
                                    {/*    <div className="d-flex gap-4 flex-sm-row flex-column">*/}
                                    {/*        <div className="flex-shrink-0">*/}
                                    {/*            <img*/}
                                    {/*                src="../assets/img/categories/product-1.png"*/}
                                    {/*                alt="google home"*/}
                                    {/*                className="w-px-75"*/}
                                    {/*            />*/}
                                    {/*        </div>*/}
                                    {/*        <div className="flex-grow-1">*/}
                                    {/*            <div className="row">*/}
                                    {/*                <div className="col-md-8">*/}
                                    {/*                    <a href="#">*/}
                                    {/*                        <h6 className="mb-2">*/}
                                    {/*                            Google - Google Home - White*/}
                                    {/*                        </h6>*/}
                                    {/*                    </a>*/}
                                    {/*                    <div className="text-body mb-2 d-flex flex-wrap">*/}
                                    {/*                        <span className="me-1">Sold by:</span>{" "}*/}
                                    {/*                        <a href="#" className="me-3">*/}
                                    {/*                            Google*/}
                                    {/*                        </a>*/}
                                    {/*                    </div>*/}
                                    {/*                    <span className="badge bg-label-success">*/}
                                    {/*                            In Stock*/}
                                    {/*                        </span>*/}
                                    {/*                </div>*/}
                                    {/*                <div className="col-md-4">*/}
                                    {/*                    <div className="text-md-end">*/}
                                    {/*                        <div className="my-2 my-lg-4">*/}
                                    {/*                            <span className="text-primary">$299/</span>*/}
                                    {/*                            <s className="text-muted">$359</s>*/}
                                    {/*                        </div>*/}
                                    {/*                    </div>*/}
                                    {/*                </div>*/}
                                    {/*            </div>*/}
                                    {/*        </div>*/}
                                    {/*    </div>*/}
                                    {/*</li>*/}
                                    {/*<li className="list-group-item p-4">*/}
                                    {/*    <div className="d-flex gap-4 flex-sm-row flex-column">*/}
                                    {/*        <div className="flex-shrink-0">*/}
                                    {/*            <img*/}
                                    {/*                src="../assets/img/categories/product-5.png"*/}
                                    {/*                alt="google home"*/}
                                    {/*                className="w-px-75"*/}
                                    {/*            />*/}
                                    {/*        </div>*/}
                                    {/*        <div className="flex-grow-1">*/}
                                    {/*            <div className="row">*/}
                                    {/*                <div className="col-md-8">*/}
                                    {/*                    <a href="#">*/}
                                    {/*                        <h6 className="mb-2">*/}
                                    {/*                            Apple iPhone 11 (64GB, Black)*/}
                                    {/*                        </h6>*/}
                                    {/*                    </a>*/}
                                    {/*                    <div className="text-body mb-2 d-flex flex-wrap">*/}
                                    {/*                        <span className="me-1">Sold by:</span>{" "}*/}
                                    {/*                        <a href="#">Apple</a>*/}
                                    {/*                    </div>*/}
                                    {/*                </div>*/}
                                    {/*                <div className="col-md-4">*/}
                                    {/*                    <div className="text-md-end">*/}
                                    {/*                        <div className="my-2 my-lg-4">*/}
                                    {/*                            <span className="text-primary">$299/</span>*/}
                                    {/*                            <s className="text-muted">$359</s>*/}
                                    {/*                        </div>*/}
                                    {/*                    </div>*/}
                                    {/*                </div>*/}
                                    {/*            </div>*/}
                                    {/*        </div>*/}
                                    {/*    </div>*/}
                                    {/*</li>*/}
                                </ul>
                            </div>
                            <div className="col-xl-3">
                                <div className="border rounded p-4">
                                    <h6>Price Details</h6>
                                    <dl className="row mb-0 text-heading">
                                        <dt className="col-6 fw-normal">Order Total</dt>
                                        <dd className="col-6 text-end">${totalPrice}</dd>

                                        <dt className="col-sm-6 text-heading fw-normal">
                                            Charges
                                        </dt>
                                        <dd className="col-sm-6 text-end">
                                            <s className="text-muted">$5.00</s>{" "}
                                            <span className="badge bg-label-success ms-1">
                                                Free
                                            </span>
                                        </dd>
                                    </dl>
                                    <hr className="mx-n6 mb-4"/>
                                    <dl className="row mb-0">
                                        <dt className="col-6 text-heading">Total</dt>
                                        <dd className="col-6 fw-medium text-end text-heading mb-0">
                                            ${totalPrice}
                                        </dd>
                                    </dl>
                                </div>
                            </div>
                        </div>
                    </div>
                    <form id="wizard-checkout-form" onSubmit={() => false}>
                        {/*<div*/}
                        {/*    id="checkout-cart"*/}
                        {/*    className="content fv-plugins-bootstrap5 fv-plugins-framework"*/}
                        {/*>*/}
                        {/*    <div className="row">*/}
                        {/*        <div className="col-xl-8 mb-4 mb-xl-0">*/}
                        {/*            <div className="alert alert-success mb-4" role="alert">*/}
                        {/*                <div className="d-flex gap-3">*/}
                        {/*                    <div className="alert-icon flex-shrink-0 rounded-circle me-0">*/}
                        {/*                        <i className="bx bx-purchase-tag"></i>*/}
                        {/*                    </div>*/}
                        {/*                    <div className="flex-grow-1">*/}
                        {/*                        <h5 className="alert-heading mb-1">Available Offers</h5>*/}
                        {/*                        <ul className="list-unstyled mb-0">*/}
                        {/*                            <li>*/}
                        {/*                                {" "}*/}
                        {/*                                - 10% Instant Discount on Bank of America Corp Bank*/}
                        {/*                                Debit and Credit cards*/}
                        {/*                            </li>*/}
                        {/*                            <li>*/}
                        {/*                                {" "}*/}
                        {/*                                - 25% Cashback Voucher of up to $60 on first ever*/}
                        {/*                                PayPal transaction. TCA*/}
                        {/*                            </li>*/}
                        {/*                        </ul>*/}
                        {/*                    </div>*/}
                        {/*                </div>*/}
                        {/*                <button*/}
                        {/*                    type="button"*/}
                        {/*                    className="btn-close btn-pinned"*/}
                        {/*                    data-bs-dismiss="alert"*/}
                        {/*                    aria-label="Close"*/}
                        {/*                ></button>*/}
                        {/*            </div>*/}

                        {/*            <h5>My Shopping Bag (2 Items)</h5>*/}
                        {/*            <ul className="list-group mb-4">*/}
                        {/*                <li className="list-group-item p-4">*/}
                        {/*                    <div className="d-flex gap-4 flex-sm-row flex-column align-items-center">*/}
                        {/*                        <div className="flex-shrink-0 d-flex align-items-center">*/}
                        {/*                            <img*/}
                        {/*                                src="../../assets/img/products/1.png"*/}
                        {/*                                alt="google home"*/}
                        {/*                                className="w-px-100"*/}
                        {/*                            />*/}
                        {/*                        </div>*/}
                        {/*                        <div className="flex-grow-1">*/}
                        {/*                            <div className="row text-center text-sm-start">*/}
                        {/*                                <div className="col-md-8">*/}
                        {/*                                    <p className="me-3 mb-2">*/}
                        {/*                                        <a href="#" className="fw-medium">*/}
                        {/*                                            {" "}*/}
                        {/*                                            <span className="text-heading">*/}
                        {/*                                                Google - Google Home - White*/}
                        {/*                                            </span>*/}
                        {/*                                        </a>*/}
                        {/*                                    </p>*/}
                        {/*                                    <div className="text-muted mb-2 d-flex flex-wrap justify-content-center justify-content-sm-start">*/}
                        {/*                                        <span className="me-1">Sold by:</span>{" "}*/}
                        {/*                                        <a href="#" className="me-4">*/}
                        {/*                                            Apple*/}
                        {/*                                        </a>*/}
                        {/*                                        <span className="badge bg-label-success">*/}
                        {/*                                            In Stock*/}
                        {/*                                        </span>*/}
                        {/*                                    </div>*/}
                        {/*                                    <div className="d-flex d-md-block align-items-center mb-2 gap-2 justify-content-center justify-content-sm-start">*/}
                        {/*                                        <div*/}
                        {/*                                            className="read-only-ratings mb-sm-2 px-0 jq-ry-container"*/}
                        {/*                                            data-rateyo-read-only="true"*/}
                        {/*                                            readOnly*/}
                        {/*                                            style={{width: 108}}*/}
                        {/*                                        >*/}
                        {/*                                            <div className="jq-ry-group-wrapper">*/}
                        {/*                                                <div className="jq-ry-normal-group jq-ry-group">*/}
                        {/*                                                    <svg*/}
                        {/*                                                        className="icon icon-tabler icon-tabler-star-filled"*/}
                        {/*                                                        width="20px"*/}
                        {/*                                                        height="20px"*/}
                        {/*                                                        viewBox="0 0 24 24"*/}
                        {/*                                                        strokeWidth="1.5"*/}
                        {/*                                                        strokeLinecap="round"*/}
                        {/*                                                        strokeLinejoin="round"*/}
                        {/*                                                        fill="gray"*/}
                        {/*                                                    >*/}
                        {/*                                                        <path*/}
                        {/*                                                            stroke="none"*/}
                        {/*                                                            d="M0 0h24v24H0z"*/}
                        {/*                                                            fill="none"*/}
                        {/*                                                        ></path>*/}
                        {/*                                                        <path*/}
                        {/*                                                            d="M8.243 7.34l-6.38 .925l-.113 .023a1 1 0 0 0 -.44 1.684l4.622 4.499l-1.09 6.355l-.013 .11a1 1 0 0 0 1.464 .944l5.706 -3l5.693 3l.1 .046a1 1 0 0 0 1.352 -1.1l-1.091 -6.355l4.624 -4.5l.078 -.085a1 1 0 0 0 -.633 -1.62l-6.38 -.926l-2.852 -5.78a1 1 0 0 0 -1.794 0l-2.853 5.78z"*/}
                        {/*                                                            strokeWidth="0"*/}
                        {/*                                                        ></path>*/}
                        {/*                                                    </svg>*/}
                        {/*                                                    <svg*/}
                        {/*                                                        className="icon icon-tabler icon-tabler-star-filled"*/}
                        {/*                                                        width="20px"*/}
                        {/*                                                        height="20px"*/}
                        {/*                                                        viewBox="0 0 24 24"*/}
                        {/*                                                        strokeWidth="1.5"*/}
                        {/*                                                        strokeLinecap="round"*/}
                        {/*                                                        strokeLinejoin="round"*/}
                        {/*                                                        fill="gray"*/}
                        {/*                                                        style={{marginLeft: 2}}*/}
                        {/*                                                    >*/}
                        {/*                                                        <path*/}
                        {/*                                                            stroke="none"*/}
                        {/*                                                            d="M0 0h24v24H0z"*/}
                        {/*                                                            fill="none"*/}
                        {/*                                                        ></path>*/}
                        {/*                                                        <path*/}
                        {/*                                                            d="M8.243 7.34l-6.38 .925l-.113 .023a1 1 0 0 0 -.44 1.684l4.622 4.499l-1.09 6.355l-.013 .11a1 1 0 0 0 1.464 .944l5.706 -3l5.693 3l.1 .046a1 1 0 0 0 1.352 -1.1l-1.091 -6.355l4.624 -4.5l.078 -.085a1 1 0 0 0 -.633 -1.62l-6.38 -.926l-2.852 -5.78a1 1 0 0 0 -1.794 0l-2.853 5.78z"*/}
                        {/*                                                            strokeWidth="0"*/}
                        {/*                                                        ></path>*/}
                        {/*                                                    </svg>*/}
                        {/*                                                    <svg*/}
                        {/*                                                        className="icon icon-tabler icon-tabler-star-filled"*/}
                        {/*                                                        width="20px"*/}
                        {/*                                                        height="20px"*/}
                        {/*                                                        viewBox="0 0 24 24"*/}
                        {/*                                                        strokeWidth="1.5"*/}
                        {/*                                                        strokeLinecap="round"*/}
                        {/*                                                        strokeLinejoin="round"*/}
                        {/*                                                        fill="gray"*/}
                        {/*                                                        style={{marginLeft: 2}}*/}
                        {/*                                                    >*/}
                        {/*                                                        <path*/}
                        {/*                                                            stroke="none"*/}
                        {/*                                                            d="M0 0h24v24H0z"*/}
                        {/*                                                            fill="none"*/}
                        {/*                                                        ></path>*/}
                        {/*                                                        <path*/}
                        {/*                                                            d="M8.243 7.34l-6.38 .925l-.113 .023a1 1 0 0 0 -.44 1.684l4.622 4.499l-1.09 6.355l-.013 .11a1 1 0 0 0 1.464 .944l5.706 -3l5.693 3l.1 .046a1 1 0 0 0 1.352 -1.1l-1.091 -6.355l4.624 -4.5l.078 -.085a1 1 0 0 0 -.633 -1.62l-6.38 -.926l-2.852 -5.78a1 1 0 0 0 -1.794 0l-2.853 5.78z"*/}
                        {/*                                                            strokeWidth="0"*/}
                        {/*                                                        ></path>*/}
                        {/*                                                    </svg>*/}
                        {/*                                                    <svg*/}
                        {/*                                                        className="icon icon-tabler icon-tabler-star-filled"*/}
                        {/*                                                        width="20px"*/}
                        {/*                                                        height="20px"*/}
                        {/*                                                        viewBox="0 0 24 24"*/}
                        {/*                                                        strokeWidth="1.5"*/}
                        {/*                                                        strokeLinecap="round"*/}
                        {/*                                                        strokeLinejoin="round"*/}
                        {/*                                                        fill="gray"*/}
                        {/*                                                        style={{marginLeft: 2}}*/}
                        {/*                                                    >*/}
                        {/*                                                        <path*/}
                        {/*                                                            stroke="none"*/}
                        {/*                                                            d="M0 0h24v24H0z"*/}
                        {/*                                                            fill="none"*/}
                        {/*                                                        ></path>*/}
                        {/*                                                        <path*/}
                        {/*                                                            d="M8.243 7.34l-6.38 .925l-.113 .023a1 1 0 0 0 -.44 1.684l4.622 4.499l-1.09 6.355l-.013 .11a1 1 0 0 0 1.464 .944l5.706 -3l5.693 3l.1 .046a1 1 0 0 0 1.352 -1.1l-1.091 -6.355l4.624 -4.5l.078 -.085a1 1 0 0 0 -.633 -1.62l-6.38 -.926l-2.852 -5.78a1 1 0 0 0 -1.794 0l-2.853 5.78z"*/}
                        {/*                                                            strokeWidth="0"*/}
                        {/*                                                        ></path>*/}
                        {/*                                                    </svg>*/}
                        {/*                                                    <svg*/}
                        {/*                                                        className="icon icon-tabler icon-tabler-star-filled"*/}
                        {/*                                                        width="20px"*/}
                        {/*                                                        height="20px"*/}
                        {/*                                                        viewBox="0 0 24 24"*/}
                        {/*                                                        strokeWidth="1.5"*/}
                        {/*                                                        strokeLinecap="round"*/}
                        {/*                                                        strokeLinejoin="round"*/}
                        {/*                                                        fill="gray"*/}
                        {/*                                                        style={{marginLeft: 2}}*/}
                        {/*                                                    >*/}
                        {/*                                                        <path*/}
                        {/*                                                            stroke="none"*/}
                        {/*                                                            d="M0 0h24v24H0z"*/}
                        {/*                                                            fill="none"*/}
                        {/*                                                        ></path>*/}
                        {/*                                                        <path*/}
                        {/*                                                            d="M8.243 7.34l-6.38 .925l-.113 .023a1 1 0 0 0 -.44 1.684l4.622 4.499l-1.09 6.355l-.013 .11a1 1 0 0 0 1.464 .944l5.706 -3l5.693 3l.1 .046a1 1 0 0 0 1.352 -1.1l-1.091 -6.355l4.624 -4.5l.078 -.085a1 1 0 0 0 -.633 -1.62l-6.38 -.926l-2.852 -5.78a1 1 0 0 0 -1.794 0l-2.853 5.78z"*/}
                        {/*                                                            strokeWidth="0"*/}
                        {/*                                                        ></path>*/}
                        {/*                                                    </svg>*/}
                        {/*                                                </div>*/}
                        {/*                                                <div*/}
                        {/*                                                    className="jq-ry-rated-group jq-ry-group"*/}
                        {/*                                                    style={{width: '79.6296%'}}*/}
                        {/*                                                >*/}
                        {/*                                                    <svg*/}
                        {/*                                                        className="icon icon-tabler icon-tabler-star-filled"*/}
                        {/*                                                        width="20px"*/}
                        {/*                                                        height="20px"*/}
                        {/*                                                        viewBox="0 0 24 24"*/}
                        {/*                                                        strokeWidth="1.5"*/}
                        {/*                                                        strokeLinecap="round"*/}
                        {/*                                                        strokeLinejoin="round"*/}
                        {/*                                                        fill="#f39c12"*/}
                        {/*                                                    >*/}
                        {/*                                                        <path*/}
                        {/*                                                            stroke="none"*/}
                        {/*                                                            d="M0 0h24v24H0z"*/}
                        {/*                                                            fill="none"*/}
                        {/*                                                        ></path>*/}
                        {/*                                                        <path*/}
                        {/*                                                            d="M8.243 7.34l-6.38 .925l-.113 .023a1 1 0 0 0 -.44 1.684l4.622 4.499l-1.09 6.355l-.013 .11a1 1 0 0 0 1.464 .944l5.706 -3l5.693 3l.1 .046a1 1 0 0 0 1.352 -1.1l-1.091 -6.355l4.624 -4.5l.078 -.085a1 1 0 0 0 -.633 -1.62l-6.38 -.926l-2.852 -5.78a1 1 0 0 0 -1.794 0l-2.853 5.78z"*/}
                        {/*                                                            strokeWidth="0"*/}
                        {/*                                                        ></path>*/}
                        {/*                                                    </svg>*/}
                        {/*                                                    <svg*/}
                        {/*                                                        className="icon icon-tabler icon-tabler-star-filled"*/}
                        {/*                                                        width="20px"*/}
                        {/*                                                        height="20px"*/}
                        {/*                                                        viewBox="0 0 24 24"*/}
                        {/*                                                        strokeWidth="1.5"*/}
                        {/*                                                        strokeLinecap="round"*/}
                        {/*                                                        strokeLinejoin="round"*/}
                        {/*                                                        fill="#f39c12"*/}
                        {/*                                                        style={{marginLeft: 2}}*/}
                        {/*                                                    >*/}
                        {/*                                                        <path*/}
                        {/*                                                            stroke="none"*/}
                        {/*                                                            d="M0 0h24v24H0z"*/}
                        {/*                                                            fill="none"*/}
                        {/*                                                        ></path>*/}
                        {/*                                                        <path*/}
                        {/*                                                            d="M8.243 7.34l-6.38 .925l-.113 .023a1 1 0 0 0 -.44 1.684l4.622 4.499l-1.09 6.355l-.013 .11a1 1 0 0 0 1.464 .944l5.706 -3l5.693 3l.1 .046a1 1 0 0 0 1.352 -1.1l-1.091 -6.355l4.624 -4.5l.078 -.085a1 1 0 0 0 -.633 -1.62l-6.38 -.926l-2.852 -5.78a1 1 0 0 0 -1.794 0l-2.853 5.78z"*/}
                        {/*                                                            strokeWidth="0"*/}
                        {/*                                                        ></path>*/}
                        {/*                                                    </svg>*/}
                        {/*                                                    <svg*/}
                        {/*                                                        className="icon icon-tabler icon-tabler-star-filled"*/}
                        {/*                                                        width="20px"*/}
                        {/*                                                        height="20px"*/}
                        {/*                                                        viewBox="0 0 24 24"*/}
                        {/*                                                        strokeWidth="1.5"*/}
                        {/*                                                        strokeLinecap="round"*/}
                        {/*                                                        strokeLinejoin="round"*/}
                        {/*                                                        fill="#f39c12"*/}
                        {/*                                                        style={{marginLeft: 2}}*/}
                        {/*                                                    >*/}
                        {/*                                                        <path*/}
                        {/*                                                            stroke="none"*/}
                        {/*                                                            d="M0 0h24v24H0z"*/}
                        {/*                                                            fill="none"*/}
                        {/*                                                        ></path>*/}
                        {/*                                                        <path*/}
                        {/*                                                            d="M8.243 7.34l-6.38 .925l-.113 .023a1 1 0 0 0 -.44 1.684l4.622 4.499l-1.09 6.355l-.013 .11a1 1 0 0 0 1.464 .944l5.706 -3l5.693 3l.1 .046a1 1 0 0 0 1.352 -1.1l-1.091 -6.355l4.624 -4.5l.078 -.085a1 1 0 0 0 -.633 -1.62l-6.38 -.926l-2.852 -5.78a1 1 0 0 0 -1.794 0l-2.853 5.78z"*/}
                        {/*                                                            strokeWidth="0"*/}
                        {/*                                                        ></path>*/}
                        {/*                                                    </svg>*/}
                        {/*                                                    <svg*/}
                        {/*                                                        className="icon icon-tabler icon-tabler-star-filled"*/}
                        {/*                                                        width="20px"*/}
                        {/*                                                        height="20px"*/}
                        {/*                                                        viewBox="0 0 24 24"*/}
                        {/*                                                        strokeWidth="1.5"*/}
                        {/*                                                        strokeLinecap="round"*/}
                        {/*                                                        strokeLinejoin="round"*/}
                        {/*                                                        fill="#f39c12"*/}
                        {/*                                                        style={{marginLeft: 2}}*/}
                        {/*                                                    >*/}
                        {/*                                                        <path*/}
                        {/*                                                            stroke="none"*/}
                        {/*                                                            d="M0 0h24v24H0z"*/}
                        {/*                                                            fill="none"*/}
                        {/*                                                        ></path>*/}
                        {/*                                                        <path*/}
                        {/*                                                            d="M8.243 7.34l-6.38 .925l-.113 .023a1 1 0 0 0 -.44 1.684l4.622 4.499l-1.09 6.355l-.013 .11a1 1 0 0 0 1.464 .944l5.706 -3l5.693 3l.1 .046a1 1 0 0 0 1.352 -1.1l-1.091 -6.355l4.624 -4.5l.078 -.085a1 1 0 0 0 -.633 -1.62l-6.38 -.926l-2.852 -5.78a1 1 0 0 0 -1.794 0l-2.853 5.78z"*/}
                        {/*                                                            strokeWidth="0"*/}
                        {/*                                                        ></path>*/}
                        {/*                                                    </svg>*/}
                        {/*                                                    <svg*/}
                        {/*                                                        className="icon icon-tabler icon-tabler-star-filled"*/}
                        {/*                                                        width="20px"*/}
                        {/*                                                        height="20px"*/}
                        {/*                                                        viewBox="0 0 24 24"*/}
                        {/*                                                        strokeWidth="1.5"*/}
                        {/*                                                        strokeLinecap="round"*/}
                        {/*                                                        strokeLinejoin="round"*/}
                        {/*                                                        fill="#f39c12"*/}
                        {/*                                                        style={{marginLeft: 2}}*/}
                        {/*                                                    >*/}
                        {/*                                                        <path*/}
                        {/*                                                            stroke="none"*/}
                        {/*                                                            d="M0 0h24v24H0z"*/}
                        {/*                                                            fill="none"*/}
                        {/*                                                        ></path>*/}
                        {/*                                                        <path*/}
                        {/*                                                            d="M8.243 7.34l-6.38 .925l-.113 .023a1 1 0 0 0 -.44 1.684l4.622 4.499l-1.09 6.355l-.013 .11a1 1 0 0 0 1.464 .944l5.706 -3l5.693 3l.1 .046a1 1 0 0 0 1.352 -1.1l-1.091 -6.355l4.624 -4.5l.078 -.085a1 1 0 0 0 -.633 -1.62l-6.38 -.926l-2.852 -5.78a1 1 0 0 0 -1.794 0l-2.853 5.78z"*/}
                        {/*                                                            strokeWidth="0"*/}
                        {/*                                                        ></path>*/}
                        {/*                                                    </svg>*/}
                        {/*                                                </div>*/}
                        {/*                                            </div>*/}
                        {/*                                        </div>*/}
                        {/*                                        <input*/}
                        {/*                                            type="number"*/}
                        {/*                                            className="form-control form-control-sm w-px-100"*/}
                        {/*                                            value="1"*/}
                        {/*                                            min="1"*/}
                        {/*                                            max="5"*/}
                        {/*                                        />*/}
                        {/*                                    </div>*/}
                        {/*                                </div>*/}
                        {/*                                <div className="col-md-4">*/}
                        {/*                                    <div className="text-md-end">*/}
                        {/*                                        <button*/}
                        {/*                                            type="button"*/}
                        {/*                                            className="btn-close btn-pinned"*/}
                        {/*                                            aria-label="Close"*/}
                        {/*                                        ></button>*/}
                        {/*                                        <div className="d-flex d-md-block align-items-center mb-2 gap-2 justify-content-center justify-content-sm-start">*/}
                        {/*                                            <div className="my-2 mt-md-8 mb-md-4">*/}
                        {/*                                                <span className="text-primary">$299/</span>*/}
                        {/*                                                <s className="text-body">$359</s>*/}
                        {/*                                            </div>*/}
                        {/*                                            <button*/}
                        {/*                                                type="button"*/}
                        {/*                                                className="btn btn-sm btn-label-primary"*/}
                        {/*                                            >*/}
                        {/*                                                Move to wishlist*/}
                        {/*                                            </button>*/}
                        {/*                                        </div>*/}
                        {/*                                    </div>*/}
                        {/*                                </div>*/}
                        {/*                            </div>*/}
                        {/*                        </div>*/}
                        {/*                    </div>*/}
                        {/*                </li>*/}
                        {/*                <li className="list-group-item p-4">*/}
                        {/*                    <div className="d-flex gap-4 flex-sm-row flex-column align-items-center">*/}
                        {/*                        <div className="flex-shrink-0 d-flex align-items-center">*/}
                        {/*                            <img*/}
                        {/*                                src="../../assets/img/products/2.png"*/}
                        {/*                                alt="google home"*/}
                        {/*                                className="w-px-100"*/}
                        {/*                            />*/}
                        {/*                        </div>*/}
                        {/*                        <div className="flex-grow-1">*/}
                        {/*                            <div className="row text-center text-sm-start">*/}
                        {/*                                <div className="col-md-8">*/}
                        {/*                                    <p className="me-3 mb-2">*/}
                        {/*                                        <a href="#" className="fw-medium">*/}
                        {/*                                            <span className="text-heading">*/}
                        {/*                                                Apple iPhone 11 (64GB, Black)*/}
                        {/*                                            </span>*/}
                        {/*                                        </a>*/}
                        {/*                                    </p>*/}
                        {/*                                    <div className="text-muted mb-2 d-flex flex-wrap justify-content-center justify-content-sm-start">*/}
                        {/*                                        <span className="me-1">Sold by:</span>{" "}*/}
                        {/*                                        <a href="#" className="me-4">*/}
                        {/*                                            Apple*/}
                        {/*                                        </a>*/}
                        {/*                                        <span className="badge bg-label-success">*/}
                        {/*                                            In Stock*/}
                        {/*                                        </span>*/}
                        {/*                                    </div>*/}
                        {/*                                    <div className="d-flex d-md-block align-items-center mb-2 gap-2 justify-content-center justify-content-sm-start">*/}
                        {/*                                        <div*/}
                        {/*                                            className="read-only-ratings mb-sm-2 px-0 jq-ry-container"*/}
                        {/*                                            data-rateyo-read-only="true"*/}
                        {/*                                            readOnly*/}
                        {/*                                            style={{width: 108}}*/}
                        {/*                                        >*/}
                        {/*                                            <div className="jq-ry-group-wrapper">*/}
                        {/*                                                <div className="jq-ry-normal-group jq-ry-group">*/}
                        {/*                                                    <svg*/}
                        {/*                                                        className="icon icon-tabler icon-tabler-star-filled"*/}
                        {/*                                                        width="20px"*/}
                        {/*                                                        height="20px"*/}
                        {/*                                                        viewBox="0 0 24 24"*/}
                        {/*                                                        strokeWidth="1.5"*/}
                        {/*                                                        strokeLinecap="round"*/}
                        {/*                                                        strokeLinejoin="round"*/}
                        {/*                                                        fill="gray"*/}
                        {/*                                                    >*/}
                        {/*                                                        <path*/}
                        {/*                                                            stroke="none"*/}
                        {/*                                                            d="M0 0h24v24H0z"*/}
                        {/*                                                            fill="none"*/}
                        {/*                                                        ></path>*/}
                        {/*                                                        <path*/}
                        {/*                                                            d="M8.243 7.34l-6.38 .925l-.113 .023a1 1 0 0 0 -.44 1.684l4.622 4.499l-1.09 6.355l-.013 .11a1 1 0 0 0 1.464 .944l5.706 -3l5.693 3l.1 .046a1 1 0 0 0 1.352 -1.1l-1.091 -6.355l4.624 -4.5l.078 -.085a1 1 0 0 0 -.633 -1.62l-6.38 -.926l-2.852 -5.78a1 1 0 0 0 -1.794 0l-2.853 5.78z"*/}
                        {/*                                                            strokeWidth="0"*/}
                        {/*                                                        ></path>*/}
                        {/*                                                    </svg>*/}
                        {/*                                                    <svg*/}
                        {/*                                                        className="icon icon-tabler icon-tabler-star-filled"*/}
                        {/*                                                        width="20px"*/}
                        {/*                                                        height="20px"*/}
                        {/*                                                        viewBox="0 0 24 24"*/}
                        {/*                                                        strokeWidth="1.5"*/}
                        {/*                                                        strokeLinecap="round"*/}
                        {/*                                                        strokeLinejoin="round"*/}
                        {/*                                                        fill="gray"*/}
                        {/*                                                        style={{marginLeft: 2}}*/}
                        {/*                                                    >*/}
                        {/*                                                        <path*/}
                        {/*                                                            stroke="none"*/}
                        {/*                                                            d="M0 0h24v24H0z"*/}
                        {/*                                                            fill="none"*/}
                        {/*                                                        ></path>*/}
                        {/*                                                        <path*/}
                        {/*                                                            d="M8.243 7.34l-6.38 .925l-.113 .023a1 1 0 0 0 -.44 1.684l4.622 4.499l-1.09 6.355l-.013 .11a1 1 0 0 0 1.464 .944l5.706 -3l5.693 3l.1 .046a1 1 0 0 0 1.352 -1.1l-1.091 -6.355l4.624 -4.5l.078 -.085a1 1 0 0 0 -.633 -1.62l-6.38 -.926l-2.852 -5.78a1 1 0 0 0 -1.794 0l-2.853 5.78z"*/}
                        {/*                                                            strokeWidth="0"*/}
                        {/*                                                        ></path>*/}
                        {/*                                                    </svg>*/}
                        {/*                                                    <svg*/}
                        {/*                                                        className="icon icon-tabler icon-tabler-star-filled"*/}
                        {/*                                                        width="20px"*/}
                        {/*                                                        height="20px"*/}
                        {/*                                                        viewBox="0 0 24 24"*/}
                        {/*                                                        strokeWidth="1.5"*/}
                        {/*                                                        strokeLinecap="round"*/}
                        {/*                                                        strokeLinejoin="round"*/}
                        {/*                                                        fill="gray"*/}
                        {/*                                                        style={{marginLeft: 2}}*/}
                        {/*                                                    >*/}
                        {/*                                                        <path*/}
                        {/*                                                            stroke="none"*/}
                        {/*                                                            d="M0 0h24v24H0z"*/}
                        {/*                                                            fill="none"*/}
                        {/*                                                        ></path>*/}
                        {/*                                                        <path*/}
                        {/*                                                            d="M8.243 7.34l-6.38 .925l-.113 .023a1 1 0 0 0 -.44 1.684l4.622 4.499l-1.09 6.355l-.013 .11a1 1 0 0 0 1.464 .944l5.706 -3l5.693 3l.1 .046a1 1 0 0 0 1.352 -1.1l-1.091 -6.355l4.624 -4.5l.078 -.085a1 1 0 0 0 -.633 -1.62l-6.38 -.926l-2.852 -5.78a1 1 0 0 0 -1.794 0l-2.853 5.78z"*/}
                        {/*                                                            strokeWidth="0"*/}
                        {/*                                                        ></path>*/}
                        {/*                                                    </svg>*/}
                        {/*                                                    <svg*/}
                        {/*                                                        className="icon icon-tabler icon-tabler-star-filled"*/}
                        {/*                                                        width="20px"*/}
                        {/*                                                        height="20px"*/}
                        {/*                                                        viewBox="0 0 24 24"*/}
                        {/*                                                        strokeWidth="1.5"*/}
                        {/*                                                        strokeLinecap="round"*/}
                        {/*                                                        strokeLinejoin="round"*/}
                        {/*                                                        fill="gray"*/}
                        {/*                                                        style={{marginLeft: 2}}*/}
                        {/*                                                    >*/}
                        {/*                                                        <path*/}
                        {/*                                                            stroke="none"*/}
                        {/*                                                            d="M0 0h24v24H0z"*/}
                        {/*                                                            fill="none"*/}
                        {/*                                                        ></path>*/}
                        {/*                                                        <path*/}
                        {/*                                                            d="M8.243 7.34l-6.38 .925l-.113 .023a1 1 0 0 0 -.44 1.684l4.622 4.499l-1.09 6.355l-.013 .11a1 1 0 0 0 1.464 .944l5.706 -3l5.693 3l.1 .046a1 1 0 0 0 1.352 -1.1l-1.091 -6.355l4.624 -4.5l.078 -.085a1 1 0 0 0 -.633 -1.62l-6.38 -.926l-2.852 -5.78a1 1 0 0 0 -1.794 0l-2.853 5.78z"*/}
                        {/*                                                            strokeWidth="0"*/}
                        {/*                                                        ></path>*/}
                        {/*                                                    </svg>*/}
                        {/*                                                    <svg*/}
                        {/*                                                        className="icon icon-tabler icon-tabler-star-filled"*/}
                        {/*                                                        width="20px"*/}
                        {/*                                                        height="20px"*/}
                        {/*                                                        viewBox="0 0 24 24"*/}
                        {/*                                                        strokeWidth="1.5"*/}
                        {/*                                                        strokeLinecap="round"*/}
                        {/*                                                        strokeLinejoin="round"*/}
                        {/*                                                        fill="gray"*/}
                        {/*                                                        style={{marginLeft: 2}}*/}
                        {/*                                                    >*/}
                        {/*                                                        <path*/}
                        {/*                                                            stroke="none"*/}
                        {/*                                                            d="M0 0h24v24H0z"*/}
                        {/*                                                            fill="none"*/}
                        {/*                                                        ></path>*/}
                        {/*                                                        <path*/}
                        {/*                                                            d="M8.243 7.34l-6.38 .925l-.113 .023a1 1 0 0 0 -.44 1.684l4.622 4.499l-1.09 6.355l-.013 .11a1 1 0 0 0 1.464 .944l5.706 -3l5.693 3l.1 .046a1 1 0 0 0 1.352 -1.1l-1.091 -6.355l4.624 -4.5l.078 -.085a1 1 0 0 0 -.633 -1.62l-6.38 -.926l-2.852 -5.78a1 1 0 0 0 -1.794 0l-2.853 5.78z"*/}
                        {/*                                                            strokeWidth="0"*/}
                        {/*                                                        ></path>*/}
                        {/*                                                    </svg>*/}
                        {/*                                                </div>*/}
                        {/*                                                <div*/}
                        {/*                                                    className="jq-ry-rated-group jq-ry-group"*/}
                        {/*                                                    style={{width: '79.6296%'}}*/}
                        {/*                                                >*/}
                        {/*                                                    <svg*/}
                        {/*                                                        className="icon icon-tabler icon-tabler-star-filled"*/}
                        {/*                                                        width="20px"*/}
                        {/*                                                        height="20px"*/}
                        {/*                                                        viewBox="0 0 24 24"*/}
                        {/*                                                        strokeWidth="1.5"*/}
                        {/*                                                        strokeLinecap="round"*/}
                        {/*                                                        strokeLinejoin="round"*/}
                        {/*                                                        fill="#f39c12"*/}
                        {/*                                                    >*/}
                        {/*                                                        <path*/}
                        {/*                                                            stroke="none"*/}
                        {/*                                                            d="M0 0h24v24H0z"*/}
                        {/*                                                            fill="none"*/}
                        {/*                                                        ></path>*/}
                        {/*                                                        <path*/}
                        {/*                                                            d="M8.243 7.34l-6.38 .925l-.113 .023a1 1 0 0 0 -.44 1.684l4.622 4.499l-1.09 6.355l-.013 .11a1 1 0 0 0 1.464 .944l5.706 -3l5.693 3l.1 .046a1 1 0 0 0 1.352 -1.1l-1.091 -6.355l4.624 -4.5l.078 -.085a1 1 0 0 0 -.633 -1.62l-6.38 -.926l-2.852 -5.78a1 1 0 0 0 -1.794 0l-2.853 5.78z"*/}
                        {/*                                                            strokeWidth="0"*/}
                        {/*                                                        ></path>*/}
                        {/*                                                    </svg>*/}
                        {/*                                                    <svg*/}
                        {/*                                                        className="icon icon-tabler icon-tabler-star-filled"*/}
                        {/*                                                        width="20px"*/}
                        {/*                                                        height="20px"*/}
                        {/*                                                        viewBox="0 0 24 24"*/}
                        {/*                                                        strokeWidth="1.5"*/}
                        {/*                                                        strokeLinecap="round"*/}
                        {/*                                                        strokeLinejoin="round"*/}
                        {/*                                                        fill="#f39c12"*/}
                        {/*                                                        style={{marginLeft: 2}}*/}
                        {/*                                                    >*/}
                        {/*                                                        <path*/}
                        {/*                                                            stroke="none"*/}
                        {/*                                                            d="M0 0h24v24H0z"*/}
                        {/*                                                            fill="none"*/}
                        {/*                                                        ></path>*/}
                        {/*                                                        <path*/}
                        {/*                                                            d="M8.243 7.34l-6.38 .925l-.113 .023a1 1 0 0 0 -.44 1.684l4.622 4.499l-1.09 6.355l-.013 .11a1 1 0 0 0 1.464 .944l5.706 -3l5.693 3l.1 .046a1 1 0 0 0 1.352 -1.1l-1.091 -6.355l4.624 -4.5l.078 -.085a1 1 0 0 0 -.633 -1.62l-6.38 -.926l-2.852 -5.78a1 1 0 0 0 -1.794 0l-2.853 5.78z"*/}
                        {/*                                                            strokeWidth="0"*/}
                        {/*                                                        ></path>*/}
                        {/*                                                    </svg>*/}
                        {/*                                                    <svg*/}
                        {/*                                                        className="icon icon-tabler icon-tabler-star-filled"*/}
                        {/*                                                        width="20px"*/}
                        {/*                                                        height="20px"*/}
                        {/*                                                        viewBox="0 0 24 24"*/}
                        {/*                                                        strokeWidth="1.5"*/}
                        {/*                                                        strokeLinecap="round"*/}
                        {/*                                                        strokeLinejoin="round"*/}
                        {/*                                                        fill="#f39c12"*/}
                        {/*                                                        style={{marginLeft: 2}}*/}
                        {/*                                                    >*/}
                        {/*                                                        <path*/}
                        {/*                                                            stroke="none"*/}
                        {/*                                                            d="M0 0h24v24H0z"*/}
                        {/*                                                            fill="none"*/}
                        {/*                                                        ></path>*/}
                        {/*                                                        <path*/}
                        {/*                                                            d="M8.243 7.34l-6.38 .925l-.113 .023a1 1 0 0 0 -.44 1.684l4.622 4.499l-1.09 6.355l-.013 .11a1 1 0 0 0 1.464 .944l5.706 -3l5.693 3l.1 .046a1 1 0 0 0 1.352 -1.1l-1.091 -6.355l4.624 -4.5l.078 -.085a1 1 0 0 0 -.633 -1.62l-6.38 -.926l-2.852 -5.78a1 1 0 0 0 -1.794 0l-2.853 5.78z"*/}
                        {/*                                                            strokeWidth="0"*/}
                        {/*                                                        ></path>*/}
                        {/*                                                    </svg>*/}
                        {/*                                                    <svg*/}
                        {/*                                                        className="icon icon-tabler icon-tabler-star-filled"*/}
                        {/*                                                        width="20px"*/}
                        {/*                                                        height="20px"*/}
                        {/*                                                        viewBox="0 0 24 24"*/}
                        {/*                                                        strokeWidth="1.5"*/}
                        {/*                                                        strokeLinecap="round"*/}
                        {/*                                                        strokeLinejoin="round"*/}
                        {/*                                                        fill="#f39c12"*/}
                        {/*                                                        style={{marginLeft: 2}}*/}
                        {/*                                                    >*/}
                        {/*                                                        <path*/}
                        {/*                                                            stroke="none"*/}
                        {/*                                                            d="M0 0h24v24H0z"*/}
                        {/*                                                            fill="none"*/}
                        {/*                                                        ></path>*/}
                        {/*                                                        <path*/}
                        {/*                                                            d="M8.243 7.34l-6.38 .925l-.113 .023a1 1 0 0 0 -.44 1.684l4.622 4.499l-1.09 6.355l-.013 .11a1 1 0 0 0 1.464 .944l5.706 -3l5.693 3l.1 .046a1 1 0 0 0 1.352 -1.1l-1.091 -6.355l4.624 -4.5l.078 -.085a1 1 0 0 0 -.633 -1.62l-6.38 -.926l-2.852 -5.78a1 1 0 0 0 -1.794 0l-2.853 5.78z"*/}
                        {/*                                                            strokeWidth="0"*/}
                        {/*                                                        ></path>*/}
                        {/*                                                    </svg>*/}
                        {/*                                                    <svg*/}
                        {/*                                                        className="icon icon-tabler icon-tabler-star-filled"*/}
                        {/*                                                        width="20px"*/}
                        {/*                                                        height="20px"*/}
                        {/*                                                        viewBox="0 0 24 24"*/}
                        {/*                                                        strokeWidth="1.5"*/}
                        {/*                                                        strokeLinecap="round"*/}
                        {/*                                                        strokeLinejoin="round"*/}
                        {/*                                                        fill="#f39c12"*/}
                        {/*                                                        style={{marginLeft: 2}}*/}
                        {/*                                                    >*/}
                        {/*                                                        <path*/}
                        {/*                                                            stroke="none"*/}
                        {/*                                                            d="M0 0h24v24H0z"*/}
                        {/*                                                            fill="none"*/}
                        {/*                                                        ></path>*/}
                        {/*                                                        <path*/}
                        {/*                                                            d="M8.243 7.34l-6.38 .925l-.113 .023a1 1 0 0 0 -.44 1.684l4.622 4.499l-1.09 6.355l-.013 .11a1 1 0 0 0 1.464 .944l5.706 -3l5.693 3l.1 .046a1 1 0 0 0 1.352 -1.1l-1.091 -6.355l4.624 -4.5l.078 -.085a1 1 0 0 0 -.633 -1.62l-6.38 -.926l-2.852 -5.78a1 1 0 0 0 -1.794 0l-2.853 5.78z"*/}
                        {/*                                                            strokeWidth="0"*/}
                        {/*                                                        ></path>*/}
                        {/*                                                    </svg>*/}
                        {/*                                                </div>*/}
                        {/*                                            </div>*/}
                        {/*                                        </div>*/}
                        {/*                                        <input*/}
                        {/*                                            type="number"*/}
                        {/*                                            className="form-control form-control-sm w-px-100"*/}
                        {/*                                            value="1"*/}
                        {/*                                            min="1"*/}
                        {/*                                            max="5"*/}
                        {/*                                        />*/}
                        {/*                                    </div>*/}
                        {/*                                </div>*/}
                        {/*                                <div className="col-md-4">*/}
                        {/*                                    <div className="text-md-end">*/}
                        {/*                                        <button*/}
                        {/*                                            type="button"*/}
                        {/*                                            className="btn-close btn-pinned checkout-btn-close"*/}
                        {/*                                            aria-label="Close"*/}
                        {/*                                        ></button>*/}
                        {/*                                        <div className="d-flex d-md-block align-items-center mb-2 gap-2 justify-content-center justify-content-sm-start">*/}
                        {/*                                            <div className="my-2 mt-md-8 mb-md-4">*/}
                        {/*                                                <span className="text-primary">$299/</span>*/}
                        {/*                                                <s className="text-body">$359</s>*/}
                        {/*                                            </div>*/}
                        {/*                                            <button*/}
                        {/*                                                type="button"*/}
                        {/*                                                className="btn btn-sm btn-label-primary"*/}
                        {/*                                            >*/}
                        {/*                                                Move to wishlist*/}
                        {/*                                            </button>*/}
                        {/*                                        </div>*/}
                        {/*                                    </div>*/}
                        {/*                                </div>*/}
                        {/*                            </div>*/}
                        {/*                        </div>*/}
                        {/*                    </div>*/}
                        {/*                </li>*/}
                        {/*            </ul>*/}

                        {/*            <div className="list-group">*/}
                        {/*                <a*/}
                        {/*                    href="#"*/}
                        {/*                    className="list-group-item text-primary border-primary d-flex justify-content-between"*/}
                        {/*                >*/}
                        {/*                    <span className="fw-medium">*/}
                        {/*                        Add more products from wishlist*/}
                        {/*                    </span>*/}
                        {/*                    <i className="bx bx-sm bx-right-arrow-alt scaleX-n1-rtl mt-50"></i>*/}
                        {/*                </a>*/}
                        {/*            </div>*/}
                        {/*        </div>*/}

                        {/*        <div className="col-xl-4">*/}
                        {/*            <div className="border rounded p-4 mb-4">*/}
                        {/*                <h6>Offer</h6>*/}
                        {/*                <div className="row g-4 mb-4">*/}
                        {/*                    <div className="col-8 col-xxl-8 col-xl-12">*/}
                        {/*                        <input*/}
                        {/*                            type="text"*/}
                        {/*                            className="form-control"*/}
                        {/*                            placeholder="Enter Promo Code"*/}
                        {/*                            aria-label="Enter Promo Code"*/}
                        {/*                        />*/}
                        {/*                    </div>*/}
                        {/*                    <div className="col-4 col-xxl-4 col-xl-12">*/}
                        {/*                        <div className="d-grid">*/}
                        {/*                            <button*/}
                        {/*                                type="button"*/}
                        {/*                                className="btn btn-label-primary"*/}
                        {/*                            >*/}
                        {/*                                Apply*/}
                        {/*                            </button>*/}
                        {/*                        </div>*/}
                        {/*                    </div>*/}
                        {/*                </div>*/}

                        {/*                <div className="bg-lighter rounded p-4">*/}
                        {/*                    <h6 className="mb-2">Buying gift for a loved one?</h6>*/}
                        {/*                    <p className="mb-2">*/}
                        {/*                        Gift wrap and personalized message on card, Only for $2.*/}
                        {/*                    </p>*/}
                        {/*                    <a href="#" className="fw-medium">*/}
                        {/*                        Add a gift wrap*/}
                        {/*                    </a>*/}
                        {/*                </div>*/}
                        {/*                <hr className="mx-n6 my-4" />*/}

                        {/*                <h6>Price Details</h6>*/}
                        {/*                <dl className="row mb-0 text-heading">*/}
                        {/*                    <dt className="col-6 fw-normal">Bag Total</dt>*/}
                        {/*                    <dd className="col-6 text-end">$1198.00</dd>*/}

                        {/*                    <dt className="col-6 fw-normal">Coupon Discount</dt>*/}
                        {/*                    <dd className="col-6 text-primary text-end">*/}
                        {/*                        Apply Coupon*/}
                        {/*                    </dd>*/}

                        {/*                    <dt className="col-6 fw-normal">Order Total</dt>*/}
                        {/*                    <dd className="col-6 text-end">$1198.00</dd>*/}

                        {/*                    <dt className="col-6 fw-normal">Delivery Charges</dt>*/}
                        {/*                    <dd className="col-6 text-end">*/}
                        {/*                        <s className="text-muted">$5.00</s>{" "}*/}
                        {/*                        <span className="badge bg-label-success ms-1">*/}
                        {/*                            Free*/}
                        {/*                        </span>*/}
                        {/*                    </dd>*/}
                        {/*                </dl>*/}

                        {/*                <hr className="mx-n6 my-4" />*/}
                        {/*                <dl className="row mb-0">*/}
                        {/*                    <dt className="col-6 text-heading">Total</dt>*/}
                        {/*                    <dd className="col-6 fw-medium text-end text-heading mb-0">*/}
                        {/*                        $1198.00*/}
                        {/*                    </dd>*/}
                        {/*                </dl>*/}
                        {/*            </div>*/}
                        {/*            <div className="d-grid">*/}
                        {/*                <button className="btn btn-primary btn-next">*/}
                        {/*                    Place Order*/}
                        {/*                </button>*/}
                        {/*            </div>*/}
                        {/*        </div>*/}
                        {/*    </div>*/}
                        {/*</div>*/}

                        {/*<div*/}
                        {/*    id="checkout-address"*/}
                        {/*    className="content fv-plugins-bootstrap5 fv-plugins-framework"*/}
                        {/*>*/}
                        {/*    <div className="row">*/}
                        {/*        <div className="col-xl-8 mb-4 mb-xl-0">*/}
                        {/*            <p className="fw-medium text-heading">*/}
                        {/*                Select your preferable address*/}
                        {/*            </p>*/}
                        {/*            <div className="row mb-4 g-4">*/}
                        {/*                <div className="col-md">*/}
                        {/*                    <div className="form-check custom-option custom-option-basic checked">*/}
                        {/*                        <label*/}
                        {/*                            className="form-check-label custom-option-content"*/}
                        {/*                            htmlFor="customRadioAddress1"*/}
                        {/*                        >*/}
                        {/*                            <input*/}
                        {/*                                name="customRadioTemp"*/}
                        {/*                                className="form-check-input"*/}
                        {/*                                type="radio"*/}
                        {/*                                value=""*/}
                        {/*                                id="customRadioAddress1"*/}
                        {/*                                checked=""*/}
                        {/*                            />*/}
                        {/*                            <span className="custom-option-header mb-2">*/}
                        {/*                                <span className="fw-medium text-heading mb-0">*/}
                        {/*                                    John Doe (Default)*/}
                        {/*                                </span>*/}
                        {/*                                <span className="badge bg-label-primary">Home</span>*/}
                        {/*                            </span>*/}
                        {/*                            <span className="custom-option-body">*/}
                        {/*                                <small>*/}
                        {/*                                    4135 Parkway Street, Los Angeles, CA, 90017.*/}
                        {/*                                    <br /> Mobile : 1234567890 Card / Cash on delivery*/}
                        {/*                                    available*/}
                        {/*                                </small>*/}
                        {/*                                <span className="my-3 border-bottom d-block"></span>*/}
                        {/*                                <span className="d-flex mb-1_5">*/}
                        {/*                                    <a className="me-4" href="#">*/}
                        {/*                                        Edit*/}
                        {/*                                    </a>{" "}*/}
                        {/*                                    <a href="#">Remove</a>*/}
                        {/*                                </span>*/}
                        {/*                            </span>*/}
                        {/*                        </label>*/}
                        {/*                    </div>*/}
                        {/*                </div>*/}
                        {/*                <div className="col-md">*/}
                        {/*                    <div className="form-check custom-option custom-option-basic">*/}
                        {/*                        <label*/}
                        {/*                            className="form-check-label custom-option-content"*/}
                        {/*                            htmlFor="customRadioAddress2"*/}
                        {/*                        >*/}
                        {/*                            <input*/}
                        {/*                                name="customRadioTemp"*/}
                        {/*                                className="form-check-input"*/}
                        {/*                                type="radio"*/}
                        {/*                                value=""*/}
                        {/*                                id="customRadioAddress2"*/}
                        {/*                            />*/}
                        {/*                            <span className="custom-option-header mb-2">*/}
                        {/*                                <span className="fw-medium text-heading mb-0">*/}
                        {/*                                    ACME Inc.*/}
                        {/*                                </span>*/}
                        {/*                                <span className="badge bg-label-success">*/}
                        {/*                                    Office*/}
                        {/*                                </span>*/}
                        {/*                            </span>*/}
                        {/*                            <span className="custom-option-body">*/}
                        {/*                                <small>*/}
                        {/*                                    87 Hoffman Avenue, New York, NY, 10016.*/}
                        {/*                                    <br />*/}
                        {/*                                    Mobile : 1234567890 Card / Cash on delivery*/}
                        {/*                                    available*/}
                        {/*                                </small>*/}
                        {/*                                <span className="my-3 border-bottom d-block"></span>*/}
                        {/*                                <span className="d-flex mb-1_5">*/}
                        {/*                                    <a className="me-4" href="#">*/}
                        {/*                                        Edit*/}
                        {/*                                    </a>{" "}*/}
                        {/*                                    <a href="#">Remove</a>*/}
                        {/*                                </span>*/}
                        {/*                            </span>*/}
                        {/*                        </label>*/}
                        {/*                    </div>*/}
                        {/*                </div>*/}
                        {/*            </div>*/}
                        {/*            <button*/}
                        {/*                type="button"*/}
                        {/*                className="btn btn-label-primary mb-4"*/}
                        {/*                data-bs-toggle="modal"*/}
                        {/*                data-bs-target="#addNewAddress"*/}
                        {/*            >*/}
                        {/*                Add new address*/}
                        {/*            </button>*/}

                        {/*            <p className="fw-medium text-heading">*/}
                        {/*                Choose Delivery Speed*/}
                        {/*            </p>*/}
                        {/*            <div className="row mt-2">*/}
                        {/*                <div className="col-md mb-md-0 mb-2">*/}
                        {/*                    <div className="form-check custom-option custom-option-icon position-relative">*/}
                        {/*                        <label*/}
                        {/*                            className="form-check-label custom-option-content"*/}
                        {/*                            htmlFor="customRadioDelivery1"*/}
                        {/*                        >*/}
                        {/*                            <span className="custom-option-body">*/}
                        {/*                                <i className="bx bx-user mb-2"></i>*/}
                        {/*                                <span className="custom-option-title mb-2">*/}
                        {/*                                    Standard*/}
                        {/*                                </span>*/}
                        {/*                                <span className="badge bg-label-success btn-pinned">*/}
                        {/*                                    FREE*/}
                        {/*                                </span>*/}
                        {/*                                <small>Get your product in 1 Week.</small>*/}
                        {/*                            </span>*/}
                        {/*                            <input*/}
                        {/*                                name="customRadioIcon"*/}
                        {/*                                className="form-check-input"*/}
                        {/*                                type="radio"*/}
                        {/*                                value=""*/}
                        {/*                                id="customRadioDelivery1"*/}
                        {/*                                checked=""*/}
                        {/*                            />*/}
                        {/*                        </label>*/}
                        {/*                    </div>*/}
                        {/*                </div>*/}
                        {/*                <div className="col-md mb-md-0 mb-2">*/}
                        {/*                    <div className="form-check custom-option custom-option-icon position-relative">*/}
                        {/*                        <label*/}
                        {/*                            className="form-check-label custom-option-content"*/}
                        {/*                            htmlFor="customRadioDelivery2"*/}
                        {/*                        >*/}
                        {/*                            <span className="custom-option-body">*/}
                        {/*                                <i className="bx bx-star mb-2"></i>*/}
                        {/*                                <span className="custom-option-title mb-2">*/}
                        {/*                                    Express*/}
                        {/*                                </span>*/}
                        {/*                                <span className="badge bg-label-secondary btn-pinned">*/}
                        {/*                                    $10*/}
                        {/*                                </span>*/}
                        {/*                                <small>Get your product in 3-4 days.</small>*/}
                        {/*                            </span>*/}
                        {/*                            <input*/}
                        {/*                                name="customRadioIcon"*/}
                        {/*                                className="form-check-input"*/}
                        {/*                                type="radio"*/}
                        {/*                                value=""*/}
                        {/*                                id="customRadioDelivery2"*/}
                        {/*                            />*/}
                        {/*                        </label>*/}
                        {/*                    </div>*/}
                        {/*                </div>*/}
                        {/*                <div className="col-md">*/}
                        {/*                    <div className="form-check custom-option custom-option-icon position-relative checked">*/}
                        {/*                        <label*/}
                        {/*                            className="form-check-label custom-option-content"*/}
                        {/*                            htmlFor="customRadioDelivery3"*/}
                        {/*                        >*/}
                        {/*                            <span className="custom-option-body">*/}
                        {/*                                <i className="bx bx-crown mb-2"></i>*/}
                        {/*                                <span className="custom-option-title mb-2">*/}
                        {/*                                    Overnight*/}
                        {/*                                </span>*/}
                        {/*                                <span className="badge bg-label-secondary btn-pinned">*/}
                        {/*                                    $15*/}
                        {/*                                </span>*/}
                        {/*                                <small>Get your product in 0-1 days.</small>*/}
                        {/*                            </span>*/}
                        {/*                            <input*/}
                        {/*                                name="customRadioIcon"*/}
                        {/*                                className="form-check-input"*/}
                        {/*                                type="radio"*/}
                        {/*                                value=""*/}
                        {/*                                id="customRadioDelivery3"*/}
                        {/*                            />*/}
                        {/*                        </label>*/}
                        {/*                    </div>*/}
                        {/*                </div>*/}
                        {/*            </div>*/}
                        {/*        </div>*/}

                        {/*        <div className="col-xl-4">*/}
                        {/*            <div className="border rounded p-4 mb-4">*/}
                        {/*                <h6>Estimated Delivery Date</h6>*/}
                        {/*                <ul className="list-unstyled">*/}
                        {/*                    <li className="d-flex gap-4 align-items-center py-2 mb-4">*/}
                        {/*                        <div className="flex-shrink-0">*/}
                        {/*                            <img*/}
                        {/*                                src="../../assets/img/products/1.png"*/}
                        {/*                                alt="google home"*/}
                        {/*                                className="w-px-50"*/}
                        {/*                            />*/}
                        {/*                        </div>*/}
                        {/*                        <div className="flex-grow-1">*/}
                        {/*                            <p className="mb-0">*/}
                        {/*                                <a className="text-body" href="#">*/}
                        {/*                                    Google - Google Home - White*/}
                        {/*                                </a>*/}
                        {/*                            </p>*/}
                        {/*                            <p className="fw-medium mb-0">18th Nov 2021</p>*/}
                        {/*                        </div>*/}
                        {/*                    </li>*/}
                        {/*                    <li className="d-flex gap-4 align-items-center py-2">*/}
                        {/*                        <div className="flex-shrink-0">*/}
                        {/*                            <img*/}
                        {/*                                src="../../assets/img/products/2.png"*/}
                        {/*                                alt="google home"*/}
                        {/*                                className="w-px-50"*/}
                        {/*                            />*/}
                        {/*                        </div>*/}
                        {/*                        <div className="flex-grow-1">*/}
                        {/*                            <p className="mb-0">*/}
                        {/*                                <a className="text-body" href="#">*/}
                        {/*                                    Apple iPhone 11 (64GB, Black)*/}
                        {/*                                </a>*/}
                        {/*                            </p>*/}
                        {/*                            <p className="fw-medium mb-0">20th Nov 2021</p>*/}
                        {/*                        </div>*/}
                        {/*                    </li>*/}
                        {/*                </ul>*/}

                        {/*                <hr className="mx-n6 my-4" />*/}

                        {/*                <h6>Price Details</h6>*/}
                        {/*                <dl className="row mb-0 text-heading">*/}
                        {/*                    <dt className="col-6 fw-normal">Order Total</dt>*/}
                        {/*                    <dd className="col-6 text-end">$1198.00</dd>*/}

                        {/*                    <dt className="col-6 fw-normal">Delivery Charges</dt>*/}
                        {/*                    <dd className="col-6 text-end">*/}
                        {/*                        <s className="text-muted">$5.00</s>{" "}*/}
                        {/*                        <span className="badge bg-label-success ms-2">*/}
                        {/*                            Free*/}
                        {/*                        </span>*/}
                        {/*                    </dd>*/}
                        {/*                </dl>*/}
                        {/*                <hr className="mx-n6 my-4" />*/}
                        {/*                <dl className="row mb-0">*/}
                        {/*                    <dt className="col-6 text-heading">Total</dt>*/}
                        {/*                    <dd className="col-6 fw-medium text-end text-heading mb-0">*/}
                        {/*                        $1198.00*/}
                        {/*                    </dd>*/}
                        {/*                </dl>*/}
                        {/*            </div>*/}
                        {/*            <div className="d-grid">*/}
                        {/*                <button className="btn btn-primary btn-next">*/}
                        {/*                    Place Order*/}
                        {/*                </button>*/}
                        {/*            </div>*/}
                        {/*        </div>*/}
                        {/*    </div>*/}
                        {/*</div>*/}

                        {/*<div*/}
                        {/*    id="checkout-payment"*/}
                        {/*    className="content fv-plugins-bootstrap5 fv-plugins-framework"*/}
                        {/*>*/}
                        {/*    <div className="row">*/}
                        {/*        <div className="col-xl-8 mb-4 mb-xl-0">*/}
                        {/*            <div className="alert alert-success mb-4" role="alert">*/}
                        {/*                <div className="d-flex gap-4">*/}
                        {/*                    <div className="alert-icon flex-shrink-0 rounded-circle me-0">*/}
                        {/*                        <i className="bx bx-purchase-tag"></i>*/}
                        {/*                    </div>*/}
                        {/*                    <div className="flex-grow-1">*/}
                        {/*                        <h5 className="alert-heading mb-1">Available Offers</h5>*/}
                        {/*                        <ul className="list-unstyled mb-0">*/}
                        {/*                            <li>*/}
                        {/*                                {" "}*/}
                        {/*                                - 10% Instant Discount on Bank of America Corp Bank*/}
                        {/*                                Debit and Credit cards*/}
                        {/*                            </li>*/}
                        {/*                            <li>*/}
                        {/*                                {" "}*/}
                        {/*                                - 25% Cashback Voucher of up to $60 on first ever*/}
                        {/*                                PayPal transaction. TCA*/}
                        {/*                            </li>*/}
                        {/*                        </ul>*/}
                        {/*                    </div>*/}
                        {/*                </div>*/}
                        {/*                <button*/}
                        {/*                    type="button"*/}
                        {/*                    className="btn-close btn-pinned"*/}
                        {/*                    data-bs-dismiss="alert"*/}
                        {/*                    aria-label="Close"*/}
                        {/*                ></button>*/}
                        {/*            </div>*/}

                        {/*            <div className="col-xxl-6 col-lg-8">*/}
                        {/*                <div className="nav-align-top">*/}
                        {/*                    <ul*/}
                        {/*                        className="nav nav-pills row-gap-2"*/}
                        {/*                        id="paymentTabs"*/}
                        {/*                        role="tablist"*/}
                        {/*                    >*/}
                        {/*                        <li className="nav-item" role="presentation">*/}
                        {/*                            <button*/}
                        {/*                                className="nav-link active"*/}
                        {/*                                id="pills-cc-tab"*/}
                        {/*                                data-bs-toggle="pill"*/}
                        {/*                                data-bs-target="#pills-cc"*/}
                        {/*                                type="button"*/}
                        {/*                                role="tab"*/}
                        {/*                                aria-controls="pills-cc"*/}
                        {/*                                aria-selected="true"*/}
                        {/*                            >*/}
                        {/*                                Card*/}
                        {/*                            </button>*/}
                        {/*                        </li>*/}
                        {/*                        <li className="nav-item" role="presentation">*/}
                        {/*                            <button*/}
                        {/*                                className="nav-link"*/}
                        {/*                                id="pills-cod-tab"*/}
                        {/*                                data-bs-toggle="pill"*/}
                        {/*                                data-bs-target="#pills-cod"*/}
                        {/*                                type="button"*/}
                        {/*                                role="tab"*/}
                        {/*                                aria-controls="pills-cod"*/}
                        {/*                                aria-selected="false"*/}
                        {/*                                tabIndex="-1"*/}
                        {/*                            >*/}
                        {/*                                Cash On Delivery*/}
                        {/*                            </button>*/}
                        {/*                        </li>*/}
                        {/*                        <li className="nav-item" role="presentation">*/}
                        {/*                            <button*/}
                        {/*                                className="nav-link"*/}
                        {/*                                id="pills-gift-card-tab"*/}
                        {/*                                data-bs-toggle="pill"*/}
                        {/*                                data-bs-target="#pills-gift-card"*/}
                        {/*                                type="button"*/}
                        {/*                                role="tab"*/}
                        {/*                                aria-controls="pills-gift-card"*/}
                        {/*                                aria-selected="false"*/}
                        {/*                                tabIndex="-1"*/}
                        {/*                            >*/}
                        {/*                                Gift Card*/}
                        {/*                            </button>*/}
                        {/*                        </li>*/}
                        {/*                    </ul>*/}
                        {/*                </div>*/}
                        {/*                <div*/}
                        {/*                    className="tab-content px-0 pb-0"*/}
                        {/*                    id="paymentTabsContent"*/}
                        {/*                >*/}
                        {/*                    <div*/}
                        {/*                        className="tab-pane fade show active"*/}
                        {/*                        id="pills-cc"*/}
                        {/*                        role="tabpanel"*/}
                        {/*                        aria-labelledby="pills-cc-tab"*/}
                        {/*                    >*/}
                        {/*                        <div className="row g-4">*/}
                        {/*                            <div className="col-12">*/}
                        {/*                                <label*/}
                        {/*                                    className="form-label w-100"*/}
                        {/*                                    htmlFor="paymentCard"*/}
                        {/*                                >*/}
                        {/*                                    Card Number*/}
                        {/*                                </label>*/}
                        {/*                                <div className="input-group input-group-merge">*/}
                        {/*                                    <input*/}
                        {/*                                        id="paymentCard"*/}
                        {/*                                        name="paymentCard"*/}
                        {/*                                        className="form-control credit-card-mask"*/}
                        {/*                                        type="text"*/}
                        {/*                                        placeholder="1356 3215 6548 7898"*/}
                        {/*                                        aria-describedby="paymentCard2"*/}
                        {/*                                    />*/}
                        {/*                                    <span*/}
                        {/*                                        className="input-group-text cursor-pointer"*/}
                        {/*                                        id="paymentCard2"*/}
                        {/*                                    >*/}
                        {/*                                        <span className="card-type"></span>*/}
                        {/*                                    </span>*/}
                        {/*                                </div>*/}
                        {/*                            </div>*/}
                        {/*                            <div className="col-12 col-md-6">*/}
                        {/*                                <label*/}
                        {/*                                    className="form-label"*/}
                        {/*                                    htmlFor="paymentCardName"*/}
                        {/*                                >*/}
                        {/*                                    Name*/}
                        {/*                                </label>*/}
                        {/*                                <input*/}
                        {/*                                    type="text"*/}
                        {/*                                    id="paymentCardName"*/}
                        {/*                                    className="form-control"*/}
                        {/*                                    placeholder="John Doe"*/}
                        {/*                                />*/}
                        {/*                            </div>*/}
                        {/*                            <div className="col-6 col-md-3">*/}
                        {/*                                <label*/}
                        {/*                                    className="form-label"*/}
                        {/*                                    htmlFor="paymentCardExpiryDate"*/}
                        {/*                                >*/}
                        {/*                                    Exp. Date*/}
                        {/*                                </label>*/}
                        {/*                                <input*/}
                        {/*                                    type="text"*/}
                        {/*                                    id="paymentCardExpiryDate"*/}
                        {/*                                    className="form-control expiry-date-mask"*/}
                        {/*                                    placeholder="MM/YY"*/}
                        {/*                                />*/}
                        {/*                            </div>*/}
                        {/*                            <div className="col-6 col-md-3">*/}
                        {/*                                <label*/}
                        {/*                                    className="form-label"*/}
                        {/*                                    htmlFor="paymentCardCvv"*/}
                        {/*                                >*/}
                        {/*                                    CVV Code*/}
                        {/*                                </label>*/}
                        {/*                                <div className="input-group input-group-merge">*/}
                        {/*                                    <input*/}
                        {/*                                        type="text"*/}
                        {/*                                        id="paymentCardCvv"*/}
                        {/*                                        className="form-control cvv-code-mask"*/}
                        {/*                                        maxLength="3"*/}
                        {/*                                        placeholder="654"*/}
                        {/*                                    />*/}
                        {/*                                    <span*/}
                        {/*                                        className="input-group-text cursor-pointer"*/}
                        {/*                                        id="paymentCardCvv2"*/}
                        {/*                                    >*/}
                        {/*                                        <i*/}
                        {/*                                            className="bx bx-help-circle text-muted"*/}
                        {/*                                            data-bs-toggle="tooltip"*/}
                        {/*                                            data-bs-placement="top"*/}
                        {/*                                            aria-label="Card Verification Value"*/}
                        {/*                                            data-bs-original-title="Card Verification Value"*/}
                        {/*                                        ></i>*/}
                        {/*                                    </span>*/}
                        {/*                                </div>*/}
                        {/*                            </div>*/}
                        {/*                            <div className="col-12">*/}
                        {/*                                <div className="form-check form-switch mt-2 ms-2">*/}
                        {/*                                    <input*/}
                        {/*                                        type="checkbox"*/}
                        {/*                                        className="form-check-input"*/}
                        {/*                                        id="cardFutureBilling"*/}
                        {/*                                    />*/}
                        {/*                                    <label*/}
                        {/*                                        htmlFor="cardFutureBilling"*/}
                        {/*                                        className="form-check-label"*/}
                        {/*                                    >*/}
                        {/*                                        Save card for future billing?*/}
                        {/*                                    </label>*/}
                        {/*                                </div>*/}
                        {/*                            </div>*/}
                        {/*                            <div className="col-12">*/}
                        {/*                                <button*/}
                        {/*                                    type="button"*/}
                        {/*                                    className="btn btn-primary btn-next me-3"*/}
                        {/*                                >*/}
                        {/*                                    Save Changes*/}
                        {/*                                </button>*/}
                        {/*                                <button*/}
                        {/*                                    type="reset"*/}
                        {/*                                    className="btn btn-label-secondary"*/}
                        {/*                                >*/}
                        {/*                                    Reset*/}
                        {/*                                </button>*/}
                        {/*                            </div>*/}
                        {/*                        </div>*/}
                        {/*                    </div>*/}

                        {/*                    <div*/}
                        {/*                        className="tab-pane fade"*/}
                        {/*                        id="pills-cod"*/}
                        {/*                        role="tabpanel"*/}
                        {/*                        aria-labelledby="pills-cod-tab"*/}
                        {/*                    >*/}
                        {/*                        <p>*/}
                        {/*                            Cash on Delivery is a type of payment method where the*/}
                        {/*                            recipient make payment for the order at the time of*/}
                        {/*                            delivery rather than in advance.*/}
                        {/*                        </p>*/}
                        {/*                        <button*/}
                        {/*                            type="button"*/}
                        {/*                            className="btn btn-primary btn-next"*/}
                        {/*                        >*/}
                        {/*                            Pay On Delivery*/}
                        {/*                        </button>*/}
                        {/*                    </div>*/}

                        {/*                    <div*/}
                        {/*                        className="tab-pane fade"*/}
                        {/*                        id="pills-gift-card"*/}
                        {/*                        role="tabpanel"*/}
                        {/*                        aria-labelledby="pills-gift-card-tab"*/}
                        {/*                    >*/}
                        {/*                        <h6>Enter Gift Card Details</h6>*/}
                        {/*                        <div className="row g-5">*/}
                        {/*                            <div className="col-12">*/}
                        {/*                                <label*/}
                        {/*                                    htmlFor="giftCardNumber"*/}
                        {/*                                    className="form-label"*/}
                        {/*                                >*/}
                        {/*                                    Gift card number*/}
                        {/*                                </label>*/}
                        {/*                                <input*/}
                        {/*                                    type="number"*/}
                        {/*                                    className="form-control"*/}
                        {/*                                    id="giftCardNumber"*/}
                        {/*                                    placeholder="Gift card number"*/}
                        {/*                                />*/}
                        {/*                            </div>*/}
                        {/*                            <div className="col-12">*/}
                        {/*                                <label htmlFor="giftCardPin" className="form-label">*/}
                        {/*                                    Gift card pin*/}
                        {/*                                </label>*/}
                        {/*                                <input*/}
                        {/*                                    type="number"*/}
                        {/*                                    className="form-control"*/}
                        {/*                                    id="giftCardPin"*/}
                        {/*                                    placeholder="Gift card pin"*/}
                        {/*                                />*/}
                        {/*                            </div>*/}
                        {/*                            <div className="col-12">*/}
                        {/*                                <button*/}
                        {/*                                    type="button"*/}
                        {/*                                    className="btn btn-primary btn-next"*/}
                        {/*                                >*/}
                        {/*                                    Redeem Gift Card*/}
                        {/*                                </button>*/}
                        {/*                            </div>*/}
                        {/*                        </div>*/}
                        {/*                    </div>*/}
                        {/*                </div>*/}
                        {/*            </div>*/}
                        {/*        </div>*/}
                        {/*        <div className="col-xl-4">*/}
                        {/*            <div className="border rounded p-4">*/}
                        {/*                <h6>Price Details</h6>*/}
                        {/*                <dl className="row text-heading">*/}
                        {/*                    <dt className="col-6 fw-normal">Order Total</dt>*/}
                        {/*                    <dd className="col-6 text-end">$1198.00</dd>*/}

                        {/*                    <dt className="col-6 fw-normal">Delivery Charges</dt>*/}
                        {/*                    <dd className="col-6 text-end">*/}
                        {/*                        <s className="text-muted">$5.00</s>{" "}*/}
                        {/*                        <span className="badge bg-label-success ms-1">*/}
                        {/*                            Free*/}
                        {/*                        </span>*/}
                        {/*                    </dd>*/}
                        {/*                </dl>*/}
                        {/*                <hr className="mx-n6 mb-4 mt-4" />*/}
                        {/*                <dl className="row">*/}
                        {/*                    <dt className="col-6 text-heading mb-3">Total</dt>*/}
                        {/*                    <dd className="col-6 fw-medium text-end text-heading mb-0">*/}
                        {/*                        $1198.00*/}
                        {/*                    </dd>*/}

                        {/*                    <dt className="col-6 fw-medium text-heading">*/}
                        {/*                        Deliver to:*/}
                        {/*                    </dt>*/}
                        {/*                    <dd className="col-6 fw-medium text-end mb-0">*/}
                        {/*                        <span className="badge bg-label-primary">Home</span>*/}
                        {/*                    </dd>*/}
                        {/*                </dl>*/}
                        {/*                <address>*/}
                        {/*                    <span className="text-heading fw-medium">*/}
                        {/*                        {" "}*/}
                        {/*                        John Doe (Default),*/}
                        {/*                    </span>*/}
                        {/*                    <br />*/}
                        {/*                    4135 Parkway Street, <br />*/}
                        {/*                    Los Angeles, CA, 90017. <br />*/}
                        {/*                    Mobile : +1 906 568 2332*/}
                        {/*                </address>*/}
                        {/*                <a href="#" className="fw-medium">*/}
                        {/*                    Change address*/}
                        {/*                </a>*/}
                        {/*            </div>*/}
                        {/*        </div>*/}
                        {/*    </div>*/}
                        {/*</div>*/}

                        {/*<div*/}
                        {/*    id="checkout-confirmation"*/}
                        {/*    className="content fv-plugins-bootstrap5 fv-plugins-framework active dstepper-block"*/}
                        {/*>*/}
                        {/*    <div className="row mb-4">*/}
                        {/*        <div className="col-12 col-lg-8 mx-auto text-center mb-2">*/}
                        {/*            <h4>Thank You! 😇</h4>*/}
                        {/*            <p>*/}
                        {/*                Your order{" "}*/}
                        {/*                <a href="#" className="text-heading fw-medium">*/}
                        {/*                    #1536548131*/}
                        {/*                </a>{" "}*/}
                        {/*                has been placed!*/}
                        {/*            </p>*/}
                        {/*            <p>*/}
                        {/*                We sent an email to{" "}*/}
                        {/*                <a*/}
                        {/*                    href="mailto:john.doe@example.com"*/}
                        {/*                    className="text-heading fw-medium"*/}
                        {/*                >*/}
                        {/*                    john.doe@example.com*/}
                        {/*                </a>{" "}*/}
                        {/*                with your order confirmation and receipt. If the email*/}
                        {/*                hasn't arrived within two minutes, please check your spam*/}
                        {/*                folder to see if the email was routed there.*/}
                        {/*            </p>*/}
                        {/*            <p>*/}
                        {/*                <span>*/}
                        {/*                    <i className="bx bx-time-five me-1 text-heading align-top"></i>{" "}*/}
                        {/*                    Time placed:&nbsp;*/}
                        {/*                </span>{" "}*/}
                        {/*                25/05/2020 13:35pm*/}
                        {/*            </p>*/}
                        {/*        </div>*/}
                        {/*        <div className="col-12">*/}
                        {/*            <ul className="list-group list-group-horizontal-md">*/}
                        {/*                <li className="list-group-item flex-fill p-4 text-body">*/}
                        {/*                    <h6 className="d-flex align-items-center gap-2">*/}
                        {/*                        <i className="bx bx-map"></i> Shipping*/}
                        {/*                    </h6>*/}
                        {/*                    <address className="mb-0">*/}
                        {/*                        John Doe <br />*/}
                        {/*                        4135 Parkway Street,*/}
                        {/*                        <br />*/}
                        {/*                        Los Angeles, CA 90017,*/}
                        {/*                        <br />*/}
                        {/*                        USA*/}
                        {/*                    </address>*/}
                        {/*                    <p className="mb-0 mt-4">+123456789</p>*/}
                        {/*                </li>*/}
                        {/*                <li className="list-group-item flex-fill p-4 text-body">*/}
                        {/*                    <h6 className="d-flex align-items-center gap-2">*/}
                        {/*                        <i className="bx bx-credit-card"></i> Billing Address*/}
                        {/*                    </h6>*/}
                        {/*                    <address className="mb-0">*/}
                        {/*                        John Doe <br />*/}
                        {/*                        4135 Parkway Street,*/}
                        {/*                        <br />*/}
                        {/*                        Los Angeles, CA 90017,*/}
                        {/*                        <br />*/}
                        {/*                        USA*/}
                        {/*                    </address>*/}
                        {/*                    <p className="mb-0 mt-4">+123456789</p>*/}
                        {/*                </li>*/}
                        {/*                <li className="list-group-item flex-fill p-4 text-body">*/}
                        {/*                    <h6 className="d-flex align-items-center gap-2">*/}
                        {/*                        <i className="bx bxs-ship"></i> Shipping Method*/}
                        {/*                    </h6>*/}
                        {/*                    <p className="fw-medium mb-4">Preferred Method:</p>*/}
                        {/*                    Standard Delivery*/}
                        {/*                    <br />*/}
                        {/*                    (Normally 3-4 business days)*/}
                        {/*                </li>*/}
                        {/*            </ul>*/}
                        {/*        </div>*/}
                        {/*    </div>*/}

                        {/*    <div className="row">*/}
                        {/*        <div className="col-xl-9 mb-4 mb-xl-0">*/}
                        {/*            <ul className="list-group">*/}
                        {/*                <li className="list-group-item p-4">*/}
                        {/*                    <div className="d-flex gap-4 flex-sm-row flex-column">*/}
                        {/*                        <div className="flex-shrink-0">*/}
                        {/*                            <img*/}
                        {/*                                src="../assets/img/categories/product-1.png"*/}
                        {/*                                alt="google home"*/}
                        {/*                                className="w-px-75"*/}
                        {/*                            />*/}
                        {/*                        </div>*/}
                        {/*                        <div className="flex-grow-1">*/}
                        {/*                            <div className="row">*/}
                        {/*                                <div className="col-md-8">*/}
                        {/*                                    <a href="#">*/}
                        {/*                                        <h6 className="mb-2">*/}
                        {/*                                            Google - Google Home - White*/}
                        {/*                                        </h6>*/}
                        {/*                                    </a>*/}
                        {/*                                    <div className="text-body mb-2 d-flex flex-wrap">*/}
                        {/*                                        <span className="me-1">Sold by:</span>{" "}*/}
                        {/*                                        <a href="#" className="me-3">*/}
                        {/*                                            Google*/}
                        {/*                                        </a>*/}
                        {/*                                    </div>*/}
                        {/*                                    <span className="badge bg-label-success">*/}
                        {/*                                        In Stock*/}
                        {/*                                    </span>*/}
                        {/*                                </div>*/}
                        {/*                                <div className="col-md-4">*/}
                        {/*                                    <div className="text-md-end">*/}
                        {/*                                        <div className="my-2 my-lg-4">*/}
                        {/*                                            <span className="text-primary">$299/</span>*/}
                        {/*                                            <s className="text-muted">$359</s>*/}
                        {/*                                        </div>*/}
                        {/*                                    </div>*/}
                        {/*                                </div>*/}
                        {/*                            </div>*/}
                        {/*                        </div>*/}
                        {/*                    </div>*/}
                        {/*                </li>*/}
                        {/*                <li className="list-group-item p-4">*/}
                        {/*                    <div className="d-flex gap-4 flex-sm-row flex-column">*/}
                        {/*                        <div className="flex-shrink-0">*/}
                        {/*                            <img*/}
                        {/*                                src="../assets/img/categories/product-5.png"*/}
                        {/*                                alt="google home"*/}
                        {/*                                className="w-px-75"*/}
                        {/*                            />*/}
                        {/*                        </div>*/}
                        {/*                        <div className="flex-grow-1">*/}
                        {/*                            <div className="row">*/}
                        {/*                                <div className="col-md-8">*/}
                        {/*                                    <a href="#">*/}
                        {/*                                        <h6 className="mb-2">*/}
                        {/*                                            Apple iPhone 11 (64GB, Black)*/}
                        {/*                                        </h6>*/}
                        {/*                                    </a>*/}
                        {/*                                    <div className="text-body mb-2 d-flex flex-wrap">*/}
                        {/*                                        <span className="me-1">Sold by:</span>{" "}*/}
                        {/*                                        <a href="#">Apple</a>*/}
                        {/*                                    </div>*/}
                        {/*                                </div>*/}
                        {/*                                <div className="col-md-4">*/}
                        {/*                                    <div className="text-md-end">*/}
                        {/*                                        <div className="my-2 my-lg-4">*/}
                        {/*                                            <span className="text-primary">$299/</span>*/}
                        {/*                                            <s className="text-muted">$359</s>*/}
                        {/*                                        </div>*/}
                        {/*                                    </div>*/}
                        {/*                                </div>*/}
                        {/*                            </div>*/}
                        {/*                        </div>*/}
                        {/*                    </div>*/}
                        {/*                </li>*/}
                        {/*            </ul>*/}
                        {/*        </div>*/}
                        {/*        <div className="col-xl-3">*/}
                        {/*            <div className="border rounded p-4">*/}
                        {/*                <h6>Price Details</h6>*/}
                        {/*                <dl className="row mb-0 text-heading">*/}
                        {/*                    <dt className="col-6 fw-normal">Order Total</dt>*/}
                        {/*                    <dd className="col-6 text-end">$1198.00</dd>*/}

                        {/*                    <dt className="col-sm-6 text-heading fw-normal">*/}
                        {/*                        Charges*/}
                        {/*                    </dt>*/}
                        {/*                    <dd className="col-sm-6 text-end">*/}
                        {/*                        <s className="text-muted">$5.00</s>{" "}*/}
                        {/*                        <span className="badge bg-label-success ms-1">*/}
                        {/*                            Free*/}
                        {/*                        </span>*/}
                        {/*                    </dd>*/}
                        {/*                </dl>*/}
                        {/*                <hr className="mx-n6 mb-4" />*/}
                        {/*                <dl className="row mb-0">*/}
                        {/*                    <dt className="col-6 text-heading">Total</dt>*/}
                        {/*                    <dd className="col-6 fw-medium text-end text-heading mb-0">*/}
                        {/*                        $1198.00*/}
                        {/*                    </dd>*/}
                        {/*                </dl>*/}
                        {/*            </div>*/}
                        {/*        </div>*/}
                        {/*    </div>*/}
                        {/*</div>*/}
                    </form>
                </div>
            </div>
        </Overview>
    );
};
