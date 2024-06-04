import { TLCompleteEventInfo, TLTextShape, TextShapeTool } from "tldraw";

export class PromptShapeTool extends TextShapeTool {
  static override id = "prompt";
  onExit = (info: TLCompleteEventInfo) => {
    const shape = this.editor.getEditingShape();
    console.log("onDragExit", shape);
    if (!shape) return;
    this.editor.updateShape<TLTextShape>({
      id: shape.id,
      type: "text",
      meta: {
        prompt: true,
      },
      props: {
        color: "light-violet",
      },
    });
  };
}
