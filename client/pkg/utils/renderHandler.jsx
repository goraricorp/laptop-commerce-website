import {Badge, Pagination} from "react-bootstrap";
import React from "react";
import Navbar from "../layouts/Navbar.jsx";
import Overside from "../layouts/Overside.jsx";
import Activitybar from "../layouts/Activitybar.jsx";
import Outbar from "../layouts/Outbar.jsx";
import CategoryBadge from "../components/badge/CategoryBadge.jsx";

export const renderRatingStar = (rating) => {
    // Sanitize rating to be between 0 and 5
    const sanitizedRating = Math.max(0, Math.min(rating, 5));
    const fullStars = Math.floor(sanitizedRating); // Full stars count
    const halfStar = sanitizedRating % 1 >= 0.1 ? 1 : 0; // Half-star check
    const emptyStars = 5 - fullStars - halfStar; // Remaining empty stars

    // Ensure valid star counts // bx-sm
    return (
        <>
            {/* Full stars */}
            {Array.from({ length: fullStars }).map((_, index) => (
                <i key={`full-${index}`} className='bx bxs-star'></i>
            ))}
            {/* Half star */}
            {halfStar === 1 && <i className='bx bxs-star-half' key="half" />}
            {/* Empty stars */}
            {Array.from({ length: emptyStars }).map((_, index) => (
                <i key={`empty-${index}`} className='bx bx-star'></i>
            ))}
        </>
    );
};

export const renderStatusDelivery = (status) => {
    switch (status) {
        case 5: // "Delivered"
            return <Badge bg="label-success">Delivered</Badge>;
        case 0: // "Ordered"
            return <Badge bg="label-warning">Ordered</Badge>;
        case 3: // "Dispatched"
            return <Badge bg="label-primary">Dispatched</Badge>;
        case 1: // "Pickup"
            return <Badge bg="label-info">Pickup</Badge>;
        case 6: // "Rejected"
            return <Badge bg="label-danger">Rejected</Badge>;
        case 2: // "Arrival"
            return <Badge bg="label-dark">Arrival</Badge>;
        case 4: // "Arrival"
            return <Badge bg="label-secondary">Arrival</Badge>;
        default:
            return <Badge bg="label-light">{status}</Badge>;
    }
};

export const renderProductColor = (color) => {
    switch (color) {
        case 'dark':
            return <Badge bg="label-dark">Black</Badge>;
        case 'light':
            return <Badge bg="label-secondary">White</Badge>;
        case 'gold':
            return <Badge bg="label-warning">Gold</Badge>;
        case 'cyan':
            return <Badge bg="label-info">Cyan</Badge>;
        case 'red':
            return <Badge bg="label-danger">Red</Badge>;
        case 'blue':
            return <Badge bg="label-primary">Blue</Badge>;
        case 'green':
            return <Badge bg="label-success">Green</Badge>;
        default:
            return <Badge bg="dark">{color}</Badge>;
    }
};

export const renderAddressType = (type) => {
    switch (type) {
        case 'Company':
            return <Badge bg="label-primary">Company</Badge>;
        case 'Home':
            return <Badge bg="label-info">Ordered</Badge>;
        case 'Office':
            return <Badge bg="label-success">Dispatched</Badge>;
        case 'Travel':
            return <Badge bg="label-warning">Travel</Badge>;
        case 'Post':
            return <Badge bg="label-danger">Post</Badge>;
        default:
            return <Badge bg="label-secondary">Other</Badge>;
    }
};

export const renderCategory = (category) => {
    switch (category) {
        case "Laptop":
            return <CategoryBadge cate="Laptop" icon="bx-laptop" color="primary" />
        case "Keyboard":
            return <CategoryBadge cate="Keyboard" icon="bxs-keyboard" color="warning" />
        case "Mouse":
            return <CategoryBadge cate="Mouse" icon="bx-mouse-alt" color="success" />
        case "Tablet":
            return <CategoryBadge cate="Tablet" icon="bx-devices" color="danger" />
        case "Smartphone":
            return <CategoryBadge cate="Smartphone" icon="bx-mobile-alt" color="info" />
        case "Smartwatch":
            return <CategoryBadge cate="Smartwatch" icon="bxs-watch-alt" color="secondary" />
        case "Screen":
            return <CategoryBadge cate="Screen" icon="bx-desktop" color="primary" />
        case "Monitor":
            return <CategoryBadge cate="Monitor" icon="bx-desktop" color="danger" />
        case "Play Station":
            return <CategoryBadge cate="Play Station" icon="bx-coin-stack" color="secondary" />
        case "Camera":
            return <CategoryBadge cate="Camera" icon="bx-camera" color="secondary" />
        case "Sound":
            return <CategoryBadge cate="Sound" icon="bx-headphone" color="secondary" />
        case "Household":
            return <CategoryBadge cate="Household" icon="bx-briefcase" color="warning" />
        case "Office":
            return <CategoryBadge cate="Office" icon="bx-home-smile" color="info" />
        case "Game":
            return <CategoryBadge cate="Game" icon="bx-laptop" color="primary" />
        case "Electronics":
            return <CategoryBadge cate="Electronics" icon="bx-headphone" color="danger" />
        case "Accessories":
            return <CategoryBadge cate="Accessories" icon="bxs-watch" color="secondary" />
        case "Shoes":
            return <CategoryBadge cate="Shoes" icon="bx-walk" color="success" />
        default:
            return <CategoryBadge cate="Unknown" icon="bx-question-mark" color="dark" />
    }
};

export const renderProductType = (type) => {
    switch (type) {
        case 'office':
            return <Badge bg="label-info">Office</Badge>;
        case 'gaming':
            return <Badge bg="label-danger">Gaming</Badge>;
        case 'education':
            return <Badge bg="label-success">Education</Badge>;
        case 'graphic':
            return <Badge bg="label-warning">Graphic</Badge>;
        case 'workstation':
            return <Badge bg="label-primary">Workstation</Badge>;
        default:
            return <Badge bg="label-secondary">Other</Badge>;
    }
};

export const renderRoleBadge = (role) => {
    switch (role) {
        case 1:
            return <Badge bg="label-danger">Administrator</Badge>;
        case 0:
            return <><Badge bg="label-primary" className="me-1">User</Badge><Badge bg="label-info">Buyer</Badge></>;
        case 2:
            return <Badge bg="label-success">Deliver</Badge>;
        case 3:
            return <Badge bg="label-warning">Seller</Badge>;
        default:
            return <Badge bg="label-secondary">Other</Badge>;
    }
};

export const renderRoleIcon = (role) => {
    switch (role) {
        case 1: // "Admin"
            return <span className="text-truncate d-flex align-items-center text-heading">
                <i className="bx bx-desktop text-danger me-2"></i>Admin</span>;
        case 0: // "User"
            return <span className="text-truncate d-flex align-items-center text-heading">
                <i className="bx bx-user text-success me-2"></i>User</span>;
        case "Subscriber":
            return <span className="text-truncate d-flex align-items-center text-heading">
                <i className="bx bx-crown text-primary me-2"></i>Subscriber</span>;
        case "Editor":
            return <span className="text-truncate d-flex align-items-center text-heading">
                <i className="bx bx-pie-chart-alt text-info me-2"></i>Editor</span>;
        case "Author":
            return <span className="text-truncate d-flex align-items-center text-heading">
                <i className="bx bx-edit text-warning me-2"></i>Author</span>;
        default:
            return <span className="text-truncate d-flex align-items-center text-heading">
                <i className="bx bx-badge text-primary me-2"></i>Other</span>;
    }
};

export const renderComponentByRole = (role) => {
    switch (role) {
        case 1: // "Admin"
            return <Navbar><Overside/></Navbar>
        case 0: // "User"
            return <Activitybar><Overside/></Activitybar>
        default:
            return <Outbar><Overside/></Outbar>
    }

    // if (role === 1) {
    //     return (
    //         <Navbar>
    //             <Overside/>
    //         </Navbar>
    //     );
    // } else if (role === 0) {
    //     return (
    //         <Activitybar>
    //             <Overside/>
    //         </Activitybar>
    //     );
    // } else {
    //     return (
    //         <Outbar>
    //             <Overside/>
    //         </Outbar>
    //     );
    // }
};