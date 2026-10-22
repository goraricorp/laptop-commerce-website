import React, { Component, useState, useEffect } from "react";
import { redirect, useLocation, useNavigate } from 'react-router-dom';
import { Container, Button, Row, Col, Card, Form } from 'react-bootstrap';
import axios from 'axios';

import Transitionbar from '../../layouts/Transitionbar.jsx';
import OrderItem from "../../components/product/OrderItem.jsx";
import { NotifyModal } from "../../components/modal/notice/NotifyModal.jsx";
import { formatDateTimeMySQL } from "../../utils/formatHandler.jsx";
import apiHandler from "../../utils/apiHandler.jsx";

export default function CheckOutPage() {
    const location = useLocation();
    const [paymentMethod, setPaymentMethod] = useState("paypal"); // State for delivery method
    const [status, setStatus] = useState(1); // State for delivery method
    const [isPaypalSelected, setIsPaypalSelected] = useState(false);

    const [showSuccess, setShowSuccess] = useState(false);
    const [showError, setShowError] = useState(false);

    const navigate = useNavigate();
    const token = localStorage.getItem('token');
    const { cartData, prePrice, discount, voucher, totalPrice, userData, address, deliverymethod } = location.state || {};

    // console.log(location.state);

    const paypalAPI = async () => {
        // Kiểm tra nếu PayPal đã được tải trước
        if (window.paypal) {
            paypal.Buttons({
                createOrder: function (data, actions) {
                    return fetch('http://localhost:5172/paypal/create-order', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({ totalPrice: totalPrice })
                    }).then(res => res.json())
                        .then(order => order.id);
                },
                onApprove: function (data, actions) {
                    return fetch('http://localhost:5172/paypal/capture-order', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({ orderID: data.orderID }),
                    }).then(res => res.json())
                        .then(details => {
                            // alert('Thanh toán thành công');
                            handleStatusChange(1);
                            handleOrder()
                        });
                },
                onError: function (err) {
                    setShowError(true);
                    console.error(err);
                    // alert('Có lỗi xảy ra trong quá trình thanh toán');
                }
            }).render('#paypal-button-container');
        }
    };

    const handleOrder = async () => {
        try {
            const requestData = {
                date: formatDateTimeMySQL(new Date()),
                voucher: voucher ? voucher : null,
                address: address,
                price: totalPrice,
                status: status,
                items: cartData
            };

            // console.log('Dữ liệu gửi lên:', requestData);

            await apiHandler.post(`/bill/add-bill`, requestData, {
                headers: { Authorization: `Bearer ${token}` },
            });

            setShowSuccess(true);
        } catch (error) {
            // console.error('Lỗi khi tạo hóa đơn:', error.response ? error.response.data : error.message);
            setShowError(true);
        }
    };

    const handleNavigate = () => {
        navigate('/pay/success', {
            state: {
                cartData, // Dữ liệu giỏ hàng
                prePrice,
                discount,
                voucher,
                totalPrice,
                userData,
                address,
            }
        });
    }

    const handlePaymentMethodChange = (event) => {
        setPaymentMethod(event.target.value);
        setIsPaypalSelected(event.target.value === "paypal"); // Set to true if PayPal is selected
    };

    const handleStatusChange = (status) => {
        setStatus(status);
        // console.log(status)
    };

    useEffect(() => {
        if (isPaypalSelected) {
            const script = document.createElement('script');
            script.src = "https://www.paypal.com/sdk/js?client-id=AdhVzROq2s2WBCyzBViwG2txjK55M54O6K_swNa_do0hEpOGo5PQf49TYCoz3evn0s3PF_jdXovGzKb3&currency=USD";
            script.async = true;
            script.onload = () => {
                paypalAPI(); // Call PayPal API when PayPal is selected
            };
            document.body.appendChild(script);
            return () => {
                document.body.removeChild(script);
            };
        }
    }, [isPaypalSelected]); // Only run when PayPal is selected

    useEffect(() => {
        if (!location.state) {
            navigate('/pay/cart');
        }
    }, []);

    return (
        <>
            <Transitionbar />
            <div className="container">
                <div className="row">
                    {/* Left Section: Order Info and Payment Method */}
                    <div className="col col-sm-12 col-md-6 col-lg-8">
                        {/* Order Information */}
                        <div className="card p-3 mb-4">
                            <div className="p-3">
                                <h5>Order Information</h5>
                                <div>Order ID: <strong>#</strong></div>
                                <div>Customer: <strong>{userData?.firstname} {userData?.lastname}</strong></div>
                                <div>{deliverymethod}:
                                    {deliverymethod === "Tại cửa hàng" && (
                                        <strong>{address}</strong>
                                    )}
                                    {deliverymethod === "Giao tận nơi" && (
                                        <strong>{address.street}, {address.city}, {address.district}</strong>
                                    )}
                                </div>
                            </div>
                        </div>
                        {/* Payment Method */}
                        <div className="card p-3 mb-4">
                            <div className="p-3"><h5>Phương thức thanh toán</h5>
                                {/*<div className="form-check">*/}
                                {/*    <input*/}
                                {/*        name="default-radio-1"*/}
                                {/*        className="form-check-input"*/}
                                {/*        type="radio"*/}
                                {/*        value=""*/}
                                {/*        id="defaultRadio2"*/}
                                {/*        checked/>*/}
                                {/*    <label className="form-check-label" htmlFor="defaultRadio2"> Checked </label>*/}
                                {/*</div>*/}
                                {/*<Form.Check*/}
                                {/*    className="form-check"*/}
                                {/*    type="radio"*/}
                                {/*    label="Bank transfer by QR"*/}
                                {/*    name="paymentMethod"*/}
                                {/*    value="qr"*/}
                                {/*    checked={paymentMethod === "qr"}*/}
                                {/*    onChange={handlePaymentMethodChange}*/}
                                {/*/>*/}
                                {/* Other Payment Methods */}
                                <Form.Check
                                    type="radio"
                                    label="Pay with Paypal"
                                    name="paymentMethod"
                                    value="paypal"
                                    checked={paymentMethod === "paypal"}
                                    onChange={handlePaymentMethodChange}
                                />
                                <Form.Check
                                    type="radio"
                                    label="Cash on Delivery"
                                    name="paymentMethod"
                                    value="cod"
                                    checked={paymentMethod === "cod"}
                                    onChange={handlePaymentMethodChange}
                                />
                            </div>
                        </div>
                        {paymentMethod === "qr" && (
                            <>
                                <div className="card p-3 mb-4">
                                    <div className="p-3">
                                        <h5>Transfer Instructions</h5>
                                        <div className="mb-1">
                                            <strong>Method 1: </strong>
                                            Use your banking app to scan the QR code.
                                        </div>
                                        <div className="mb-1">
                                            <strong>Method 2: </strong>
                                            Enter the transfer information below.
                                            Please ensure the amount and transfer content are entered correctly.
                                        </div>
                                        <div className="mb-1">
                                            After a successful transfer, click the <strong>I have transferred</strong> button.
                                            The system will take about 30 seconds to verify that the payment has been
                                            received.
                                        </div>
                                    </div>
                                </div>
                                {/* Bank Info */}
                                <div className="card p-3 mb-4">
                                    <div className="p-3">
                                        <div className="row">
                                            <div className="col col-lg-9">
                                                <p>
                                                    <strong>Bank:</strong> BIDV (Bank for Investment and Development of
                                                    Vietnam)
                                                </p>
                                                <p><strong>Account Name:</strong> Japtor Gortheia</p>
                                                <p><strong>Account Number:</strong> 1234567890</p>
                                                <p><strong>Payment Reference:</strong> 212410160005 RYPRGG</p>
                                                <p><strong>Amount:</strong> ${totalPrice}</p>
                                            </div>
                                            <div className="col col-3 justify-content-center">
                                                <div className="d-flex align-items-center flex-column">
                                                    <img className="img-fluid rounded mb-4"
                                                         src="https://upload.wikimedia.org/wikipedia/commons/thumb/d/d0/QR_code_for_mobile_English_Wikipedia.svg/1200px-QR_code_for_mobile_English_Wikipedia.svg.png"
                                                         height="120" width="120" alt="QR Code"/>
                                                    <div className="customer-info text-center mb-4">
                                                        <h5 className="mb-0">Scan QR code</h5>
                                                        <span>Customer ID #30</span>
                                                    </div>
                                                </div>
                                                {/*<img src="https://via.placeholder.com/150" alt="QR Code"/>*/}
                                                {/*<p className="text-center">Scan QR code</p>*/}
                                            </div>
                                        </div>
                                        <Button className="w-100" variant="primary" onClick={() => {
                                            handleStatusChange(1);
                                            handleOrder()
                                            // NotifySuccess()
                                        }}>Order</Button>
                                    </div>
                                </div>
                            </>
                        )}
                        {paymentMethod === "cod" && (
                            <div className="card p-3 mb-3">
                                <div className="p-3">
                                    <Button className="w-100" variant="primary" onClick={() => {
                                        handleStatusChange(0)
                                        handleOrder()
                                    }}>
                                        Accept Payment
                                    </Button>
                                </div>
                            </div>
                        )}
                        {paymentMethod === "paypal" && (
                            <>
                                <div className="card p-3 mb-4 d-flex justify-content-center">
                                    <div className="d-flex justify-content-center w-100">
                                        <div className="d-flex" id="paypal-button-container"></div>
                                    </div>
                                </div>
                                {/*<div className="card p-3 mb-3 d-flex justify-content-center">*/}
                                {/*    <div className="row d-flex justify-content-center flex-wrap">*/}
                                {/*        <div className="col-12">*/}
                                {/*            <div className="d-flex justify-content-center w-100"*/}
                                {/*                 style={{minWidth: '120px'}}>*/}
                                {/*                <div className="d-flex" id="paypal-button-container"></div>*/}
                                {/*            </div>*/}
                                {/*        </div>*/}
                                {/*    </div>*/}
                                {/*</div>*/}
                            </>
                        )}
                    </div>

                    <div className="col col-lg-4 col-md-6 col-sm-12 mb-4">
                        <div className="container position-sticky sticky-summary p-0" style={{top: 24}}>
                            <div className="card p-3 mb-4">
                                <div className="rounded p-3">
                                    <h5>Price Details</h5>
                                    <dl className="row mb-0 text-heading">
                                        <dt className="col-6 fw-normal">Bag Total</dt>
                                        <dd className="col-6 text-end">${prePrice}</dd>

                                        <dt className="col-6 fw-normal">Coupon Discount</dt>
                                        {
                                            voucher
                                                ? <dd className="col-6 text-end">-{voucher.percentage_discount}%</dd>
                                                : <dd className="col-6 text-primary text-end">Apply Coupon</dd>
                                        }

                                        <dt className="col-6 fw-normal">Order Total</dt>
                                        <dd className="col-6 text-end">-${discount}</dd>

                                        <dt className="col-6 fw-normal">Delivery Charges</dt>
                                        <dd className="col-6 text-end">
                                            <s className="text-muted">$5.00</s>
                                            <span className="badge bg-label-success ms-1">Free</span>
                                        </dd>
                                    </dl>
                                    <hr className="my-4"/>
                                    <dl className="row mb-0">
                                        <dt className="col-6 text-heading">Total</dt>
                                        <dd className="col-6 fw-medium text-end text-heading mb-0">${totalPrice}</dd>
                                    </dl>
                                </div>
                                {/*<div className="p-3">*/}
                                {/*    <Button className="w-100" variant="danger">*/}
                                {/*        Order*/}
                                {/*    </Button>*/}
                                {/*</div>*/}
                            </div>
                            <div className="card p-3">
                                <div className="rounded p-3">
                                    <h5>Order List</h5>
                                    <hr className="my-4"/>
                                    {cartData?.map((item, index) => (
                                        <OrderItem key={index} item={item}/>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <NotifyModal
                type="primary"
                title="Order successfully"
                message="Follow your order in Order History!"
                show={showSuccess}
                onHide={() => {
                    setShowSuccess(false)
                    handleNavigate()
                }}
            />

            <NotifyModal
                type="error"
                title="Order failed"
                message="Something went wrong!"
                show={showError}
                onHide={() => {
                    setShowError(false)
                }}
            />
        </>
    );
}
