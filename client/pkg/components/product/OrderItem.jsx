import React, { useState, useEffect } from "react";

export default function OrderItem({ item }) {
    const [product, setProduct] = useState([]);
    const [default_config, setdefaultconfig] = useState([]);
    const [descriptions, setArray] = useState([]);
    const [isChecked, setIsChecked] = useState(false);

    // console.log(item)

    useEffect(() => {

    }, []);

    return (
        <>
            <div className="d-none justify-content-lg-start justify-content-center align-items-center product-name">
                <div className="avatar-wrapper">
                    <div
                        className="avatar me-4 rounded-2 bg-label-secondary"
                        style={{width: 112, height: 112}}
                    >
                        <img
                            src={item.product.image}
                            className="rounded"
                            alt="item"
                        />
                    </div>
                </div>
                <div className="d-flex justify-content-between align-items-left flex-column">
                    <h6 className="text-nowrap mb-2">{`${item.product.brand} ${item.product.name}`}</h6>
                    <h6 className="text-nowrap mb-0 mt-2">${item.configuration.price}</h6>
                    <h6 className="text-nowrap mb-0">x{item?.quantity}</h6>
                </div>
                <div className="text-right">
                    {/* <span>{product.price} đ</span><br /> */}
                    <span>x{item?.quantity}</span>
                </div>
            </div>
            <div className="d-flex gap-4 flex-sm-row flex-column align-items-center">
                <div className="flex-shrink-0 d-flex align-items-center">
                    <img src={item.product.image} alt="google home" className="w-px-100"/>
                </div>
                <div className="flex-grow-1">
                    <div className="row text-center text-sm-start">
                        <div className="col-md-8">
                            <p className="me-3 mb-2">
                                <a className="fw-medium">
                                    <span className="text-heading">{`${item.product.brand} ${item.product.name}`}</span>
                                </a>
                            </p>
                            {/*<div className="text-muted mb-2 d-flex flex-wrap justify-content-center justify-content-sm-start">*/}
                            {/*    <span className="me-1">Sold by:</span>*/}
                            {/*    <a className="me-4">Apple</a>*/}
                            {/*    <span className="badge bg-label-success">In Stock</span>*/}
                            {/*</div>*/}
                            <div className="d-flex d-md-block align-items-center mb-2 gap-2 justify-content-center justify-content-sm-start">
                                <span className="text-nowrap mb-0 mt-2">${item.configuration.price}</span>
                            </div>
                        </div>
                        <div className="col-md-4">
                            <div className="text-md-end">
                                <div
                                    className="d-flex d-md-block align-items-center mb-2 gap-2 justify-content-center justify-content-sm-start">
                                    <div className="my-2 mt-md-8 mb-md-4">
                                        <span className="text-primary">x{item?.quantity}</span>
                                        {/*<span className="text-primary">$299/</span>*/}
                                        {/*<s className="text-body">$359</s>*/}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};
