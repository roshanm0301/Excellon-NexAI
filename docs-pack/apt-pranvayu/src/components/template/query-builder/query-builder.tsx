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

export const QueryBuilderTemplate = React.memo((props: any) => {
  const { callBack, conditions } = props;
  const [query, setQuery] = useState(initialQuery);

  useEffect(() => {
    if (!conditions || (conditions.and?.length === 0 && conditions.any?.length === 0)) {
      setQuery({ combinator: "and", rules: [], id: v4() });
      return;
    }

    // if (conditions) {
    const rules =
      conditions.and?.length > 0
        ? conditions.and
        : conditions.any?.length > 0
          ? conditions.any
          : [];

    initialQuery.combinator =
      conditions.and?.length > 0
        ? "and"
        : conditions.any?.length > 0
          ? "or"
          : "and";

    initialQuery.rules = execQuery(rules);
    initialQuery.id = v4();

    if (initialQuery?.rules?.length > 0) {
      setQuery({ ...query, ...initialQuery });
    }
    // }
  }, []);

  const onQueryChange = (q: any) => {
    setQuery(q);
    return;
  };

  const onSaveQuery = () => {
    const _conditions: any = {
      ...conditions,
      and: [],
      any: [],
    };
    query.rules.map((i: any) => {
      if (i.field !== "" && i.field !== "~" && i.operator !== "~") {
        _conditions.and =
          query.combinator === "and"
            ? execCondition(query.rules, query.combinator)
            : [];

        _conditions.any =
          query.combinator === "or"
            ? execCondition(query.rules, query.combinator)
            : [];
      }
    });
    callBack(_conditions);
  };

  const execCondition = (rules: any[], combinator: string | null) => {
    if (rules?.length <= 0) return [];

    const condition: any[] = rules?.map((item: any) => {
      return {
        operator: item.operator,
        fact: item.field,
        value: item.value,
        and:
          item.combinator === "and"
            ? execCondition(item.rules, item.combinator)
            : [],
        any:
          item.combinator === "or"
            ? execCondition(item.rules, item.combinator)
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
        operator: item.operator,
        field: item.fact,
        value: item.value,
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
      item.and?.length > 0 ? item.and : item.any?.length > 0 ? item.any : [];

    initialQuery.combinator =
      item.and?.length > 0 ? "and" : item.any?.length > 0 ? "or" : "and";

    if (rules?.length <= 0) return {};

    initialQuery.rules = execQuery(rules);
    initialQuery.id = v4();
    return initialQuery;
  };

  const operators = conditionOperator?.map((item: any) => {
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
