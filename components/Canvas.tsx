"use client";

import dynamic from "next/dynamic";
import { BrowserShapeUtil } from "@/components/BrowserShape";
import { useEditor } from "tldraw";
import { useEffect, useState } from "react";
import { BottomBar } from "@/components/BottomBar";
import { BrowserTool } from "@/tools/BrowserTool";
import { SignOutButton } from "@clerk/nextjs";
import { Button } from "./ui/button";
import { snapshot } from "@/lib/snapshot";
import { shouldUseAuth } from "@/lib/shouldUseAuth";
import { Settings } from "@/components/Settings";
import { PromptShapeTool } from "@/tools/PromptShapeTool";
import { breed } from "@/lib/breed";
import { ReloadIcon } from "@radix-ui/react-icons";

const Tldraw = dynamic(async () => (await import("tldraw")).Tldraw, {
  ssr: false,
});

const shapeUtils = [BrowserShapeUtil];

export function Canvas() {
  return (
    <div style={{ position: "fixed", inset: 0 }}>
      <Tldraw
        persistenceKey="tlweb"
        shapeUtils={shapeUtils}
        hideUi={false}
        tools={[BrowserTool, PromptShapeTool]}
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
      editor.store.loadSnapshot(snapshot);
    }
  }, [editor]);

  return (
    <>
      <div
        className="absolute top-1 right-1 flex gap-1"
        style={{ zIndex: 1000 }}
      >
        <Settings />
        <BreedButton />
        {shouldUseAuth && (
          <SignOutButton>
            <Button size="sm">Sign Out</Button>
          </SignOutButton>
        )}
      </div>
      <div
        className="absolute bottom-1 left-1/2 transform -translate-x-1/2"
        style={{ zIndex: 1000 }}
      >
        <BottomBar />
      </div>
    </>
  );
}

function BreedButton() {
  const editor = useEditor();
  const [isBreeding, setIsBreeding] = useState(false);
  return (
    <Button
      onClick={async () => {
        setIsBreeding(true);
        await breed(editor);
        setIsBreeding(false);
      }}
      disabled={isBreeding}
      size="sm"
    >
      {isBreeding ? <ReloadIcon className="h-4 w-4 animate-spin" /> : "Breed"}
    </Button>
  );
}
