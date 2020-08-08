import {When} from "react-if";
import {MenuItem} from "react-contextmenu";
import React from "react";

export default (props) => {
    const isVisible = props.isVisible ? props.isVisible : true;
    const onClick = props.onClick;
    const children = props.children;

    return (
        <When condition={isVisible}>
            <MenuItem onClick={onClick}>
                {children}
            </MenuItem>
        </When>
    )
}
