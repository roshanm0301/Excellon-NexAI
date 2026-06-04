import React, { useEffect } from "react";
import { useStepEditor } from "../../../react";
import { AiTaskFillWrapper } from "../../../assistant/a2ui/components/AiTaskFillButton";
import { HTTP } from "../task/HTTP";
import { ActionTask } from "../task/action";
import { Array } from "../task/array";
import { Cache } from "../task/cache";
import { Condition } from "../task/condition";
import { Crypto } from "../task/crypto";
import { Date } from "../task/date";
import { Document } from "../task/document";
import { Geometry } from "../task/geo";
import { Identifier } from "../task/identifier";
import { Iterator } from "../task/iterator";
import { JSON } from "../task/json";
import { Loop } from "../task/loop";
import { Math } from "../task/math";
import { Object } from "../task/object";
import { PromiseTask } from "../task/promise";
import { Provider } from "../task/provider";
import { Query } from "../task/query";
import { Repository } from "../task/repository/repository";
import { Request } from "../task/request";
import { Resolver } from "../task/resolver";
import { Response } from "../task/response";
import { RSATask } from "../task/rsa";
import { Schema } from "../task/schema";
import { Security } from "../task/security";
import { SMTP } from "../task/smtp";
import { String } from "../task/string";
import { Subscription } from "../task/subscription";
import { Switch } from "../task/switch";
import { Transaction } from "../task/transaction";
import { UUID } from "../task/uuid";
import { WorkFlowTask } from "../task/workflow";
import { HistoryTask } from "../task/history";
import { VersionTask } from "../task/version";
import { Entity } from "../task/entity";
import { ORM } from "../task/orm";
import { MinIOTask } from "../task/minIO";
import { State } from "../task/state";
import { Filter } from "../task/filter/filter";
import { Trino } from "../task/trino/trino";
import { Azure } from "../task/azureTask/azure";
import { Variable } from "../task/variable";
import { Sequence } from "../task/sequence/sequence";
import { Validator } from "../task/validator/validator";
import { ESQuery } from "../task/esquery/esquery";
import { Export } from "../task/export/export"
import { Rule } from "../task/rule";
import { TemplateTask } from "../task/template/templateTask";
import { UIComponentTask } from "../task/uiComponent";
import { KeyCloakTask } from "../task/keyClock";

export const StepEditor = React.memo(() => {
  const { type } = useStepEditor();

  const renderStep = () => {
    switch (type) {
      case "Document":
        return <Document />;
      case "Request":
        return <Request />;
      case "Switch":
        return <Switch />;
      case "Response":
        return <Response />;
      case "Resolver":
        return <Resolver />;
      case "Rule":
        return <Rule />;
      case "Condition":
        return <Condition />;
      case "Date":
        return <Date />;
      case "UUID":
        return <UUID />;
      case "Object":
        return <Object />;
      case "Query":
        return <Query />;
      case "Array":
        return <Array />;
      case "JSON":
        return <JSON />;
      case "Identifier":
        return <Identifier />;
      case "Geometry":
        return <Geometry />;
      case "Promise":
        return <PromiseTask />;
      case "HTTP":
        return <HTTP />;
      case "Transaction":
        return <Transaction />;
      case "Security":
        return <Security />;
      case "Loop":
        return <Loop />;
      case "SMTP":
        return <SMTP />;
      case "Math":
        return <Math />;
      case "Iterator":
        return <Iterator />;
      case "String":
        return <String />;
      case "Action":
        return <ActionTask />;
      case "Provider":
        return <Provider />;
      case "Schema":
        return <Schema />;
      case "Repository":
        return <Repository />
      case "RSA":
        return <RSATask />
      case "Crypto":
        return <Crypto />
      case "Workflow":
        return <WorkFlowTask />
      case "Subscription":
        return <Subscription />
      case "Cache":
        return <Cache />
      case "History":
        return <HistoryTask />
      case "Version":
        return <VersionTask />
      case "Entity":
        return <Entity />
      case "ORM":
        return <ORM />
      case "MinIO":
        return <MinIOTask />
      case "State":
        return <State />;
      case "Filter":
        return <Filter />;
      case "Trino":
        return <Trino />;
      case "Azure":
        return <Azure />;
      case "Variable":
        return <Variable />;
      case "Sequence":
        return <Sequence />;
      case "Validator":
        return <Validator />
      case "ESQuery":
        return <ESQuery />
      case "Export":
        return <Export />
      case "Template":
        return <TemplateTask />
      case "UIComponent":
        return <UIComponentTask />
      case "Keycloak":
        return <KeyCloakTask />
      default:
        return <div>This step is not implemented yet!</div>;
    }
  };

  useEffect(() => {
    let m_pos: any;
    function resize(e: any) {
      var parent = resize_el.parentNode;
      var dx = m_pos - e.x;
      m_pos = e.x;
      parent.style.width =
        parseInt(getComputedStyle(parent, "").width) + dx + "px";
    }

    let resize_el: any = document.getElementById("resize");
    resize_el?.addEventListener(
      "mousedown",
      function (e: any) {
        m_pos = e.x;
        document.addEventListener("mousemove", resize, false);
      },
      false
    );
    document?.addEventListener(
      "mouseup",
      function () {
        document.removeEventListener("mousemove", resize, false);
      },
      false
    );

    return () => {
      document.removeEventListener("mousemove", resize, false);
    };
  }, []);

  return (
    <>
      <div className="content-block step-editor-header">
        <h4 className="step-editor-header__title">{type}</h4>
        <AiTaskFillWrapper />
      </div>
      <div className="responsive-paddings">{renderStep()}</div>
    </>
  );
});
