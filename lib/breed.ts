import { BrowserShape } from "@/components/BrowserShape";
import { Box, Editor, TLShape } from "tldraw";
import { makeShapeID } from "./makeShapeID";
import { settingsStringAtom } from "@/state/settings";
import { getDefaultStore } from "jotai";

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

  const htmls = selectedShapes.map((s) => s.props.html!);

  const id = makeShapeID();
  editor.createShape<BrowserShape>({
    ...getPointUnder(boundingBox),
    type: "browser",
    id,
    props: {
      isBred: true,
    },
  });

  await waitFor(() => {
    return !!document.getElementById(`iframe-1-${id}`);
  });

  submit({ htmls, shapeID: id });
}

/**
 * Waits for a condition to be true, checking periodically, with a timeout.
 * @param conditionFunction A function that returns a boolean indicating the condition status.
 * @param interval The interval in milliseconds to check the condition.
 * @param timeout The maximum time in milliseconds to wait for the condition to be true.
 * @returns A promise that resolves to true if the condition is met within the timeout, otherwise false.
 */
async function waitFor(
  conditionFunction: () => boolean,
  interval: number = 20,
  timeout: number = 1000
): Promise<boolean> {
  const startTime = Date.now();

  return new Promise((resolve) => {
    const checkCondition = () => {
      if (conditionFunction()) {
        resolve(true);
      } else if (Date.now() - startTime > timeout) {
        resolve(false);
      } else {
        setTimeout(checkCondition, interval);
      }
    };

    checkCondition();
  });
}

function getPointUnder(box: Box) {
  return { x: box.midX - 640 / 2, y: box.maxY + 20 };
}

function submit({ htmls, shapeID }: { htmls: string[]; shapeID: string }) {
  const settings = getDefaultStore().get(settingsStringAtom);
  const form = document.createElement("form");
  form.target = `iframe-1-${shapeID}`;
  form.method = "POST";
  form.action = "/api/breed";

  form.style.display = "none";

  const input = document.createElement("input");
  input.type = "hidden";
  input.name = "deps";
  input.value = JSON.stringify(htmls.map((h) => ({ html: h })));

  const input2 = document.createElement("input");
  input2.type = "hidden";
  input2.name = "settings";
  input2.value = settings;

  form.appendChild(input);
  form.appendChild(input2);
  document.body.appendChild(form);

  form.submit();
  document.body.removeChild(form);
}
