import clsx from "clsx";

export default function Column({ props, children }) {
    return (
        <div className={clsx("flex flex-row items-start", props?.className)}>
            {children}
        </div>
    );
}
