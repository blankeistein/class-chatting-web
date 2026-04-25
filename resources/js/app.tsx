import { createInertiaApp } from "@inertiajs/react";
import { resolvePageComponent } from "laravel-vite-plugin/inertia-helpers";
import { createRoot } from "react-dom/client";
import "../css/app.css";
import { FirebaseAuthBridge } from "./Components/FirebaseAuthBridge";
import { ThemeProvider } from "./Contexts/ThemeContext";

const appName = import.meta.env.VITE_APP_NAME || "Laravel";

createInertiaApp({
  title: (title) => `${title ? title + " | " : ""}${appName}`,

  resolve: (name) => resolvePageComponent(
    `./Pages/${name}.tsx`,
    import.meta.glob('./Pages/**/*.tsx')
  ),

  setup({ el, App, props }: { el: Element; App: any; props: any }) {
    const root = createRoot(el);
    root.render(
      <ThemeProvider>
        <>
          <FirebaseAuthBridge firebaseAuth={props.initialPage.props.auth?.firebase ?? null} />
          <App {...props} />
        </>
      </ThemeProvider>
    );
  },
});
