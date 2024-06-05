import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Info, Settings as SettingsIcon, TriangleAlert } from "lucide-react";
import { Textarea } from "./ui/textarea";
import { useAtom } from "jotai";
import { settingsAtom } from "@/state/settings";
import { Alert, AlertDescription, AlertTitle } from "./ui/alert";

export function Settings() {
  const [settings, setSettings] = useAtom(settingsAtom);
  return (
    <Dialog>
      <DialogTrigger asChild={true}>
        <Button size="icon" variant="ghost" title="Settings">
          <SettingsIcon />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Settings</DialogTitle>
          <DialogDescription>
            Make changes to settings that will be applied to generation.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="key" className="text-xs flex items-center gap-1">
              Open Router Key
              <a href="https://openrouter.ai/" target="_blank">
                <Info className="h-3 w-3" />
              </a>
            </Label>
            <Input
              id="key"
              value={settings.apiKey}
              onChange={(e) =>
                setSettings({ ...settings, apiKey: e.target.value })
              }
              type="password"
            />
          </div>
          <hr />
          <div className="flex flex-col gap-2">
            <Label htmlFor="model" className="text-xs">
              Model
            </Label>
            <Select
              name="model"
              value={settings.model}
              onValueChange={(value) =>
                setSettings({ ...settings, model: value as any })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a Model" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="haiku">Haiku</SelectItem>
                <SelectItem value="sonnet">Sonnet</SelectItem>
                <SelectItem value="opus">Opus</SelectItem>
                <SelectItem value="gpt-4o">GPT-4o</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="model" className="text-xs">
            Prompt
          </Label>
          <Textarea
            id="prompt"
            placeholder="Make sure to specify that the return value should be a standalone html file."
            value={settings.prompt}
            onChange={(e) =>
              setSettings({ ...settings, prompt: e.target.value })
            }
          />
        </div>

        {!settings.apiKey && (
          <Alert variant="destructive">
            <TriangleAlert className="h-4 w-4" />
            <AlertDescription>
              You must provide an Open Router API key to change the model and
              prompt.
            </AlertDescription>
          </Alert>
        )}
        <DialogFooter>
          <DialogClose asChild>
            <Button>Close</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
