import { Head } from "@inertiajs/react";

export default function Test4() {
    return (
        <>
            <Head title="Preview">
                <script src="https://cdn.tailwindcss.com/3.4.17" />
            </Head>
            <a className="m-1" onClick={compile}>
                Test
            </a>
        </>
    );
}
