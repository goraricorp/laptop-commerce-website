import React from "react";
import { Dropdown, DropdownButton, ButtonGroup, Button } from "react-bootstrap";

export const SelectSortButton = ({ categorical, variant, items, onSelect }) => {
    return (
        <>
            {/*<DropdownButton*/}
            {/*    as={ButtonGroup}*/}
            {/*    key={category.categorical}*/}
            {/*    id={`dropdown-variants-${category.categorical}`}*/}
            {/*    variant={category.variant}*/}
            {/*    title={category.categorical}*/}
            {/*>*/}
            {/*    {category.item.map((product, index) => (*/}
            {/*        <Dropdown.Item*/}
            {/*            eventKey={index}*/}
            {/*            key={index}*/}
            {/*            onClick={() => onSelect(category.categorical, product)}*/}
            {/*        >*/}
            {/*            {product}*/}
            {/*        </Dropdown.Item>*/}
            {/*    ))}*/}
            {/*</DropdownButton>*/}
            <div className="btn-group">
                <Button
                    aria-label='Click me'
                    type="button"
                    variant={"primary"}
                    // variant={variant}
                    className="dropdown-toggle hide-arrow"
                    // btn btn-primary
                    data-bs-toggle="dropdown"
                    aria-expanded="false"
                >
                    {categorical}
                </Button>
                <ul className="dropdown-menu">
                    {items.map((item, index) => (
                        <li
                            key={index}
                            onClick={() => onSelect(categorical, item)}
                        >
                            <a aria-label="dropdown action link" className="dropdown-item" href="#">{item}</a>
                        </li>
                    ))}
                    <li>
                        <hr className="dropdown-divider" />
                    </li>
                    {/*<li><a aria-label="dropdown action link" className="dropdown-item" href="#">Action</a></li>*/}
                    {/*<li><a aria-label="dropdown action link" className="dropdown-item" href="#">Another action</a></li>*/}
                    {/*<li><a aria-label="dropdown action link" className="dropdown-item" href="#">Something else here</a></li>*/}
                    {/*<li><a aria-label="dropdown action link" className="dropdown-item" href="#">Separated link</a></li>*/}
                </ul>
            </div>
        </>
    );
};
