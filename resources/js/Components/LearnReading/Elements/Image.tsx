import { createElement } from "react";

export default function Image({ src, props }) {
    return createElement("img", {
        className: props.className,
        src,
    });
}
