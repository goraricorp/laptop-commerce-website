import React, {useEffect} from "react";
import { getToastPosition, getToastType } from "../../utils/iconHandler.jsx";

export default function ToastBox({ title, type, position, message }) {
    useEffect(() => {
        Toast();
    },[])

    return (
        <>
            <div
                className="bs-toast toast toast-placement-ex m-2"
                role="alert"
                aria-live="assertive"
                aria-atomic="true"
                data-bs-delay="3000">
                <div className="toast-header">
                    <i className="bx bx-bell me-2"></i>
                    <div className="me-auto fw-medium">{title}</div>
                    <small>{type}</small>
                    <button type="button" className="btn-close" data-bs-dismiss="toast" aria-label="Close"></button>
                </div>
                <div className="toast-body">{message}</div>
            </div>
            {/* <!-- Toast with Placements --> */}

            {/* <!-- Bootstrap Toasts with Placement --> */}
            <div className="card mb-4">
                <h5 className="card-header">Bootstrap Toasts Example With Placement</h5>
                <div className="card-body">
                    <div className="row gx-3 gy-2 align-items-center">
                        <div className="col-md-3">
                            <label className="form-label" htmlFor="selectTypeOpt">
                                Type
                            </label>
                            <select id="selectTypeOpt" className="form-select color-dropdown" defaultValue={getToastType(type)}>
                                <option value="bg-primary">Primary</option>
                                <option value="bg-secondary">Secondary</option>
                                <option value="bg-success">Success</option>
                                <option value="bg-danger">Danger</option>
                                <option value="bg-warning">Warning</option>
                                <option value="bg-info">Info</option>
                                <option value="bg-dark">Dark</option>
                            </select>
                        </div>
                        <div className="col-md-3">
                            <label className="form-label" htmlFor="selectPlacement">
                                Placement
                            </label>
                            <select className="form-select placement-dropdown" id="selectPlacement" defaultValue={getToastPosition(position)}>
                                <option value="top-0 start-0">Top left</option>
                                <option value="top-0 start-50 translate-middle-x">Top center</option>
                                <option value="top-0 end-0">Top right</option>
                                <option value="top-50 start-0 translate-middle-y">Middle left</option>
                                <option value="top-50 start-50 translate-middle">Middle center</option>
                                <option value="top-50 end-0 translate-middle-y">Middle right</option>
                                <option value="bottom-0 start-0">Bottom left</option>
                                <option value="bottom-0 start-50 translate-middle-x">Bottom center</option>
                                <option value="bottom-0 end-0">Bottom right</option>
                            </select>
                        </div>
                        {/*<div className="col-md-3">*/}
                        {/*    <label className="form-label" htmlFor="showToastPlacement">*/}
                        {/*        &nbsp;*/}
                        {/*    </label>*/}
                        {/*    <button id="showToastPlacement" className="btn btn-primary d-block">*/}
                        {/*        Show Toast*/}
                        {/*    </button>*/}
                        {/*</div>*/}
                    </div>
                </div>
            </div>
        </>
    )
};