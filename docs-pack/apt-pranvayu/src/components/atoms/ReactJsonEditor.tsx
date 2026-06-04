import React from "react";
import ReactJson, { ReactJsonViewProps } from "react-json-view";
import { useTheme } from "../../contexts/ThemeContext";

interface IReactJSON extends ReactJsonViewProps {
  name?: string | null | false;
  src: Record<string, any> | any[];
}

export const ReactJsonEditor = React.memo((props: IReactJSON) => {
  const { name = "jsonEditor", src, theme: themeProp, ...rest } = props;
  const { isDark } = useTheme();
  const resolvedTheme = themeProp ?? (isDark ? "monokai" : "rjv-default");
  return (
    <ReactJson
      name={name}
      src={src}
      theme={resolvedTheme}
      style={{
        backgroundColor: "transparent",
        fontFamily: "var(--font-mono, 'Fira Code', monospace)",
        fontSize: "var(--text-xs, 12px)",
      }}
      {...rest}
    />
  );
});
