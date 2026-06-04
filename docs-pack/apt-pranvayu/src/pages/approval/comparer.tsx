import React from "react";
import ReactDiffViewer, { DiffMethod } from "react-diff-viewer";
import { useTheme } from "../../contexts/ThemeContext";

export default function Comparer(props: any) {
  const { oldJSON, newJSON, leftTitle = "Old Version", rightTitle = "New Version" } = props
  const { isDark } = useTheme();

  const newStyles = {
    variables: {
      light: {
        diffViewerBackground: '#ffffff',
        diffViewerColor: '#212529',
        addedBackground: '#e6ffec',
        addedColor: '#24292e',
        removedBackground: '#ffeef0',
        removedColor: '#24292e',
        wordAddedBackground: '#acf2bd',
        wordRemovedBackground: '#fdb8c0',
        addedGutterBackground: '#cdffd8',
        removedGutterBackground: '#ffdce0',
        gutterBackground: '#f7f7f7',
        gutterBackgroundDark: '#f3f1f1',
        codeFoldGutterBackground: '#dbedff',
        codeFoldBackground: '#f1f8ff',
        emptyLineBackground: '#fafbfc',
        gutterColor: '#6e7781',
        addedGutterColor: '#24292e',
        removedGutterColor: '#24292e',
        codeFoldContentColor: '#0366d6',
      },
      dark: {
        diffViewerBackground: '#1e1e1e',
        diffViewerColor: '#cccccc',
        addedBackground: '#1a2e1a',
        addedColor: '#cccccc',
        removedBackground: '#2e1a1a',
        removedColor: '#cccccc',
        wordAddedBackground: '#2ea04333',
        wordRemovedBackground: '#f8514933',
        addedGutterBackground: '#1a2e1a',
        removedGutterBackground: '#2e1a1a',
        gutterBackground: '#252526',
        gutterBackgroundDark: '#2d2d2d',
        codeFoldGutterBackground: '#264f78',
        codeFoldBackground: '#1e3a5f',
        emptyLineBackground: '#1e1e1e',
        gutterColor: '#858585',
        addedGutterColor: '#cccccc',
        removedGutterColor: '#cccccc',
        codeFoldContentColor: '#3794ff',
      }
    }
  };
  return (
    <div className="scrollmenu">
      <ReactDiffViewer
        oldValue={JSON.stringify(oldJSON, undefined, 4)}
        newValue={JSON.stringify(newJSON, undefined, 4)}
        splitView={true}
        compareMethod={DiffMethod.WORDS}
        styles={newStyles}
        useDarkTheme={isDark}
        leftTitle={leftTitle}
        rightTitle={rightTitle}
      />
    </div>
  );
}
