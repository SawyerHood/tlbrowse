import { Button } from "@/components/ui/button";
import {
  Dialog,
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
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Settings as SettingsIcon } from "lucide-react";
import { Textarea } from "./ui/textarea";

export function Settings() {
  return (
    <Dialog>
      <DialogTrigger asChild={true}>
        <Button size="icon" variant="ghost">
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
            <Label htmlFor="key" className="text-xs">
              Open Router Key
            </Label>
            <Input id="key" value="Pedro Duarte" type="password" />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="model" className="text-xs">
              Model
            </Label>
            <Select name="model" defaultValue="haiku">
              <SelectTrigger>
                <SelectValue placeholder="Select a Model" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="haiku">Haiku</SelectItem>
                <SelectItem value="sonnet">Sonnet</SelectItem>
                <SelectItem value="opus">Opus</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="model" className="text-xs">
            Prompt
          </Label>
          <Textarea id="prompt" placeholder="Enter a prompt" />
        </div>
        <DialogFooter>
          <Button>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
