import React, { useEffect, useState } from "react";
import { Button, Col, Form, InputGroup, Modal, Row } from "react-bootstrap";
import axios from "axios";
import apiHandler from "../../../utils/apiHandler.jsx";

export default function StatisticView({ item, show, onHide, onReload }) {
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
        if (item) {
            setFormData({
                tower: item.tower || '',
                street: item.street || '',
                district: item.district || '',
                city: item.city || '',
                state: item.state || '',
                country: item.country || ''
            });
        } else {
            setFormData({
                tower: '',
                street: '',
                district: '',
                city: '',
                state: '',
                country: ''
            });
        }
    }, [item]);

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

    const handleSubmit = async (event) => {
        event.preventDefault();
        event.stopPropagation();

        const form = event.currentTarget;
        if (form.checkValidity() === false) {
            setValidated(true);
            return;
        }

        try {
            const token = localStorage.getItem('token');
            const response = item ?
                await apiHandler.put(`/address/update/${address.idaddress}`, formData) :
                await apiHandler.post('/address/addition', formData, {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                });

            if (response.status === 200 || response.status === 201) {
                // alert(address ? 'Address updated successfully' : 'Address added successfully');
                onHide();
            }
            onReload()
        } catch (error) {
            setError(error.response ? error.response.data.message : 'Failed to save item');
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
                        <h5>Details</h5>
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {/*<h4>Details</h4>*/}
                    <p>
                        Bill Details.
                    </p>
                    <Form noValidate validated={validated} onSubmit={handleInvalid}>
                        <Row className="mb-3">
                            <Form.Group as={Col} md={7} controlId="fullname">
                                <Form.Label>Fullname</Form.Label>
                                <InputGroup hasValidation>
                                    <InputGroup.Text id="fullname">
                                        <i className='bx bx-buildings' ></i>
                                    </InputGroup.Text>
                                    <Form.Control
                                        readOnly
                                        type="text"
                                        name="fullname"
                                        value={item ? `${item.account.user.firstname} ${item.account.user.lastname}` : `Unknown`}
                                        onChange={handleChange}
                                    />
                                    <Form.Control.Feedback/>
                                </InputGroup>
                            </Form.Group>
                            <Form.Group as={Col} md={5} controlId="username">
                                <Form.Label>Username</Form.Label>
                                <InputGroup hasValidation>
                                    <InputGroup.Text id="username">
                                        <i className='bx bx-buildings' ></i>
                                    </InputGroup.Text>
                                    <Form.Control
                                        readOnly
                                        type="text"
                                        name="username"
                                        value={item ? item.account.username : 'unknown'}
                                        onChange={handleChange}
                                    />
                                    <Form.Control.Feedback/>
                                </InputGroup>
                            </Form.Group>
                        </Row>
                        <Row className="mb-3">
                            <Form.Group as={Col} md={5} controlId="phone">
                                <Form.Label>Phone</Form.Label>
                                <InputGroup hasValidation>
                                    <InputGroup.Text id="phone">
                                        <i className='bx bx-buildings' ></i>
                                    </InputGroup.Text>
                                    <Form.Control
                                        readOnly
                                        type="text"
                                        name="phone"
                                        value={item !== null ? item.account.user.phone_number : '+84?'}
                                        onChange={handleChange}
                                    />
                                    <Form.Control.Feedback/>
                                </InputGroup>
                            </Form.Group>
                            <Form.Group as={Col} md={7} controlId="email">
                                <Form.Label>Email</Form.Label>
                                <InputGroup hasValidation>
                                    <InputGroup.Text id="email">
                                        <i className='bx bx-buildings' ></i>
                                    </InputGroup.Text>
                                    <Form.Control
                                        readOnly
                                        type="text"
                                        name="email"
                                        value={item ? item.account !== null ? item.account.email : 'unknown@email.com' : 'unknown@email.com'}
                                        onChange={handleChange}
                                    />
                                    <Form.Control.Feedback/>
                                </InputGroup>
                            </Form.Group>
                        </Row>
                        <Row className="mb-3">
                            <Form.Group as={Col} md={8} controlId="address">
                                <Form.Label>Address</Form.Label>
                                <InputGroup hasValidation>
                                    <InputGroup.Text id="address">
                                        <i className='bx bx-buildings' ></i>
                                    </InputGroup.Text>
                                    <Form.Control
                                        readOnly
                                        type="text"
                                        name="address"
                                        value={item ? item.address ? `${item.address.tower}, ${item.address.street}, ${item.address.district}, ${item.address.city}, ${item.address.state}, ${item.address.country}` : 'Unknown?' : 'Unknown?'}
                                        onChange={handleChange}
                                    />
                                    <Form.Control.Feedback/>
                                </InputGroup>
                            </Form.Group>
                            <Form.Group as={Col} md={4} controlId="voucher">
                                <Form.Label>Voucher</Form.Label>
                                <InputGroup hasValidation>
                                    <InputGroup.Text id="voucher">
                                        <i className='bx bx-buildings' ></i>
                                    </InputGroup.Text>
                                    <Form.Control
                                        readOnly
                                        type="text"
                                        name="voucher"
                                        value={item ? item.discount !== null ? item.discount.discount_name : 'Unknown' : 'Unknown'}
                                        onChange={handleChange}
                                    />
                                    <Form.Control.Feedback/>
                                </InputGroup>
                            </Form.Group>
                        </Row>
                        <Row className="mb-3">
                            <Form.Group as={Col} md={4} controlId="date">
                                <Form.Label>Date</Form.Label>
                                <InputGroup hasValidation>
                                    <InputGroup.Text id="date">
                                        <i className='bx bx-buildings' ></i>
                                    </InputGroup.Text>
                                    <Form.Control
                                        readOnly
                                        type="text"
                                        name="date"
                                        value={item ? item.date !== null ? new Date(item.date).toLocaleString() : 'Unknown' : 'Unknown'}
                                        onChange={handleChange}
                                    />
                                    <Form.Control.Feedback/>
                                </InputGroup>
                            </Form.Group>
                            <Form.Group as={Col} md={4} controlId="price">
                                <Form.Label>Price</Form.Label>
                                <InputGroup hasValidation>
                                    <InputGroup.Text id="price">
                                        <i className='bx bx-buildings' ></i>
                                    </InputGroup.Text>
                                    <Form.Control
                                        readOnly
                                        type="text"
                                        name="price"
                                        value={item ? item.price !== null ? item.price : 'Unknown' : 'Unknown'}
                                        onChange={handleChange}
                                    />
                                    <Form.Control.Feedback/>
                                </InputGroup>
                            </Form.Group>
                            <Form.Group as={Col} md={4} controlId="status">
                                <Form.Label>Status</Form.Label>
                                <InputGroup hasValidation>
                                    <InputGroup.Text id="status">
                                        <i className='bx bx-buildings' ></i>
                                    </InputGroup.Text>
                                    <Form.Control
                                        readOnly
                                        type="text"
                                        name="status"
                                        value={item ? item.status !== null && item.status !== '' ? item.status === 1 ? 'Paid' : 'Ordered' : 'Unknown' : 'Unknown'}
                                        onChange={handleChange}
                                    />
                                    <Form.Control.Feedback/>
                                </InputGroup>
                            </Form.Group>
                        </Row>
                        <Row className="mb-3">
                            {item ? item.bill_details.map((detail, index) => (
                                <Form.Group key={index} as={Col} md={4} controlId="date">
                                    <Form.Label>Date</Form.Label>
                                    <InputGroup hasValidation>
                                        <InputGroup.Text id="date">
                                            <i className='bx bx-buildings' ></i>
                                        </InputGroup.Text>
                                        <Form.Control
                                            readOnly
                                            type="text"
                                            name="date"
                                            value={detail}
                                            onChange={handleChange}
                                        />
                                        <Form.Control.Feedback/>
                                    </InputGroup>
                                </Form.Group>
                            )): null}
                        </Row>
                        <hr/>
                        {error && <p className="text-danger">{error}</p>}
                    </Form>
                </Modal.Body>
                <Modal.Footer>
                    <Button onClick={onHide} variant="secondary" className="me-auto">
                        <i className='bx bx-x me-2'></i>
                        <span>Close</span>
                    </Button>
                    <Button onClick={onHide} variant="primary">
                        <i className='bx bx-x me-2'></i>
                        <span>Close</span>
                    </Button>
                </Modal.Footer>
            </Modal>
        </>
    );
}