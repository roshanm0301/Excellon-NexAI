import { Dom } from "../core/dom";
import { EditorView } from "./editor";

export class StepEditorView implements EditorView {
  public static create(content: HTMLElement): StepEditorView {
    const root = Dom.element("div", {
      class: "sqd-editor sqd-step-editor",
      id: "resize",
    });
    root.appendChild(content);
    const resizeHandler = Dom.element("div", {
      class: "resizeHandler",
      id: "resizeHandler",
    });
    root.appendChild(resizeHandler);
    return new StepEditorView(root);
  }

  private constructor(public readonly root: HTMLElement) {}
}
