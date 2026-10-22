import React, { useEffect, useState } from "react";
import { Table, Button, Form, Pagination, Dropdown, Badge, Modal } from "react-bootstrap";
import axios from 'axios';
import ColorForm from "../../components/modal/form/ColorForm.jsx";
import apiHandler from "../../utils/apiHandler.jsx";
import { renderProductColor } from "../../utils/renderHandler.jsx";
import { PaginationCustom } from "../../components/pagination/PaginationCustom.jsx";

export default function ProductColor() {
    const [data, setData] = useState([])
    const [data1, setData1] = useState([])
    const handleShow = (id) => {
        setSelectedProductId(id);
        setShow(true);
    };
    const [show, setShow] = useState(false); // Quản lý trạng thái modal
    const [selectedProductId, setSelectedProductId] = useState(null); // ID sản phẩm được chọn để xóa

    // Hàm đóng modal
    const handleClose = () => {
        setShow(false);
        setSelectedProductId(null);
    };
    const confirmDelete = () => {
        handleDelete(selectedProductId); // Gọi hàm xóa từ props với ID đã chọn
        handleClose(); // Đóng modal
    };

    const fetchData = async () => {
        try {
            const [colorsResponse, productsResponse] = await Promise.all([
                apiHandler.get("/admin/get-color"),
                apiHandler.get("/products/get-product"),
                // axios.get("http://localhost:5172/admin/payhd"),
            ]);
            setData(colorsResponse.data);
            setData1(productsResponse.data);
            // setData2(payhdResponse.data);
        } catch (error) {
            console.error("Error fetching data", error);
        }
    };
    const mergedData = data.map(user => {
        const account = data1.find(acc => acc.idproduct === user.idproduct);
        return { ...user, ...account };
    });
    // console.log(mergedData)

    const [searchTerm, setSearchTerm] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [selectedEntries, setSelectedEntries] = useState([]);
    const [itemsPerPage, setItemsPerPage] = useState(7);

    const handleSearch = (e) => {
        setSearchTerm(e.target.value);
        setCurrentPage(1);
    };
    const handleEdit = (idcolor) => {
        // Tìm user theo ID
        // console.log(idcolor)
        const colorToEdit = mergedData.find(product => product.idcolor === idcolor);
        // console.log(colorToEdit)
        if (colorToEdit) {
            setSelectedColor(colorToEdit); // Lưu thông tin user vào state `selectedUser`
            setModalShow(true); // Hiển thị modal để chỉnh sửa thông tin
        }
    };
    const handleModalClose = () => {
        fetchData();
        setModalShow(false);
        setSelectedColor(null);
    };
    const [selectedColor, setSelectedColor] = useState(null);
    const [modalShow, setModalShow] = useState(false);
    const handleSelectAll = (e) => {
        if (e.target.checked) {
            const allVisibleItems = filteredData.slice(indexOfFirstItem, indexOfLastItem).map(item => item.idcolor);
            setSelectedEntries(allVisibleItems);
        } else {
            setSelectedEntries([]);
        }
    };

    const handleSelectItem = (idproduct) => {
        if (selectedEntries.includes(idproduct)) {
            setSelectedEntries(selectedEntries.filter(item => item !== idproduct));
        } else {
            setSelectedEntries([...selectedEntries, idproduct]);
        }
    };
    const handleDelete = async (id) => {
        try {

            // Send delete request to the server
            await apiHandler.delete(`/admin/delete-color/${id}`);

            // Optionally, fetch the updated data again
            fetchData();
        } catch (error) {
            console.error("Error deleting product:", error);
        }
    };

    const filteredData = mergedData.filter(item =>
        item.product_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.color.toLowerCase().includes(searchTerm.toLowerCase())
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
        // fetchAPI();
        // fetchAPI1();
        fetchData();
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
                                                Add New Product
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
                                {/*{*/}
                                {/*    ["Product Name", "Color"].map((item, index) => (*/}
                                {/*        <th className="sorting" key={index} style={{ verticalAlign: "middle", fontSize: 13 }}>*/}
                                {/*            {item}*/}
                                {/*        </th>*/}
                                {/*    ))*/}
                                {/*}*/}
                                <th className="sorting" style={{ verticalAlign: "middle", fontSize: 13 }}>
                                    Product Name
                                </th>
                                <th className="sorting" style={{ verticalAlign: "middle", fontSize: 13, width: 100 }}>
                                    Color
                                </th>
                                <th className="sorting_disabled text-center"
                                    style={{ verticalAlign: "middle", fontSize: 13, width: 120 }}>Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {currentItems.map((item, index) => (
                                <tr key={index}>
                                    <td>
                                        <Form.Check
                                            type="checkbox"
                                            checked={selectedEntries.includes(item.idcolor)}
                                            onChange={() => handleSelectItem(item.idcolor)}
                                        />
                                    </td>
                                    <td>
                                        <div className="d-flex align-items-center">
                                            <div
                                                className="avatar-wrapper me-3 rounded-2 bg-label-secondary">
                                                <div className="avatar">
                                                    <img
                                                        // src={`../assets/img/categories/product-7.png`}
                                                        src={item.product_image}
                                                        alt="Product-8"
                                                        className="rounded"
                                                    />
                                                </div>
                                            </div>
                                            <div className="d-flex flex-column justify-content-center">
                                                <span className="text-heading text-wrap fw-medium">
                                                    {`${item.brand} ${item.product_name}`}
                                                </span>
                                                {/*<span className="text-truncate mb-0 d-none d-sm-block">*/}
                                                {/*    <small>Pro</small>*/}
                                                {/*</span>*/}
                                            </div>
                                        </div>
                                    </td>
                                    <td>{renderProductColor(item.color)}</td>
                                    <td>
                                        <Button
                                            variant="link"
                                            onClick={() => handleEdit(item.idcolor)}
                                            className="text-body p-2">
                                            <i className='bx bx-edit'></i>
                                        </Button>
                                        <Button
                                            variant="link"
                                            onClick={() => handleShow(item.idcolor)}
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
                                <PaginationCustom
                                    currentPage={currentPage}
                                    totalPages={totalPages}
                                    onPageChange={setCurrentPage}
                                />
                            </div>
                            <ColorForm
                                show={modalShow}
                                // onHide={() => setModalShow(false)}
                                onHide={handleModalClose}
                                onReload='a'
                                color={selectedColor}
                            />
                        </div>
                    </div>
                </div>
                <Modal show={show} onHide={handleClose} centered>
                    <Modal.Header closeButton>
                        <Modal.Title>Xác nhận xóa</Modal.Title>
                    </Modal.Header>
                    <Modal.Body>Bạn có chắc chắn muốn xóa không?</Modal.Body>
                    <Modal.Footer>
                        <Button variant="secondary" onClick={handleClose}>
                            Hủy
                        </Button>
                        <Button variant="danger" onClick={confirmDelete}>
                            Xác nhận xóa
                        </Button>
                    </Modal.Footer>
                </Modal>
            </div>
        </>
    );
};