import { TLShapeId, Editor } from "tldraw";

export function connectShapes(editor: Editor, from: TLShapeId, to: TLShapeId) {
  editor.createShape({
    type: "arrow",
    props: {
      start: {
        type: "binding",
        boundShapeId: from,
        normalizedAnchor: { x: 0.5, y: 1 },
        isExact: false,
        isPrecise: false,
      },
      end: {
        type: "binding",
        boundShapeId: to,
        normalizedAnchor: { x: 0.5, y: 0 },
        isExact: false,
        isPrecise: false,
      },
    },
  });
}
