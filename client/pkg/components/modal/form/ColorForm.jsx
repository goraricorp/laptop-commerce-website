import axios from "axios";
import React, { useEffect, useState } from "react";
import { Button, Col, Form, InputGroup, Modal, Row } from "react-bootstrap";
import { ConfirmModal } from "../notice/ConfirmModal.jsx";
import apiHandler from "../../../utils/apiHandler.jsx";

export default function ColorForm({ color, show, onHide, onReload }) {
    const [validated, setValidated] = useState(false);
    const [formData, setFormData] = useState({
        color: '',
        product_name: '',
    });
    const [error, setError] = useState(null);
    const [product, setData] = useState([]);
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [showConfirmDelete, setShowConfirmDelete] = useState(false);

    const fetchAPI = async () => {
        const response = await apiHandler.get("/products/get-product")
        setData(response.data)
    };

    const handleChange = (event) => {
        const { name, value } = event.target;
        setFormData(prevData => ({ ...prevData, [name]: value }));
    };

    const handleInvalid = (event) => {
        event.preventDefault();
        event.stopPropagation();

        const form = event.currentTarget;

        if (form.checkValidity() === false) {
            setValidated(true);
        } else {
            const allFieldsFilled = Object.values(formData).every(value => value.trim() !== "");

            if (allFieldsFilled) {
                setShowConfirmModal(true);
            } else {
                setValidated(true);
            }
        }
    };

    const handleConfirmSave = async () => {
        try {
            // const token = localStorage.getItem('token');
            // console.log(formData);
            const response = color
                ? await apiHandler.post(`/admin/update-color/${color.idcolor}`, formData)
                : await apiHandler.put('/admin/create-color', formData);


            if (response.status === 200 || response.status === 201) {
                // alert(address ? 'Address updated successfully' : 'Address added successfully');
                setShowConfirmModal(false)
                onHide();
                onReload()
            }
        } catch (error) {
            setError(error.response ? error.response.data.message : 'Failed to save address');
        }
    };

    const handleDelete = async () => {
        try {
            const token = localStorage.getItem('token');
            await apiHandler.delete(`/admin/delete/${color.idaddress}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setShowConfirmDelete(false);
            onHide();
            onReload()
        } catch (error) {
            console.error("Error deleting address:", error);
            setError(error.response ? error.response.data.message : 'Failed to save address');
        }
    };

    useEffect(() => {
        fetchAPI()
        if (color) {
            setFormData({
                color: color.color || '',
                product_name: color.product_name || '',
            });
        }
        if (!show) {
            setFormData({
                color: '',
                product_name: '',
            });
        }
        setValidated(false);
        setError(null);
    }, [show]);

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
                        <h5>Edit Color</h5>
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {/* <h4>Note</h4> */}
                    {/* <p>
                        Enter invalid values of all input groups to help us know your location. Then we can deliver your package.
                    </p> */}
                    <Form noValidate validated={validated} onSubmit={handleInvalid}> {/*onSubmit={handleSubmit, openConfirmModal}*/}
                        <Row className="mb-3">
                            <select
                                className="form-select"
                                id="product_name"
                                name="product_name"
                                defaultValue=""
                                value={formData.product_name}
                                onChange={handleChange}
                                required
                            >
                                <option value="">Choose Product</option>
                                {
                                    product.map((cat, index) => (
                                        <option key={index} value={cat.product_name}>{cat.product_name}</option>
                                    ))
                                }
                            </select>
                            <Form.Group as={Col} md={5} controlId="color">
                                <Form.Label>Color</Form.Label>
                                <InputGroup hasValidation>
                                    <InputGroup.Text id="color">
                                        <i className='bx bx-user' ></i>
                                    </InputGroup.Text>
                                    <Form.Control
                                        required
                                        type="text"
                                        name="color"
                                        value={formData.color}
                                        onChange={handleChange}
                                    />
                                    <Form.Control.Feedback type="invalid">
                                        Please enter color.
                                    </Form.Control.Feedback>
                                </InputGroup>
                            </Form.Group>

                        </Row>

                        <hr />
                        {error && <p className="text-danger">{error}</p>}
                    </Form>
                </Modal.Body>
                <Modal.Footer>
                    <Button onClick={onHide} variant="secondary" className="me-auto">
                        <i className='bx bx-x me-2'></i>
                        <span>Close</span>
                    </Button>
                    {/*<Button type="submit" variant="info"*/}
                    {/*        onClick={handleSubmit}> /!*onClick={handleSubmit, openConfirmModal}*!/*/}
                    {/*    <i className='bx bx-check me-2' ></i>*/}
                    {/*    <span>Save changes</span>*/}
                    {/*</Button>*/}
                    {color ?
                        <>
                            {/* <Button onClick={() => setShowConfirmDelete(true)} variant="danger" className="me-3">
                                <i className='bx bx-trash' ></i>
                                <span>Delete Address</span>
                            </Button> */}
                            <Button onClick={handleInvalid} variant="info">
                                <i className='bx bx-check me-2'></i>
                                <span>Save changes</span>
                            </Button>
                        </> : <>
                            <Button type="submit" variant="success" onClick={handleInvalid}>
                                <i className='bx bx-plus me-2'></i>
                                <span>Create Address</span>
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
                title="Delete Color"
                type="danger"
                button="Delete"
                show={showConfirmDelete}
                onHide={() => setShowConfirmDelete(false)}
                onSave={handleDelete}
            />
        </>
    )
}