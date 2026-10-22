import React from "react";
import { Button } from "react-bootstrap";

export const BrandButton = ({ brand, onSelect }) => {
    return (
        <>
            {brand.brand_logo ?
                <div className="btn-group">
                    <Button
                        aria-label='Click me'
                        type="button"
                        variant={"outline-secondary"}
                        // variant={variant}
                        className="hide-arrow"
                        // btn btn-primary
                        data-bs-toggle="dropdown"
                        aria-expanded="false"
                        onClick={() => onSelect(brand.brand_name)}
                    >
                        <img src={brand.brand_logo} alt={brand.brand_name} className="h-px-50" />
                        {/*{brand.brand_name}*/}
                    </Button>
                </div>
            : <></>}
        </>
    );
};

export const BrandButtonNew = ({ brand, onSelect }) => {
    return (
        <>
            <div className="btn-group">
                <Button
                    aria-label='Click me'
                    type="button"
                    variant={"outline-secondary"}
                    // variant={variant}
                    className="hide-arrow"
                    // btn btn-primary
                    data-bs-toggle="dropdown"
                    aria-expanded="false"
                    onClick={() => onSelect(brand.brand_name)}
                >
                    <img src={brand.brand_logo} alt={brand.brand_name} className="h-px-40" />
                    {/*{brand.brand_name}*/}
                </Button>
            </div>
        </>
    );
};
