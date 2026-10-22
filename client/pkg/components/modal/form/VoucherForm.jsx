import axios, { formToJSON } from "axios";
import React, { useEffect, useState, useRef } from "react";
import { Button, Col, Form, InputGroup, Modal, Row } from "react-bootstrap";
import Calendar from "react-calendar";
import {ConfirmModal} from "../notice/ConfirmModal.jsx";
import apiHandler from "../../../utils/apiHandler.jsx";

export default function VoucherForm({ voucher, show, onHide, onReload }) {
    const [validated, setValidated] = useState(false);
    const [formData, setFormData] = useState({
        iddiscount: '',
        discount_name: '',
        percentage_discount: '',
        value_discount: '',
        start_date: '',
        end_date: '',
    });
    const [error, setError] = useState(null);
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [showConfirmDelete, setShowConfirmDelete] = useState(false);
    const fromCalendarRef = useRef(null);
    const toCalendarRef = useRef(null);
    const [showFromCalendar, setShowFromCalendar] = useState(false);
    const [fromDate, setFromDate] = useState(null);
    const [toDate, setToDate] = useState(null);
    const onToDateChange = (date) => {
        if (fromDate && date <= fromDate) {
            setError("Ngày kết thúc phải sau ngày bắt đầu.");
        } else {
            setError("");
            setToDate(date);
            setFormData(prevData => ({ ...prevData, end_date: date }));
            setShowToCalendar(false);
        }
    };

    const [showToCalendar, setShowToCalendar] = useState(false);

    useEffect(() => {
        setError(null);
        if (voucher) {
            setFormData({
                iddiscount: voucher.iddiscount ?? '',
                discount_name: voucher.discount_name ?? '',
                percentage_discount: voucher.percentage_discount ?? '',
                value_discount: voucher.value_discount ?? '',
                start_date: voucher.start_date ? new Date(voucher.start_date) : '', // Chuyển thành đối tượng Date
                end_date: voucher.end_date ? new Date(voucher.end_date) : '' // Chuyển thành đối tượng Date
            });
            setFromDate(voucher.start_date ? new Date(voucher.start_date) : null);
            setToDate(voucher.end_date ? new Date(voucher.end_date) : null);
        } else {
            setFormData({
                iddiscount: '',
                discount_name: '',
                percentage_discount: '',
                value_discount: '',
                start_date: '',
                end_date: '',
            });
        }
    }, [voucher]);

    const handleChange = (event) => {
        const { name, value } = event.target;
        setFormData(prevData => ({ ...prevData, [name]: value }));
    };

    const convertFormDataToString = (data) => {
        return Object.fromEntries(
            Object.entries(data).map(([key, value]) => [key, String(value || "")])
        );
    };

    const handleInvalid = (event) => {
        event.preventDefault();
        event.stopPropagation();
        console.log(formData)
        const form = event.currentTarget;
        // const datastring = convertFormDataToString(formData)
        // console.log(formData)
        if (form.checkValidity() === false) {
            setValidated(true);
        } else {
            const allFieldsFilled = Object.values(formData.discount_name).every(value => value.trim() !== "");

            if (allFieldsFilled) {
                setShowConfirmModal(true);
            } else {
                setValidated(true);
            }
        }
    };

    const handleConfirmSave = async () => {
        try {
            const response = voucher
                ? await apiHandler.put(`/admin/update-voucher/${voucher.iddiscount}`, formData)
                : await apiHandler.post('/admin/create-voucher', formData);
            if (response.status === 200 || response.status === 201) {
                setShowConfirmModal(false)
                onHide();
                onReload()
            }
        } catch (error) {
            setError(error.response ? error.response.data.message : 'Failed to save voucher');
        }
    };

    const handleDelete = async () => {
        try {
            const token = localStorage.getItem('token');
            await apiHandler.delete(`/admin/delete-voucher/${voucher.iddiscount}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setShowConfirmDelete(false);
            onHide();
            onReload()
        } catch (error) {
            console.error("Error deleting voucher:", error);
            setError(error.response ? error.response.data.message : 'Failed to save voucher');
        }
    };

    const onFromDateChange = (date) => {
        if (toDate && date >= toDate) {
            setError("Ngày bắt đầu phải trước ngày kết thúc.");
        } else {
            setError("");
            setFromDate(date);
            setFormData(prevData => ({ ...prevData, start_date: date }));
            setShowFromCalendar(false);
        }
    };

    return (
        <>
            <Modal
                // {...address}
                show={show}
                onHide={onHide} //
                size="lg"
                aria-labelledby="contained-modal-title-vcenter"
                centered
            >
                <Modal.Header >
                    <Modal.Title id="contained-modal-title-vcenter">
                        <h3>Edit Voucher</h3>
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form noValidate validated={validated} onSubmit={handleInvalid}> {/*onSubmit={handleSubmit, openConfirmModal}*/}
                        <Row className="mb-3">
                            <Form.Group as={Col} className="col-5 mb-3" controlId="discount_name">
                                <Form.Label>Discount Name</Form.Label>
                                <InputGroup hasValidation>
                                    <InputGroup.Text id="discount_name">
                                        <i className='bx bx-layer'></i>
                                    </InputGroup.Text>
                                    <Form.Control
                                        required
                                        type="text"
                                        name="discount_name"
                                        placeholder="Discount Name"
                                        value={formData.discount_name}
                                        onChange={handleChange}
                                    />
                                    <Form.Control.Feedback type="invalid">
                                        Please enter Voucher Name.
                                    </Form.Control.Feedback>
                                </InputGroup>
                            </Form.Group>
                            <Form.Group as={Col} className="col-5 mb-3" controlId="percentage_discount">
                                <Form.Label>Percentage Discount</Form.Label>
                                <InputGroup hasValidation>
                                    <InputGroup.Text id="percentage_discount">
                                        <i className='bx bx-layer'></i>
                                    </InputGroup.Text>
                                    <Form.Control
                                        required
                                        type="number"
                                        name="percentage_discount"
                                        placeholder="Percentage Discount"
                                        value={formData.percentage_discount ?? ''}
                                        onChange={handleChange}
                                    />
                                    <Form.Control.Feedback type="invalid">
                                        Please enter Percentage Discount.
                                    </Form.Control.Feedback>
                                </InputGroup>
                            </Form.Group>
                            {/*<div className="input-group mb-3">*/}
                            {/*    <input type="file" className="form-control" id="inputImage"/>*/}
                            {/*</div>*/}

                        </Row>
                        <Row className="mb-3">
                            <Form.Group as={Col} className="col-5 mb-3" controlId="value_discount">
                                <Form.Label>Value Discount</Form.Label>
                                <InputGroup hasValidation>
                                    <InputGroup.Text id="value_discount">
                                        <i className='bx bx-layer'></i>
                                    </InputGroup.Text>
                                    <Form.Control
                                        required
                                        type="number"
                                        name="value_discount"
                                        placeholder="Value Discount"
                                        value={formData.value_discount ?? ''}
                                        onChange={handleChange}
                                    />
                                    <Form.Control.Feedback type="invalid">
                                        Please enter Value Discount.
                                    </Form.Control.Feedback>
                                </InputGroup>
                            </Form.Group>
                        </Row>
                        <hr />
                        {error && <p className="text-danger">{error}</p>}
                    </Form>

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
                </Modal.Body>
                <Modal.Footer>
                    <Button onClick={onHide} variant="secondary" className="me-auto">
                        <i className='bx bx-x me-2'></i>
                        <span>Close</span>
                    </Button>
                    {voucher ?
                        <>
                            <Button onClick={handleInvalid} variant="info">
                                <i className='bx bx-check me-2'></i>
                                <span>Save changes</span>
                            </Button>
                        </> : <>
                            <Button type="submit" variant="success" onClick={handleInvalid}>
                                <i className='bx bx-plus me-2'></i>
                                <span>Create Category</span>
                            </Button>
                        </>
                    }
                </Modal.Footer>
            </Modal>

            <ConfirmModal
                type="info"
                show={showConfirmModal}
                onHide={() => setShowConfirmModal(false)}
                onSave={() => { handleConfirmSave(); setShowConfirmModal(false) }}
            />
            <ConfirmModal
                title="Delete Voucher"
                type="danger"
                button="Delete"
                show={showConfirmDelete}
                onHide={() => setShowConfirmDelete(false)}
                onSave={handleDelete}
            />
        </>
    )
}