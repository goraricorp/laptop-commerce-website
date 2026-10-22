import React, { useEffect, useState } from "react";
import { Button, Col, Form, InputGroup, Modal, Row } from "react-bootstrap";
import axios from "axios";
import { ConfirmModal } from "../notice/ConfirmModal.jsx";
import apiHandler from "../../../utils/apiHandler.jsx";

export default function AddressForm({ address, show, onHide, onReload }) {
    const [validated, setValidated] = useState(false);
    const [formData, setFormData] = useState({
        tower: '',
        street: '',
        district: '',
        city: '',
        state: '',
        country: ''
    });
    const [error, setError] = useState(null);
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [showConfirmDelete, setShowConfirmDelete] = useState(false);

    useEffect(() => {
        if (address) {
            setFormData({
                type: address.type || '',
                tower: address.tower || '',
                street: address.street || '',
                district: address.district || '',
                city: address.city || '',
                state: address.state || '',
                country: address.country || ''
            });
        }

        if (!show) {
            // Reset form data và trạng thái khi modal đóng
            setFormData({
                type: '',
                tower: '',
                street: '',
                district: '',
                city: '',
                state: '',
                country: ''
            });

            setValidated(false);
            setError(null);
        }
    }, [show]);

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
            const token = localStorage.getItem('token');
            const response = address
                ? await apiHandler.put(`/address/update/${address.idaddress}`, formData, {
                    headers: { Authorization: `Bearer ${token}` }
                })
                : await apiHandler.post('/address/addition', formData, {
                    headers: { Authorization: `Bearer ${token}` }
                });

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
            await apiHandler.delete(`/address/delete/${address.idaddress}`, {
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
                <Modal.Header closeButton>
                    <Modal.Title id="contained-modal-title-vcenter">
                        <h5>Address Details</h5>
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {/*<h4>Note</h4>*/}
                    <p>
                        Enter invalid values of all input groups to help us know your location. Then we can deliver your package.
                    </p>
                    <Form noValidate
                          validated={validated}
                          onSubmit={handleInvalid}
                    > {/*onSubmit={handleSubmit, openConfirmModal}*/}
                        <div className="mb-3">
                            <label htmlFor="address" className="form-label">Address Type</label>
                            <select
                                className="form-select"
                                id="address"
                                name="type"
                                defaultValue=""
                                value={formData.type}
                                onChange={handleChange}
                                required
                            >
                                <option value="">Choose type of address</option>
                                <option value="Home">Home</option>
                                <option value="Company">Company</option>
                            </select>
                            <Form.Control.Feedback type="invalid">
                                Please select a type of address.
                            </Form.Control.Feedback>
                        </div>
                        <div className="row mb-3">
                            <Form.Group as={Col} md={4} controlId="tower">
                                <Form.Label>Tower</Form.Label>
                                <InputGroup hasValidation>
                                    <InputGroup.Text id="tower">
                                        <i className='bx bx-buildings'></i>
                                    </InputGroup.Text>
                                    <Form.Control
                                        required
                                        type="text"
                                        name="tower"
                                        value={formData.tower}
                                        onChange={handleChange}
                                    />
                                    <Form.Control.Feedback type="invalid">
                                        Please enter your building.
                                    </Form.Control.Feedback>
                                </InputGroup>
                            </Form.Group>
                            <Form.Group as={Col} md={4} controlId="street">
                                <Form.Label>Street</Form.Label>
                                <InputGroup hasValidation>
                                    <InputGroup.Text id="street">
                                        <i className='bx bx-map-alt'></i>
                                    </InputGroup.Text>
                                    <Form.Control
                                        required
                                        type="text"
                                        name="street"
                                        value={formData.street}
                                        onChange={handleChange}
                                    />
                                    <Form.Control.Feedback type="invalid">
                                        Please enter your road.
                                    </Form.Control.Feedback>
                                </InputGroup>
                            </Form.Group>
                            <Form.Group as={Col} md={4} controlId="district">
                                <Form.Label>District</Form.Label>
                                <InputGroup hasValidation>
                                    <InputGroup.Text id="district">
                                        <i className='bx bxs-directions'></i>
                                    </InputGroup.Text>
                                    <Form.Control
                                        type="text"
                                        name="district"
                                        value={formData.district}
                                        onChange={handleChange}
                                        required
                                    />
                                    <Form.Control.Feedback type="invalid">
                                        Please enter your district.
                                    </Form.Control.Feedback>
                                </InputGroup>
                            </Form.Group>
                        </div>
                        <Row className="mb-3">
                            <Form.Group as={Col} md={4} controlId="city">
                                <Form.Label>City</Form.Label>
                                <InputGroup hasValidation>
                                    <InputGroup.Text id="city">
                                        <i className='bx bxs-city'></i>
                                    </InputGroup.Text>
                                    <Form.Control
                                        type="text"
                                        name="city"
                                        value={formData.city}
                                        onChange={handleChange}
                                        required
                                    />
                                    <Form.Control.Feedback type="invalid">
                                        Please enter your city.
                                    </Form.Control.Feedback>
                                </InputGroup>
                            </Form.Group>

                            <Form.Group as={Col} md={4} controlId="state">
                                <Form.Label>State</Form.Label>
                                <InputGroup hasValidation>
                                    <InputGroup.Text id="state">
                                        <i className='bx bxs-flag-alt'></i>
                                    </InputGroup.Text>
                                    <Form.Control
                                        type="text"
                                        name="state"
                                        value={formData.state}
                                        onChange={handleChange}
                                        required
                                    />
                                    <Form.Control.Feedback type="invalid">
                                        Please enter your state.
                                    </Form.Control.Feedback>
                                </InputGroup>
                            </Form.Group>

                            <Form.Group as={Col} md={4} controlId="country">
                                <Form.Label>Country</Form.Label>
                                <InputGroup hasValidation>
                                    <InputGroup.Text id="country">
                                        <i className='bx bx-globe'></i>
                                    </InputGroup.Text>
                                    <Form.Control
                                        type="text"
                                        name="country"
                                        value={formData.country}
                                        onChange={handleChange}
                                        required
                                    />
                                    <Form.Control.Feedback type="invalid">
                                        Please enter your country.
                                    </Form.Control.Feedback>
                                </InputGroup>
                            </Form.Group>
                        </Row>
                        <hr/>
                        {/*{error && <p className="text-danger">{error}</p>}*/}
                    </Form>
                </Modal.Body>
                <Modal.Footer>
                    <Button onClick={onHide} variant="secondary" className="me-auto">
                        <i className='bx bx-x me-2'></i>
                        <span>Close</span>
                    </Button>
                    {address ?
                        <>
                            <Button onClick={() => setShowConfirmDelete(true)} variant="danger" className="me-3">
                                <i className='bx bx-trash me-2'></i>
                                <span>Delete Address</span>
                            </Button>
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
                title="Delete Address"
                type="danger"
                button="Delete"
                show={showConfirmDelete}
                onHide={() => setShowConfirmDelete(false)}
                onSave={handleDelete}
            />
        </>
    );
}
