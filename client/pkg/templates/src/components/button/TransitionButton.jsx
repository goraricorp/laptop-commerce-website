import React from "react";
import { Link } from "react-router-dom";
import { getCategoryIcon } from "../../utils/iconHandler.jsx";

export const TransitionButton = ({ icon }) => {
    return (
        <>
            {/*<div className="d-inline-flex m-0">*/}
            {/*    <div className="card-icon m-0">*/}
            {/*        <div className="avatar">*/}
            {/*            <div className={`avatar-initial rounded bg-label-primary`}>*/}
            {/*                <i className={`bx ${(icon)} bx-sm`}></i>*/}
            {/*            </div>*/}
            {/*        </div>*/}
            {/*    </div>*/}
            {/*</div>*/}
            <li className="nav-item me-3 me-xl-2">
                <Link
                    className="nav-link dropdown-toggle hide-arrow"
                    to="#"
                >
                    {/*<i className={`bx ${icon} bx-sm`}></i>*/}
                    <div className="card-icon m-0">
                        <div className="avatar">
                            <div className={`avatar-initial rounded bg-label-primary`}>
                                <i className={`bx ${(icon)} bx-sm`}></i>
                            </div>
                        </div>
                    </div>
                </Link>
            </li>
        </>
    )
}