import { createRoot } from "react-dom/client";
import "./index.css";
import "./styles/desk.css";
import "./styles/saas.css";
import { Provider } from "react-redux";
import { BrowserRouter } from "react-router-dom";
import store from "./app/store";
import AppRoutes from "./AppRoutes";

createRoot(document.getElementById("root")!).render(
  <Provider store={store}>
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  </Provider>,
);
