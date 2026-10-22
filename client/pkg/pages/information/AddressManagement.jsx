import React, {Component, useEffect, useState} from "react";
import {Button, Form} from "react-bootstrap";
import AddressItem from "../../components/address/AddressItem.jsx";
import AddressForm from "../../components/modal/form/AddressForm.jsx";
import axios from "axios";
import apiHandler from "../../utils/apiHandler.jsx";
import {useLocation} from "react-router-dom";
import {PaginationCustom} from "../../components/pagination/PaginationCustom.jsx";
import Overview from "../../layouts/Overview.jsx";

export const AddressManagement = () => {
    const [addresses, setAddresses] = useState([]);
    const [loading, setLoading] = useState(true);
    // const [reloadAddressManagement, setReloadAddressManagement] = useState(0);

    const [reloadTrigger, setReloadTrigger] = useState(false);

    const [modalShow, setModalShow] = useState(false);

    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(6);

    // Giả sử filteredData là mảng productList sau khi lọc theo search, v.v.
    const filteredData = addresses; // Hoặc thêm logic lọc

    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = filteredData.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(filteredData.length / itemsPerPage);

    const handleReload = () => {
        setReloadTrigger(!reloadTrigger);
    };

    const listAddresses = async () => {
        try {
            // setLoading(true);
            const token = localStorage.getItem('token');
            const response = await apiHandler.get('/address/list', {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
            setAddresses(response.data);
        } catch (error) {
            console.error('Lỗi khi lấy dữ liệu:', error);
        } finally {
            // setLoading(false);
        }
    };

    const handleItemsPerPageChange = (e) => {
        setItemsPerPage(Number(e.target.value));
        setCurrentPage(1);
    };

    useEffect(() => {
        // handleReload()

        listAddresses();
    }, [reloadTrigger]);  // Khi reloadTrigger thay đổi, useEffect sẽ gọi lại API //

    // if (loading) {
    //     return <p>Đang tải dữ liệu...</p>;
    // }

    return (
        <>
            <div className="row">
                <div className="col-12 mb-4">
                    <div className="card p-3 light bg-body-tertiary align-items-center bg-navbar-theme">
                        {/*<AddressList key={reloadTrigger} onReload={handleReload}/>*/}
                        <div className="container d-flex ps-2 p-0 align-items-center justify-content-between">
                            <div className="d-flex justify-content-center align-items-center">
                                <h5 className="m-0">Address List</h5>
                                <div className="ms-3">
                                    <Form.Select
                                        // className="w-100"
                                        value={itemsPerPage}
                                        onChange={handleItemsPerPageChange}
                                    >
                                        <option value={2}>2</option>
                                        <option value={3}>3</option>
                                        <option value={4}>4</option>
                                        <option value={6}>6</option>
                                        <option value={12}>12</option>
                                    </Form.Select>
                                </div>
                            </div>
                            <div className="d-flex justify-content-center align-items-center">
                                <PaginationCustom
                                    currentPage={currentPage}
                                    totalPages={totalPages}
                                    onPageChange={setCurrentPage}
                                />
                                <Button className="ms-3" variant="primary" onClick={() => setModalShow(true)}>
                                    <i className='bx bx-plus me-2'></i>
                                    <span>Add Address</span>
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="row d-none">
                <div className="col-12 mb-4">
                    <div className="card p-3 light bg-body-tertiary bg-navbar-theme">
                        <div className="d-flex justify-content-between align-items-center">
                            <div className="m-0">
                                <Form.Select
                                    // className="w-100"
                                    value={itemsPerPage}
                                    onChange={handleItemsPerPageChange}
                                >
                                    <option value={2}>2</option>
                                    <option value={4}>4</option>
                                    <option value={6}>6</option>
                                    <option value={8}>8</option>
                                    <option value={12}>12</option>
                                    <option value={24}>24</option>
                                </Form.Select>
                            </div>
                            <PaginationCustom
                                currentPage={currentPage}
                                totalPages={totalPages}
                                onPageChange={setCurrentPage}
                            />
                        </div>
                    </div>
                </div>
            </div>

            <div className="row">
                {/*{addresses.map((address, index) => (*/}
                {/*    <div className="col col-xl-4 col-lg-6 col-md-6 col-sm-12 mb-0" key={index}>*/}
                {/*        <div className="card p-0 mb-4">*/}
                {/*            <AddressItem item={address} key={reloadTrigger} onReload={handleReload}/>*/}
                {/*        </div>*/}
                {/*    </div>*/}
                {/*))}*/}
                {currentItems.map((address, index) => (
                    <div className="col col-xl-4 col-lg-6 col-md-6 col-sm-12 mb-0" key={index}>
                        <div className="card p-0 mb-4">
                            <AddressItem item={address} key={reloadTrigger} onReload={handleReload}/>
                        </div>
                    </div>
                ))}
            </div>
            <AddressForm
                show={modalShow}
                // onHide={() => setModalShow(false)}
                onHide={() => setModalShow(false)}
                onReload={handleReload}
                address={null}
            />
        </>
    )
}
