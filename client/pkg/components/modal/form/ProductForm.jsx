import axios from "axios";
import React, { useEffect, useState } from "react";
import { Button, Col, Form, InputGroup, Modal, Row } from "react-bootstrap";
import { ConfirmModal } from "../notice/ConfirmModal.jsx";
import apiHandler from "../../../utils/apiHandler.jsx";

export default function ProductForm({ product, show, onHide, onReload }) {
    const [validated, setValidated] = useState(false);
    const [previewImage, setPreviewImage] = useState(null); // State lưu URL xem trước
    const [formData, setFormData] = useState({
        brand: '',
        category_name: '',
        product_image: '',
        product_name: '',
        idcategory: ''
    });
    const [category, setCategory] = useState([]);
    const [data1, setData1] = useState([])
    const [brand, setBrand] = useState([]);
    const fetchCategory = async () => {
        const response = await apiHandler.get("/category/get-category")
        setCategory(response.data)
        // console.log(response.data)
    }
    const getBrand = async () => {
        const response = await apiHandler.get("/admin/get-brand")
        setBrand(response.data)
    };
    const findIdCategoryByName = (name) => {
        const category = data1.find(cat => cat.category_name.toLowerCase() === name.toLowerCase());
        return category ? category.idcategory : null;
    };

    const [error, setError] = useState(null);
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [showConfirmDelete, setShowConfirmDelete] = useState(false);


    const convertFormDataToString = (data) => {
        return Object.fromEntries(
            Object.entries(data).map(([key, value]) => [key, String(value || "")])
        );
    };

    const handleChange = (event) => {
        const { name, value } = event.target;

        // Nếu thay đổi là từ category
        if (name === 'category_name') {
            const selectedCategory = category.find(cat => cat.category_name === value); // Tìm category từ danh sách
            setFormData(prevData => ({
                ...prevData,
                category_name: value, // Cập nhật tên category
                idcategory: selectedCategory ? String(selectedCategory.idcategory) : ''
            }));
        }
        // Nếu thay đổi là từ brand
        else if (name === 'brand_name') {
            const selectedBrand = brand.find(br => br.brand_name === value); // Tìm brand từ danh sách
            setFormData(prevData => ({
                ...prevData,
                brand: selectedBrand ? selectedBrand.brand_name : value // Cập nhật brand
            }));
        }
        else {
            // Cập nhật các trường khác bình thường
            setFormData(prevData => ({
                ...prevData,
                [name]: value
            }));
        }
    };
    const handleImageChange = (event) => {
        const file = event.target.files[0];
        if (file) {
            const previewURL = URL.createObjectURL(file);
            setPreviewImage(previewURL); // Lưu URL ảnh tạm thời
            setFormData((prevData) => ({
                ...prevData,
                product_image: URL.createObjectURL(file) // Lưu URL của ảnh vào state
            }));
        }
    };
    const handleInvalid = async (event) => {
        event.preventDefault();
        event.stopPropagation();
        setFormData(prevData => ({
            ...prevData,
            product_image: "fileInput(0)"
        }))
        const form = event.currentTarget;
        const dataAsString = convertFormDataToString(formData);
        const idCategory = findIdCategoryByName(dataAsString.category_name)

        if (form.checkValidity() === false) {
            setValidated(true);
        } else {
            const allFieldsFilled = Object.values(dataAsString).every(value => value.trim() !== "");

            if (allFieldsFilled) {
                setShowConfirmModal(true);
            } else {

                setValidated(true);
            }
        }
    };

    const handleConfirmSave = async () => {
        try {
            const dataAsString = convertFormDataToString(formData);
            // const token = localStorage.getItem('token');
            const fileInput = document.getElementById('upload');
            const file = fileInput.files[0];
            const formDataToSend = new FormData();

            if (file) {
                formDataToSend.append('product_image', file); // Đảm bảo file được thêm vào FormData
            }
            // Thêm các trường dữ liệu khác vào FormData, bao gồm cả thông tin người dùng
            formDataToSend.append('brand', formData.brand);
            formDataToSend.append('category_name', formData.category_name);
            formDataToSend.append('product_name', formData.product_name);
            formDataToSend.append('idcategory', formData.idcategory);


            const response = product
                ? await apiHandler.post(`/products/update-productname/${product.idproduct}`, formDataToSend, {
                    headers: {
                        'Content-Type': 'multipart/form-data'
                    },
                    product_name: formDataToSend.product_name,
                })
                : await apiHandler.put('/products/create-productname', formDataToSend, {
                    headers: {
                        'Content-Type': 'multipart/form-data'
                    },
                })

            // if ((ImageResponse && ImageResponse.status === 200) || (response.status === 200)) {
            //     onHide();
            //     setShowModal(false);
            //     onReload();

            // }
            if (response.status === 200 || response.status === 201) {
                // alert(address ? 'Address updated successfully' : 'Address added successfully');
                setShowConfirmModal(false)
                onHide();
                onReload()
            }
        } catch (error) {
            setError(error.response ? error.response.data.message : 'Failed to save address');
        }
        // onReload()
    };

    const handleDelete = async () => {
        try {
            await apiHandler.delete(`/products/delete-productname/${product.idproduct}`);
            setShowConfirmDelete(false);
            onHide();
            onReload()
        } catch (error) {
            // console.error("Error deleting product:", error);
            setError(error.response ? error.response.data.message : 'Failed to save product name');
        }
    };

    const getImage = () => {
        // Update/reset user image of account page
        let productImage = document.getElementById('uploadedImage');
        const fileInput = document.querySelector('.product-file-input');
        const resetFileInput = document.querySelector('.product-image-reset');

        if (productImage && fileInput && resetFileInput) {
            const resetImage = productImage.src; // Lưu URL gốc của ảnh

            // Khi người dùng chọn ảnh mới
            fileInput.onchange = () => {
                if (fileInput.files[0]) {
                    productImage.src = window.URL.createObjectURL(fileInput.files[0]); // Thay đổi ảnh
                }
            };

            // Khi người dùng muốn reset ảnh
            resetFileInput.onclick = () => {
                fileInput.value = ''; // Reset input file
                productImage.src = resetImage; // Đặt lại ảnh về giá trị ban đầu
            };
        }
    };

    useEffect(() => {
        getImage();
        // fetchAPI1();
        fetchCategory();
        getBrand();
        if (product) {
            setFormData({
                brand: product.brand || '',
                category_name: product.category_name || '',
                product_image: product.product_image || '',
                product_name: product.product_name || '',
                idcategory: product.idcategory || ''
            });
        }

        if (!show) {
            setFormData({
                brand: '',
                category_name: '',
                product_image: '',
                product_name: '',
                idcategory: ''
            });
        }
        setValidated(false);
        setError(null);
    }, [show]);
    return (
        <>
            <Modal
                show={show}
                onHide={onHide} //
                size="lg"
                aria-labelledby="contained-modal-title-vcenter"
                centered
            >
                <Modal.Header closeButton>
                    <Modal.Title id="contained-modal-title-vcenter">
                        <h5>Edit Product</h5>
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form noValidate validated={validated} onSubmit={handleInvalid}>
                        <div className="row mb-3">
                            <div className="d-flex align-items-start align-items-sm-center gap-4 rounded-2 col-7 mb-3">
                                <div className="avatar-wrapper me-3 rounded-2 bg-label-secondary">
                                    <img
                                        src={`${previewImage}` || "/assets/img/product/default.png"}
                                        alt="product-image"
                                        className="d-block rounded"
                                        height="100"
                                        width="100"
                                        aria-label="Product image"
                                        id="uploadedImage"
                                    />
                                </div>
                                <div className="button-wrapper">
                                    <label htmlFor="upload" className="btn btn-primary me-3 mb-4" tabIndex="0">
                                        <span className="d-none d-sm-block">Upload new photo</span>
                                        <i className="bx bx-sm bx-upload d-block d-sm-none"></i>
                                        <input
                                            type="file"
                                            name="product"
                                            id="upload"
                                            className="product-file-input"
                                            hidden
                                            accept="image/png, image/jpeg"
                                            onChange={handleImageChange} // Gọi hàm khi chọn ảnh
                                        />
                                    </label>
                                    <button aria-label='Click me' type="button"
                                        className="btn btn-outline-secondary product-image-reset mb-4">
                                        <i className="bx bx-reset d-block d-sm-none"></i>
                                        <span className="d-none d-sm-block">Reset</span>
                                    </button>
                                    <p className="text-muted mb-2">Allowed JPG or PNG.</p>
                                </div>
                            </div>
                            <div className="col-5 mb-3">
                                <label htmlFor="category" className="form-label">Category</label>
                                <select
                                    className="form-select"
                                    id="category"
                                    name="category_name"
                                    defaultValue=""
                                    value={formData.category_name}
                                    onChange={handleChange}
                                    required
                                >
                                    <option value="">Choose category</option>
                                    {
                                        category.map((cat, index) => (
                                            <option key={index} value={cat.category_name}>{cat.category_name}</option>
                                        ))
                                    }
                                </select>
                                <Form.Control.Feedback type="invalid">
                                    Please select a category.
                                </Form.Control.Feedback>
                            </div>

                            <Form.Group as={Col} md={7} controlId="product_name">
                                <Form.Label>Product Name</Form.Label>
                                <InputGroup hasValidation>
                                    <InputGroup.Text id="product_name">
                                        <i className='bx bx-package'></i>
                                    </InputGroup.Text>
                                    <Form.Control
                                        required
                                        type="text"
                                        name="product_name"
                                        value={formData.product_name}
                                        onChange={handleChange}
                                    />
                                    <Form.Control.Feedback type="invalid">
                                        Please enter Product Name.
                                    </Form.Control.Feedback>
                                </InputGroup>
                            </Form.Group>
                            <div className="col-5 mb-3">
                                <label htmlFor="brand" className="form-label">Brand</label>
                                <select
                                    className="form-select"
                                    id="brand"
                                    name="brand_name"
                                    defaultValue=""
                                    value={formData.brand}
                                    onChange={handleChange}
                                    required
                                >
                                    <option value="">Choose Brand</option>
                                    {
                                        brand.map((br, index) => (
                                            <option key={index} value={br.brand_name}>{br.brand_name}</option>
                                        ))
                                    }
                                </select>
                                <Form.Control.Feedback type="invalid">
                                    Please select a brand.
                                </Form.Control.Feedback>
                            </div>
                        </div>
                        <hr />
                        {/*{error && <p className="text-danger">{error}</p>}*/}
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
                    {product ?
                        <>
                            <Button onClick={() => setShowConfirmDelete(true)} variant="danger" className="me-3">
                                <i className='bx bx-trash me-2'></i>
                                <span>Delete Product</span>
                            </Button>
                            <Button onClick={handleInvalid} variant="info">
                                <i className='bx bx-check me-2'></i>
                                <span>Save changes</span>
                            </Button>
                        </> : <>
                            <Button type="submit" variant="success" onClick={handleInvalid}>
                                <i className='bx bx-plus me-2'></i>
                                <span>Create Product</span>
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
                title="Delete Product"
                type="danger"
                button="Delete"
                show={showConfirmDelete}
                onHide={() => setShowConfirmDelete(false)}
                onSave={handleDelete}
            />
        </>
    )
}