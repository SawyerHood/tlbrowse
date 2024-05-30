import { StateNode } from "tldraw";

export class BrowserTool extends StateNode {
  static override id = "browser";

  override onEnter = () => {
    this.editor.setCursor({ type: "cross", rotation: 0 });
  };

  override onPointerDown = () => {
    const { currentPagePoint } = this.editor.inputs;
    this.editor.createShape({
      type: "browser",
      x: currentPagePoint.x,
      y: currentPagePoint.y,
    });

    this.editor.setCurrentTool("select");
  };

  override onCancel = () => {
    this.editor.setCurrentTool("select");
  };
}
