import React, { useEffect, useRef, useState } from "react";
import { Badge, Button, Dropdown, Form, Pagination, Table } from "react-bootstrap";
import Calendar from "react-calendar";
import axios from "axios";
import StatisticView from "../../components/modal/form/StatisticView.jsx";
import { Link } from "react-router-dom";
import { formatDateTime } from "../../utils/formatHandler.jsx";
import { renderStatusDelivery } from "../../utils/renderHandler.jsx";
import apiHandler from "../../utils/apiHandler.jsx";
import {PaginationCustom} from "../../components/pagination/PaginationCustom.jsx";

export default function Statistics() {
    const [data, setData] = useState([]);

    const [searchTerm, setSearchTerm] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [selectedEntries, setSelectedEntries] = useState([]);
    const [itemsPerPage, setItemsPerPage] = useState(7);

    const [fromDate, setFromDate] = useState(null);
    const [toDate, setToDate] = useState(null);
    const [showFromCalendar, setShowFromCalendar] = useState(false);
    const [showToCalendar, setShowToCalendar] = useState(false);
    const [error, setError] = useState("");
    const fromCalendarRef = useRef(null);
    const toCalendarRef = useRef(null);

    const [showModal, setShowModal] = useState(false);
    const [selectedItem, setSelectedItem] = useState(null);
    const [modalData, setModalData] = useState(null);

    const handleItemClick = (item) => {
        setSelectedItem(item);
        setShowModal(true);
    };

    const handleModalClose = () => {
        setShowModal(false);
        setSelectedItem(null);
    };

    const fetchStatistics = async () => {
        try {
            const response = await apiHandler.get('/bill/list-all');
            setData(response.data);
            // console.log(response.data);
        } catch (error) {
            // console.error('Lỗi khi lấy dữ liệu:', error);
            setError(`Lỗi khi lấy dữ liệu: ${error}`);
        } finally {
            // setLoading(false);
        }
    }

    const onFromDateChange = (date) => {
        if (toDate && date >= toDate) {
            setError("Ngày bắt đầu phải trước ngày kết thúc.");
        } else {
            setError("");
            setFromDate(date);
            setShowFromCalendar(false);
        }
    };

    const onToDateChange = (date) => {
        if (fromDate && date <= fromDate) {
            setError("Ngày kết thúc phải sau ngày bắt đầu.");
        } else {
            setError("");
            setToDate(date);
            setShowToCalendar(false);
        }
    };

    const handleClickOutside = event => {
        if (
            fromCalendarRef.current &&
            !fromCalendarRef.current.contains(event.target) &&
            toCalendarRef.current &&
            !toCalendarRef.current.contains(event.target)
        ) {
            setShowFromCalendar(false);
            setShowToCalendar(false);
        }
    };

    useEffect(() => {
        fetchStatistics()
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSearch = (e) => {
        setSearchTerm(e.target.value);
        setCurrentPage(1);
    };

    const handleSelectAll = (e) => {
        if (e.target.checked) {
            const allVisibleItems = filteredData.slice(indexOfFirstItem, indexOfLastItem).map(item => item.id);
            setSelectedEntries(allVisibleItems);
        } else {
            setSelectedEntries([]);
        }
    };

    const handleSelectItem = (id) => {
        if (selectedEntries.includes(id)) {
            setSelectedEntries(selectedEntries.filter(item => item !== id));
        } else {
            setSelectedEntries([...selectedEntries, id]);
        }
    };

    const filteredData = data.filter(item =>
        // item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        // item.email.toLowerCase().includes(searchTerm.toLowerCase())

        item.account?.username?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = filteredData.slice(indexOfFirstItem, indexOfLastItem);

    const totalPages = Math.ceil(filteredData.length / itemsPerPage);

    const getInitials = (name) => {
        const initials = name.split(" ").map(n => n[0]).join("");
        return initials;
    };

    const handleItemsPerPageChange = (e) => {
        setItemsPerPage(Number(e.target.value));
        setCurrentPage(1);
    };

    const handleOpenModal = (item) => {
        setModalData(item); // Cập nhật dữ liệu cho modal
        setShowModal(true);  // Mở modal
    };

    // console.log(new Date(fromDate).toLocaleString(), new Date(toDate).toLocaleString())
    // setFromDate(`${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`);

    return (
        <>
            <div className="card">
                <div className="card-datatable table-responsive">
                    <div className="dataTables_wrapper dt-bootstrap5 no-footer">
                        <div className="card-header flex-column flex-md-row pb-0">
                            <div className="d-flex justify-content-between align-items-center mb-4">
                                {/*<div className="head-label text-center">*/}
                                {/*    <h5 className="card-title mb-0">Statistics</h5>*/}
                                {/*</div>*/}
                                <div className="col-sm-12 col-md-6 d-flex">
                                    <div
                                        className="dataTables_filter mb-0 mb-md-6 d-flex justify-content-center justify-content-md-end mt-n6 mt-md-0 me-3"> {/* col-sm-6 col-md-2 */}
                                        <Form.Control
                                            className="form-control"
                                            type="search"
                                            placeholder="Search..."
                                            value={searchTerm}
                                            onChange={handleSearch}
                                        />
                                    </div>
                                    <div className="dataTables_length">
                                        <label className="d-flex justify-content-left align-items-center">
                                            {/*<span>Show</span>*/}
                                            <select
                                                name="DataTables_Table_0_length"
                                                aria-controls="DataTables_Table_0"
                                                className="form-select" // ms-3 me-3
                                                style={{ width: "80px" }}
                                                onChange={handleItemsPerPageChange}
                                                value={itemsPerPage}
                                            >
                                                <option value="10">7</option>
                                                <option value="10">10</option>
                                                <option value="25">20</option>
                                                <option value="50">50</option>
                                                <option value="50">70</option>
                                                <option value="50">100</option>
                                            </select>
                                            {/*<span>entries</span>*/}
                                        </label>
                                    </div>
                                </div>
                                {/*<div className="col-lg-3 col-sm-6 col-12">*/}
                                {/*    <small className="text-light fw-medium">Hidden arrow</small>*/}
                                {/*    <div className="demo-inline-spacing">*/}
                                {/*        <div className="btn-group">*/}
                                {/*            <button aria-label='Click me'*/}
                                {/*                    type="button"*/}
                                {/*                    className="btn btn-primary dropdown-toggle hide-arrow"*/}
                                {/*                    data-bs-toggle="dropdown"*/}
                                {/*                    aria-expanded="false">*/}
                                {/*                Hidden arrow*/}
                                {/*            </button>*/}
                                {/*            <ul className="dropdown-menu">*/}
                                {/*                <li><a aria-label="dropdown action link" className="dropdown-item"*/}
                                {/*                       href="#">Action</a></li>*/}
                                {/*                <li><a aria-label="dropdown action link" className="dropdown-item"*/}
                                {/*                       href="#">Another*/}
                                {/*                    action</a></li>*/}
                                {/*                <li><a aria-label="dropdown action link" className="dropdown-item"*/}
                                {/*                       href="#">Something*/}
                                {/*                    else here</a></li>*/}
                                {/*                <li>*/}
                                {/*                    <hr className="dropdown-divider"/>*/}
                                {/*                </li>*/}
                                {/*                <li><a aria-label="dropdown action link" className="dropdown-item"*/}
                                {/*                       href="#">Separated*/}
                                {/*                    link</a></li>*/}
                                {/*            </ul>*/}
                                {/*        </div>*/}
                                {/*    </div>*/}
                                {/*</div>*/}
                                <div className="dt-action-buttons text-end pt-6 pt-md-0">
                                    <ul className="dt-buttons btn-group navbar-nav flex-row align-items-center p-0 m-0">
                                        <li className="nav-item dropdown-style-switcher dropdown me-3">
                                            <a
                                                className="nav-link dropdown-toggle hide-arrow"
                                                href="#"
                                                data-bs-toggle="dropdown"
                                                ref={toCalendarRef}
                                            >
                                                <button className="btn btn-outline-primary">
                                                    <i className='bx bx-calendar me-2'></i>
                                                    <span>
                                                        From date: {fromDate ? fromDate.toLocaleDateString() : "Select date"}
                                                    </span>
                                                </button>
                                            </a>
                                            <ul className="dropdown-menu dropdown-menu-end p-0">
                                                <li>
                                                    <Calendar onChange={onFromDateChange} value={fromDate} />
                                                </li>
                                            </ul>
                                        </li>
                                        <li className="nav-item dropdown-style-switcher dropdown">
                                            <a
                                                className="nav-link dropdown-toggle hide-arrow"
                                                href="#"
                                                data-bs-toggle="dropdown"
                                                ref={toCalendarRef}
                                            >
                                                <button className="btn btn-outline-primary">
                                                    <i className='bx bx-calendar me-2'></i>
                                                    <span>
                                                        To date: {toDate ? toDate.toLocaleDateString() : "Select date"}
                                                    </span>
                                                </button>
                                            </a>
                                            <ul className="dropdown-menu dropdown-menu-end p-0">
                                                <li>
                                                    <Calendar onChange={onToDateChange} value={toDate} />
                                                </li>
                                            </ul>
                                        </li>
                                    </ul>
                                </div>
                            </div>
                            {/*<div className="row mb-3">*/}
                            {/*    <div className="col-sm-12 col-md-6">*/}
                            {/*        <div className="dataTables_length">*/}
                            {/*            <label className="d-flex justify-content-start align-items-center">*/}
                            {/*                /!*<span>Show</span>*!/*/}
                            {/*                <select*/}
                            {/*                    name="DataTables_Table_0_length"*/}
                            {/*                    aria-controls="DataTables_Table_0"*/}
                            {/*                    className="form-select" // ms-3 me-3*/}
                            {/*                    style={{width: "80px"}}*/}
                            {/*                    onChange={handleItemsPerPageChange}*/}
                            {/*                    value={itemsPerPage}*/}
                            {/*                >*/}
                            {/*                    <option value="10">10</option>*/}
                            {/*                    <option value="25">25</option>*/}
                            {/*                    <option value="50">50</option>*/}
                            {/*                </select>*/}
                            {/*                /!*<span>entries</span>*!/*/}
                            {/*            </label>*/}
                            {/*        </div>*/}
                            {/*    </div>*/}
                            {/*    <div*/}
                            {/*        className="dataTables_filter mb-0 mb-md-6 col-sm-12 col-md-6 d-flex justify-content-center justify-content-md-end mt-n6 mt-md-0">*/}
                            {/*        <Form.Control*/}
                            {/*            className="form-control"*/}
                            {/*            type="search"*/}
                            {/*            placeholder="Search..."*/}
                            {/*            value={searchTerm}*/}
                            {/*            onChange={handleSearch}*/}
                            {/*            style={{width: "410px"}}*/}
                            {/*        />*/}
                            {/*    </div>*/}
                            {/*</div>*/}
                        </div>
                        <Table hover responsive className="table border-top dataTable no-footer dtr-column">
                            <thead style={{ height: 64 }}>
                                <tr>
                                    <th
                                        className="sorting_disabled dt-checkboxes-cell dt-checkboxes-select-all"
                                        style={{ verticalAlign: "middle", fontSize: 16, width: 18 }}
                                    >
                                        <Form.Check
                                            type="checkbox"
                                            onChange={handleSelectAll}
                                            checked={selectedEntries.length === currentItems.length && currentItems.length > 0}
                                        />
                                    </th>
                                    {
                                        ["Fullname", "Order Date", "Spent", "Status"].map((item, index) => (
                                            <th className="sorting" key={index} style={{ verticalAlign: "middle", fontSize: 13 }}>
                                                {item}
                                            </th>
                                        ))
                                    }
                                    <th className="sorting_disabled" style={{ verticalAlign: "middle", fontSize: 13, width: 128 }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {currentItems.map((item, index) => (
                                    <tr key={index} style={{ height: 64 }}>
                                        <td>
                                            <Form.Check
                                                className="dt-checkboxes-cell"
                                                type="checkbox"
                                                checked={selectedEntries.includes(item.id)}
                                                onChange={() => handleSelectItem(item.id)}
                                            />
                                        </td>
                                        <td className="sorting_1">
                                            <div className="d-flex justify-content-start align-items-center user-name">
                                                <div className="avatar-wrapper">
                                                    <div className="avatar avatar-sm me-4">
                                                        {item.account.user.avatar
                                                            ? <img
                                                                className="rounded-circle"
                                                                src={item.account.user.avatar}
                                                                alt="avatar"
                                                            />
                                                            : <span className={`avatar-initial rounded-circle bg-label-${"primary"}`}>
                                                                {item.account.user.firstname[0]}{item.account.user.lastname[0]}
                                                            </span>
                                                        }
                                                    </div>
                                                </div>
                                                <div className="d-flex flex-column">
                                                    <a className="text-heading text-truncate">
                                                        <span
                                                            className="fw-medium">{`${item.account.user.firstname} ${item.account.user.lastname}`}</span>
                                                    </a>
                                                    <small>
                                                        {`${item.account.email}  |  ${item.account.username}`}
                                                        {/*{item.account.email}*/}
                                                        {/*<i className='bx bx-space-bar bx-sm px-2'></i>*/}
                                                        {/*{item.account?.username}*/}
                                                    </small>
                                                </div>
                                            </div>
                                        </td>
                                        {/*<td>{item.date ? new Date(item.date).toLocaleString() : "N/A"}</td>*/}
                                        <td>{formatDateTime(item.date)}</td>
                                        <td>{item.price ? item.price : "$?"}</td>
                                        <td>{renderStatusDelivery(item.status)}</td>
                                        <td>
                                            <Button
                                                variant="link"
                                                className="text-body p-2"
                                                onClick={() => handleItemClick(item)}>
                                                <i className='bx bx-bullseye'></i>
                                            </Button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </Table>
                        <div className="card-footer flex-column flex-md-row pb-0 pb-4">
                            <div className="row">
                                <div className="d-flex col-sm-12 col-md-6">
                                    <div className="dataTables_info d-flex justify-content-start align-items-center">
                                        <div className="text-center mt-2">
                                            {/*{`Showing from ${indexOfFirstItem + 1} to ${Math.min(indexOfLastItem, filteredData.length)} of ${filteredData.length} entries`}*/}
                                            <span>Showing from </span>
                                            <span className="text-primary">{indexOfFirstItem + 1}</span>
                                            <span> to </span>
                                            <span
                                                className="text-primary">{Math.min(indexOfLastItem, filteredData.length)}</span>
                                            <span> of </span>
                                            <span className="text-primary">{filteredData.length}</span>
                                            <span> entries</span>
                                        </div>
                                    </div>
                                    <div className="ms-2 me-2"></div>
                                    <div className="dataTables_select d-flex justify-content-start align-items-center">
                                        <div className="text-center mt-2">
                                            Selected {selectedEntries.length} entries
                                        </div>
                                    </div>
                                </div>
                                <div className="col-sm-12 col-md-6 d-flex justify-content-center justify-content-md-end">
                                    <PaginationCustom
                                        currentPage={currentPage}
                                        totalPages={totalPages}
                                        onPageChange={setCurrentPage}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <StatisticView
                show={showModal}
                onHide={() => setShowModal(false)}
                item={selectedItem}
            />
        </>
    );
};