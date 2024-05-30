import { Hand, MousePointer2, PanelTop } from "lucide-react";
import { Card } from "./ui/card";
import { ToggleGroupItem, ToggleGroup } from "./ui/toggle-group";
import { useEditor, useValue } from "tldraw";

export function BottomBar() {
  const editor = useEditor();

  const selectedTool = useValue("tool", () => editor.getCurrentToolId(), [
    editor,
  ]);

  return (
    <Card className="p-1">
      <ToggleGroup
        type="single"
        size="sm"
        onValueChange={(v) => {
          editor.setCurrentTool(v);
        }}
        value={selectedTool}
      >
        <ToggleGroupItem value="select" aria-label="Select">
          <MousePointer2 className="h-4 w-4" />
        </ToggleGroupItem>
        <ToggleGroupItem value="hand" aria-label="hand">
          <Hand className="h-4 w-4" />
        </ToggleGroupItem>
        <ToggleGroupItem value="browser" aria-label="browser">
          <PanelTop className="h-4 w-4" />
        </ToggleGroupItem>
      </ToggleGroup>
    </Card>
  );
}
