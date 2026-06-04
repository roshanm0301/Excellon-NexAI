import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ActionWorkflowContainer } from "../pages/actionWorkflow";
import SubscriptionConfiguration from "../pages/subscription-configuration/subscription-configuration";
import Callback from "../pages/auth/Callback";

const RouteComponent = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<SubscriptionConfiguration />}></Route>
        <Route path="/callback" element={<Callback />}></Route>
        <Route
          path="/schema/add-action/:SchemaId"
          element={<ActionWorkflowContainer />}
        ></Route>
        <Route
          path="/schema/edit-action/:SchemaId/:id"
          element={<ActionWorkflowContainer />}
        ></Route>
        <Route
          path="/template/add-template"
          element={<ActionWorkflowContainer />}
        ></Route>
        <Route
          path="/template/edit-template/:TemplateId/:id"
          element={<ActionWorkflowContainer />}
        ></Route>
      </Routes>
    </BrowserRouter>
  );
};

export default RouteComponent;
