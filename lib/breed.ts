import { BrowserShape } from "@/components/BrowserShape";
import { Box, Editor, TLShape } from "tldraw";
import { makeShapeID } from "./makeShapeID";
import { connectShapes } from "./connectShapes";

export async function breed(editor: Editor) {
  const selectedShapes = editor
    .getSelectedShapes()
    .filter((s: TLShape): s is BrowserShape => s.type === "browser");

  const boundingBox = editor.getSelectionRotatedPageBounds();

  if (!boundingBox) {
    return;
  }

  if (selectedShapes.length !== 2) {
    // TODO show a toast
    return;
  }

  const urls = selectedShapes.map((s) => s.props.url);
  const response = await fetch(`/api/breedUrl`, {
    method: "POST",
    body: JSON.stringify({ urls }),
    headers: {
      "Content-Type": "application/json",
    },
  });

  const offspringUrl = await response.json();

  const id = makeShapeID();
  editor.createShape<BrowserShape>({
    ...getPointUnder(boundingBox),
    type: "browser",
    id,
    props: {
      isBred: true,
      url: offspringUrl,
    },
  });

  connectShapes(editor, selectedShapes[0].id, id);
  connectShapes(editor, selectedShapes[1].id, id);
}

function getPointUnder(box: Box) {
  return { x: box.midX - 640 / 2, y: box.maxY + 100 };
}
