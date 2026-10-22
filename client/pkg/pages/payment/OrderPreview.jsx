import React, { Component, useState, useEffect } from "react";
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { Button, Form, FormText } from 'react-bootstrap';
import Transitionbar from '../../layouts/Transitionbar.jsx';
import CardItem from '../../components/product/CartItem.jsx';
import OrderItem from "../../components/product/OrderItem.jsx";
import axios from 'axios';
import apiHandler from "../../utils/apiHandler.jsx";

export default function OrderPreview() {
    const [user, setUser] = useState([]);
    const [address, setAdress] = useState([]);
    const [selectedAddress, setSelectedAddress] = useState(""); // State to track selected address
    const [deliveryMethod, setDeliveryMethod] = useState("Delivery"); // State for delivery method

    const location = useLocation();
    const { cartData, prePrice, discount, voucher, totalPrice } = location.state || {};

    const token = localStorage.getItem('token');

    const navigate = useNavigate();
    const handleOrderClick = (event) => {
        // handleAddBill();
        event.preventDefault();
        navigate('/pay/checkout', {
            state: {
                cartData, // Dữ liệu giỏ hàng
                prePrice,
                discount,
                voucher,
                totalPrice,
                userData: user,
                address: selectedAddress,
                deliveryMethod
            }
        });
    };

    const fetchUser = async () => {
        try {
            const response = await apiHandler.get(`/account/get-info`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            setUser(response.data)
        } catch (error) {
            // console.error('Lỗi khi lấy dữ liệu mô tả của sản phẩm:', error);
        }
    };

    const fetchAddress = async () => {
        try {
            const response = await apiHandler.get(`/address/list`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            setAdress(response.data)
            // console.log(response.data)
        } catch (error) {
            console.error('Lỗi khi lấy dữ liệu mô tả của sản phẩm:', error);
        }
    };

    const handleDeliveryMethodChange = (event) => {
        setDeliveryMethod(event.target.value);
    };

    useEffect(() => {
        if (!location.state) {
            navigate('/pay/cart');
        }

        fetchUser();
        fetchAddress();
    }, []);

    return (
        <>
            <Transitionbar />
            <div className="container">
                <div className="row">
                    {/* Left Section */}
                    <div className="col col-sm-12 col-md-6 col-lg-8">
                        <div className="row">
                            <div className="col-12 mb-4">
                                <div
                                    className="card px-3 py-3 light bg-body-tertiary align-items-center bg-navbar-theme">
                                    <div className="container d-flex ps-2 p-0 align-items-center">
                                        <h5 className="m-0">Order</h5>
                                        <Button disabled variant="light" className="ms-auto">
                                            <i className='bx bx-plus text-white me-2'></i>
                                            <span></span>
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="card p-3 mb-4">
                            <div className="rounded p-3">
                                <h5>Preferable Address</h5>
                                <Form.Check
                                    className="mb-2"
                                    type="radio"
                                    label="Delivery"
                                    name="deliveryMethod"
                                    value="Delivery"
                                    checked={deliveryMethod === 'Delivery'}
                                    onChange={handleDeliveryMethodChange}
                                />
                                <Form.Check
                                    disabled
                                    type="radio"
                                    label="Shop"
                                    name="deliveryMethod"
                                    value="Shop"
                                    checked={deliveryMethod === 'Shop'} // Always checked by default
                                    onChange={handleDeliveryMethodChange}
                                />
                            </div>
                        </div>
                        {/* Store Locations */}
                        {/* Recipient Information */}
                        <div className="card p-3 mb-4">
                            <div className="rounded p-3">
                                <h5>Customer Information</h5>
                                <Form.Group controlId="formRecipientName">
                                    <Form.Label>Fullname</Form.Label>
                                    <Form.Control
                                        type="text"
                                        readOnly
                                        placeholder="Enter your fullname"
                                        name="recipientName"
                                        defaultValue={user.firstname && user.lastname ? `${user.firstname} ${user.lastname}` : ""}
                                        // value={recipientName}
                                        // onChange={this.handleInputChange}
                                    />
                                </Form.Group>
                                <Form.Group controlId="formPhoneNumber" className="mt-3">
                                    <Form.Label>Phone number</Form.Label>
                                    <Form.Control
                                        type="text"
                                        readOnly
                                        placeholder="Phone number"
                                        name="phoneNumber"
                                        defaultValue={user.phone}
                                        // value={phoneNumber}
                                        // onChange={this.handleInputChange}
                                    />
                                </Form.Group>
                                {deliveryMethod === 'Delivery' && (
                                    <Form.Group controlId="formAddress" className="mt-3">
                                        <Form.Label>Address to delivery</Form.Label>
                                        <Form.Select
                                            aria-label="Choose address to deliver"
                                            // value={selectedAddress}
                                            onChange={(e) => {
                                                const selectedValue = parseInt(e.target.value);
                                                const selectedItem = address.find(item => item.idaddress === selectedValue);

                                                setSelectedAddress(selectedItem);
                                                // console.log(selectedAddress)
                                            }}
                                        >
                                            <option>Choose address</option>
                                            {address.map((addr, index) => (
                                                <option key={index} value={addr.idaddress}>
                                                    {addr.street}, {addr.city}, {addr.district}, {addr.city}, {addr.state}, {addr.country},
                                                </option>
                                            ))}
                                        </Form.Select>
                                    </Form.Group>
                                )}
                            </div>
                        </div>
                        {/* Product List */}
                        {/* <Card className="p-3">
                            {products.map((item) => <CardItem key={item.id} item={item} />)}
                        </Card> */}
                    </div>

                    <div className="col col-lg-4 col-md-12 col-sm-12 mb-4">
                        <div className="container position-sticky sticky-summary p-0" style={{top: 24}}>
                            <div className="card p-3 mb-4">
                                <div className="rounded p-3">
                                    <h5>Offer</h5>
                                    <div className="row g-4 mb-4">
                                        <div className="col-12">
                                            <Form.Select
                                                className="mb-4"
                                                aria-label="Default select example"
                                                disabled
                                                // onChange={(e) => setSelectedVoucher(e.target.value)}
                                            >
                                                {/*<option>Choose voucher</option>*/}
                                                {/*{voucher.map((item, index) => (*/}
                                                {/*    <option key={index}*/}
                                                {/*            value={item.percentage_discount}>{item.discount_name}</option>*/}
                                                {/*))}*/}
                                                <option
                                                    value="">{voucher ? voucher.discount_name : "Not Selected"}</option>
                                            </Form.Select>
                                            {/*<input type="text" className="form-control" placeholder="Enter Promo Code"*/}
                                            {/*    aria-label="Enter Promo Code" />*/}
                                        </div>
                                        {/*<div className="col-4 col-xxl-4 col-xl-12">*/}
                                        {/*    <Form.Control*/}
                                        {/*        className="text-end"*/}
                                        {/*        value={voucher ? `${voucher.percentage_discount}%` : "0%"}*/}
                                        {/*        readOnly*/}
                                        {/*    >*/}
                                        {/*    </Form.Control>*/}
                                        {/*</div>*/}
                                    </div>
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
                                <div className="rounded p-3">
                                    <Button
                                        className="w-100"
                                        variant="danger"
                                        onClick={handleOrderClick}
                                        disabled={selectedAddress === ""}
                                    >
                                        Order
                                    </Button>
                                </div>
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
        </>
    )
}