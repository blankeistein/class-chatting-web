import { createInertiaApp } from "@inertiajs/react";
import { resolvePageComponent } from "laravel-vite-plugin/inertia-helpers";
import { createRoot } from "react-dom/client";
import { FirebaseAuthBridge } from "./Components/FirebaseAuthBridge";

const appName = import.meta.env.VITE_APP_NAME || "Laravel";

createInertiaApp({
    title: (title) => `${title ? title + " | " : ""}${appName}`,

    resolve: (name) => resolvePageComponent(
        `./Pages/${name}.tsx`,
        import.meta.glob('./Pages/**/*.tsx')
    ),

    setup({ el, App, props }) {
        const root = createRoot(el);
        root.render(
            <>
                <FirebaseAuthBridge firebaseAuth={props.initialPage.props.auth?.firebase ?? null} />
                <App {...props} />
            </>
        );
    },
});
