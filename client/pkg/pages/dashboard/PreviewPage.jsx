import axios from "axios";
import React, { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Badge, Button, Form, Pagination, Table } from "react-bootstrap";
import { formatDateTime } from "../../utils/formatHandler.jsx";
import { renderStatusDelivery } from "../../utils/renderHandler.jsx";
import Calendar from "react-calendar";
import StatisticView from "../../components/modal/form/StatisticView.jsx";
import apiHandler from "../../utils/apiHandler.jsx";

export default function PreviewPage() {
    const [formData, setFormData] = useState({
        iduser: '',
        username: '',
        email: '',
        firstname: '',
        lastname: '',
        phone: '',
        avatar: ''
    });

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

    const navigate = useNavigate();

    const handleItemClick = (item) => {
        setSelectedItem(item);
        setShowModal(true);
    };

    const handleModalClose = () => {
        setShowModal(false);
        setSelectedItem(null);
    };

    const fetchPreviews = async () => {
        const token = localStorage.getItem("token");

        try {
            const response = await apiHandler.get('/bill/list-bill', {
                headers: { Authorization: `Bearer ${token}` }
            });

            setData(response.data);
            // console.log(response.data);
        } catch (error) {
            // console.error('Lỗi khi lấy dữ liệu:', error);
            setError(`Lỗi khi lấy dữ liệu: ${error}`);
        } finally {
            // setLoading(false);
        }
    }

    const handleFromDateClick = () => {
        setShowFromCalendar(!showFromCalendar);
        setShowToCalendar(false);
    };

    const handleToDateClick = () => {
        setShowToCalendar(!showToCalendar);
        setShowFromCalendar(false);
    };

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

    const handleItemsPerPageChange = (e) => {
        setItemsPerPage(Number(e.target.value));
        setCurrentPage(1);
    };

    const renderPagination = () => {
        const totalPages = Math.ceil(filteredData.length / itemsPerPage);

        // Nếu chỉ có 1 trang, không cần hiển thị phân trang
        if (totalPages <= 1) return null;

        const paginationItems = [];
        const addPageButton = (pageNumber) => (
            <Pagination.Item
                key={pageNumber}
                active={pageNumber === currentPage}
                onClick={() => setCurrentPage(pageNumber)}
            >
                {pageNumber}
            </Pagination.Item>
        );

        // Thêm nút 'First' và 'Previous'
        paginationItems.push(
            <Pagination.First
                key="first"
                onClick={() => setCurrentPage(1)}
                disabled={currentPage === 1}
            />,
            <Pagination.Prev
                key="prev"
                onClick={() => setCurrentPage(currentPage - 1)}
                disabled={currentPage === 1}
            />
        );

        if (totalPages <= 7) {
            // Hiển thị tất cả các trang nếu số trang <= 7
            for (let i = 1; i <= totalPages; i++) {
                paginationItems.push(addPageButton(i));
            }
        } else {
            // Hiển thị phân trang với dấu `...`
            if (currentPage <= 4) {
                // Trường hợp trang hiện tại nằm trong khoảng 1 - 4
                for (let i = 1; i <= 5; i++) {
                    paginationItems.push(addPageButton(i));
                }
                paginationItems.push(<Pagination.Ellipsis key="end-ellipsis" />);
                paginationItems.push(addPageButton(totalPages));
            } else if (currentPage >= totalPages - 3) {
                // Trường hợp trang hiện tại nằm trong khoảng cuối (totalPages - 3 đến totalPages)
                paginationItems.push(addPageButton(1));
                paginationItems.push(<Pagination.Ellipsis key="start-ellipsis" />);
                for (let i = totalPages - 4; i <= totalPages; i++) {
                    paginationItems.push(addPageButton(i));
                }
            } else {
                // Trường hợp trang hiện tại ở giữa
                paginationItems.push(addPageButton(1));
                paginationItems.push(<Pagination.Ellipsis key="start-ellipsis" />);
                paginationItems.push(addPageButton(currentPage - 1));
                paginationItems.push(addPageButton(currentPage));
                paginationItems.push(addPageButton(currentPage + 1));
                paginationItems.push(<Pagination.Ellipsis key="end-ellipsis" />);
                paginationItems.push(addPageButton(totalPages));
            }
        }

        // Thêm nút 'Next' và 'Last'
        paginationItems.push(
            <Pagination.Next
                key="next"
                onClick={() => setCurrentPage(currentPage + 1)}
                disabled={currentPage === totalPages}
            />,
            <Pagination.Last
                key="last"
                onClick={() => setCurrentPage(totalPages)}
                disabled={currentPage === totalPages}
            />
        );

        return <Pagination className="m-0">{paginationItems}</Pagination>;
    };

    const getInformation = async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                // navigate('/login');
                return;
            }

            const response = await apiHandler.get('/account/get-info', {
                headers: { Authorization: `Bearer ${token}` }
            });

            const data = response.data;
            setFormData({
                iduser: data.iduser,
                username: data.username,
                email: data.email,
                firstname: data.firstname,
                lastname: data.lastname,
                phone: data.phone,
                avatar: data.avatar
            });
        } catch (error) {
            setError('Error fetching user data');
        }
    };

    const handlePhoneNumber = (phone) => {
        const number = phone.split('');
        const result = `(${number[0]}${number[1]}${number[2]}) ${number[3]}${number[4]}${number[5]}-${number[6]}${number[7]}${number[8]}${number[9]}`;
        return result;
    }

    useEffect(() => {
        getInformation()
        fetchPreviews()
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <>
            <div className="row">
                <div className="col-xl-4 col-lg-5 col-md-5 order-1 order-md-0">
                    <div className="card mb-4">
                        <div className="card-body pt-12">
                            <div className="customer-avatar-section">
                                <div className="d-flex align-items-center flex-column">
                                    <img className="img-fluid rounded mb-4" src={formData.avatar}
                                        height="120" width="120" alt="User avatar" />
                                    <div className="customer-info text-center mb-4">
                                        <h5 className="mb-0">{`${formData.firstname} ${formData.lastname}`}</h5>
                                        <span>Customer ID #{formData.iduser}</span>
                                    </div>
                                </div>
                            </div>
                            <div className="d-flex justify-content-around flex-wrap mb-4 gap-0 gap-md-3 gap-lg-4">
                                <div className="d-flex align-items-center gap-4 me-5">
                                    <div className="avatar">
                                        <div className="avatar-initial rounded bg-label-primary"><i
                                            className="bx bx-cart bx-sm"></i>
                                        </div>
                                    </div>
                                    {/*<div className="avatar flex-shrink-0">*/}
                                    {/*    <img aria-label='dsahboard icon image'*/}
                                    {/*         src="/assets/img/icons/unicons/chart-success.png"*/}
                                    {/*         alt="chart success"*/}
                                    {/*         className="rounded"*/}
                                    {/*    />*/}
                                    {/*</div>*/}
                                    <div>
                                        <h5 className="mb-0">184</h5>
                                        <span>Orders</span>
                                    </div>
                                </div>
                                <div className="d-flex align-items-center gap-4">
                                    <div className="avatar">
                                        <div className="avatar-initial rounded bg-label-primary"><i
                                            className="bx bx-dollar bx-sm"></i>
                                        </div>
                                    </div>
                                    <div>
                                        <h5 className="mb-0">$12,378</h5>
                                        <span>Spent</span>
                                    </div>
                                </div>
                            </div>

                            <div className="info-container">
                                <h5 className="pb-4 border-bottom text-capitalize mt-6 mb-4">Details</h5>
                                <ul className="list-unstyled mb-4">
                                    <li className="mb-2">
                                        <span className="h6 me-1">Username:</span>
                                        <span>{formData.username}</span>
                                    </li>
                                    <li className="mb-2">
                                        <span className="h6 me-1">Email:</span>
                                        <span>{formData.email}</span>
                                    </li>
                                    <li className="mb-2">
                                        <span className="h6 me-1">Status:</span>
                                        <span className="badge bg-label-success">Active</span>
                                    </li>
                                    <li className="mb-2">
                                        <span className="h6 me-1">Contact:</span>
                                        <span>{formData.phone ? handlePhoneNumber(formData.phone) : "Invalid phone number"}</span>
                                    </li>

                                    {/*<li className="mb-2">*/}
                                    {/*    <span className="h6 me-1">Country:</span>*/}
                                    {/*    <span>USA</span>*/}
                                    {/*</li>*/}
                                </ul>
                                <div className="d-flex justify-content-center">
                                    <Link
                                        to="/user/profile"
                                        className="btn btn-primary w-100"
                                    // data-bs-target="#editUser"
                                    // data-bs-toggle="modal"
                                    >
                                        Edit Details
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </div>
                    {/*<div className="card mb-4 bg-gradient-primary">*/}
                    {/*    <div className="card-body">*/}
                    {/*        <div className="row justify-content-between mb-4">*/}
                    {/*            <div*/}
                    {/*                className="col-md-12 col-lg-7 col-xl-12 col-xxl-7 text-center text-lg-start text-xl-center text-xxl-start order-1  order-lg-0 order-xl-1 order-xxl-0">*/}
                    {/*                <h5 className="card-title text-white text-nowrap mb-4">Upgrade to premium</h5>*/}
                    {/*                <p className="card-text text-white">Upgrade customer to premium membership to access*/}
                    {/*                    pro features.</p>*/}
                    {/*            </div>*/}
                    {/*            <span*/}
                    {/*                className="col-md-12 col-lg-5 col-xl-12 col-xxl-5 text-center mx-auto mx-md-0 mb-2"><img*/}
                    {/*                src="../../assets/img/illustrations/rocket.png" className="w-px-75 m-2"*/}
                    {/*                alt="3dRocket"/></span>*/}
                    {/*        </div>*/}
                    {/*        <button className="btn btn-white text-primary w-100 fw-medium shadow-xs"*/}
                    {/*                data-bs-target="#upgradePlanModal" data-bs-toggle="modal">Upgrade to premium*/}
                    {/*        </button>*/}
                    {/*    </div>*/}
                    {/*</div>*/}
                </div>
                <div className="col-xl-8 col-lg-7 col-md-7 order-0 order-md-1">
                    <div className="row text-nowrap">
                        <div className="col-md-6 mb-4">
                            <div className="card h-100">
                                <div className="card-body">
                                    <div className="card-icon mb-2">
                                        <div className="avatar">
                                            <div className="avatar-initial rounded bg-label-primary"><i
                                                className="bx bx-dollar bx-sm"></i>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="card-info">
                                        <h5 className="card-title mb-2">Account Balance</h5>
                                        <div className="d-flex align-items-baseline gap-1">
                                            <h5 className="text-primary mb-0">$2345</h5>
                                            <p className="mb-0"> Credit Left</p>
                                        </div>
                                        <p className="mb-0 text-truncate">Account balance for next purchase</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="col-md-6 mb-4">
                            <div className="card">
                                <div className="card-body">
                                    <div className="card-icon mb-2">
                                        <div className="avatar">
                                            <div className="avatar-initial rounded bg-label-success"><i
                                                className="bx bx-gift bx-sm"></i>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="card-info">
                                        <h5 className="card-title mb-2">Loyalty Program</h5>
                                        <span className="badge bg-label-success mb-2">Platinum member</span>
                                        <p className="mb-0">3000 points to next tier</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="col-md-6 mb-4">
                            <div className="card">
                                <div className="card-body">
                                    <div className="card-icon mb-2">
                                        <div className="avatar">
                                            <div className="avatar-initial rounded bg-label-warning"><i
                                                className="bx bx-star bx-sm"></i>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="card-info">
                                        <h5 className="card-title mb-2">Wishlist</h5>
                                        <div className="d-flex align-items-baseline gap-1">
                                            <h5 className="text-warning mb-0">15</h5>
                                            <p className="mb-0">Items in wishlist</p>
                                        </div>
                                        <p className="mb-0 text-truncate">Receive notification when items go on sale</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="col-md-6 mb-4">
                            <div className="card">
                                <div className="card-body">
                                    <div className="card-icon mb-2">
                                        <div className="avatar">
                                            <div className="avatar-initial rounded bg-label-info"><i
                                                className="bx bx-crown bx-sm"></i>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="card-info">
                                        <h5 className="card-title mb-2">Coupons</h5>
                                        <div className="d-flex align-items-baseline gap-1">
                                            <h5 className="text-info mb-0">21</h5>
                                            <p className="mb-0">Coupons you win</p>
                                        </div>

                                        <p className="mb-0 text-truncate">Use coupon on next purchase</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="row">
                        <div className="col-lg-12 mb-4 order-0">
                            <div className="card">
                                <div className="card-datatable table-responsive">
                                    <div className="dataTables_wrapper dt-bootstrap5 no-footer">
                                        <div className="card-header flex-column flex-md-row pb-0">
                                            <div className="d-flex justify-content-between align-items-center mb-4">
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
                                                        <label
                                                            className="d-flex justify-content-left align-items-center">
                                                            {/*<span>Show</span>*/}
                                                            <select
                                                                name="DataTables_Table_0_length"
                                                                aria-controls="DataTables_Table_0"
                                                                className="form-select" // ms-3 me-3
                                                                style={{ width: "80px" }}
                                                                onChange={handleItemsPerPageChange}
                                                                value={itemsPerPage}
                                                            >
                                                                <option value="10">10</option>
                                                                <option value="25">25</option>
                                                                <option value="50">50</option>
                                                            </select>
                                                            {/*<span>entries</span>*/}
                                                        </label>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        <Table hover responsive
                                            className="table border-top dataTable no-footer dtr-column">
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
                                                        ["Order Date", "Spent", "Status"].map((item, index) => (
                                                            <th className="sorting" key={index}
                                                                style={{ verticalAlign: "middle", fontSize: 13 }}>
                                                                {item}
                                                            </th>
                                                        ))
                                                    }
                                                    <th className="sorting_disabled"
                                                        style={{ verticalAlign: "middle", fontSize: 13, width: 128 }}>Actions
                                                    </th>
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
                                                        <td>{formatDateTime(item.date)}</td>
                                                        <td>{item.price ? item.price : "$?"}</td>
                                                        <td>{renderStatusDelivery(item.status)}</td>
                                                        <td>
                                                            <Link to={`/user/bill?id=${item.id}`}>
                                                                <i className='bx bx-bullseye'></i>
                                                            </Link>
                                                            {/*<Button variant="link" onClick={() => handleItemClick(item)}>*/}
                                                            {/*    <i className='bx bx-bullseye'></i>*/}
                                                            {/*</Button>*/}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </Table>
                                        <div className="card-footer flex-column flex-md-row pb-0 pb-4">
                                            <div className="row">
                                                <div className="d-flex col-sm-12 col-md-6">
                                                    <div
                                                        className="dataTables_info d-flex justify-content-start align-items-center">
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
                                                    <div
                                                        className="dataTables_select d-flex justify-content-start align-items-center">
                                                        <div className="text-center mt-2">
                                                            Selected {selectedEntries.length} entries
                                                        </div>
                                                    </div>
                                                </div>
                                                <div
                                                    className="col-sm-12 col-md-6 d-flex justify-content-center justify-content-md-end">
                                                    {renderPagination()}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            {/*<DataTables/>*/}
            <StatisticView
                show={showModal}
                onHide={() => setShowModal(false)}
                item={selectedItem}
            />
        </>
    )
}