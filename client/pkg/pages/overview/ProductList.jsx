import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Container, Button, Row, Col, Stack, Pagination, Form, Badge } from 'react-bootstrap';
import { SelectSortButton } from "../../components/button/SelectSortButton.jsx";
import ProductItem from "../../components/product/ProductItem";
import Transitionbar from "../../layouts/Transitionbar.jsx";
import Overview from "../../layouts/Overview.jsx";
import apiHandler from "../../utils/apiHandler.jsx";
import { BrandButton } from "../../components/button/BrandButton.jsx";
import { PaginationCustom } from "../../components/pagination/PaginationCustom.jsx";
import usePerfectScrollbar from "../../hooks/usePerfectScrollbar.jsx";

export default function ProductList() {
    // Các filter cứng theo category
    const categories = [
        {
            categorical: "CPU",
            variant: "danger",
            item: [
                "Intel core i5",
                "Intel core i7",
                "Intel core i9",
                "AMD Ryzen 5",
                "AMD Ryzen 7",
                "AMD Ryzen 9",
                "Apple M2",
                "Apple M2 Pro",
                "Apple M2 Max",
                "Apple M3",
                "Apple M3 Pro",
                "Apple M3 Max",
                "Apple M4",
                "Apple M4 Pro",
                "Apple M4 Max"
            ],
        },
        {
            categorical: "GPU",
            variant: "success",
            item: [
                "Integrated",
                "AMD Radeon RX 5500M",
                "NVIDIA RTX 3050",
                "NVIDIA RTX 3060",
                "NVIDIA RTX 4050",
                "NVIDIA RTX 4060",
                "NVIDIA RTX 5060",
                "NVIDIA RTX 5070",
            ],
        },
        {
            categorical: "RAM",
            variant: "info",
            item: ["8 GB", "16 GB", "24 GB", "32 GB", "64 GB"],
        },
        {
            categorical: "Storage",
            variant: "warning",
            item: ["256 GB", "512 GB", "1024 GB", "2048 GB"],
        },
        {
            categorical: "Screen",
            variant: "primary",
            item: ["13'", "14'", "15'", "16'"],
        },
    ];

    const [brands, setBrands] = useState([]);
    const [list, setList] = useState([]);
    const [activeFilters, setActiveFilters] = useState({}); // { CPU: ["Intel core i5", "AMD Ryzen 7"], GPU: [...] }
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(8);
    const [searchTerm, setSearchTerm] = useState("");

    const [searchType, setSearchType] = useState("basic"); // basic, advanced
    const [searchQueryTerm, setSearchQueryTerm] = useState(""); // basic, advanced

    const location = useLocation();
    const navigate = useNavigate();

    // Lấy query search từ URL nếu cần
    const query = new URLSearchParams(location.search);
    const searchQuery = query.get("search") || "";

    useEffect(() => {
        if (searchQuery) {
            setSearchTerm(searchQuery);
        }
    }, [searchQuery]);

    // Load danh sách sản phẩm
    const handleLoadProducts = async () => {
        try {
            const response = await apiHandler.get("/products/load-product");
            setList(response.data);
            // Reset activeFilters khi clear filter
            setActiveFilters({});
        } catch (error) {
            console.error("Error loading products:", error);
        }
    };

    // Load danh sách thương hiệu
    const handleLoadBrand = async () => {
        try {
            const response = await apiHandler.get("/products/load-brand");
            setBrands(response.data);
        } catch (error) {
            console.error("Error loading brands:", error);
        }
    };

    // Tải sản phẩm theo thương hiệu
    const loadProductByBrand = async (brand) => {
        try {
            setList([]);
            const response = await apiHandler.get(`/products/load-product-brand/${brand}`);
            setList(response.data);
            // Reset activeFilters khi filter theo brand
            setActiveFilters({});
        } catch (error) {
            console.error("Error loading product by brand:", error);
        }
    };

    // Hàm gọi API filter dựa trên activeFilters
    const applyFilters = async (filters) => {
        try {
            // Nếu không có filter nào, load toàn bộ sản phẩm
            const filterKeys = Object.keys(filters).filter((key) => filters[key].length > 0);
            if (filterKeys.length === 0) {
                handleLoadProducts();
                return;
            }
            // Giả sử API của bạn chấp nhận query string với format: ?filters=CPU:Intel core i5,AMD Ryzen 7;GPU:RTX 3050
            const queryString = filterKeys
                .map((cat) => `${cat}:${filters[cat].join(",")}`)
                .join(";");
            setList([]);
            const response = await apiHandler.get(`/products/load-product-condition?filters=${encodeURIComponent(queryString)}`);
            setList(response.data);
        } catch (error) {
            // console.error("Error filtering products:", error);
            setList([]);
        }
    };

    // Hàm xử lý khi checkbox thay đổi: category, selectedItem, isChecked
    const filterProducts = async (category, selectedItem, isChecked) => {
        setActiveFilters((prev) => {
            const newFilters = { ...prev };
            if (newFilters[category]) {
                if (isChecked) {
                    // Thêm filter nếu chưa có
                    if (!newFilters[category].includes(selectedItem)) {
                        newFilters[category].push(selectedItem);
                    }
                } else {
                    // Bỏ filter: loại bỏ selectedItem khỏi mảng
                    newFilters[category] = newFilters[category].filter((item) => item !== selectedItem);
                }
            } else if (isChecked) {
                newFilters[category] = [selectedItem];
            }
            // Sau khi cập nhật state, gọi API với các filter mới
            applyFilters(newFilters);
            return newFilters;
        });
    };

    // Search giống DataTables: lọc mảng list theo searchTerm trên các trường của product
    const globalFilteredData = list.filter((product) => {
        const term = searchTerm.toLowerCase();
        return (
            (product.product_name && product.product_name.toLowerCase().includes(term)) ||
            (product.brand && product.brand.toLowerCase().includes(term)) ||
            (product.category && product.category.toLowerCase().includes(term)) ||
            (product.description && product.description.toLowerCase().includes(term))
        );
    });

    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = globalFilteredData.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(globalFilteredData.length / itemsPerPage);

    const handleItemsPerPageChange = (e) => {
        setItemsPerPage(Number(e.target.value));
        setCurrentPage(1);
    };

    const handleSearch = (e) => {
        setSearchTerm(e.target.value);
        setCurrentPage(1);
    };

    const handleSearchTypeChange = (e) => {
        setSearchType(e.target.value);
        setCurrentPage(1);
    };

    const handleSearchQuery = async () => {
        try {
            // const query = "intel core 9";
            const response = await apiHandler.get(`/products/search/${searchQueryTerm}`);
            setList(response.data);

            // console.log(response.data);
        } catch (error) {
            // console.error("Error searching products:", error);
            setList([]);
        }
    };

    useEffect(() => {
        handleLoadProducts();
        handleLoadBrand();
    }, []);

    // Sử dụng PerfectScrollbar cho các nhóm button (nếu bạn đã cài đặt hook usePerfectScrollbar)
    usePerfectScrollbar("brand-button-group");
    usePerfectScrollbar("sort-button-group");

    return (
        <>
            <Transitionbar />
            <Overview>
                <h5 className="card-title">Laptop</h5>
                <h6 className="card-subtitle text-muted">
                    Laptop is the best mobile device to work...
                </h6>
                <hr className="mb-0" />
                <div className="d-flex demo-inline-spacing" id="brand-button-group">
                    {brands.map((brand, index) => (
                        <BrandButton key={index} brand={brand} onSelect={loadProductByBrand} />
                    ))}
                </div>
            </Overview>
            <Overview>
                <h5 className="card-title">Sort by</h5>
                <h6 className="card-subtitle text-muted">Choose one of config to sort...</h6>
                <hr className="mb-0" />
                <div className="demo-inline-spacing" id="sort-button-group">
                    {categories.map((category) => (
                        <div key={category.categorical} className="mb-3">{/*  id="sort-button-group" */}
                            <Badge bg={`label-${category.variant}`} className="mb-2 me-2">
                                {category.categorical}
                            </Badge>
                            {/*<div className="d-flex flex-wrap">*/}
                            {category.item.map((item) => (
                                <div key={item} className="form-check form-check-inline">
                                    <input
                                        className="form-check-input"
                                        type="checkbox"
                                        value={item}
                                        onChange={(e) => filterProducts(category.categorical, item, e.target.checked)}
                                    />
                                    <label className="form-check-label">{item}</label>
                                </div>
                            ))}
                            {/*</div>*/}
                        </div>
                    ))}
                </div>
            </Overview>
            <Overview>
                <h3 className="text-center m-0">Spotlight</h3>
            </Overview>
            <Overview>
                <div className="d-flex justify-content-between align-items-center">
                    <div className="d-flex justify-content-center align-items-center">
                        <div className="m-0">
                            <Form.Select
                                // className="w-100"
                                value={itemsPerPage}
                                onChange={handleItemsPerPageChange}
                            >
                                <option value={2}>2</option>
                                <option value={4}>4</option>
                                <option value={8}>8</option>
                                <option value={12}>12</option>
                                <option value={24}>24</option>
                            </Form.Select>
                        </div>
                        <div className="m-0 ms-3">
                            <Form.Select
                                // className="w-100"
                                value={searchType}
                                onChange={handleSearchTypeChange}
                            >
                                <option value={"basic"}>Basic</option>
                                <option value={"advanced"}>Advanced</option>
                            </Form.Select>
                        </div>
                        {(searchType === "basic") ? (
                            <>
                                <div className="ms-3">
                                    <Form.Control
                                        type="search"
                                        placeholder="Search..."
                                        value={searchTerm}
                                        onChange={handleSearch}
                                    />
                                </div>
                            </>
                        ) : (searchType === "advanced") ? (
                            <>
                                <div className="ms-3">
                                    <Form.Control
                                        type="search"
                                        placeholder="Search..."
                                        value={searchQueryTerm}
                                        onChange={(e) => setSearchQueryTerm(e.target.value)}
                                    />
                                </div>
                                <Button className="ms-3" onClick={handleSearchQuery}>
                                    Search
                                </Button>
                            </>
                        ) : (<></>)}
                    </div>
                    <div className="d-flex justify-content-center align-items-center">
                        <Button className="me-3" onClick={handleLoadProducts}>
                            Clear Filter
                        </Button>
                        <PaginationCustom currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
                    </div>
                </div>
            </Overview>

            <div className="container">
                <div className="row">
                    {globalFilteredData.length > 0 ? (
                        currentItems.map((product) => (
                            <div key={product.idproduct} className="col col-sm-12 col-md-6 col-lg-4 col-xl-3 mb-4">
                                <ProductItem product={product} />
                            </div>
                        ))
                    ) : (
                        <div className="col col-12">
                            <div className="card justify-content-center align-items-center mb-4">
                                <div className="card-body">
                                    <h3 className="text-center m-0">No product was found</h3>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}

function ProductListm() {
    // Các filter cứng theo category
    const categories = [
        {
            categorical: "CPU",
            variant: "danger",
            item: [
                "Intel core i5",
                "Intel core i7",
                "Intel core i9",
                "AMD Ryzen 5",
                "AMD Ryzen 7",
                "AMD Ryzen 9",
                "Apple M2",
                "Apple M3",
                "Apple M4",
            ],
        },
        {
            categorical: "GPU",
            variant: "success",
            item: ["RTX 1660", "RTX 2060", "RTX 3050", "RTX 3060", "RTX 4050", "RTX 4060"],
        },
        {
            categorical: "RAM",
            variant: "info",
            item: ["8 GB", "16 GB", "24 GB", "32 GB", "64 GB", "128 GB"],
        },
        {
            categorical: "Storage",
            variant: "warning",
            item: ["256 GB", "512 GB", "1 TB", "2 TB"],
        },
        {
            categorical: "Screen",
            variant: "primary",
            item: ["13'", "14'", "15'", "16'"],
        },
    ];

    const [brands, setBrands] = useState([]);
    const [list, setList] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(8);
    const [searchTerm, setSearchTerm] = useState("");

    const location = useLocation();
    const navigate = useNavigate();

    // Lấy query search từ URL nếu cần
    const query = new URLSearchParams(location.search);
    const searchQuery = query.get("search") || "";

    // Nếu có query thì cập nhật searchTerm
    useEffect(() => {
        if (searchQuery) {
            setSearchTerm(searchQuery);
        }
    }, [searchQuery]);

    // Load danh sách sản phẩm từ API
    const handleLoadProducts = async () => {
        try {
            const response = await apiHandler.get("/products/load-product");
            setList(response.data);
        } catch (error) {
            console.error("Error loading products:", error);
        }
    };

    // Load danh sách thương hiệu từ API
    const handleLoadBrand = async () => {
        try {
            const response = await apiHandler.get("/products/load-brand");
            setBrands(response.data);
        } catch (error) {
            console.error("Error loading brands:", error);
        }
    };

    // Tải sản phẩm theo thương hiệu
    const loadProductByBrand = async (brand) => {
        try {
            setList([]);
            const response = await apiHandler.get(`/products/load-product-brand/${brand}`);
            setList(response.data);
        } catch (error) {
            console.error("Error loading product by brand:", error);
        }
    };

    // Lọc sản phẩm theo điều kiện (ví dụ, theo checkbox của category)
    const filterProducts = async (category, selectedItem) => {
        // Gọi API lọc theo điều kiện, sau đó cập nhật list
        try {
            setList([]);
            const response = await apiHandler.get(`/products/load-product-condition/${selectedItem}`);
            setList(response.data);
        } catch (error) {
            console.error("Error filtering products:", error);
        }
    };

    // Search giống DataTables: tìm kiếm toàn cục trên nhiều thuộc tính của sản phẩm
    // Giả sử mỗi product có: product_name, brand, category, description (bạn chỉnh theo cấu trúc của bạn)
    const filteredData = list.filter((product) => {
        const term = searchTerm.toLowerCase();
        return (
            (product.product_name && product.product_name.toLowerCase().includes(term)) ||
            (product.brand && product.brand.toLowerCase().includes(term)) ||
            (product.category && product.category.toLowerCase().includes(term)) ||
            (product.description && product.description.toLowerCase().includes(term))
        );
    });

    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = filteredData.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(filteredData.length / itemsPerPage);

    const handleItemsPerPageChange = (e) => {
        setItemsPerPage(Number(e.target.value));
        setCurrentPage(1);
    };

    const handleSearch = (e) => {
        setSearchTerm(e.target.value);
        setCurrentPage(1);
    };

    const handleSearchQuery = async () => {
        try {
            const query = "intel core 9";
            const response = await apiHandler.get(`/products/search/${query}`);
            setList(response.data);

            console.log(response.data);
        } catch (error) {
            console.error("Error searching products:", error);
        }
    };

    useEffect(() => {
        handleLoadProducts();
        handleLoadBrand();
        // handleSearchQuery();
    }, []);

    // Sử dụng PerfectScrollbar cho các nhóm button
    usePerfectScrollbar("brand-button-group");
    usePerfectScrollbar("sort-button-group");

    return (
        <>
            <Transitionbar />
            <Overview>
                <h5 className="card-title">Laptop</h5>
                <h6 className="card-subtitle text-muted">
                    Laptop is the best mobile device to work...
                </h6>
                <hr className="mb-0" />
                <div className="d-flex demo-inline-spacing" id="brand-button-group">{/* direction="horizontal" */}
                    {brands.map((brand, index) => (
                        <BrandButton key={index} brand={brand} onSelect={loadProductByBrand} />
                    ))}
                </div>
            </Overview>
            <Overview>
                <h5 className="card-title">Sort by</h5>
                <h6 className="card-subtitle text-muted">Choose one of config to sort...</h6>
                <hr className="mb-0" />

                <div className="demo-inline-spacing">
                    {categories.map((category) => (
                        <div key={category.categorical} className="mb-3">{/*  id="sort-button-group" */}
                            <Badge bg={`label-${category.variant}`} className="mb-2 me-2">
                                {category.categorical}
                            </Badge>
                            {category.item.map((item) => (
                                <div key={item} className="form-check form-check-inline">
                                    <input
                                        className="form-check-input"
                                        type="checkbox"
                                        value={item}
                                        onChange={() => filterProducts(category.categorical, item)}
                                    />
                                    <label className="form-check-label">{item}</label>
                                </div>
                            ))}
                        </div>
                    ))}
                </div>
                {/*<div id="sort-button-group">*/}
                {/*    {categories.map((category) => (*/}
                {/*        <div key={category.categorical} className="mb-3">*/}
                {/*            <div>*/}
                {/*                <span className={`badge bg-label-${category.variant} me-2`}>*/}
                {/*                  {category.categorical}*/}
                {/*                </span>*/}
                {/*            </div>*/}
                {/*            <div className="d-flex flex-wrap">*/}
                {/*                {category.item.map((item) => (*/}
                {/*                    <div key={item} className="form-check form-check-inline">*/}
                {/*                        <input*/}
                {/*                            className="form-check-input"*/}
                {/*                            type="checkbox"*/}
                {/*                            value={item}*/}
                {/*                            onChange={() => filterProducts(category.categorical, item)}*/}
                {/*                        />*/}
                {/*                        <label className="form-check-label">{item}</label>*/}
                {/*                    </div>*/}
                {/*                ))}*/}
                {/*            </div>*/}
                {/*        </div>*/}
                {/*    ))}*/}
                {/*</div>*/}
            </Overview>
            <Overview>
                <h3 className="text-center m-0">Spotlight</h3>
            </Overview>
            <Overview>
                <div className="d-flex justify-content-between align-items-center">
                    <div className="d-flex justify-content-center align-items-center">
                        <div className="m-0">
                            <Form.Select
                                // className="w-100"
                                value={itemsPerPage}
                                onChange={handleItemsPerPageChange}
                            >
                                <option value={2}>2</option>
                                <option value={4}>4</option>
                                <option value={8}>8</option>
                                <option value={12}>12</option>
                                <option value={24}>24</option>
                            </Form.Select>
                        </div>
                        <div className="ms-3">
                            <Form.Control
                                type="search"
                                placeholder="Search..."
                                value={searchTerm}
                                onChange={handleSearch}
                            />
                        </div>
                        <Button className="ms-3" onClick={handleLoadProducts}>
                            Clear Filter
                        </Button>
                    </div>
                    <PaginationCustom currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
                </div>
            </Overview>

            <div className="container">
                <div className="row">
                    {list.length ? currentItems.map((product) => (
                        <div key={product.idproduct} className="col col-sm-12 col-md-6 col-lg-4 col-xl-3 mb-4">
                            <ProductItem product={product} />
                        </div>
                    )) : (
                        <div className="col col-12">
                            <div className="card justify-content-center align-items-center mb-4">
                                <div className="card-body">
                                    <h3 className="text-center m-0">No product was found</h3>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}

function ProductListn() {
    const categories = [
        { categorical: 'CPU', variant: 'danger', item: ['Intel core i5','Intel core i7','Intel core i9','AMD Ryzen 5','AMD Ryzen 7','AMD Ryzen 9','Apple M2','Apple M3','Apple M4'] },
        { categorical: 'GPU', variant: 'success', item: ['RTX 1660','RTX 2060','RTX 3050','RTX 3060','RTX 4050','RTX 4060'] },
        { categorical: 'RAM', variant: 'info', item: ['8 GB','16 GB','24 GB','32 GB','64 GB','128 GB'] },
        { categorical: 'Storage', variant: 'warning', item: ['256 GB','512 GB','1 TB',"2 TB"] },
        { categorical: 'Screen', variant: 'primary', item: ['13\'','14\'','15\'','16\''] },
    ];
    // const brands = ['Apple', 'Dell', 'Lenovo', 'Asus', 'HP', 'Acer', 'Microsoft', 'LG']
    const [brands, setBrands] = useState([]);
    const [list, setList] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(8);

    const [searchTerm, setSearchTerm] = useState("");

    // Giả sử filteredData là mảng productList sau khi lọc theo search, v.v.
    const filteredData = list; // Hoặc thêm logic lọc

    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = filteredData.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(filteredData.length / itemsPerPage);
    const location = useLocation();

    // Extract search query from URL
    const query = new URLSearchParams(location.search);
    const searchQuery = query.get("search");

    // const filteredData = mergedData.filter(item =>
    //     item.firstname.toLowerCase().includes(searchTerm.toLowerCase()) ||
    //     item.lastname.toLowerCase().includes(searchTerm.toLowerCase())
    // );
    //
    // const indexOfLastItem = currentPage * itemsPerPage;
    // const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    // const currentItems = filteredData.slice(indexOfFirstItem, indexOfLastItem);
    //
    // const totalPages = Math.ceil(filteredData.length / itemsPerPage);

    const handleLoadProducts = async () => {
        try {
            const response = await apiHandler.get("/products/load-product");
            setList(response.data);
        } catch (error) {}
    };

    const handleLoadBrand = async () => {
        try {
            const response = await apiHandler.get("/products/load-brand");
            setBrands(response.data);
        } catch (error) {}
    }

    const loadProductByBrand = async (brand) => {
        try {
            const response = await apiHandler.get(`/products/load-product-brand/${brand}`);
            setList(response.data);
        } catch (error) {}
    };

    // Function to filter products based on dropdown selection
    const filterProducts = (category, selectedItem) => {
        const filteredProducts = async () => {
            try {
                const response = await apiHandler.get(`/products/load-product-condition/${selectedItem}`);
                setList(response.data);
            } catch (error) {}
        };
        filteredProducts();
    };

    const handleItemsPerPageChange = (e) => {
        setItemsPerPage(Number(e.target.value));
        setCurrentPage(1);
    };

    const handleSearch = (e) => {
        setSearchTerm(e.target.value);
        setCurrentPage(1);
    };

    useEffect(() => {
        handleLoadProducts();
        handleLoadBrand();

        if (searchQuery !== '') {
            // fetchProductByName();
        }

    }, []);

    // useEffect(() => {
    //     window.scrollTo({ top: 0, behavior: "smooth" });
    // }, [currentPage]);

    usePerfectScrollbar("brand-button-group")
    usePerfectScrollbar("sort-button-group")

    return (
        <>
            <Transitionbar/>
            <Overview>
                <h5 className="card-title">Laptop</h5>
                <h6 className="card-subtitle text-muted">
                    Laptop is best mobile device to work...
                </h6>
                <hr className="mb-0"/>
                <Stack className="demo-inline-spacing" direction="horizontal" id="brand-button-group">
                    {brands.map((brand, index) => (
                        <BrandButton
                            key={index}
                            brand={brand}
                            onSelect={loadProductByBrand}
                        />
                    ))}
                </Stack>
            </Overview>
            <Overview>
                <h5 className="card-title">Sort by</h5>
                <h6 className="card-subtitle text-muted">
                    Choose one of config to sort...
                </h6>
                <hr className="mb-0"/>

                <div className="demo-inline-spacing">
                    {categories.map((category) => (
                        <div key={category.categorical} className="mb-3" id="sort-button-group">
                            <Badge bg={`label-${category.variant}`} className="mb-2 me-2">
                                {category.categorical}
                            </Badge>
                            {category.item.map((item) => (
                                <div key={item} className="form-check form-check-inline">
                                    <input
                                        className="form-check-input"
                                        type="checkbox"
                                        value={item}
                                        onChange={() => filterProducts(category.categorical, item)}
                                    />
                                    <label className="form-check-label">{item}</label>
                                </div>
                            ))}
                        </div>
                    ))}
                </div>
            </Overview>
            <Overview>
                <h3 className="text-center m-0">Spotlight</h3>
            </Overview>
            <Overview>
                <div className="d-flex justify-content-between align-items-center">
                    <div className="d-flex justify-content-center align-items-center">
                        <div className="m-0">
                            <Form.Select
                                // className="w-100"
                                value={itemsPerPage}
                                onChange={handleItemsPerPageChange}
                            >
                                <option value={2}>2</option>
                                <option value={4}>4</option>
                                <option value={8}>8</option>
                                <option value={12}>12</option>
                                <option value={24}>24</option>
                            </Form.Select>
                        </div>
                        <div
                            className="dataTables_filter mb-0 mb-md-6 d-flex justify-content-center justify-content-md-end mt-n6 mt-md-0 ms-3"> {/* col-sm-6 col-md-2 */}
                            <Form.Control
                                className="form-control"
                                type="search"
                                placeholder="Search..."
                                value={searchTerm}
                                onChange={handleSearch}
                            />
                        </div>
                        <Button
                            className="ms-3"
                            onClick={handleLoadProducts}
                        >
                            Clear Filter
                        </Button>
                    </div>
                    <PaginationCustom
                        currentPage={currentPage}
                        totalPages={totalPages}
                        onPageChange={setCurrentPage}
                    />
                </div>
            </Overview>

            <div className="container">
                {/*<h2 className="text-center mb-4">Spotlight</h2>*/}
                <div className="row">
                    {currentItems.map(product => (
                        <div key={product.idproduct} className="col col-sm-12 col-md-6 col-xl-3 col-lg-4 mb-4">
                            <ProductItem product={product} />
                        </div>
                    ))}
                </div>
            </div>
        </>
    )
}

function ProductListb() {
    const categories = [
        { categorical: 'CPU', variant: 'danger', item: ['Intel core i5','Intel core i7','Intel core i9','AMD Ryzen 5','AMD Ryzen 7','AMD Ryzen 9','Apple M2','Apple M3','Apple M4'] },
        { categorical: 'GPU', variant: 'success', item: ['RTX 1660','RTX 2060','RTX 3050','RTX 3060','RTX 4050','RTX 4060'] },
        { categorical: 'RAM', variant: 'info', item: ['8 GB','16 GB','24 GB','32 GB','64 GB','128 GB'] },
        { categorical: 'Storage', variant: 'warning', item: ['256 GB','512 GB','1 TB',"2 TB"] },
        { categorical: 'Screen', variant: 'primary', item: ['13\'','14\'','15\'','16\''] },
    ];
    // const brands = ['Apple', 'Dell', 'Lenovo', 'Asus', 'HP', 'Acer', 'Microsoft', 'LG']
    const [brands, setBrands] = useState([]);
    const [list, setList] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(8);

    // Giả sử filteredData là mảng productList sau khi lọc theo search, v.v.
    const filteredData = list; // Hoặc thêm logic lọc

    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = filteredData.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(filteredData.length / itemsPerPage);
    const location = useLocation();

    // Extract search query from URL
    const query = new URLSearchParams(location.search);
    const searchQuery = query.get("search");

    const handleLoadProducts = async () => {
        try {
            const response = await apiHandler.get("/products/load-product");
            setList(response.data);
        } catch (error) {}
    };

    const handleLoadBrand = async () => {
        try {
            const response = await apiHandler.get("/products/load-brand");
            setBrands(response.data);
        } catch (error) {}
    }

    const loadProductByBrand = async (brand) => {
        try {
            const response = await apiHandler.get(`/products/load-product-brand/${brand}`);
            setList(response.data);
        } catch (error) {}
    };

    // Function to filter products based on dropdown selection
    const filterProducts = (category, selectedItem) => {
        const filteredProducts = async () => {
            try {
                const response = await apiHandler.get(`/products/load-product-condition/${selectedItem}`);
                setList(response.data);
            } catch (error) {}
        };
        filteredProducts();
    };

    const handleItemsPerPageChange = (e) => {
        setItemsPerPage(Number(e.target.value));
        setCurrentPage(1);
    };

    useEffect(() => {
        handleLoadProducts();
        handleLoadBrand();

        if (searchQuery !== '') {
            // fetchProductByName();
        }

    }, []);

    // useEffect(() => {
    //     window.scrollTo({ top: 0, behavior: "smooth" });
    // }, [currentPage]);

    usePerfectScrollbar("brand-button-group")
    usePerfectScrollbar("sort-button-group")

    return (
        <>
            <Transitionbar/>
            <Overview>
                <h5 className="card-title">Laptop</h5>
                <h6 className="card-subtitle text-muted">
                    Laptop is best mobile device to work...
                </h6>
                <hr className="mb-0"/>
                {/*<div className="demo-inline-spacing" id="brand-button-group">*/}
                {/*    {brands.map((brand, index) => (*/}
                {/*        <BrandButton*/}
                {/*            key={index}*/}
                {/*            brand={brand}*/}
                {/*            onSelect={filterProducts}*/}
                {/*        />*/}
                {/*    ))}*/}
                {/*</div>*/}

                <Stack className="demo-inline-spacing" direction="horizontal" id="brand-button-group">
                    {brands.map((brand, index) => (
                        <BrandButton
                            key={index}
                            brand={brand}
                            onSelect={loadProductByBrand}
                        />
                    ))}
                </Stack>
            </Overview>
            <Overview>
                <h5 className="card-title">Sort by</h5>
                <h6 className="card-subtitle text-muted">
                    Choose one of config to sort...
                </h6>
                <hr className="mb-0"/>
                {/*<Stack className="demo-inline-spacing" direction="horizontal" id="sort-button-group">*/}
                {/*    {categories.map((category, index) => (*/}
                {/*        <SelectSortButton*/}
                {/*            key={index}*/}
                {/*            categorical={category.categorical}*/}
                {/*            variant={category.variant}*/}
                {/*            items={category.item}*/}
                {/*            onSelect={filterProducts}*/}
                {/*        />*/}
                {/*    ))}*/}
                {/*</Stack>*/}

                {/*<div className="demo-inline-spacing">*/}
                {/*    {categories.map((category, index) => (*/}
                {/*        <SelectSortButton*/}
                {/*            key={index}*/}
                {/*            categorical={category.categorical}*/}
                {/*            variant={category.variant}*/}
                {/*            items={category.item}*/}
                {/*            onSelect={filterProducts}*/}
                {/*        />*/}
                {/*    ))}*/}
                {/*</div>*/}

                <div className="demo-inline-spacing">
                    {categories.map((category) => (
                        <div key={category.categorical} className="mb-3" id="sort-button-group">
                            {/* Hiển thị tên category trên một dòng riêng */}
                            <Badge bg={`label-${category.variant}`} className="mb-2 me-2">
                                {category.categorical}
                            </Badge>
                            {/* Các checkbox của category hiển thị theo hàng */}
                            {category.item.map((item) => (
                                <div key={item} className="form-check form-check-inline">
                                    <input
                                        className="form-check-input"
                                        type="checkbox"
                                        value={item}
                                        onChange={() => filterProducts(category.categorical, item)}
                                    />
                                    <label className="form-check-label">{item}</label>
                                </div>
                            ))}
                        </div>
                    ))}
                </div>

                {/*<Stack className="demo-inline-spacing" direction="horizontal" id="sort-button-group">*/}
                {/*    {categories.map((category, index) => (*/}
                {/*        <>*/}
                {/*            <Badge key={index} bg={`label-${category.variant}`} className="d-block">{category.categorical}</Badge>*/}
                {/*            {category.item.map((item, index) => (*/}
                {/*                <div key={index} className="form-check">*/}
                {/*                    <input className="form-check-input" type="checkbox" value=""*/}
                {/*                           onClick={() => filterProducts(category.categorical, item)}/>*/}
                {/*                    <label className="form-check-label"> {item} </label>*/}
                {/*                </div>*/}
                {/*            ))}*/}
                {/*        </>*/}
                {/*    ))}*/}
                {/*</Stack>*/}
            </Overview>
            <Overview>
                <h3 className="text-center m-0">Spotlight</h3>
            </Overview>
            <Overview>
                <div className="d-flex justify-content-between align-items-center">
                    <div className="d-flex justify-content-center align-items-center">
                        <div className="m-0">
                            <Form.Select
                                // className="w-100"
                                value={itemsPerPage}
                                onChange={handleItemsPerPageChange}
                            >
                                <option value={2}>2</option>
                                <option value={4}>4</option>
                                <option value={8}>8</option>
                                <option value={12}>12</option>
                                <option value={24}>24</option>
                            </Form.Select>
                        </div>
                        <Button
                            className="ms-3"
                            onClick={handleLoadProducts}
                        >
                            Clear Filter
                        </Button>
                    </div>
                    <PaginationCustom
                        currentPage={currentPage}
                        totalPages={totalPages}
                        onPageChange={setCurrentPage}
                    />
                </div>
            </Overview>

            <div className="container">
                {/*<h2 className="text-center mb-4">Spotlight</h2>*/}
                <div className="row">
                    {currentItems.map(product => (
                        <div key={product.idproduct} className="col col-sm-12 col-md-6 col-xl-3 col-lg-4 mb-4">
                            <ProductItem product={product} />
                        </div>
                    ))}
                </div>
            </div>

            {/*<ProductListv/>*/}
        </>
    )
}

function ProductListc() {
    const productsPerPage = 8; // Số sản phẩm mỗi trang

    const categories = [
        { categorical: 'CPU', variant: 'primary', item: ['Intel core i3','Intel core i5','Intel core i7','Intel core i9','AMD Ryzen 5','AMD Ryzen 7','Apple M1'] },
        { categorical: 'RAM', variant: 'info', item: ['4','8','16','32','64'] },
        { categorical: 'GPU', variant: 'success', item: ['RTX 2060', 'RTX 3060','RTX 3090', 'RTX 4070','GTX 1660 Ti'] },
        { categorical: 'SSD', variant: 'warning', item: ['128', '256', '512', '1024', "2048"] },
        { categorical: 'Screen', variant: 'danger', item: ['15', '14', '12','16'] },
    ];
    const brands = ['Lenovo', 'Dell', 'HP', 'Acer', 'Microsoft', 'Asus', 'LG', 'Apple', 'Razer', 'Samsung']

    const [count, setCount] = useState(0);
    const [productList, setProductList] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const location = useLocation();

    // Extract search query from URL
    const query = new URLSearchParams(location.search);
    const searchQuery = query.get("search");

    const fetchAPI = async () => {
        const response = await apiHandler.get("/products/load-product");
        setProductList(response.data);
    };

    const fetchProductByBrand = async (brand) => {
        const response = await apiHandler.get(`/products/load-productBrand/${brand}`);
        setProductList(response.data);
    };

    const fetchProductByName = async () => {
        try {
            const response = await apiHandler.get(`/products/load-productName/${searchQuery}`);
            setProductList(response.data);
        } catch (error) {
            // Handle error nếu không tìm thấy
        }
    };

    useEffect(() => {
        fetchAPI();
        if (searchQuery != '') {
            fetchProductByName();
        }
    }, []);

    // Hàm lọc sản phẩm theo category, brand, v.v.
    const filterProducts = (category, selectedItem) => {
        const filteredProducts = async () => {
            const response = await apiHandler.get(`/products/load-selected-brand/${selectedItem}`);
            setProductList(response.data);
            setCurrentPage(1); // Reset về trang 1 sau khi lọc
        };
        filteredProducts();
    };

    // Tính toán chỉ số sản phẩm hiển thị cho trang hiện tại
    const indexOfLastProduct = currentPage * productsPerPage;
    const indexOfFirstProduct = indexOfLastProduct - productsPerPage;
    const currentProducts = productList.slice(indexOfFirstProduct, indexOfLastProduct);
    const totalPages = Math.ceil(productList.length / productsPerPage);

    // Hàm chuyển trang
    const paginate = (pageNumber) => setCurrentPage(pageNumber);

    return (
        <>
            <Transitionbar/>
            <Overview>
                <h5 className="card-title">Laptop</h5>
                <h6 className="card-subtitle text-muted">
                    Laptop is best mobile device to work...
                </h6>
                <hr className="mb-0"/>
                {brands.map((brand, index) => (
                    <BrandButton
                        key={index}
                        brand={brand}
                        onSelect={filterProducts}
                    />
                ))}
            </Overview>
            <Overview>
                <h5 className="card-title">Sort by</h5>
                <h6 className="card-subtitle text-muted">
                    Choose one of config to sort...
                </h6>
                <hr className="mb-0"/>
                {categories.map((category, index) => (
                    <SelectSortButton
                        key={index}
                        categorical={category.categorical}
                        variant={category.variant}
                        items={category.item}
                        onSelect={filterProducts}
                    />
                ))}
            </Overview>
            <Overview>
                <h3 className="text-center m-0">Spotlight</h3>
            </Overview>

            <div className="container">
                <div className="row">
                    {currentProducts.map(product => (
                        <div key={product.idproduct} className="col col-sm-12 col-md-6 col-xl-3 col-lg-4 mb-4">
                            <ProductItem product={product}/>
                        </div>
                    ))}
                </div>
                {/* Phần phân trang */}
                <nav>
                    <ul className="pagination justify-content-center">
                        <li className={`page-item ${currentPage === 1 ? "disabled" : ""}`}>
                            <Button
                                variant="outline-primary"
                                onClick={() => paginate(currentPage - 1)}
                                disabled={currentPage === 1}
                            >
                                Previous
                            </Button>
                        </li>
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map(number => (
                            <li key={number} className={`page-item ${currentPage === number ? "active" : ""}`}>
                                <Button variant="outline-primary" onClick={() => paginate(number)}>
                                    {number}
                                </Button>
                            </li>
                        ))}
                        <li className={`page-item ${currentPage === totalPages ? "disabled" : ""}`}>
                            <Button
                                variant="outline-primary"
                                onClick={() => paginate(currentPage + 1)}
                                disabled={currentPage === totalPages}
                            >
                                Next
                            </Button>
                        </li>
                    </ul>
                </nav>
            </div>
        </>
    );
}

function ProductListx() {
    // State quản lý danh sách sản phẩm
    const [productList, setProductList] = useState([]);
    // State phân trang
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(8);
    const location = useLocation();

    // Nếu có search query từ URL
    const query = new URLSearchParams(location.search);
    const searchQuery = query.get("search");

    // Lấy dữ liệu sản phẩm từ API
    const fetchAPI = async () => {
        try {
            const response = await apiHandler.get("/products/load-product");
            setProductList(response.data);
        } catch (error) {
            console.error("Error fetching products:", error);
        }
    };

    const fetchProductByName = async () => {
        try {
            const response = await apiHandler.get(`/products/load-productName/${searchQuery}`);
            setProductList(response.data);
        } catch (error) {
            console.error("Error fetching products by name:", error);
        }
    };

    useEffect(() => {
        if (searchQuery && searchQuery.trim() !== "") {
            fetchProductByName();
        } else {
            fetchAPI();
        }
    }, [searchQuery]);

    // Nếu có logic lọc, bạn có thể thay đổi ở đây
    const filteredData = productList; // Hoặc dùng bộ lọc nếu cần

    // Tính chỉ số đầu và cuối của sản phẩm hiển thị cho trang hiện tại
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = filteredData.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(filteredData.length / itemsPerPage);

    // Hàm chuyển trang
    const paginate = (pageNumber) => setCurrentPage(pageNumber);

    // Hàm render giao diện phân trang
    const renderPagination = () => {
        if (totalPages <= 1) return null;
        let paginationItems = [];

        // Nút First và Prev
        paginationItems.push(
            <Pagination.First key="first" onClick={() => paginate(1)} disabled={currentPage === 1} />
        );
        paginationItems.push(
            <Pagination.Prev key="prev" onClick={() => paginate(currentPage - 1)} disabled={currentPage === 1} />
        );

        // Nếu tổng số trang nhỏ hơn hoặc bằng 7 thì hiển thị tất cả các trang
        if (totalPages <= 7) {
            for (let i = 1; i <= totalPages; i++) {
                paginationItems.push(
                    <Pagination.Item key={i} active={i === currentPage} onClick={() => paginate(i)}>
                        {i}
                    </Pagination.Item>
                );
            }
        } else {
            // Nếu trang hiện tại ở đầu
            if (currentPage <= 4) {
                for (let i = 1; i <= 5; i++) {
                    paginationItems.push(
                        <Pagination.Item key={i} active={i === currentPage} onClick={() => paginate(i)}>
                            {i}
                        </Pagination.Item>
                    );
                }
                paginationItems.push(<Pagination.Ellipsis key="end-ellipsis" />);
                paginationItems.push(
                    <Pagination.Item key={totalPages} onClick={() => paginate(totalPages)}>
                        {totalPages}
                    </Pagination.Item>
                );
            } else if (currentPage >= totalPages - 3) {
                // Nếu trang hiện tại ở cuối
                paginationItems.push(
                    <Pagination.Item key={1} onClick={() => paginate(1)}>
                        1
                    </Pagination.Item>
                );
                paginationItems.push(<Pagination.Ellipsis key="start-ellipsis" />);
                for (let i = totalPages - 4; i <= totalPages; i++) {
                    paginationItems.push(
                        <Pagination.Item key={i} active={i === currentPage} onClick={() => paginate(i)}>
                            {i}
                        </Pagination.Item>
                    );
                }
            } else {
                // Nếu trang hiện tại nằm giữa
                paginationItems.push(
                    <Pagination.Item key={1} onClick={() => paginate(1)}>
                        1
                    </Pagination.Item>
                );
                paginationItems.push(<Pagination.Ellipsis key="start-ellipsis" />);
                for (let i = currentPage - 1; i <= currentPage + 1; i++) {
                    paginationItems.push(
                        <Pagination.Item key={i} active={i === currentPage} onClick={() => paginate(i)}>
                            {i}
                        </Pagination.Item>
                    );
                }
                paginationItems.push(<Pagination.Ellipsis key="end-ellipsis" />);
                paginationItems.push(
                    <Pagination.Item key={totalPages} onClick={() => paginate(totalPages)}>
                        {totalPages}
                    </Pagination.Item>
                );
            }
        }

        // Nút Next và Last
        paginationItems.push(
            <Pagination.Next key="next" onClick={() => paginate(currentPage + 1)} disabled={currentPage === totalPages} />
        );
        paginationItems.push(
            <Pagination.Last key="last" onClick={() => paginate(totalPages)} disabled={currentPage === totalPages} />
        );

        return <Pagination className="m-0">{paginationItems}</Pagination>;
    };

    return (
        <Container>
            <Row className="mb-3">
                <Col xs={12} className="d-flex justify-content-between align-items-center">
                    <Form.Control
                        type="text"
                        placeholder="Search..."
                        value={searchQuery || ""}
                        onChange={(e) => {
                            // Nếu có xử lý tìm kiếm, set lại query hoặc gọi API tìm kiếm
                            // Ví dụ: update URL hoặc gọi fetchProductByName()
                        }}
                        style={{ width: 300 }}
                    />
                    <Form.Select
                        style={{ width: 100 }}
                        value={itemsPerPage}
                        onChange={(e) => {
                            setItemsPerPage(Number(e.target.value));
                            setCurrentPage(1);
                        }}
                    >
                        <option value={1}>1</option>
                        <option value={4}>4</option>
                        <option value={10}>10</option>
                        <option value={25}>25</option>
                        <option value={50}>50</option>
                        <option value={70}>70</option>
                        <option value={100}>100</option>
                    </Form.Select>
                </Col>
            </Row>
            <Row>
                {currentItems.map(product => (
                    <Col key={product.idproduct} xs={12} sm={6} md={4} lg={3} className="mb-4">
                        <ProductItem product={product} />
                    </Col>
                ))}
            </Row>
            <Row className="justify-content-center">
                <Col xs="auto">{renderPagination()}</Col>
            </Row>
        </Container>
    );
}

function ProductListz() {
    const categories = [
        { categorical: 'CPU', variant: 'primary', item: ['Intel core i3','Intel core i5','Intel core i7','Intel core i9','AMD Ryzen 5','AMD Ryzen 7','Apple M1'] },
        { categorical: 'RAM', variant: 'info', item: ['4','8','16','32','64'] },
        { categorical: 'GPU', variant: 'success', item: ['RTX 2060', 'RTX 3060','RTX 3090', 'RTX 4070','GTX 1660 Ti'] },
        { categorical: 'SSD', variant: 'warning', item: ['128', '256', '512', '1024', "2048"] },
        { categorical: 'Screen', variant: 'danger', item: ['15', '14', '12','16'] },
    ];

    const brands = ['Lenovo', 'Dell', 'HP', 'Acer', 'Microsoft', 'Asus', 'LG', 'Apple', 'Razer', 'Samsung']
    const [count, setCount] = useState(0);
    const [productList, setProductList] = useState([]);
    const location = useLocation();

    // Extract search query from URL
    const query = new URLSearchParams(location.search);
    const searchQuery = query.get("search");
    const fetchAPI = async () => {
        const response = await apiHandler.get("/products/load-product");
        setProductList(response.data);
    };

    const fetchProductByBrand = async (brand) => {
        const response = await apiHandler.get(`/products/load-productBrand/${brand}`);
        setProductList(response.data);
    };

    const fetchProductByName= async () => {
        try {
           const response = await apiHandler.get(`/products/load-productName/${searchQuery}`);
            setProductList(response.data);
        } catch (error) {
            // console.log('chưa nhập tên tìm kiếm')
        }
    };

    useEffect(() => {
        fetchAPI();
        if(searchQuery != ''){
            fetchProductByName();
        }
    }, []);

    // Function to filter products based on dropdown selection
    const filterProducts = (category, selectedItem) => {
        const filteredProducts = async () => {
            const response = await apiHandler.get(`/products/load-selected-brand/${selectedItem}`);
            setProductList(response.data);
        };
        filteredProducts();
    };

    return (
        <>
            <Transitionbar/>
            <Overview>
                <h5 className="card-title">Laptop</h5>
                <h6 className="card-subtitle text-muted">
                    Laptop is best mobile device to work...
                </h6>
                <hr className="mb-0"/>
                {/*<Row className="justify-content-center">*/}
                {/*    <Stack direction="horizontal" gap={3}>*/}
                {/*        {brands.map((brand, index) => (*/}
                {/*            <button*/}
                {/*                key={index}*/}
                {/*                className="btn btn-outline-primary"*/}
                {/*                onClick={() => fetchProductByBrand(brand)}*/}
                {/*            >*/}
                {/*                {brand}*/}
                {/*            </button>*/}
                {/*        ))}*/}
                {/*    </Stack>*/}
                {/*</Row>*/}
                <div className="demo-inline-spacing">
                    {/*row justify-content-center*/}
                    {/*<Stack direction="horizontal" gap={3}>*/}
                    {/*    {categories.map((category, index) => (*/}
                    {/*        <SelectSortButton key={index} category={category} onSelect={filterProducts}/>*/}
                    {/*    ))}*/}
                    {/*</Stack>*/}

                    {brands.map((brand, index) => (
                        <BrandButton
                            key={index}
                            brand={brand}
                            onSelect={filterProducts}
                        />
                    ))}
                </div>
            </Overview>
            <Overview>
                <h5 className="card-title">Sort by</h5>
                <h6 className="card-subtitle text-muted">
                    Choose one of config to sort...
                </h6>
                <hr className="mb-0"/>
                <div className="demo-inline-spacing">
                    {/*row justify-content-center*/}
                    {/*<Stack direction="horizontal" gap={3}>*/}
                    {/*    {categories.map((category, index) => (*/}
                    {/*        <SelectSortButton key={index} category={category} onSelect={filterProducts}/>*/}
                    {/*    ))}*/}
                    {/*</Stack>*/}

                    {categories.map((category, index) => (
                        <SelectSortButton
                            key={index}
                            categorical={category.categorical}
                            variant={category.variant}
                            items={category.item}
                            onSelect={filterProducts}
                        />
                    ))}
                </div>
            </Overview>
            <Overview>
                <h3 className="text-center m-0">Spotlight</h3>
            </Overview>

            <div className="container">
                {/*<h2 className="text-center mb-4">Spotlight</h2>*/}
                <div className="row">
                    {productList.map(product => (
                        <div key={product.idproduct} className="col col-sm-12 col-md-6 col-xl-3 col-lg-4 mb-4">
                            <ProductItem product={product}/>
                        </div>
                    ))}
                </div>
            </div>
        </>
    );
}

function ProductListv() {
    const [productList, setProductList] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(7);

    // Giả sử filteredData là mảng productList sau khi lọc theo search, v.v.
    const filteredData = productList; // Hoặc thêm logic lọc

    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = filteredData.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(filteredData.length / itemsPerPage);

    const fetchAPI = async () => {
        try {
            const response = await apiHandler.get("/products/load-product");
            setProductList(response.data);
        } catch (error) {
            console.error("Error fetching products:", error);
        }
    };

    useEffect(() => {
        fetchAPI();
    }, []);

    const handleItemsPerPageChange = (e) => {
        setItemsPerPage(Number(e.target.value));
        setCurrentPage(1);
    };

    return (
        <Container>
            <Row>
                {currentItems.map(product => (
                    <Col key={product.idproduct} xs={12} sm={6} md={4} lg={3} className="mb-4">
                        <ProductItem product={product} />
                    </Col>
                ))}
            </Row>
            <Row className="justify-content-center">
                <Col xs="auto">
                    <PaginationCustom
                        currentPage={currentPage}
                        totalPages={totalPages}
                        onPageChange={setCurrentPage}
                    />
                </Col>
            </Row>
            <Row>
                <Form.Select
                    style={{ width: 100 }}
                    value={itemsPerPage}
                    onChange={handleItemsPerPageChange}
                >
                    <option value={7}>7</option>
                    <option value={10}>10</option>
                    <option value={25}>25</option>
                    <option value={50}>50</option>
                    <option value={70}>70</option>
                    <option value={100}>100</option>
                </Form.Select>
            </Row>
        </Container>
    );
}
