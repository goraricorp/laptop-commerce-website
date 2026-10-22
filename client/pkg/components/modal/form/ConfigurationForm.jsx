import axios from "axios";
import React, { useEffect, useState } from "react";
import { Button, Col, Form, InputGroup, Modal, Row } from "react-bootstrap";
import { ConfirmModal } from "../notice/ConfirmModal.jsx";
import apiHandler from "../../../utils/apiHandler.jsx";

export default function ConfigurationForm({ configuration, show, onHide, onReload }) {
    const [validated, setValidated] = useState(false);
    const [formData, setFormData] = useState({
        cpu: '',
        gpu: '',
        price: '',
        ram: '',
        screen: '',
        storage: '',
        resolution: '',
        product_name: ''
    });
    const [products, setProductList] = useState([]);

    const [error, setError] = useState(null);
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [showConfirmDelete, setShowConfirmDelete] = useState(false);

    useEffect(() => {
        if (configuration) {
            setFormData({
                cpu: configuration.cpu || '',
                gpu: configuration.gpu || '',
                price: configuration.price || '',
                ram: configuration.ram || '',
                screen: configuration.screen || '',
                storage: configuration.storage || '',
                resolution: configuration.resolution || '',
                product_name: configuration.product_name || '',
            });
        }

        if (!show) {
            setFormData({
                cpu: '',
                gpu: '',
                price: '',
                ram: '',
                screen: '',
                storage: '',
                resolution: '',
                product_name: ''
            });
        }

        setValidated(false);
        setError(null);

        getProducts()
    }, [show]);

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

        const form = event.currentTarget;
        const datastring = convertFormDataToString(formData)
        // console.log(datastring)
        if (form.checkValidity() === false) {
            setValidated(true);
        } else {
            const allFieldsFilled = Object.values(datastring).every(value => value.trim() !== "");
            // console.log(allFieldsFilled)
            if (allFieldsFilled) {
                // console.log("1")
                setShowConfirmModal(true);
            } else {
                // console.log("2")
                setValidated(true);
            }
        }
    };

    const handleConfirmSave = async () => {
        try {
            // const token = localStorage.getItem('token');
            // console.log(formData)
            const response = configuration
                ? await apiHandler.post(`/admin/update-configuration/${configuration.idconfiguration}`, formData)
                : await apiHandler.put('/admin/create-configuration', formData);


            if (response.status === 200 || response.status === 201) {
                // alert(address ? 'Address updated successfully' : 'Address added successfully');
                setShowConfirmModal(false)
                onHide();
                onReload()
            }
        } catch (error) {
            setError(error.response ? error.response.data.message : 'Failed to save configuration');
        }
    };

    const handleDelete = async () => {
        try {
            const token = localStorage.getItem('token');
            await apiHandler.delete(`/admin/delete/${configuration.idaddress}`, {
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

    const getProducts = async () => {
        try {
            const response = await apiHandler.get('/products/get-product');
            setProductList(response.data);
        } catch (error) {
            console.error("Error fetching products:", error);
        }
    }

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
                        <h5>Edit Configuration</h5>
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {/* <h4>Note</h4> */}
                    {/* <p>
                        Enter invalid values of all input groups to help us know your location. Then we can deliver your package.
                    </p> */}
                    <Form noValidate validated={validated}
                        onSubmit={handleInvalid}> {/*onSubmit={handleSubmit, openConfirmModal}*/}
                        <div className="mb-3">
                            <label htmlFor="product_name" className="form-label">Product</label>
                            <select
                                className="form-select"
                                id="product_name"
                                name="product_name"
                                defaultValue=""
                                value={formData.product_name}
                                onChange={handleChange}
                                required
                            >
                                <option value="">Choose product</option>
                                {
                                    products.map((item, index) => (
                                        <option key={index} value={item.product_name}>{`${item.brand} ${item.product_name}`}</option>
                                    ))
                                }
                            </select>
                            <Form.Control.Feedback type="invalid">
                                Please select a type of address.
                            </Form.Control.Feedback>
                        </div>
                        <Row className="mb-3">
                            <Form.Group as={Col} md={8} controlId="cpu">
                                <Form.Label>CPU</Form.Label>
                                <InputGroup hasValidation>
                                    <InputGroup.Text id="cpu">
                                        <i className='bx bx-pie-chart-alt'></i>
                                    </InputGroup.Text>
                                    <Form.Control
                                        required
                                        type="text"
                                        name="cpu"
                                        value={formData.cpu}
                                        onChange={handleChange}
                                    />
                                    <Form.Control.Feedback type="invalid">
                                        Please enter CPU.
                                    </Form.Control.Feedback>
                                </InputGroup>
                            </Form.Group>
                            <Form.Group as={Col} md={4} controlId="ram">
                                <Form.Label>RAM</Form.Label>
                                <InputGroup hasValidation>
                                    <InputGroup.Text id="ram">
                                        <i className='bx bx-bar-chart-square'></i>
                                    </InputGroup.Text>
                                    <Form.Control
                                        required
                                        type="text"
                                        name="ram"
                                        value={formData.ram}
                                        onChange={handleChange}
                                    />
                                    <Form.Control.Feedback type="invalid">
                                        Please enter Ram.
                                    </Form.Control.Feedback>
                                </InputGroup>
                            </Form.Group>
                            <Form.Group as={Col} md={8} controlId="gpu">
                                <i className='bx bx-pie-chart-alt-2'></i>
                                <InputGroup hasValidation>
                                    <InputGroup.Text id="gpu">
                                        <i className='bx bx-user'></i>
                                    </InputGroup.Text>
                                    <Form.Control
                                        required
                                        type="text"
                                        name="gpu"
                                        value={formData.gpu}
                                        onChange={handleChange}
                                    />
                                    <Form.Control.Feedback type="invalid">
                                        Please enter GPU.
                                    </Form.Control.Feedback>
                                </InputGroup>
                            </Form.Group>
                            <Form.Group as={Col} md={4} controlId="storage">
                                <Form.Label>Storage</Form.Label>
                                <InputGroup hasValidation>
                                    <InputGroup.Text id="storage">
                                        <i className='bx bx-hdd'></i>
                                    </InputGroup.Text>
                                    <Form.Control
                                        type="email"
                                        name="storage"
                                        value={formData.storage}
                                        onChange={handleChange}
                                        required
                                    />
                                    <Form.Control.Feedback type="invalid">
                                        Please enter storage.
                                    </Form.Control.Feedback>
                                </InputGroup>
                            </Form.Group>
                        </Row>
                        <Row className="mb-3">
                            <Form.Group as={Col} md={4} controlId="screen">
                                <Form.Label>Screen</Form.Label>
                                <InputGroup hasValidation>
                                    <InputGroup.Text id="screen">
                                        <i className='bx bx-desktop'></i>
                                    </InputGroup.Text>
                                    <Form.Control
                                        type="text"
                                        name="screen"
                                        value={formData.screen}
                                        onChange={handleChange}
                                        required
                                    />
                                    <Form.Control.Feedback type="invalid">
                                        Please enter screen.
                                    </Form.Control.Feedback>
                                </InputGroup>
                            </Form.Group>
                            <Form.Group as={Col} md={8} controlId="resolution">
                                <Form.Label>Resolution</Form.Label>
                                <InputGroup hasValidation>
                                    <InputGroup.Text id="resolution">
                                        <i className='bx bx-fullscreen'></i>
                                    </InputGroup.Text>
                                    <Form.Control
                                        type="text"
                                        name="resolution"
                                        value={formData.resolution}
                                        onChange={handleChange}
                                        required
                                    />
                                    <Form.Control.Feedback type="invalid">
                                        Please enter resolution.
                                    </Form.Control.Feedback>
                                </InputGroup>
                            </Form.Group>
                            <Form.Group as={Col} md={5} controlId="price">
                                <Form.Label>Price</Form.Label>
                                <InputGroup hasValidation>
                                    <InputGroup.Text id="price">
                                        <i className='bx bxs-flag-alt'></i>
                                    </InputGroup.Text>
                                    <Form.Control
                                        type="text"
                                        name="price"
                                        value={formData.price}
                                        onChange={handleChange}
                                        required
                                    />
                                    <Form.Control.Feedback type="invalid">
                                        Please enter price.
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
                    {configuration ?
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
                                <span>Create Configuration</span>
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
                title="Delete Configuration"
                type="danger"
                button="Delete"
                show={showConfirmDelete}
                onHide={() => setShowConfirmDelete(false)}
                onSave={handleDelete}
            />
        </>
    )
}