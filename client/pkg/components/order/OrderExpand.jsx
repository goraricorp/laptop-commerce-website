import React from "react";
import { Link } from "react-router-dom";
import { Badge, Button, Form, Table } from "react-bootstrap";
import { formatDateTime } from "../../utils/formatHandler.jsx";
import { renderStatusDelivery } from "../../utils/renderHandler.jsx";

export default function OrderExpand({ order }) {
    // console.log(order)
    const sanitized = (array) => array.map(obj => Object.assign({}, obj))

    const subPrice = () => {
        return order.bill_details.reduce((sum, detail) => {
            return sum + (detail.price * detail.quantity);
        }, 0)
    }

    const totalPrice = () => {
        return order.bill_details.reduce((sum, detail) => {
            return sum + (detail.price * detail.quantity);
        }, 0) * (100 - order?.discount?.percentage_discount) / 100
    }

    return (
        <>
            <div className="card mb-4">
                <div className="card-header d-flex justify-content-between align-items-center">
                    {/*<h5 className="card-title m-0">Order #{order?.id ? order.id : ""}</h5>*/}
                    {/*<Button variant="info" className="ms-auto">*/}
                    {/*    <i className='bx bx-book-content text-white me-2'></i>*/}
                    {/*    <span>Details</span>*/}
                    {/*</Button>*/}
                    <div className="d-flex flex-column justify-content-center">
                        <div className="mb-1">
                            <span className="h5 me-3">Order #{order?.id}</span>
                            {/*<span className="badge bg-label-success me-1 ms-2">Paid</span>*/}
                            {/*<span className="badge bg-label-info">Ready to Pickup</span>*/}
                            {renderStatusDelivery(order?.status)}
                        </div>
                        <p className="mb-0">{formatDateTime(order?.date)}</p>
                    </div>
                    <div className="d-flex align-content-center flex-wrap gap-2">
                        <Button as={Link} to={`/user/bill?id=${order.id}`} className="btn btn-info delete-order">
                            <i className='bx bx-book-content text-white me-2'></i>
                            <span>Details</span>
                        </Button>
                    </div>
                </div>
                <div className="card-datatable table-responsive pb-3">
                    <div className="dataTables_wrapper dt-bootstrap5 no-footer">
                        <Table hover responsive className="table border-top dataTable no-footer dtr-column">
                            <thead style={{height: 64}}>
                            <tr>
                                <th
                                    className="sorting_disabled dt-checkboxes-cell dt-checkboxes-select-all"
                                    style={{verticalAlign: "middle", fontSize: 16, width: 18}}
                                >
                                    <Form.Check
                                        type="checkbox"
                                        // onChange={handleSelectAll}
                                        // checked={selectedEntries.length === currentItems.length && currentItems.length > 0}
                                    />
                                </th>
                                <th className="sorting"
                                    style={{verticalAlign: "middle", fontSize: 13}}>
                                    Products
                                </th>
                                {["Price", "Qty", "Total"].map((item, index) => (
                                    <th className="sorting" key={index}
                                        style={{verticalAlign: "middle", fontSize: 13, width: 100}}>
                                        {item}
                                    </th>
                                ))}
                            </tr>
                            </thead>
                            <tbody>
                            {order?.bill_details.map((item, index) => (
                                <tr key={index}>
                                    <td className="dt-checkboxes-cell">
                                        <Form.Check
                                            type="checkbox"
                                            // onChange={() => handleSelectRow(product.id)}
                                            // checked={selectedEntries.includes(product.id)}
                                        />
                                    </td>
                                    <td className="sorting_1">
                                        <div className="d-flex align-items-center">
                                            <div
                                                className="avatar-wrapper me-3 rounded-2 bg-label-secondary">
                                                <div className="avatar">
                                                    <img
                                                        src={`/assets/img/categories/product-7.png`}
                                                        alt="Product-8"
                                                        className="rounded"
                                                    />
                                                </div>
                                            </div>
                                            <div className="d-flex flex-column justify-content-center">
                                                <span className="text-heading text-wrap fw-medium">
                                                    {`${item?.brand} ${item?.product}`}
                                                </span>
                                                <span className="text-truncate mb-0 d-none d-sm-block">
                                                    <small>
                                                        {`
                                                            ${item?.configuration?.cpu}
                                                            |
                                                            ${item?.configuration?.gpu}
                                                            |
                                                            ${item?.configuration?.ram} GB
                                                            |
                                                            ${item?.configuration?.storage} GB
                                                            |
                                                            ${item?.configuration?.screen}'
                                                            |
                                                            ${item?.configuration?.resolution}
                                                        `}
                                                    </small>
                                                </span>
                                            </div>
                                        </div>
                                    </td>
                                    <td>
                                        <span>${item?.price}</span>
                                    </td>
                                    <td>
                                        <span>{item?.quantity}</span>
                                    </td>
                                    <td>
                                        <span>${item?.price * item?.quantity}</span>
                                    </td>
                                </tr>
                            ))}
                            </tbody>
                        </Table>
                    </div>
                    <div className="d-flex justify-content-end align-items-center m-4 mb-2">
                        <div className="order-calculations">
                            <div className="d-flex justify-content-start mb-2">
                                <span className="w-px-100 text-heading">Subtotal:</span>
                                <h6 className="mb-0">
                                    {/*${order?.price}  |  {order?.bill_details?.reduce((sum, detail) => {*/}
                                    {/*    return sum + (detail.price * detail.quantity);*/}
                                    {/*}, 0)}*/}
                                    ${subPrice()}
                                </h6>
                            </div>
                            <div className="d-flex justify-content-start mb-2">
                                <span className="w-px-100 text-heading">Discount:</span>
                                <h6 className="mb-0">${order.discount ?
                                    (subPrice() * order?.discount?.percentage_discount / 100) : 0}</h6>
                            </div>
                            {/*<div className="d-flex justify-content-start mb-2">*/}
                            {/*    <span className="w-px-100 text-heading">Tax:</span>*/}
                            {/*    <h6 className="mb-0">$28</h6>*/}
                            {/*</div>*/}
                            <div className="d-flex justify-content-start">
                                <h6 className="w-px-100 mb-0">Total:</h6>
                                <h6 className="mb-0">${order.price}</h6>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    )
}