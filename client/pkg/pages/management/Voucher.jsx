import React, { useEffect, useState } from "react";
import { Table, Button, Form, Pagination } from "react-bootstrap";
import axios from 'axios';
import { useNavigate } from "react-router-dom";
// import "./DataTables.css"; // Add custom styling here
import VoucherForm from "../../components/modal/form/VoucherForm.jsx";
import { formatDateTime } from "../../utils/formatHandler.jsx";
import apiHandler from "../../utils/apiHandler.jsx";

export default function Voucher() {
    const navigate = useNavigate();

    const [searchTerm, setSearchTerm] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [selectedEntries, setSelectedEntries] = useState([]);
    const [itemsPerPage, setItemsPerPage] = useState(7);

    const [data, setData] = useState([])

    const fetchAPI = async () => {
        const response = await apiHandler.get("/admin/get-voucher")
        setData(response.data)
    };

    const handleSearch = (e) => {
        setSearchTerm(e.target.value);
        setCurrentPage(1);
    };
    const handleEdit = (iddiscount) => {
        // Tìm user theo ID

        const voucherToEdit = data.find(voucher => voucher.iddiscount === iddiscount);

        if (voucherToEdit) {
            setSelectedVoucher(voucherToEdit); // Lưu thông tin user vào state `selectedUser`
            setModalShow(true); // Hiển thị modal để chỉnh sửa thông tin
        }
    };
    const handleModalClose = () => {
        fetchAPI();
        setModalShow(false);
        setSelectedVoucher(null);
    };

    const [selectedVoucher, setSelectedVoucher] = useState(null);
    const [modalShow, setModalShow] = useState(false);
    const handleSelectAll = (e) => {
        if (e.target.checked) {
            const allVisibleItems = filteredData.slice(indexOfFirstItem, indexOfLastItem).map(item => item.iddiscount);
            setSelectedEntries(allVisibleItems);
        } else {
            setSelectedEntries([]);
        }
    };

    const handleSelectItem = (iddiscount) => {
        if (selectedEntries.includes(iddiscount)) {
            setSelectedEntries(selectedEntries.filter(item => item !== iddiscount));
        } else {
            setSelectedEntries([...selectedEntries, iddiscount]);
        }
    };

    const handleDelete = async (id) => {
        try {

            // Send delete request to the server
            await apiHandler.delete(`/admin/delete-voucher/${id}`);

            // Optionally, fetch the updated data again
            fetchAPI();
        } catch (error) {
            console.error("Error deleting voucher:", error);
        }
    };

    const filteredData = data.filter(item =>
        item.discount_name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = filteredData.slice(indexOfFirstItem, indexOfLastItem);
    const [item, setItem] = useState({ status: false });

    const totalPages = Math.ceil(filteredData.length / itemsPerPage);

    const getInitials = (name) => {
        const initials = name.split(" ").map(n => n[0]).join("");
        return initials;
    };
    // const getInitials = (firstname, lastname) => {
    //     return (firstname + lastname);
    // };

    const handleChange = async (e, iddiscount) => {
        const newStatus = e.target.checked;
        // console.log(newStatus)
        // console.log(iddiscount)
        try {
            await apiHandler.patch(`/admin/update-voucher-status/${iddiscount}`, {
                status: newStatus
            });

            setData(prevData =>
                prevData.map(voucher =>
                    voucher.iddiscount === iddiscount
                        ? { ...voucher, status: newStatus }
                        : voucher
                )
            );

        } catch (error) {
            console.error("Error updating status:", error);
        }
    };

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

    useEffect(() => {
        fetchAPI();
    }, []);

    return (
        <>
            <div className="card">
                <div className="card-datatable table-responsive">
                    <div className="dataTables_wrapper dt-bootstrap5 no-footer">
                        <div className="card-header flex-column flex-md-row pb-0">
                            <div className="d-flex justify-content-between align-items-center mb-3">
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
                                <div className="dt-action-buttons text-end pt-6 pt-md-0">
                                    <div className="dt-buttons btn-group flex-wrap">
                                        <div>
                                            <Button variant="primary" type="button"
                                                className="btn btn-secondary create-new btn-primary d-flex text-center"
                                                onClick={() => setModalShow(true)}>
                                                <i className='bx bx-plus me-2'></i>
                                                Add New Voucher
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <Table hover responsive className="table border-top dataTable datatable no-footer dtr-column">
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
                                <th className="sorting" style={{ verticalAlign: "middle", fontSize: 13 }}>
                                    Voucher Name
                                </th>
                                {
                                    ["Percentage", "Value"].map((item, index) => (
                                        <th className="sorting" key={index} style={{ textAlign: "center", verticalAlign: "middle", fontSize: 13, width: 120 }}>
                                            {item}
                                        </th>
                                    ))
                                }
                                {
                                    ["Start Date", "End Date"].map((item, index) => (
                                        <th className="sorting" key={index} style={{ textAlign: "center", verticalAlign: "middle", fontSize: 13, width: 200 }}>
                                            {item}
                                        </th>
                                    ))
                                }
                                {/*{*/}
                                {/*    ["Stock", "Actions"].map((item, index) => (*/}
                                {/*        <th className="sorting" key={index} style={{ verticalAlign: "middle", fontSize: 13, width: 120 }}>*/}
                                {/*            {item}*/}
                                {/*        </th>*/}
                                {/*    ))*/}
                                {/*}*/}
                                <th className="sorting" style={{ verticalAlign: "middle", fontSize: 13, width: 100 }}>
                                    Stock
                                </th>
                                <th className="sorting" style={{ verticalAlign: "middle", fontSize: 13, width: 120 }}>
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {currentItems.map((item, index) => (
                                <tr key={index}>
                                    <td>
                                        <Form.Check
                                            type="checkbox"
                                            checked={selectedEntries.includes(item.iddiscount)}
                                            onChange={() => handleSelectItem(item.iddiscount)}
                                        />
                                    </td>
                                    <td>
                                        <div className="d-flex align-items-center">
                                            <div
                                                className="avatar-wrapper me-3 rounded-2 bg-label-secondary">
                                                {/* <div className="avatar">
                                                    <img
                                                        // src={`../assets/img/categories/product-7.png`}
                                                        src={item.product_image}
                                                        alt="Product-8"
                                                        className="rounded"
                                                    />
                                                </div> */}
                                            </div>
                                            <div className="d-flex flex-column justify-content-center">
                                                <span className="text-heading text-wrap fw-medium">
                                                    {` ${item.discount_name}`}
                                                </span>
                                                {/* <span className="text-truncate mb-0 d-none d-sm-block">
                                                    <small>
                                                        Professional
                                                    </small>
                                                </span> */}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="sorting" style={{ textAlign: "center", verticalAlign: "middle", fontSize: 13 }}>
                                        {` ${item.percentage_discount}`}</td>
                                    <td className="sorting" style={{ textAlign: "center", verticalAlign: "middle", fontSize: 13 }}>
                                        {` ${item.value_discount}`}</td>
                                    <td className="sorting" style={{ textAlign: "center", verticalAlign: "middle", fontSize: 13 }}>
                                        {formatDateTime(item.start_date)}</td>
                                    <td className="sorting" style={{ textAlign: "center", verticalAlign: "middle", fontSize: 13 }}>
                                        {formatDateTime(item.end_date)}</td>
                                    <td>
                                        {/*<span className="text-truncate">*/}
                                        {/*    <label className="switch switch-primary switch-sm">*/}
                                        {/*        <input type="checkbox" className="switch-input" id="switch"/>*/}
                                        {/*        <span className="switch-toggle-slider">*/}
                                        {/*            <span className="switch-off"></span>*/}
                                        {/*        </span>*/}
                                        {/*    </label>*/}
                                        {/*    <span className="d-none">Out_of_Stock</span>*/}
                                        {/*</span>*/}
                                        <div className="form-check form-switch mb-2">
                                            <input
                                                className="form-check-input"
                                                type="checkbox"
                                                id={`flexSwitchCheck${item.iddiscount}`}
                                                checked={item.status}
                                                onChange={(e) => handleChange(e, item.iddiscount)}
                                            />
                                        </div>
                                    </td>
                                    {/* <td>{renderCategory(item.category_name)}</td> */}
                                    {/* <td> {item.role === 1 ? "Admin" : item.role === 0 ? "User" : "Unknown Role"}</td>
                                <td>{item.phone_number}</td> */}
                                    <td>
                                        <Button
                                            variant="link"
                                            onClick={() => handleEdit(item.iddiscount)}
                                            className="text-body p-2">
                                            <i className='bx bx-edit'></i>
                                        </Button>
                                        <Button
                                            variant="link"
                                            onClick={() => handleDelete(item.iddiscount)}
                                            className="text-body p-2">
                                            <i className='bx bx-trash'></i>
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
                                        Showing {currentItems.length} of {filteredData.length} entries
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
                                {renderPagination()}
                            </div>
                            <VoucherForm
                                show={modalShow}
                                // onHide={() => setModalShow(false)}
                                onHide={handleModalClose}
                                onReload='a'
                                voucher={selectedVoucher}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}