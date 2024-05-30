"use client";

import dynamic from "next/dynamic";
import { BrowserShapeUtil } from "@/components/BrowserShape";
import { useEditor } from "tldraw";
import { useEffect } from "react";
import { BottomBar } from "@/components/BottomBar";
import { BrowserTool } from "@/tools/BrowserTool";

const Tldraw = dynamic(async () => (await import("tldraw")).Tldraw, {
  ssr: false,
});

const shapeUtils = [BrowserShapeUtil];

export default function Home() {
  return (
    <div style={{ position: "fixed", inset: 0 }}>
      <Tldraw
        persistenceKey="tlweb"
        shapeUtils={shapeUtils}
        hideUi={false}
        tools={[BrowserTool]}
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
        type: "browser",
        props: {
          url: "",
        },
      });
    }
  }, [editor]);

  return (
    <>
      <div
        className="absolute bottom-1 left-1/2 transform -translate-x-1/2"
        style={{ zIndex: 1000 }}
      >
        <BottomBar />
      </div>
    </>
  );
}
