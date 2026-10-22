import React from "react";
import {Link} from "react-router-dom";

const Basket = ({ bask }) => {
    return (
        <>
            {/* <li>  to={`/product?id=${bask.product.idproduct}`} */}
            <li className="list-group-item list-group-item-action dropdown-notifications-item">
                <div className="d-flex">
                    <div className="flex-shrink-0 me-3">
                        <div className="avatar">
                            <img src={bask.product.image} alt="" className="rounded-circle"/>
                        </div>
                    </div>
                    <div className="flex-grow-1">
                        <h6 className="small mb-0">{`${bask.product.brand} ${bask.product.name}`}</h6>
                        <small className="mb-1 d-block text-body">
                            {`${bask.configuration.cpu} | ${bask.configuration.gpu}`}
                        </small>
                        <small className="text-muted">
                            {`Quantity: ${bask.quantity} | $${bask.configuration.price}`}
                        </small>
                    </div>
                    <div className="flex-shrink-0 dropdown-notifications-actions">
                        <a href="#" className="dropdown-notifications-read">
                            <span className="badge badge-dot"></span>
                        </a>
                        <a href="#" className="dropdown-notifications-archive">
                            <span className="bx bx-x"></span>
                        </a>
                    </div>
                </div>
            </li>
        </>
    )
}

export default Basket;