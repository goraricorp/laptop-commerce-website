import React, { Component, useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { Container, Button, Row, Col, Card, Form } from 'react-bootstrap';
import Transitionbar from '../../layouts/Transitionbar.jsx';
import CardItem from '../../components/product/CartItem.jsx';
import axios from 'axios';
import apiHandler from "../../utils/apiHandler.jsx";
import { NotifyModal } from "../../components/modal/notice/NotifyModal.jsx";

export default function CartList() {
    const [carts, setCart] = useState();
    const [selectedPrices, setSelectedPrices] = useState([]);
    const [selectedCartItems, setSelectedCartItems] = useState([]);
    // const [vouchername, setVoucherName] = useState([]);
    const [vouchers, setVouchers] = useState([]);
    const [voucher, setVoucher] = useState(null); // Voucher được chọn

    const [showSuccess, setShowSuccess] = useState(false);

    const token = localStorage.getItem('token');
    const navigate = useNavigate();

    const loadFullCart = async () => {
        try {
            const response = await apiHandler.get('/cart/load-cart', {
                headers: {Authorization: `Bearer ${token}`}
            });

            setCart(response.data);
            // console.log(response.data);
        } catch (error) {
            // console.error("Invalid token:", error);
        }
    };

    const getVoucher = async () => {
        try {
            const response = await apiHandler.get('/cart/get-voucher');
            setVouchers(response.data);

            // console.log(response.data)
        } catch (error) {
            // console.error('Error fetching product details:', error);
        }
    };

    // const handleOrderClick = (event) => {
    //     event.preventDefault();
    //     navigate('/pay/order', {
    //         state: {
    //             cartData: selectedCartItems, // Dữ liệu giỏ hàng
    //             prePrice: pre_total,
    //             discount: discount,
    //             totalPrice: total // Tổng giá trị đơn hàng
    //         }
    //     });
    // };

    const handleChange = (item, isSelected) => {
        loadFullCart();

        const itemPrice = item.configuration.price * item.quantity;

        // Cập nhật selectedPrices
        setSelectedPrices((prevSelectedPrices) => {
            if (isSelected) {
                // Nếu sản phẩm được chọn, thêm giá trị mới vào selectedPrices
                return prevSelectedPrices.filter(price => price !== (item.configuration.price * item.prevQuantity)) // Loại bỏ giá trị cũ (nếu có)
                    .concat(itemPrice); // Thêm giá trị mới
            } else {
                // Nếu sản phẩm bị bỏ chọn, loại bỏ giá trị của sản phẩm khỏi selectedPrices
                return prevSelectedPrices.filter((price) => price !== item.configuration.price * item.quantity);
            }
        });

        // Cập nhật selectedCartItems
        setSelectedCartItems((prevSelectedCartItems) => {
            if (isSelected) {
                // Nếu sản phẩm được chọn, thêm item vào selectedCartItemsọn, thêm item vào selectedCartItems
                return [...prevSelectedCartItems, item];
            } else {
                // Nếu sản phẩm bị bỏ chọn, loại bỏ item khỏi selectedCartItems
                return prevSelectedCartItems.filter((cartItem) => cartItem.idcart_item !== item.idcart_item);
            }
        });
    };

    // let pre_total = selectedPrices.reduce((acc, price) => acc + price, 0);
    // let discount = 0;
    // let total = pre_total - pre_total * discount;

    const calculateTotal = () => {
        const preTotal = selectedCartItems.reduce(
            (sum, item) => sum + item.configuration.price * item.quantity,
            0
        );
        const discount = voucher ? voucher.percentage_discount : 0;
        return {
            preTotal,
            discountAmount: preTotal * discount / 100,
            total: preTotal - preTotal * discount / 100,
        };
    };

    const handleCheckboxChange = (item, isSelected) => {
        setSelectedCartItems((prev) => {
            if (isSelected) {
                return [...prev, { ...item, quantity: item.quantity }];
            } else {
                return prev.filter((cartItem) => cartItem.idcart_item !== item.idcart_item);
            }
        });
    };

    const handleQuantityChange = (item, newQuantity) => {
        // if (newQuantity < 1 || newQuantity > item.configuration.quantity) return;

        setSelectedCartItems((prev) =>
            prev.map((cartItem) =>
                cartItem.idcart_item === item.idcart_item
                    ? { ...cartItem, quantity: newQuantity }
                    : cartItem
            )
        );
    };

    const handleOrderClick = (event) => {
        event.preventDefault();
        const { preTotal, discountAmount, total } = calculateTotal();
        navigate('/pay/order', {
            state: {
                cartData: selectedCartItems,
                prePrice: preTotal,
                discount: discountAmount,
                voucher: voucher,
                totalPrice: total,
            },
        });
    };

    const handleGotoPurchaseClick = (event) => {
        event.preventDefault();
        const { preTotal, discountAmount, total } = calculateTotal();
        navigate('/pay/purchase', {
            state: {
                cartData: selectedCartItems,
                prePrice: preTotal,
                discount: discountAmount,
                voucher: voucher,
                totalPrice: total,
            },
        });
    };

    useEffect(() => {
        loadFullCart();
        getVoucher();
        // response();
    }, []);

    const { preTotal, discountAmount, total } = calculateTotal();

    return (
        <>
            <Transitionbar />
            <div className="container">
                <div className="row">
                    {/* Left Section: Product List */}
                    <div className="col col-sm-12 col-md-12 col-lg-8">
                        <div className="row">
                            <div className="col-12 mb-4">
                                <div
                                    className="card px-3 py-3 light bg-body-tertiary align-items-center bg-navbar-theme">
                                    <div className="container d-flex ps-2 p-0 align-items-center">
                                        <h5 className="m-0">Cart</h5>
                                        <Button as={Link} to={'/search'} variant="primary" className="ms-auto">
                                            <i className='bx bx-cart-add me-2'></i>
                                            <span>Add Product</span>
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </div>
                        {carts?.cart_items.map((item, index) => (
                            <div className="card p-3 mb-4" key={index}>
                                <CardItem
                                    element={item}
                                    onChange={handleChange}
                                    onCheckboxChange={(isSelected) => handleCheckboxChange(item, isSelected)}
                                    onQuantityChange={(newQuantity) => handleQuantityChange(item, newQuantity)}
                                    onReload={() => loadFullCart()}
                                    onRemove={() => setShowSuccess(true)}
                                />
                            </div>
                        ))}
                    </div>

                    {/* Right Section: Order Summary */}
                    <div className="col col-lg-4 col-md-12 col-sm-12 mb-4">
                        <div className="container position-sticky sticky-summary p-0" style={{ top: 24 }}>
                            <div className="card p-3">
                                <div className="rounded p-3">
                                    <h5>Offer</h5>
                                    <div className="row g-4 mb-4">
                                        <div className="col-12">
                                            <Form.Select
                                                className="mb-4"
                                                aria-label="Default select example"
                                                onChange={(e) => {
                                                    const selectedValue = e.target.value;
                                                    const selectedItem = vouchers.find(item => item.discount_name === selectedValue);

                                                    setVoucher(selectedItem);
                                                    // console.log(selectedItem);
                                                }}
                                            >
                                                <option>Choose voucher</option>
                                                {vouchers.map((item, index) => (
                                                    <option key={index} value={item.discount_name}>{item.discount_name}</option>
                                                ))}
                                            </Form.Select>
                                            {/*<input type="text" className="form-control" placeholder="Enter Promo Code"*/}
                                            {/*    aria-label="Enter Promo Code" />*/}
                                        </div>
                                        {/*<div className="col-4 col-xxl-4 col-xl-12">*/}
                                        {/*    <div className="d-grid">*/}
                                        {/*        <Button variant="outline-primary" type="button"*/}
                                        {/*            className="btn btn-label-primary">Apply</Button>*/}
                                        {/*    </div>*/}
                                        {/*</div>*/}
                                    </div>
                                    <h5>Price Details</h5>
                                    <dl className="row mb-0 text-heading">
                                        <dt className="col-6 fw-normal">Bag Total</dt>
                                        <dd className="col-6 text-end">${preTotal}</dd>

                                        <dt className="col-6 fw-normal">Coupon Discount</dt>
                                        {
                                            voucher
                                                ? <dd className="col-6 text-end">-{voucher.percentage_discount}%</dd>
                                                : <dd className="col-6 text-primary text-end">Apply Coupon</dd>
                                        }

                                        <dt className="col-6 fw-normal">Order Total</dt>
                                        <dd className="col-6 text-end">-${discountAmount}</dd>

                                        <dt className="col-6 fw-normal">Delivery Charges</dt>
                                        <dd className="col-6 text-end">
                                            <s className="text-muted">$5.00</s>
                                            <span className="badge bg-label-success ms-1">Free</span>
                                        </dd>
                                    </dl>
                                    <hr className="my-4" />
                                    <dl className="row mb-0">
                                        <dt className="col-6 text-heading">Total</dt>
                                        <dd className="col-6 fw-medium text-end text-heading mb-0">${total}</dd>
                                    </dl>
                                </div>
                                <div className="rounded p-3">
                                    <Button
                                        className="w-100"
                                        variant="danger"
                                        // onClick={handleOrderClick}
                                        onClick={handleGotoPurchaseClick}
                                        disabled={selectedCartItems.length === 0}
                                    >
                                        {/*Order*/}
                                        Go to Purchase
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <NotifyModal
                type="primary"
                title="Remove item successfully"
                message="Product has been removed from the cart!"
                show={showSuccess}
                onHide={() => setShowSuccess(false)}
            />
        </>
    );
}
