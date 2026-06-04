import React from "react";
import { createRoot } from "react-dom/client";
import { Provider as StoreProvider } from "react-redux";
import App from "./App";
import reportWebVitals from "./reportWebVitals";
import { store } from "./store/store";
import themes from "devextreme/ui/themes";
import "./index.css";
import "./polyfills";

const container = document.getElementById("root");
const root = createRoot(container!); // createRoot(container!) if you use TypeScript

themes.initialized(() =>
  root.render(
    // <React.StrictMode>
    <StoreProvider store={store}>
        <App />
    </StoreProvider>
    // </React.StrictMode>
  )
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
