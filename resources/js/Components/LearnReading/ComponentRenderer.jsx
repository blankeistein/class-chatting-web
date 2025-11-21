import { COMPONENT_MAP } from "./contanta";

export default function ComponentRenderer({ data }) {
    if (!data || !data.type) {
        return null;
    }

    const Component = COMPONENT_MAP[data.type];
    if (!Component) {
        console.warn(`Komponen untuk tipe '${data.type}' tidak ditemukan.`);
        return null;
    }

    const children = data.childrens?.map((child, index) => (
        <ComponentRenderer key={index} data={child} />
    ));

    return <Component {...data}>{children}</Component>;
}
