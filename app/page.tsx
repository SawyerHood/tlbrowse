"use client";

import dynamic from "next/dynamic";
// import "tldraw/tldraw.css";
import { PreviewShapeUtil } from "@/components/PreviewShape";
import { useEditor } from "tldraw";
// import { Tldraw } from "tldraw";

const Tldraw = dynamic(async () => (await import("tldraw")).Tldraw, {
  ssr: false,
});

const shapeUtils = [PreviewShapeUtil];

export default function Home() {
  return (
    <div style={{ position: "fixed", inset: 0 }}>
      <Tldraw
        persistenceKey="wow"
        shapeUtils={shapeUtils}
        components={{
          SharePanel: () => <InsertPageButton />,
        }}
      ></Tldraw>
    </div>
  );
}

function InsertPageButton() {
  const editor = useEditor();
  return (
    <button
      className="bg-blue-500 text-white font-bold py-2 px-4 rounded m-2 pointer-events-auto"
      onClick={() =>
        editor.createShape({
          type: "preview",
          props: {
            url: "",
            width: 100,
            height: 100,
          },
        })
      }
    >
      Insert Browser
    </button>
  );
}
