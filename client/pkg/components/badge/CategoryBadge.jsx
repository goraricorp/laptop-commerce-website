import React from "react";
// import {Badge} from "react-bootstrap";

const CategoryBadge = ({ cate, icon, color }) => {
    return (
        <>
            {/*<Badge className="me-2" pill bg="primary" text="dark">Primary</Badge>*/}
            <span className="text-truncate d-flex align-items-center text-heading">
                <span
                    className={`w-px-30 h-px-30 rounded-circle d-flex justify-content-center align-items-center bg-label-${color} me-4`}>
                    <i className={`bx ${icon}`}></i>
                </span>
                {cate}
            </span>
        </>
    )
}

export default CategoryBadge;