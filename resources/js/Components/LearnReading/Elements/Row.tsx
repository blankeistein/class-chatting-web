import clsx from "clsx";

export default function Row({ props, children }) {
    return (
        <div className={clsx("flex flex-col", props?.className)}>
            {children}
        </div>
    );
}
