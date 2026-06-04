import React, { useEffect, useState } from "react";
import {
  QueryBuilder,
  RuleGroupType,
  defaultValidator,
  formatQuery,
} from "react-querybuilder";
import { v4 } from "uuid";
import {
  FieldSelector,
  OperatorSelector,
  RemoveRuleAndGroupAction,
  RuleAndGroupAction,
  ValueEditor,
} from ".";
import { conditionOperator } from "../../../pages/actionWorkflow/task/condition";
import { DXButton } from "../../atoms";
import "./query-builder.scss";

const initialQuery: RuleGroupType = {
  combinator: "and",
  rules: [],
};

export const QueryBuilderTemplateV2 = React.memo((props: any) => {
  const { callBack, conditions } = props;
  const [query, setQuery] = useState(initialQuery);

  useEffect(() => {
    if (conditions) {
      const rules =
        conditions?.And?.length > 0
          ? conditions?.And
          : conditions?.Any?.length > 0
            ? conditions?.Any
            : [];

      initialQuery.combinator =
        conditions.And?.length > 0
          ? "and"
          : conditions.Any?.length > 0
            ? "or"
            : "and";

      initialQuery.rules = execQuery(rules);
      initialQuery.id = v4();

      if (initialQuery?.rules?.length > 0) {
        setQuery({ ...query, ...initialQuery });
      }
    }
  }, []);

  const onQueryChange = (q: any) => {
    setQuery(q);
    return;
  };

  const onSaveQuery = () => {
    const _conditions: any = {
      ...conditions,
      And: [],
      Any: [],
    };
    query?.rules?.map((i: any) => {
      if (i?.field !== "" && i?.field !== "~" && i?.operator !== "~") {
        _conditions.And =
          query.combinator === "and"
            ? execCondition(query?.rules, query?.combinator)
            : [];

        _conditions.Any =
          query.combinator === "or"
            ? execCondition(query?.rules, query?.combinator)
            : [];
      }
    });
    callBack(_conditions);
  };

  const execCondition = (rules: any[], combinator: string | null) => {
    if (rules?.length <= 0) return [];

    const condition: any[] = rules?.map((item: any) => {
      return {
        Operator: item?.operator,
        Key: item?.field,
        Value: item?.value,
        And:
          item.combinator === "and"
            ? execCondition(item?.rules, item?.combinator)
            : [],
        Any:
          item.combinator === "or"
            ? execCondition(item?.rules, item?.combinator)
            : [],
      };
    });
    return condition || [];
  };

  const execQuery = (rules: any[]) => {
    if (rules?.length <= 0) return [];

    const condition: any[] = rules?.map((item: any) => {
      const group = execGroupQuery(item) || {};
      return {
        id: v4(),
        operator: item?.Operator,
        field: item?.Key,
        value: item?.Value,
        ...group,
      };
    });
    return condition || [];
  };

  const execGroupQuery = (item: any) => {
    const initialQuery: RuleGroupType = {
      combinator: "",
      rules: [],
    };

    const rules =
      item.And?.length > 0 ? item?.And : item?.Any?.length > 0 ? item?.Any : [];

    initialQuery.combinator =
      item.And?.length > 0 ? "and" : item?.Any?.length > 0 ? "or" : "and";

    if (rules?.length <= 0) return {};

    initialQuery.rules = execQuery(rules);
    initialQuery.id = v4();
    return initialQuery;
  };

  const additionalOperators = [
    "like",
    "ilike",
    "startsWith",
    "endsWith",
    "isNull",
    "isNotNull",
    "lessThanOrEqual",
    "greaterThanOrEqual",
    "not",
  ];

  const operators = [...conditionOperator, ...additionalOperators].map((item: any) => {
    return { name: item, label: item };
  });

  return (
    <>
      <label style={{ fontWeight: "bold" }}>Condition</label>
      <QueryBuilder
        operators={operators}
        controlElements={{
          fieldSelector: (props: any) => (
            <FieldSelector {...props}></FieldSelector>
          ),
          valueEditor: (props: any) => <ValueEditor {...props}></ValueEditor>,
          operatorSelector: (props: any) => (
            <OperatorSelector {...props}></OperatorSelector>
          ),
          combinatorSelector: (props: any) => (
            <OperatorSelector {...props}></OperatorSelector>
          ),
          addRuleAction: (props: any) => (
            <RuleAndGroupAction {...props}></RuleAndGroupAction>
          ),
          addGroupAction: (props: any) => (
            <RuleAndGroupAction {...props}></RuleAndGroupAction>
          ),
          removeRuleAction: (props: any) => (
            <RemoveRuleAndGroupAction {...props}></RemoveRuleAndGroupAction>
          ),
          removeGroupAction: (props: any) => (
            <RemoveRuleAndGroupAction {...props}></RemoveRuleAndGroupAction>
          ),
        }}
        resetOnFieldChange={false}
        query={query}
        onQueryChange={(q: any) => onQueryChange(q)}
        // extra
        independentCombinators={false}
        autoSelectOperator={false}
        parseNumbers={true}
        // showCombinatorsBetweenRules
        validator={defaultValidator}
        controlClassnames={{ queryBuilder: "queryBuilder-branches" }}
      />
      <br />
      <DXButton
        text="Save Query"
        onClick={onSaveQuery}
        type="default"
      ></DXButton>
      {/* <h4>Query</h4>
      <pre>
        <code>{formatQuery(query, "json")}</code>
      </pre> */}
    </>
  );
});
