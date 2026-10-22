import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import { Container, Row, Col, Button } from 'react-bootstrap';
import { ResponseButton } from "../components/button/ResponseButton.jsx";

const FooterLink = ({ item }) => {
    return (
        <Link to={item.link}>
            <button className="btn btn-link text-dark"> {/* text-light */}
                <i className={`${item.box} bx bx-sm me-2`}></i>
                <span>{item.name}</span>
            </button>
        </Link>
    )
}

export default function Footer() {

    const paymentIcons = [
        { id: 1, name: "Banking", box: "bxs-dollar-circle", link: "#" },
        { id: 2, name: "Cash", box: "bx-money", link: "#" },
        // { id: 3, name: "ATM Card", box: "bx-credit-card-front", link: "#" },
        { id: 4, name: "PayPal", box: "bxl-paypal", link: "#" },
        // { id: 5, name: "VISA Card", box: "bxl-visa", link: "#" },
        // { id: 6, name: "Mastercard", box: "bx-credit-card", link: "#" },
    ]

    const usefulInfo = [
        { id: 1, name: "Warranty Policy", box: "bx-check-circle", link: "#" },
        { id: 2, name: "Return Policy", box: "bx-rotate-left", link: "#" },
        { id: 3, name: "Shipping Policy", box: "bx-package", link: "#" },
        { id: 4, name: "Privacy Policy", box: "bx-shield-quarter", link: "#" },
        { id: 5, name: "Payment Policy", box: "bx-wallet", link: "#" },
        // { id: 6, name: "Inspection Policy", box: "bx-expand", link: "#" },
        { id: 7, name: "Online Shopping Guide", box: "bx-planet", link: "#" },
        { id: 8, name: "About Us", box: "bx-info-circle", link: "/about" }
    ];

    const socialIcons = [
        { id: 1, name: "Github", box: "bxl-github", link: "https://github.com/goraria/e-commerce" },
        { id: 2, name: "Facebook", box: "bxl-facebook-circle", link: "#" },
        { id: 3, name: "Youtube", box: "bxl-youtube", link: "#" },
        { id: 4, name: "Tiktok", box: "bxl-tiktok", link: "#" },
        { id: 5, name: "Twitter", box: "bxl-twitter", link: "#" },
        // { id: 6, name: "Threads" box: "bxl-thread", link: "#" },
        { id: 7, name: "Instagram", box: "bxl-instagram", link: "#" },
        // { id: 8, name: "Pinterest", box: "bxl-pinterest", link: "#" },
        // { id: 9, name: "Whatsapp", box: "bxl-whatsapp", link: "#" },
        { id: 10, name: "Reddit", box: "bxl-reddit", link: "#" },
        // { id: 11, name: "Steam", box: "bxl-steam", link: "#" },
        // { id: 12, name: "Snapchat", box: "bxl-snapchat", link: "#" },
        { id: 13, name: "Telegram", box: "bxl-telegram", link: "#" }
    ];

    return (
        <>
            <footer className="bg-light text-dark text-left">
                <div className="container">
                    <div className="row">
                        <div className="col mt-5 mb-5">
                            <h5 className="text-dark">Payment diversity</h5>
                            <ul className="list-unstyled p-0">
                                {paymentIcons.map((paymentIcon, index) => (
                                    <li key={index}>
                                        <FooterLink item={paymentIcon}/>
                                    </li>
                                ))}
                            </ul>
                        </div>
                        <div className="col mt-5 mb-5">
                            <h5 className="text-dark">Usual Information</h5>
                            <ul className="list-unstyled p-0">
                                {usefulInfo.map((useful, index) => (
                                    <li key={index}>
                                        <FooterLink item={useful}/>
                                    </li>
                                ))}
                            </ul>
                        </div>
                        <div className="col mt-5 mb-5">
                            <h5 className="text-dark">Social networks</h5>
                            <ul className="list-unstyled p-0">
                                {socialIcons.map((socialIcon, index) => (
                                    <li key={index}>
                                        <FooterLink item={socialIcon}/>
                                    </li>
                                ))}
                            </ul>
                        </div>
                        <div className="col mt-5 mb-5">
                            <h5 className="text-dark">Phản hồi, góp ý, khiếu nại</h5>
                            <p className="p-2">
                                Phản hồi nóng về chất lượng sản phẩm và dịch vụ.
                                Đội ngũ Kiểm Soát Chất Lượng của chúng tôi sẵn sàng lắng nghe quý khách.
                            </p>
                            {/*<Button href="#" variant="secondary" style={{ backgroundColor: '#ff00aa' }}>*/}
                            {/*    Gửi phản hồi ngay*/}
                            {/*</Button>*/}
                            <ResponseButton/>
                        </div>
                    </div>
                    <div className="row">
                        <div className="col text-center mb-4">  {/* text-muted */}
                            <h5 className="text-dark">
                                Copyright &copy; 2020 - {(new Date().getFullYear())} Gorth Inc. All rights reserved.
                            </h5>
                            <h6 className="text-dark">
                                Address: La Gorta, San Siro, Milano, Italia. Hotline: 999-9999999
                            </h6>
                        </div>
                    </div>
                </div>
            </footer>
        </>
    )
}


