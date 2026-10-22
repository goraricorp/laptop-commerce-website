import React, { useEffect, useState } from "react";
import { Badge, Button, Form, Table } from "react-bootstrap";
import { Link, useLocation } from "react-router-dom";
import { formatDateTime } from "../../utils/formatHandler.jsx";
import { renderStatusDelivery } from "../../utils/renderHandler.jsx";
import axios from "axios";
import apiHandler from "../../utils/apiHandler.jsx";
import NotAuthorizedPage from "../misc/NotAuthorizedPage.jsx";

export const OrderDetails = () => {
    const location = useLocation(); // Lấy thông tin URL hiện tại
    const searchParams = new URLSearchParams(location.search);
    const id = searchParams.get('id');
    // console.log('Order ID:', id);

    const [bill, setBill] = useState({});
    // const [bill, setBill] = useState();

    const handleGetBill = async () => {
        try {
            const token = localStorage.getItem('token')
            const response = await apiHandler.get(`/bill/get-bill/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            // console.log(response.data);
            setBill(response.data);
        } catch (error) {
            // console.error('Lỗi khi lấy dữ liệu:', error);
        }
    }

    // const [data, setData] = useState([])
    // const [selectedEntries, setSelectedEntries] = useState([]);
    // const [searchTerm, setSearchTerm] = useState("");
    // const [currentPage, setCurrentPage] = useState(1);
    // const [itemsPerPage, setItemsPerPage] = useState(10);
    // const indexOfLastItem = currentPage * itemsPerPage;
    // const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    // const currentItems = filteredData.slice(indexOfFirstItem, indexOfLastItem);
    //
    // const handleSelectAll = (e) => {
    //     if (e.target.checked) {
    //         const allVisibleItems = filteredData.slice(indexOfFirstItem, indexOfLastItem).map(item => item.id);
    //         setSelectedEntries(allVisibleItems);
    //     } else {
    //         setSelectedEntries([]);
    //     }
    // };
    //
    // const handleSelectItem = (id) => {
    //     if (selectedEntries.includes(id)) {
    //         setSelectedEntries(selectedEntries.filter(item => item !== id));
    //     } else {
    //         setSelectedEntries([...selectedEntries, id]);
    //     }
    // };
    //
    // const filteredData = data.filter(item =>
    //     item.account?.username?.toLowerCase().includes(searchTerm.toLowerCase())
    // );

    const subtotal = bill.bill_details?.reduce((value, element) => value + element.price * element.quantity, 0)

    const formatPhoneNumber = (phone) => {
        const number = phone.split('');
        const result = `(${number[0]}${number[1]}${number[2]}) ${number[3]}${number[4]}${number[5]}-${number[6]}${number[7]}${number[8]}${number[9]}`;
        return result;
    }

    useEffect(() => {
        handleGetBill();
    }, []);

    if (Object.keys(bill).length === 0) return <NotAuthorizedPage />;

    return (
        <>
            <div className="row">
                <div className="col-lg-12 mb-4 order-0">
                    <div className="card">
                        <div
                            className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center p-4 row-gap-4">
                            <div className="d-flex flex-column justify-content-center">
                                <div className="mb-1">
                                    <span className="h5 me-3">Order #{bill.id}</span>
                                    {/*<span className="badge bg-label-success me-1 ms-2">Paid</span>*/}
                                    {/*<span className="badge bg-label-info">Ready to Pickup</span>*/}
                                    {renderStatusDelivery(bill.status)}
                                </div>
                                {/*<p className="mb-0">Aug 17, <span id="orderYear">2024</span>, 5:48 (ET)</p>*/}
                                <p className="mb-0">{formatDateTime(bill.date)}</p>
                            </div>
                            <div className="d-flex align-content-center flex-wrap gap-2">
                                <button className="btn btn-danger delete-order">Delete Order</button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div className="row">
                <div className="col-12 col-lg-8">
                    <div className="card mb-4">
                        <div className="card-header d-flex justify-content-between align-items-center">
                            <h5 className="card-title m-0">Order details</h5>
                            {/*<h6 className="m-0"><a>Edit</a></h6>*/}
                        </div>
                        <div className="card-datatable table-responsive pb-3">
                            <div className="dataTables_wrapper dt-bootstrap5 no-footer">
                                <Table hover responsive className="table border-top dataTable no-footer dtr-column">
                                    <thead style={{ height: 64 }}>
                                    <tr>
                                        <th
                                            className="sorting_disabled dt-checkboxes-cell dt-checkboxes-select-all"
                                            style={{ verticalAlign: "middle", fontSize: 16, width: 18 }}
                                        >
                                            <Form.Check
                                                type="checkbox"
                                                // onChange={handleSelectAll}
                                                // checked={selectedEntries.length === currentItems.length && currentItems.length > 0}
                                            />
                                        </th>
                                        <th className="sorting"
                                            style={{ verticalAlign: "middle", fontSize: 13 }}>
                                            Products
                                        </th>
                                        {
                                            ["Price", "Qty", "Total"].map((item, index) => (
                                                <th className="sorting" key={index}
                                                    style={{ verticalAlign: "middle", fontSize: 13, width: 100 }}>
                                                    {item}
                                                </th>
                                            ))
                                        }
                                    </tr>
                                    </thead>
                                    <tbody>
                                    {bill.bill_details?.map((product, index) => (
                                        <tr key={index} className={index % 2 === 0 ? "odd" : "even"}>
                                            {/*<td className="control" tabIndex="0"></td>*/}
                                            <td className="dt-checkboxes-cell">
                                                <input type="checkbox"
                                                       className="dt-checkboxes form-check-input"/>
                                            </td>
                                            <td className="sorting_1">
                                                <div
                                                    className="d-flex justify-content-start align-items-center text-nowrap">
                                                    <div className="avatar-wrapper">
                                                        <div className="avatar avatar-sm me-3">
                                                            <img
                                                                src={product.image}
                                                                alt="product"
                                                                className="rounded-2"/>
                                                        </div>
                                                    </div>
                                                    <div className="d-flex flex-column">
                                                        <h6 className="text-heading mb-0">{`${product.brand} ${product.product}`}</h6>
                                                        {/*<small>Material: Wooden</small>*/}
                                                        <small>

                                                        </small>
                                                        <small>Material: Wooden</small>
                                                    </div>
                                                </div>
                                            </td>
                                            <td><span>${product.price}</span></td>
                                            <td><span className="text-body">{product.quantity}</span></td>
                                            <td><span className="text-body">${product.price * product.quantity}</span>
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
                                        <h6 className="mb-0">${subtotal}</h6>
                                    </div>
                                    <div className="d-flex justify-content-start mb-2">
                                        <span className="w-px-100 text-heading">Discount:</span>
                                        <h6 className="mb-0">${bill.discount ? bill.discount.percentage_discount * subtotal / 100 : "Unknown"}</h6>
                                    </div>
                                    {/*<div className="d-flex justify-content-start mb-2">*/}
                                    {/*    <span className="w-px-100 text-heading">Tax:</span>*/}
                                    {/*    <h6 className="mb-0">$28</h6>*/}
                                    {/*</div>*/}
                                    <div className="d-flex justify-content-start">
                                        <h6 className="w-px-100 mb-0">Total:</h6>
                                        <h6 className="mb-0">${bill.price}</h6>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="card">
                        <div className="card-header">
                            <h5 className="card-title m-0">Shipping activity</h5>
                        </div>
                        <div className="card-body pt-1">
                            <ul className="timeline pb-0 mb-0">
                                <li className="timeline-item timeline-item-transparent border-primary">
                                    <span className="timeline-point timeline-point-primary"></span>
                                    <div className="timeline-event">
                                        <div className="timeline-header">
                                            <h6 className="mb-0">Order was placed (Order ID: #{bill.id})</h6>
                                            <small className="text-muted">Tuesday 11:29 AM</small>
                                        </div>
                                        <p className="mt-3">Your order has been placed successfully</p>
                                    </div>
                                </li>
                                <li className="timeline-item timeline-item-transparent border-primary">
                                    <span className="timeline-point timeline-point-primary"></span>
                                    <div className="timeline-event">
                                        <div className="timeline-header">
                                            <h6 className="mb-0">Pick-up</h6>
                                            <small className="text-muted">Wednesday 11:29 AM</small>
                                        </div>
                                        <p className="mt-3 mb-3">Pick-up scheduled with courier</p>
                                    </div>
                                </li>
                                <li className="timeline-item timeline-item-transparent border-primary">
                                    <span className="timeline-point timeline-point-primary"></span>
                                    <div className="timeline-event">
                                        <div className="timeline-header">
                                            <h6 className="mb-0">Dispatched</h6>
                                            <small className="text-muted">Thursday 11:29 AM</small>
                                        </div>
                                        <p className="mt-3 mb-3">Item has been picked up by courier</p>
                                    </div>
                                </li>
                                <li className="timeline-item timeline-item-transparent border-primary">
                                    <span className="timeline-point timeline-point-primary"></span>
                                    <div className="timeline-event">
                                        <div className="timeline-header">
                                            <h6 className="mb-0">Package arrived</h6>
                                            <small className="text-muted">Saturday 15:20 AM</small>
                                        </div>
                                        <p className="mt-3 mb-3">Package arrived at an Amazon facility, NY</p>
                                    </div>
                                </li>
                                <li className="timeline-item timeline-item-transparent border-left-dashed">
                                    <span className="timeline-point timeline-point-primary"></span>
                                    <div className="timeline-event">
                                        <div className="timeline-header">
                                            <h6 className="mb-0">Dispatched for delivery</h6>
                                            <small className="text-muted">Today 14:12 PM</small>
                                        </div>
                                        <p className="mt-3 mb-3">Package has left an Amazon facility, NY</p>
                                    </div>
                                </li>
                                <li className="timeline-item timeline-item-transparent border-transparent pb-0">
                                    <span className="timeline-point timeline-point-secondary"></span>
                                    <div className="timeline-event pb-0">
                                        <div className="timeline-header">
                                            <h6 className="mb-0">Delivery</h6>
                                        </div>
                                        <p className="mt-1 mb-0">Package will be delivered by tomorrow</p>
                                    </div>
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>
                <div className="col-12 col-lg-4">
                    <div className="card mb-4">
                        <div className="card-header">
                            <h5 className="card-title m-0">Customer details</h5>
                        </div>
                        <div className="card-body">
                            <div className="d-flex justify-content-start align-items-center mb-4">
                                <div className="avatar me-3">
                                    <img src={bill.account?.user.avatar} alt="Avatar" className="rounded"/>
                                </div>
                                <div className="d-flex flex-column">
                                    <a className="text-body text-nowrap">
                                        <h6 className="mb-0">{bill.account?.user ? `${bill.account.user.firstname} ${bill.account.user.lastname}` : 'Unknown'}</h6>
                                    </a>
                                    <span>Customer ID: #{bill.account?.idaccount}</span></div>
                            </div>
                            <div className="d-flex justify-content-start align-items-center mb-4">
                                <span
                                    className="avatar rounded bg-label-success me-3 d-flex align-items-center justify-content-center">
                                    <i className="bx bx-cart bx-sm"></i>
                                </span>
                                <h6 className="text-nowrap mb-0">{bill.count > 1 ? `${bill.count} Orders` : `${bill.count} Order`}</h6>
                            </div>
                            <div className="d-flex justify-content-between">
                                <h6 className="mb-2">Contact info</h6>
                                <h6 className="mb-2">
                                    <Link to={"/user/profile"} className="p-0">Edit</Link>
                                    {/*<a data-bs-toggle="modal" data-bs-target="#editUser">Edit</a>*/}
                                </h6>
                            </div>
                            <p className="mb-0">Email: {bill.account?.email}</p>
                            <p className="mb-0">Mobile: {bill.account?.user ? formatPhoneNumber(bill.account.user.phone_number) : "Invalid phone number"}</p>
                        </div>
                    </div>
                    <div className="card mb-4">
                        <div className="card-header d-flex justify-content-between">
                            <h5 className="card-title m-0">Shipping address</h5>
                            {/*<h6 className="m-0">*/}
                            {/*    <a data-bs-toggle="modal" data-bs-target="#addNewAddress">Edit</a>*/}
                            {/*</h6>*/}
                        </div>
                        <div className="card-body">
                            <p className="mb-0">
                                {bill.address?.tower}
                                <br/>
                                {bill.address?.street}
                                <br/>
                                {bill.address?.district}
                                <br/>
                                {bill.address?.city}
                                <br/>
                                {bill.address?.state}
                                <br/>
                                {bill.address?.country}
                            </p>
                        </div>
                    </div>
                    <div className="card mb-4">
                        <div className="card-header d-flex justify-content-between pb-2">
                            <h5 className="card-title m-0">Billing address</h5>
                            {/*<h6 className="m-0">*/}
                            {/*    <a data-bs-toggle="modal" data-bs-target="#addNewAddress">Edit</a>*/}
                            {/*</h6>*/}
                        </div>
                        <div className="card-body">
                            <p className="mb-4">
                                {bill.address?.tower}
                                <br/>
                                {bill.address?.street}
                                <br/>
                                {bill.address?.district}
                                <br/>
                                {bill.address?.city}
                                <br/>
                                {bill.address?.state}
                                <br/>
                                {bill.address?.country}
                            </p>
                            <h6 className="mb-2">Mastercard</h6>
                            <p className="mb-0">Card Number: ******4291</p>
                        </div>
                    </div>
                </div>
            </div>
        </>
    )
}