import { Dom } from "../core/dom";
import { EditorView } from "./editor";

export class GlobalEditorView implements EditorView {
  public static create(content: HTMLElement): GlobalEditorView {
    const se = Dom.element("div", {
      class: "sqd-editor sqd-global-editor",
      id: "resize",
    });
    se.appendChild(content);

    const resizeHandler = Dom.element("div", {
      class: "resizeHandler",
      id: "resizeHandler",
    });
    se.appendChild(resizeHandler);

    const view = new GlobalEditorView(se);

    return view;
  }

  private constructor(public readonly root: HTMLElement) {}
}
