"use client";

import dynamic from "next/dynamic";
import { PreviewShapeUtil } from "@/components/PreviewShape";
import { useEditor } from "tldraw";
import { useEffect } from "react";

const Tldraw = dynamic(async () => (await import("tldraw")).Tldraw, {
  ssr: false,
});

const shapeUtils = [PreviewShapeUtil];

export default function Home() {
  return (
    <div style={{ position: "fixed", inset: 0 }}>
      <Tldraw
        persistenceKey="tlweb"
        shapeUtils={shapeUtils}
        hideUi={false}
        components={{
          Toolbar: null,
          PageMenu: null,
          MainMenu: null,
          StylePanel: null,
          DebugPanel: null,
        }}
      >
        <UI />
      </Tldraw>
    </div>
  );
}

function UI() {
  const editor = useEditor();
  useEffect(() => {
    if (editor.getCurrentPageShapeIds().size === 0) {
      editor.createShape({
        type: "preview",
        props: {
          url: "",
        },
      });
    }
  }, [editor]);

  return null;
}

// function InsertPageButton() {
//   return (
//     <button
//       className="bg-blue-500 text-white font-bold py-2 px-4 rounded m-2 pointer-events-auto"
//       onClick={() =>
//         editor.createShape({
//           type: "preview",
//           props: {
//             url: "",
//             width: 100,
//             height: 100,
//           },
//         })
//       }
//     >
//       Insert Browser
//     </button>
//   );
// }
