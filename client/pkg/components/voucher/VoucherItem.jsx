import React from "react";

export default function VoucherItem({ voucher }) {
    voucher = {
        percentage: 10,
        max: 10,
        least: 50,
        startdate: new Date().toLocaleDateString(),
        outdate: new Date().toLocaleDateString()
    }

    return (
        <>
            {/*<div className="card mb-3">*/}
            {/*    <div className="d-flex g-0">*/}
            {/*        /!*<div className="col-md-4">*!/*/}
            {/*            <img*/}
            {/*                aria-label='card image'*/}
            {/*                className="card-img card-img-left object-fit-cover"*/}
            {/*                src={"/assets/img/overviews/jp.jpeg"} alt="Card image"*/}
            {/*                style={{width: 144, height: 144}}/>*/}
            {/*        /!*</div>*!/*/}
            {/*        /!*<div className="col-md-8">*!/*/}
            {/*            <div className="card-body">*/}
            {/*                <h5 className="card-title text-truncate">Discount {item.percentage}% max {item.max}$</h5>*/}
            {/*                <p className="card-text text-truncate">*/}
            {/*                    Order with price at least {item.least}*/}
            {/*                </p>*/}
            {/*                <p className="card-text">*/}
            {/*                    <small className="text-muted text-truncate">*/}
            {/*                        Available: {item.startdate} - {item.outdate}*/}
            {/*                    </small>*/}
            {/*                </p>*/}
            {/*            </div>*/}
            {/*        /!*</div>*!/*/}
            {/*    </div>*/}
            {/*</div>*/}

            <div className="card">
                <div className="row g-0">
                    <div className="col-md-4">
                        <img aria-label='card image' className="card-img card-img-left" src="/assets/img/elements/5.png" alt="Card image" />
                    </div>
                    <div className="col-md-8">
                        <div className="card-body">
                            <h5 className="card-title">Discount {voucher.percentage}% max {voucher.max}$</h5>
                            <p className="card-text">
                                Order with price at least {voucher.least}
                            </p>
                            <p className="card-text">
                                <small className="text-muted">Available: {voucher.startdate} - {voucher.outdate}</small>
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/*<div className="card mb-4">*/}
            {/*    <div className="d-flex flex-md-row flex-column">*/}
            {/*        <div>*/}
            {/*            <img className="card-img card-img-left" src="/assets/img/elements/20.jpg"*/}
            {/*                 alt="Card image"/>*/}
            {/*        </div>*/}
            {/*        <div>*/}
            {/*            <div className="card-body">*/}
            {/*                <h5 className="card-title">Discount {item.percentage}% max {item.max}$</h5>*/}
            {/*                <p className="card-text">*/}
            {/*                    Order with price at least {item.least}*/}
            {/*                </p>*/}
            {/*                <p className="card-text">*/}
            {/*                    <small className="text-body-secondary">*/}
            {/*                        Available: {item.startdate} - {item.outdate}*/}
            {/*                    </small>*/}
            {/*                </p>*/}
            {/*            </div>*/}
            {/*        </div>*/}
            {/*    </div>*/}
            {/*</div>*/}
        </>
    )
};