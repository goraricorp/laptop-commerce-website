import React, { useState, useEffect } from "react";
import { Row, Col, Form, Button } from "react-bootstrap";
import axios from 'axios';
import { NotifyModal } from "../modal/notice/NotifyModal.jsx";
import apiHandler from "../../utils/apiHandler.jsx";
import { Link } from "react-router-dom";

export default function CardItem({ element, onChange, onReload, onRemove, onCheckboxChange, onQuantityChange }) {
    const [product, setProduct] = useState([]);
    const [isChecked, setIsChecked] = useState(false);
    const [quantity, setQuantity] = useState(element.quantity);

    const handleCheckboxToggle = () => {
        const newChecked = !isChecked;
        setIsChecked(newChecked);
        onCheckboxChange(newChecked); // Gửi trạng thái checkbox lên `Cart`
    };

    const handleQuantityChange = (newQuantity) => {
        // if (isChecked) { // Chỉ cho phép thay đổi nếu sản phẩm được tick chọn
        //     // Gửi số lượng mới lên `Cart`
        // }
        setQuantity(newQuantity);
        handleUpdateQuantity(newQuantity);
        onQuantityChange(newQuantity);
    };

    const handleUpdateQuantity = async (quantity) => {
        try {
            await apiHandler.put(`/cart/update-cartitem`, {
                idcart_item: element.idcart_item,
                quantity: quantity
            });

            // setQuantity(quantity);
            onReload()
            // onChange(element, true)
        } catch (error) {
            // console.error('Lỗi khi cập nhật vào giỏ hàng:', error);
        }
    };

    const handleRemoveItem = async () => {
        try {
            await apiHandler.put(`/cart/remove-cartitem`, {
                idcartItem: element.idcart_item,
            });

            onRemove()
            onReload();
        } catch (error) {
            console.error('Lỗi khi xóa vào giỏ hàng:', error);
        }
    };

    useEffect(() => {
        // fetchProductDetails();
        // fetchProductConfiguration();
        // fetchProductDescription();
    }, []);

    return (
        <>
            <div className="row align-items-center d-flex flex-wrap">
                <div
                    className="col col-sm-12 col-md-12 col-lg-1 d-flex align-items-center justify-content-lg-center">
                    <Form.Check
                        type="checkbox"
                        // className="me-3"
                        checked={isChecked}
                        // onChange={handleCheckboxChange}
                        onChange={handleCheckboxToggle}
                    />
                </div>
                <div className="col col-sm-12 col-md-12 col-lg-8 d-flex flex-column justify-content-center text-lg-start text-center">
                    <div className="d-flex justify-content-lg-start justify-content-center align-items-center product-name">
                        <Link className="avatar-wrapper" to={`/product/?id=${element.product.idproduct}`}>
                            <div
                                className="avatar me-4 rounded-2 bg-label-secondary"
                                style={{width: 112, height: 112}}
                            >
                                <img
                                    src={element.product.image}
                                    className="rounded"
                                    alt="item"
                                />
                            </div>
                        </Link>
                        <div className="d-flex flex-column">
                            <h6 className="text-nowrap mb-2">{`${element.product.brand} ${element.product.name}`}</h6>
                            <small className="text-truncate d-none d-sm-block">
                                {`${element.configuration.cpu} 
                                | ${element.configuration.gpu}`}
                            </small>
                            <small className="text-truncate d-none d-sm-block">
                                {`${element.configuration.ram} GB 
                                | ${element.configuration.storage} GB
                                | ${element.configuration.screen}' 
                                | ${element.configuration.resolution}`}
                            </small>
                            {/*</small>*/}
                            <h6 className="text-nowrap mb-0 mt-2">${element.configuration.price}</h6>
                        </div>
                    </div>
                </div>
                <div className="col col-sm-12 col-md-12 col-lg-3 d-flex align-items-center justify-content-start justify-content-sm-center">
                    <Button
                        className="p-2"
                        variant="outline-primary"
                        disabled={quantity <= 1}
                        onClick={() => handleQuantityChange(quantity - 1)}
                    >
                        <i className='bx bx-minus'></i>
                    </Button>
                    <Form className="d-flex align-items-center justify-content-center mx-2">
                        <Form.Control
                            className=""
                            // type="text"
                            placeholder="0"
                            // defaultValue={quantity}
                            readOnly
                            value={quantity}
                            max={element.configuration.quantity}
                            min={1}
                            onChange={(e) => handleQuantityChange(Number(e.target.value))}
                            style={{ width: 50, textAlign: "center", display: "inline-block" }}
                        />
                    </Form>
                    <Button
                        className="p-2"
                        variant="outline-primary"
                        disabled={quantity >= element.configuration.quantity}
                        onClick={() => handleQuantityChange(quantity + 1)}
                    >
                        <i className='bx bx-plus'></i>
                    </Button>
                    <Button
                        className="p-2 ms-2"
                        variant="outline-primary"
                        onClick={handleRemoveItem}
                    >
                        <i className='bx bx-trash'></i>
                    </Button>
                </div>
            </div>
        </>
    );
};

function CardItemOld({ element, onChange, onReload, onCheckboxChange, onQuantityChange }) {
    const [product, setProduct] = useState([]);
    const [default_config, setdefaultconfig] = useState([]);
    const [descriptions, setArray] = useState([]);
    const [isChecked, setIsChecked] = useState(false);
    const [quantity, setQuantity] = useState(element.quantity);
    const [reload, setReload] = useState(false);  // State to trigger re-render

    const [showSuccess, setShowSuccess] = useState(false);

    // console.log(element);

    // const fetchProductDetails = async () => {
    //     try {
    //         const response = await fetch(`/products/load-productid/${element.idproduct}`);
    //         const data = await response.json();
    //         setProduct(data[0]);
    //     } catch (error) {
    //         console.error("Error fetching product details:", error);
    //     }
    // };

    // const fetchProductConfiguration = async () => {
    //     try {
    //         const response = await fetch(`/products/load-idconfiguration/${element.idconfiguration}`);
    //         const data = await response.json();
    //         setdefaultconfig(data[0]);
    //     } catch (error) {
    //         console.error("Error fetching configuration:", error);
    //     }
    // };

    // const fetchProductDescription = async () => {
    //     try {
    //         const response = await fetch(`/products/load-description/${element.idproduct}`);
    //         const data = await response.json();
    //         setArray(data[0]);
    //     } catch (error) {
    //         console.error("Error fetching description:", error);
    //     }
    // };

    // const handleQuantityChange = (newQuantity) => {
    //     if (newQuantity < 1 || newQuantity > element.configuration.quantity) return;
    //
    //     setQuantity(newQuantity);
    //     if (isChecked) {
    //         onQuantityChange(element, newQuantity);
    //     }
    // };

    const handleCheckboxToggle = () => {
        const newChecked = !isChecked;
        setIsChecked(newChecked);
        onCheckboxChange(newChecked); // Gửi trạng thái checkbox lên `Cart`
    };

    const handleQuantityChange = (newQuantity) => {
        // if (isChecked) { // Chỉ cho phép thay đổi nếu sản phẩm được tick chọn
        //     // Gửi số lượng mới lên `Cart`
        // }
        setQuantity(newQuantity);
        handleUpdateQuantity(newQuantity);
        onQuantityChange(newQuantity);
    };

    // const handleCheckboxChange = () => {
    //     const newChecked = !isChecked;
    //     setIsChecked(newChecked);
    //     onReload()
    //     onChange(element, newChecked);
    // };
    //
    // const handleQuantityChange = (quantity) => {
    //     if (quantity < 1 || quantity > element.configuration.quantity) return;
    //
    //     setQuantity(quantity);
    //     handleUpdateQuantity(quantity);
    // };

    const handleUpdateQuantity = async (quantity) => {
        try {
            await apiHandler.put(`/cart/update-cartitem`, {
                idcart_item: element.idcart_item,
                quantity: quantity
            });

            // setQuantity(quantity);
            onReload()
            // onChange(element, true)
        } catch (error) {
            // console.error('Lỗi khi cập nhật vào giỏ hàng:', error);
        }
    };

    const handleRemoveItem = async () => {
        try {
            await apiHandler.put(`/cart/remove-cartitem`, {
                idcartItem: element.idcart_item,
            });

            setShowSuccess(true);
            onReload();
        } catch (error) {
            console.error('Lỗi khi xóa vào giỏ hàng:', error);
        }
    };

    useEffect(() => {
        // fetchProductDetails();
        // fetchProductConfiguration();
        // fetchProductDescription();
    }, []);

    return (
        <>
            <div className="row align-items-center d-flex flex-wrap">
                <div
                    className="col col-sm-12 col-md-12 col-lg-1 d-flex align-items-center justify-content-lg-center">
                    <Form.Check
                        type="checkbox"
                        // className="me-3"
                        checked={isChecked}
                        // onChange={handleCheckboxChange}
                        onChange={handleCheckboxToggle}
                    />
                </div>
                <div className="col col-sm-12 col-md-12 col-lg-8 d-flex flex-column justify-content-center text-lg-start text-center">
                    <div className="d-flex justify-content-lg-start justify-content-center align-items-center product-name">
                        <Link className="avatar-wrapper" to={`/product/?id=${element.product.idproduct}`}>
                            <div
                                className="avatar me-4 rounded-2 bg-label-secondary"
                                style={{width: 112, height: 112}}
                            >
                                <img
                                    src={element.product.image}
                                    className="rounded"
                                    alt="item"
                                />
                            </div>
                        </Link>
                        <div className="d-flex flex-column">
                            <h6 className="text-nowrap mb-2">{`${element.product.brand} ${element.product.name}`}</h6>
                            <small className="text-truncate d-none d-sm-block">
                                {`${element.configuration.cpu} 
                                | ${element.configuration.gpu}`}
                            </small>
                            <small className="text-truncate d-none d-sm-block">
                                {`${element.configuration.ram} GB 
                                | ${element.configuration.storage} GB
                                | ${element.configuration.screen}' 
                                | ${element.configuration.resolution}`}
                            </small>
                            {/*<small className="text-truncate d-none d-sm-block mb-2">*/}
                            {/*    {`${element.configuration.cpu} */}
                            {/*    | ${element.configuration.gpu} */}
                            {/*    | ${element.configuration.ram} GB */}
                            {/*    | ${element.configuration.storage} GB*/}
                            {/*    | ${element.configuration.screen}' */}
                            {/*    | ${element.configuration.resolution}`}*/}
                            {/*</small>*/}
                            <h6 className="text-nowrap mb-0 mt-2">${element.configuration.price}</h6>
                        </div>
                    </div>
                </div>
                <div className="col col-sm-12 col-md-12 col-lg-3 d-flex align-items-center justify-content-start justify-content-sm-center">
                    <Button
                        className="p-2"
                        variant="outline-primary"
                        disabled={quantity <= 1}
                        onClick={() => handleQuantityChange(quantity - 1)}
                    >
                        <i className='bx bx-minus'></i>
                    </Button>
                    <Form className="d-flex align-items-center justify-content-center mx-2">
                        <Form.Control
                            className=""
                            // type="text"
                            placeholder="0"
                            // defaultValue={quantity}
                            readOnly
                            value={quantity}
                            max={element.configuration.quantity}
                            min={1}
                            onChange={(e) => handleQuantityChange(Number(e.target.value))}
                            style={{ width: 50, textAlign: "center", display: "inline-block" }}
                        />
                    </Form>
                    <Button
                        className="p-2"
                        variant="outline-primary"
                        disabled={quantity >= element.configuration.quantity}
                        onClick={() => handleQuantityChange(quantity + 1)}
                    >
                        <i className='bx bx-plus'></i>
                    </Button>
                    <Button
                        className="p-2 ms-2"
                        variant="outline-primary"
                        onClick={handleRemoveItem}
                    >
                        <i className='bx bx-trash'></i>
                    </Button>
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
};

const CardItem0 = ({ element, onCheckboxChange, onQuantityChange }) => {
    const [isChecked, setIsChecked] = useState(false);
    const [quantity, setQuantity] = useState(element.quantity);

    const handleCheckboxToggle = () => {
        const newChecked = !isChecked;
        setIsChecked(newChecked);
        onCheckboxChange(newChecked); // Gửi trạng thái checkbox lên `Cart`
    };

    const handleQuantityChange = (newQuantity) => {
        setQuantity(newQuantity);
        onQuantityChange(newQuantity); // Gửi số lượng mới lên `Cart`
    };

    return (
        <Row className="align-items-center">
            <Col lg={1}>
                <Form.Check checked={isChecked} onChange={handleCheckboxToggle} />
            </Col>
            <Col lg={8}>
                <h6>{element.product.name}</h6>
                <p>${element.configuration.price}</p>
            </Col>
            <Col lg={3} className="text-end">
                <Button
                    onClick={() => handleQuantityChange(quantity - 1)}
                    disabled={quantity <= 1}
                    variant="outline-primary"
                >
                    -
                </Button>
                <Form.Control
                    value={quantity}
                    onChange={(e) => handleQuantityChange(Number(e.target.value))}
                    style={{ width: 50, textAlign: 'center', display: 'inline-block' }}
                />
                <Button
                    onClick={() => handleQuantityChange(quantity + 1)}
                    disabled={quantity >= element.configuration.quantity}
                    variant="outline-primary"
                >
                    +
                </Button>
            </Col>
        </Row>
    );
};
