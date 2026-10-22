import React, { useState, useEffect } from "react";
import { Link } from 'react-router-dom'
import axios from 'axios';

import { NotifyModal } from "../modal/notice/NotifyModal.jsx";
import { renderRatingStar } from "../../utils/renderHandler.jsx";
import apiHandler from "../../utils/apiHandler.jsx";

export default function ProductItem({ product }) {
    const [ratings, setRating] = useState([]);
    const [properties, setProperties] = useState([]);
    const [hover, setHover] = useState(false);

    // const [showSuccess, setShowSuccess] = useState(false);
    // const token = localStorage.getItem('token');

    const getProperties = async () => {
        try {
            const response = await apiHandler.get(`/products/load-properties/${product.idproduct}`);

            setProperties(response.data);
            // console.log(response.data)
        } catch (error) {
            // console.error('Lỗi khi lấy dữ liệu sản phẩm:', error);
        }
    }

    // const handleAddToCart = async () => {
    //     try {
    //         // console.log(carts.idcart,obj.idproduct,colors.idcolor,configurations.idconfiguration)
    //         const response = await apiHandler.put(`/cart/add-cartitem`, {
    //             idcart: carts.idcart,
    //             idproduct: product.idproduct,
    //             quantity: 1,
    //             idcolor: colors.idcolor,
    //             idconfiguration:configurations.idconfiguration,
    //         });
    //         if (response.status === 201) {
    //             // alert("Sản phẩm đã được thêm vào giỏ hàng!");
    //             setShowSuccess(true)
    //         }
    //     } catch (error) {
    //         console.error('Lỗi khi thêm vào giỏ hàng:', error);
    //     }
    // };

    const getRating = async () => {
        try {
            const response = await apiHandler.get(`/products/load-rating/${product.idproduct}`);

            setRating(response.data); // Cập nhật thông tin sản phẩm từ backend
            // console.log(response.data)
        } catch (error) {
            // console.error('Lỗi khi lấy dữ liệu mô tả của sản phẩm:', error);
            setRating(null); // Nếu lỗi thì set rỗng
        }
    };

    const handleTransition = (a, b) => ({
        transition: "transform 0.3s ease",
        transform: hover ? a : b,
    })

    // const totalScore = ratings.reduce((sum, rating) => sum + rating.score, 0);
    // const averageScore = totalScore / ratings.length;
    // const cardWidth = state;
    // const imageHeight = (1 / 8) * cardWidth;

    const calculateScore = (rates) => {
        if (rates.length > 0) {
            const totalScore = ratings.reduce((sum, rate) => sum + rate.score, 0);
            const averageScore = totalScore / ratings.length;
            return averageScore
        } else {
            return 0
        }
    }

    useEffect(() => {
        // fetchProductDetails();
        // fetchProductConfiguration();
        // fetchProductDecription();
        // fetchProductColor();
        // fetchCart();
        getProperties();
        getRating();
        // fetchAPI();
        // fetchAPI1();
        // fetchAPI2();
        // fetchAPI3();
    }, []);

    if (!properties || !properties.idproduct) {
        return (
            <div
                className="card h-100">
                <div className="card-body">
                    <div className="d-flex justify-content-center align-items-center">
                        <h5 className="card-title text-truncate">
                            Loading ...
                        </h5>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <>
            <Link to={`/product?id=${properties.idproduct}`} className="text-decoration-none">
                <div
                    className="card h-100 overflow-hidden"
                    onMouseEnter={() => setHover(true)}
                    onMouseLeave={() => setHover(false)}
                >
                    <img
                        className="card-img-top object-fit-cover w-100 h-100"
                        src={properties.image}
                        alt="Card image cap"
                        style={handleTransition("scale(1.1)", "scale(1)")}
                    />
                    <div className="card-body">
                        <div className="d-flex justify-content-between align-items-center">
                            <h5 className={`card-title text-truncate layout-transitioning ${hover ? "text-primary" : ""}`}>
                                {`${properties.brand} ${properties.name}`}
                            </h5>
                            <h5 className="fw-bold fs-5">${properties.configurations[0]?.price}</h5>
                        </div>
                        <p className={`card-text text-truncate layout-transitioning ${hover ? "text-primary" : ""}`}>
                            {properties.descriptions[0]?.title_description}
                        </p>
                        {/*<a className="btn btn-outline-primary">Go somewhere</a>*/}
                        <div className="d-flex justify-content-between align-items-center">
                            <div className="text-warning fs-4">
                                {/*<RatingStar rating={calculateScore(ratings)}/>*/}
                                {renderRatingStar(calculateScore(ratings))}
                            </div>
                            {/*<button className="btn btn-primary d-flex align-items-center" onClick={handleAddToCart}>*/}
                            {/*    <i className='bx bxs-cart-add me-2'></i>*/}
                            {/*    <span>Add</span>*/}
                            {/*</button>*/}
                        </div>
                    </div>
                </div>
            </Link>
            {/*<NotifyModal*/}
            {/*    type="primary"*/}
            {/*    title="Add to cart successfully"*/}
            {/*    message="Sản phẩm đã được thêm vào giỏ hàng!"*/}
            {/*    show={showSuccess}*/}
            {/*    onHide={() => setShowSuccess(false)}*/}
            {/*/>*/}
        </>
    );
}
