import React, { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button, Form } from "react-bootstrap";
import apiHandler from "../../utils/apiHandler.jsx";
import Transitionbar from "../../layouts/Transitionbar.jsx";
import CardItem from "../../components/product/CartItem.jsx";
import OrderItem from "../../components/product/OrderItem.jsx";
import { formatDateTimeMySQL } from "../../utils/formatHandler.jsx";
import { NotifyModal } from "../../components/modal/notice/NotifyModal.jsx";

export default function PurchasePage() {
    const location = useLocation();
    const navigate = useNavigate();
    const token = localStorage.getItem("token");

    const { cartData, prePrice, discount, voucher, totalPrice, userData } =
        location.state || {};

    // Nếu không có state (giỏ hàng rỗng) thì chuyển hướng về trang giỏ hàng
    useEffect(() => {
        if (!location.state) {
            navigate("/pay/cart");
        }
    }, [location, navigate]);

    const [user, setUser] = useState([]);
    const [address, setAddress] = useState([]);
    const [selectedAddress, setSelectedAddress] = useState(null);
    const [paymentMethod, setPaymentMethod] = useState("cod");
    const [deliveryMethod, setDeliveryMethod] = useState("Delivery");
    const [status, setStatus] = useState(1);
    const [isPaypalSelected, setIsPaypalSelected] = useState(false);

    const [showSuccess, setShowSuccess] = useState(false);
    const [showError, setShowError] = useState(false);
    const [error, setError] = useState("");

    // Lấy thông tin người dùng
    const handleGetUserInfo = async () => {
        try {
            const response = await apiHandler.get(`/account/get-info`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setUser(response.data);
        } catch (error) {
            // console.error('Error fetching user info:', error);
        }
    };

    // Lấy danh sách địa chỉ của người dùng
    const handleGetUserAddress = async () => {
        try {
            const response = await apiHandler.get(`/address/list`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setAddress(response.data);
        } catch (error) {
            console.error("Error fetching address:", error);
        }
    };

    // PayPal integration
    const paypalAPI = async () => {
        if (window.paypal) {
            window.paypal
                .Buttons({
                    createOrder: function (data, actions) {
                        return fetch("http://localhost:5172/paypal/create-order", {
                            method: "POST",
                            headers: {
                                "Content-Type": "application/json",
                            },
                            body: JSON.stringify({ totalPrice: totalPrice }),
                        })
                            .then((res) => res.json())
                            .then((order) => order.id);
                    },
                    onApprove: function (data, actions) {
                        return fetch("http://localhost:5172/paypal/capture-order", {
                            method: "POST",
                            headers: {
                                "Content-Type": "application/json",
                            },
                            body: JSON.stringify({ orderID: data.orderID }),
                        })
                            .then((res) => res.json())
                            .then((details) => {
                                // Sau khi thanh toán thành công PayPal, cập nhật status và tạo đơn hàng
                                handleStatusChange(1);
                                handleOrder();
                            });
                    },
                    onError: function (err) {
                        setShowError(true);
                        console.error(err);
                    },
                })
                .render("#paypal-button-container");
        }
    };

    // Tạo đơn hàng (bill)
    const handleOrder = async () => {
        // Kiểm tra nếu người dùng chưa chọn địa chỉ
        if (!selectedAddress) {
            setError("Please select an address before placing your order.");
            setShowError(true);
            return;
        }
        try {
            const requestData = {
                date: formatDateTimeMySQL(new Date()),
                voucher: voucher ? voucher : null,
                address: selectedAddress,
                price: totalPrice,
                status: status,
                items: cartData,
            };

            console.log("Request data:", requestData);

            await apiHandler.post(`/bill/add-bill`, requestData, {
                headers: { Authorization: `Bearer ${token}` },
            });

            setShowSuccess(true);
        } catch (error) {
            setError(
                error.response ? error.response.data : "Something went wrong while placing the order."
            );
            setShowError(true);
        }
    };

    const handleBackToCart = () => {
        navigate("/pay/cart");
    };

    const handleNavigate = () => {
        navigate("/pay/success", {
            state: {
                cartData, // Dữ liệu giỏ hàng
                prePrice,
                discount,
                voucher,
                totalPrice,
                userData,
                address: selectedAddress,
            },
        });
    };

    const handlePaymentMethodChange = (event) => {
        setPaymentMethod(event.target.value);
        setIsPaypalSelected(event.target.value === "paypal");
    };

    const handleStatusChange = (status) => {
        setStatus(status);
    };

    useEffect(() => {
        if (isPaypalSelected) {
            const script = document.createElement("script");
            script.src =
                "https://www.paypal.com/sdk/js?client-id=AdhVzROq2s2WBCyzBViwG2txjK55M54O6K_swNa_do0hEpOGo5PQf49TYCoz3evn0s3PF_jdXovGzKb3&currency=USD";
            script.async = true;
            script.onload = () => {
                paypalAPI();
            };
            document.body.appendChild(script);
            return () => {
                document.body.removeChild(script);
            };
        }
    }, [isPaypalSelected]);

    useEffect(() => {
        handleGetUserInfo();
        handleGetUserAddress();
    }, []);
    console.log(selectedAddress)
    return (
        <>
            <Transitionbar />
            <div className="container">
                <div className="row">
                    {/* Left Section: Order Info and Payment Method */}
                    <div className="col col-sm-12 col-md-6 col-lg-8">
                        <div className="row">
                            <div className="col-12 mb-4">
                                <div className="card px-3 py-3 light bg-body-tertiary align-items-center bg-navbar-theme">
                                    <div className="container d-flex ps-2 p-0 align-items-center">
                                        <h5 className="m-0">Purchase</h5>
                                        <Button
                                            className="ms-auto"
                                            as={Link}
                                            to={"/pay/cart"}
                                            onClick={handleBackToCart}
                                        >
                                            <i className="bx bx-left-arrow-circle me-2"></i>
                                            <span>Back to Cart</span>
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="card p-3 mb-4">
                            <div className="rounded p-3">
                                <div className="d-flex justify-content-between align-items-center">
                                    <h5>Customer Information</h5>
                                    <Button as={Link} to={"/user/profile"}>
                                        Edit Information
                                    </Button>
                                </div>
                                <Form.Group controlId="formRecipientName">
                                    <Form.Label>Fullname</Form.Label>
                                    <Form.Control
                                        type="text"
                                        readOnly
                                        placeholder="Enter your fullname"
                                        name="recipientName"
                                        defaultValue={
                                            user.firstname && user.lastname
                                                ? `${user.firstname} ${user.lastname}`
                                                : ""
                                        }
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
                                    />
                                </Form.Group>
                                {deliveryMethod === "Delivery" && (
                                    <Form.Group controlId="formAddress" className="mt-3">
                                        <Form.Label>Address to deliver</Form.Label>
                                        <Form.Select
                                            aria-label="Choose address to deliver"
                                            onChange={(e) => {
                                                const value = e.target.value;
                                                if (value) {
                                                    const selectedItem = address.find(
                                                        (item) => item.idaddress === parseInt(value)
                                                    );
                                                    setSelectedAddress(selectedItem);
                                                } else {
                                                    setSelectedAddress(null);
                                                }
                                            }}
                                        >
                                            <option value="">Choose address</option>
                                            {address.map((addr, index) => (
                                                <option key={index} value={addr.idaddress}>
                                                    {addr.street}, {addr.city}, {addr.district}, {addr.state}, {addr.country}
                                                </option>
                                            ))}
                                        </Form.Select>
                                    </Form.Group>
                                )}
                            </div>
                        </div>

                        {/* Payment Method */}
                        <div className="card p-3 mb-4">
                            <div className="p-3">
                                <h5>Payment Method</h5>
                                <Form.Check
                                    type="radio"
                                    label="Cash on Delivery"
                                    name="paymentMethod"
                                    value="cod"
                                    checked={paymentMethod === "cod"}
                                    onChange={handlePaymentMethodChange}
                                />
                                <Form.Check
                                    type="radio"
                                    label="Pay with Paypal"
                                    name="paymentMethod"
                                    value="paypal"
                                    checked={paymentMethod === "paypal"}
                                    onChange={handlePaymentMethodChange}
                                />
                            </div>
                        </div>

                        {paymentMethod === "cod" && (
                            <div className="card p-3 mb-3">
                                <div className="p-3">
                                    <Button
                                        className="w-100"
                                        variant="primary"
                                        onClick={() => {
                                            handleStatusChange(0);
                                            handleOrder();
                                        }}
                                    >
                                        Accept Payment
                                    </Button>
                                </div>
                            </div>
                        )}
                        {paymentMethod === "paypal" && (
                            <div className="card p-3 mb-4 d-flex justify-content-center">
                                <div className="d-flex justify-content-center w-100">
                                    <div id="paypal-button-container" className="d-flex"></div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Right Section: Price Summary and Order List */}
                    <div className="col col-lg-4 col-md-6 col-sm-12 mb-4">
                        <div className="container position-sticky sticky-summary p-0" style={{ top: 24 }}>
                            <div className="card p-3 mb-4">
                                <div className="rounded p-3">
                                    <h5>Price Details</h5>
                                    <dl className="row mb-0 text-heading">
                                        <dt className="col-6 fw-normal">Bag Total</dt>
                                        <dd className="col-6 text-end">${prePrice}</dd>

                                        <dt className="col-6 fw-normal">Coupon Discount</dt>
                                        {voucher ? (
                                            <dd className="col-6 text-end">-{voucher.percentage_discount}%</dd>
                                        ) : (
                                            <dd className="col-6 text-primary text-end">Apply Coupon</dd>
                                        )}

                                        <dt className="col-6 fw-normal">Order Total</dt>
                                        <dd className="col-6 text-end">-${discount}</dd>

                                        <dt className="col-6 fw-normal">Delivery Charges</dt>
                                        <dd className="col-6 text-end">
                                            <s className="text-muted">$5.00</s>
                                            <span className="badge bg-label-success ms-1">Free</span>
                                        </dd>
                                    </dl>
                                    <hr className="my-4" />
                                    <dl className="row mb-0">
                                        <dt className="col-6 text-heading">Total</dt>
                                        <dd className="col-6 fw-medium text-end text-heading mb-0">${totalPrice}</dd>
                                    </dl>
                                </div>
                            </div>
                            <div className="card p-3">
                                <div className="rounded p-3">
                                    <h5>Order List</h5>
                                    <hr className="my-4" />
                                    {cartData?.map((item, index) => (
                                        <OrderItem key={index} item={item} />
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
                    setShowSuccess(false);
                    handleNavigate();
                }}
            />

            <NotifyModal
                type="danger"
                title="Order failed"
                message={error}
                show={showError}
                onHide={() => {
                    setShowError(false);
                }}
            />
        </>
    );
}

function PurchasePageOld() {
    const location = useLocation();

    const [user, setUser] = useState([]);
    const [address, setAdress] = useState([]);
    const [paymentMethod, setPaymentMethod] = useState("cod"); // State for delivery method
    const [selectedAddress, setSelectedAddress] = useState("");
    const [deliveryMethod, setDeliveryMethod] = useState("Delivery");

    const [status, setStatus] = useState(1); // State for delivery method
    const [isPaypalSelected, setIsPaypalSelected] = useState(false);

    const [showSuccess, setShowSuccess] = useState(false);
    const [showError, setShowError] = useState(false);
    const [error, setError] = useState(false);

    const navigate = useNavigate();
    const token = localStorage.getItem('token');
    const { cartData, prePrice, discount, voucher, totalPrice, userData } = location.state || {};

    // console.log(location.state);

    const handleGetUserInfo = async () => {
        try {
            const response = await apiHandler.get(`/account/get-info`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            setUser(response.data)
        } catch (error) {
            // console.error('Lỗi khi lấy dữ liệu mô tả của sản phẩm:', error);
        }
    };

    const HandleGetUserAddress = async () => {
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
                address: selectedAddress,
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
            setError(error.response ? error.response.data : error.message);
            setShowError(true);
        }
    };

    const handleBackToCart = async () => {
        navigate('/pay/cart');
    }

    const handleNavigate = () => {
        navigate('/pay/success', {
            state: {
                cartData, // Dữ liệu giỏ hàng
                prePrice,
                discount,
                voucher,
                totalPrice,
                userData,
                address: selectedAddress,
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
        handleGetUserInfo();
        HandleGetUserAddress();
        if (!location.state) {
            navigate('/pay/cart');
        }
    }, []);
    // console.log(selectedAddress)
    return (
        <>
            <Transitionbar />
            <div className="container">
                <div className="row">
                    {/* Left Section: Order Info and Payment Method */}
                    <div className="col col-sm-12 col-md-6 col-lg-8">
                        {/* Order Information */}
                        <div className="row">
                            <div className="col-12 mb-4">
                                <div
                                    className="card px-3 py-3 light bg-body-tertiary align-items-center bg-navbar-theme">
                                    <div className="container d-flex ps-2 p-0 align-items-center">
                                        <h5 className="m-0">Purchase</h5>
                                        <Button
                                            className="ms-auto"
                                            as={Link}
                                            to={"/pay/cart"}
                                            onClick={handleBackToCart}
                                        >
                                            <i className='bx bx-left-arrow-circle me-2'></i>
                                            <span>Back to Cart</span>
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="card p-3 mb-4">
                            <div className="rounded p-3">
                                <div className="d-flex justify-content-between align-items-center">
                                    <h5>Customer Information</h5>
                                    <Button
                                        as={Link}
                                        to={"/user/profile"}
                                    >
                                        Edit Information
                                    </Button>
                                </div>
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
                        {/* Payment Method */}
                        <div className="card p-3 mb-4">
                            <div className="p-3"><h5>Payment Method</h5>
                                <Form.Check
                                    type="radio"
                                    label="Cash on Delivery"
                                    name="paymentMethod"
                                    value="cod"
                                    checked={paymentMethod === "cod"}
                                    onChange={handlePaymentMethodChange}
                                />
                                <Form.Check
                                    type="radio"
                                    label="Pay with Paypal"
                                    name="paymentMethod"
                                    value="paypal"
                                    checked={paymentMethod === "paypal"}
                                    onChange={handlePaymentMethodChange}
                                />
                            </div>
                        </div>
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
                            </>
                        )}
                    </div>

                    <div className="col col-lg-4 col-md-6 col-sm-12 mb-4">
                        <div className="container position-sticky sticky-summary p-0" style={{ top: 24 }}>
                            <div className="card p-3 mb-4">
                                <div className="rounded p-3">
                                    <h5>Price Details</h5>
                                    <dl className="row mb-0 text-heading">
                                        <dt className="col-6 fw-normal">Bag Total</dt>
                                        <dd className="col-6 text-end">${prePrice}</dd>

                                        <dt className="col-6 fw-normal">Coupon Discount</dt>
                                        {voucher
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
                                    <hr className="my-4" />
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
                                    <hr className="my-4" />
                                    {cartData?.map((item, index) => (
                                        <OrderItem key={index} item={item} />
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
                // message="Something went wrong!"
                message={error}
                show={showError}
                onHide={() => {
                    setShowError(false)
                }}
            />
        </>
    );
}