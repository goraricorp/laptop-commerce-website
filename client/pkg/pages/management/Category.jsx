import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Table, Button, Form, Pagination, Dropdown, Badge } from "react-bootstrap";
import axios from 'axios';
import CategoryForm from "../../components/modal/form/CategoryForm.jsx";
import apiHandler from "../../utils/apiHandler.jsx";
import {PaginationCustom} from "../../components/pagination/PaginationCustom.jsx";

export default function Category() {
    const navigate = useNavigate();

    const [data, setData] = useState([])
    const fetchAPI = async () => {
        try {
            const response = await apiHandler.get("/category/get-category")
            setData(response.data)
        } catch (error) {
            console.error("Error fetching category data:", error);
        }
    };

    const handleEdit = (idcategory) => {
        // Tìm user theo ID
        // console.log(idcategory)
        const categoryToEdit = data.find(product => product.idcategory === idcategory);
        // console.log(categoryToEdit)
        if (categoryToEdit) {
            setSelectedCategory(categoryToEdit); // Lưu thông tin user vào state `selectedUser`
            setModalShow(true); // Hiển thị modal để chỉnh sửa thông tin
        }
    };

    const handleModalClose = () => {
        fetchAPI();
        setModalShow(false);
        setSelectedCategory(null);
    };

    const handleDelete = async (id) => {
        try {
            // await axios.delete(`http://localhost:5172/admin/delete-category/${id}`);
            await apiHandler.delete(`/category/delete-category/${id}`);

            fetchAPI();
        } catch (error) {
            console.error("Error deleting category:", error);
        }
    };

    const [selectedCategory, setSelectedCategory] = useState(null);
    const [modalShow, setModalShow] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [selectedEntries, setSelectedEntries] = useState([]);
    const [itemsPerPage, setItemsPerPage] = useState(7);

    const handleSearch = (e) => {
        setSearchTerm(e.target.value);
        setCurrentPage(1);
    };

    const handleSelectAll = (e) => {
        if (e.target.checked) {
            const allVisibleItems = filteredData.slice(indexOfFirstItem, indexOfLastItem).map(item => item.idcategory);
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
        item.category_name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = filteredData.slice(indexOfFirstItem, indexOfLastItem);

    const totalPages = Math.ceil(filteredData.length / itemsPerPage);

    const getInitials = (name) => {
        const initials = name.split(" ").map(n => n[0]).join("");
        return initials;
    };
    // const getInitials = (firstname, lastname) => {
    //     return (firstname + lastname);
    // };
    const handleItemsPerPageChange = (e) => {
        setItemsPerPage(Number(e.target.value));
        setCurrentPage(1);
    };

    useEffect(() => {
        fetchAPI();
    }, []);

    return (
        <>
            <div className="card mb-4">
                <div className="card-widget-separator-wrapper">
                    <div className="card-body card-widget-separator">
                        <div className="row gy-4 gy-sm-1">
                            <div className="col-sm-6 col-lg-3">
                                <div
                                    className="d-flex justify-content-between align-items-start card-widget-1 border-end pb-4 pb-sm-0">
                                    <div>
                                        <p className="mb-1">In-store Sales</p>
                                        <h4 className="mb-1">$5,345.43</h4>
                                        <p className="mb-0">
                                            <span className="me-2">5k orders</span>
                                            <span className="badge bg-label-success">+5.7%</span>
                                        </p>
                                    </div>
                                    <span className="avatar  me-sm-4">
                                        <span className="avatar-initial rounded bg-label-secondary w-px-44 h-px-44">
                                            <i className="bx bx-store-alt bx-sm text-heading"></i>
                                        </span>
                                    </span>
                                </div>
                                <hr className="d-none d-sm-block d-lg-none me-6" />
                            </div>
                            <div className="col-sm-6 col-lg-3">
                                <div
                                    className="d-flex justify-content-between align-items-start card-widget-2 border-end pb-4 pb-sm-0">
                                    <div>
                                        <p className="mb-1">Website Sales</p>
                                        <h4 className="mb-1">$674,347.12</h4>
                                        <p className="mb-0">
                                            <span className="me-2">21k orders</span>
                                            <span className="badge bg-label-success">+12.4%</span>
                                        </p>
                                    </div>
                                    <span className="avatar p-2 me-sm-4">
                                        <span className="avatar-initial rounded bg-label-secondary w-px-44 h-px-44">
                                            <i className="bx bx-laptop bx-sm text-heading"></i>
                                        </span>
                                    </span>
                                </div>
                                <hr className="d-none d-sm-block d-lg-none" />
                            </div>
                            <div className="col-sm-6 col-lg-3">
                                <div
                                    className="d-flex justify-content-between align-items-start border-end pb-4 pb-sm-0 card-widget-3">
                                    <div>
                                        <p className="mb-1">Discount</p>
                                        <h4 className="mb-1">$14,235.12</h4>
                                        <p className="mb-0">6k orders</p>
                                    </div>
                                    <span className="avatar p-2 me-sm-4">
                                        <span className="avatar-initial rounded bg-label-secondary w-px-44 h-px-44">
                                            <i className="bx bx-gift bx-sm text-heading"></i>
                                        </span>
                                    </span>
                                </div>
                            </div>
                            <div className="col-sm-6 col-lg-3">
                                <div className="d-flex justify-content-between align-items-start">
                                    <div>
                                        <p className="mb-1">Affiliate</p>
                                        <h4 className="mb-1">$8,345.23</h4>
                                        <p className="mb-0">
                                            <span className="me-2">150 orders</span>
                                            <span className="badge bg-label-danger">-3.5%</span>
                                        </p>
                                    </div>
                                    <span className="avatar p-2 me-sm-4">
                                        <span className="avatar-initial rounded bg-label-secondary w-px-44 h-px-44">
                                            <i className="bx bx-wallet bx-sm text-heading"></i>
                                        </span>
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div className="card">
                <div className="card-datatable table-responsive">
                    <div className="dataTables_wrapper dt-bootstrap5 no-footer">
                        <div className="card-header flex-column flex-md-row pb-0">
                            <div className="d-flex justify-content-between align-items-center mb-4">
                                {/*<div className="head-label text-center">*/}
                                {/*    <h5 className="card-title mb-0">Category DataTable</h5>*/}
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
                                                <option value="7">7</option>
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
                                                Add New Category
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
                                    Category Name
                                </th>
                                <th className="sorting_disabled text-center"
                                    style={{ verticalAlign: "middle", fontSize: 13, width: 120 }}>Actions
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
                                            checked={selectedEntries.includes(item.idcategory)}
                                            onChange={() => handleSelectItem(item.idcategory)}
                                        />
                                    </td>
                                    <td className="sorting_1">
                                        <div className="d-flex align-items-center">
                                            <div className="avatar-wrapper me-3 rounded-2 bg-label-secondary">
                                                <div className="avatar"><img
                                                    src={`/assets/img/categories/${item.category_image}`}
                                                    alt="Product-8"
                                                    className="rounded" /></div>
                                            </div>
                                            <div className="d-flex flex-column justify-content-center"><span
                                                className="text-heading text-wrap fw-medium">{item.category_name}</span><span
                                                    className="text-truncate mb-0 d-none d-sm-block"><small>{item.category_description}</small></span>
                                            </div>
                                        </div>
                                    </td>
                                    {/* <td>{item.brand}</td> */}
                                    {/* <td>{item.product_name}</td> */}
                                    {/* <td> {item.role === 1 ? "Admin" : item.role === 0 ? "User" : "Unknown Role"}</td>
                                <td>{item.phone_number}</td> */}
                                    <td>
                                        <Button
                                            variant="link"
                                            onClick={() => handleEdit(item.idcategory)}
                                            className="p-2">
                                            <i className='bx bx-edit'></i>
                                        </Button>
                                        <Button
                                            variant="link"
                                            onClick={() => handleDelete(item.idcategory)}
                                            className="p-2">
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
            <CategoryForm
                show={modalShow}
                // onHide={() => setModalShow(false)}
                onHide={handleModalClose}
                onReload='a'
                category={selectedCategory}
            />
        </>
    );
};
