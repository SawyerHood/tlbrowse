/* eslint-disable react-hooks/rules-of-hooks */
import { useEffect, useRef, useState } from "react";
import {
  BaseBoxShapeUtil,
  HTMLContainer,
  TLArrowShapeProps,
  TLBaseShape,
  TLShape,
  TLShapeId,
  Vec,
  toDomPrecision,
  useIsEditing,
  useValue,
} from "tldraw";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Play, RefreshCw, RotateCw } from "lucide-react";

export type BrowserShape = TLBaseShape<
  "browser",
  {
    url: string;
    w: number;
    h: number;
    dateCreated?: number;
    html?: string;
  }
>;

export class BrowserShapeUtil extends BaseBoxShapeUtil<BrowserShape> {
  static override type = "browser" as const;

  getDefaultProps(): BrowserShape["props"] {
    return {
      url: "",
      w: (960 * 2) / 3,
      h: (540 * 2) / 3,
      dateCreated: Date.now(),
    };
  }

  override canEdit = () => true;
  override isAspectRatioLocked = (_shape: BrowserShape) => false;
  override canResize = (_shape: BrowserShape) => true;
  override canBind = (_shape: BrowserShape) => true;

  getRootShapeId(shapeId: TLShapeId): TLShapeId {
    const parentArrow = this.editor
      .getArrowsBoundTo(shapeId)
      .find((a) => a.handleId === "end");
    if (!parentArrow) {
      return shapeId;
    }
    const parentArrowShape = this.editor.getShape(parentArrow.arrowId);

    const start = (parentArrowShape?.props as TLArrowShapeProps).start;
    if (start.type === "binding") {
      return this.getRootShapeId(start.boundShapeId);
    }
    return shapeId;
  }

  getAncestors(shapeId: TLShapeId): TLShape[] {
    const shape = this.editor.getShape(shapeId);
    if (!shape) {
      return [];
    }

    const parentArrow = this.editor
      .getArrowsBoundTo(shapeId)
      .find((a) => a.handleId === "end");

    if (!parentArrow) {
      return [shape];
    }

    const parentArrowShape = this.editor.getShape(parentArrow.arrowId);

    const start = (parentArrowShape?.props as TLArrowShapeProps).start;
    if (start.type === "binding") {
      return this.getAncestors(start.boundShapeId).concat([shape]);
    }
    return [shape];
  }

  layoutTree(shapeId: TLShapeId) {
    const rootShapeId = this.getRootShapeId(shapeId);
    const toProcess = [{ id: rootShapeId, depth: 0 }];
    const layers: TLShape[][] = [];

    while (toProcess.length) {
      const { id, depth } = toProcess.shift()!;
      const shape = this.editor.getShape(id);
      if (shape) {
        layers[depth] = layers[depth] || [];
        layers[depth].push(shape);
        const arrowIds = this.editor
          .getArrowsBoundTo(id)
          .filter((a) => a.handleId === "start")
          .map((a) => a.arrowId);

        const arrows = arrowIds.map((id) => this.editor.getShape(id));
        for (const arrow of arrows) {
          if (arrow?.type === "arrow") {
            const end = (arrow.props as TLArrowShapeProps).end;
            if (end.type === "binding") {
              const endShape = this.editor.getShape(end.boundShapeId);
              if (endShape) {
                toProcess.push({ id: endShape.id, depth: depth + 1 });
              }
            }
          }
        }
      }
    }

    const root = layers[0][0];
    const centerX = root.x + (root.props as BrowserShape["props"]).w / 2;

    const spacingX = 100; // Define the spacing between shapes
    const spacingY = 200; // Define the spacing between shapes

    const startY = root.y;

    layers.forEach((layer, depth) => {
      const totalWidth = layer.reduce(
        (sum, shape) => sum + (shape.props as BrowserShape["props"]).w,
        0
      );
      const totalSpacing = (layer.length - 1) * spacingX;
      const startX = centerX - (totalWidth + totalSpacing) / 2;

      let currentX = startX;
      layer.forEach((shape) => {
        this.editor.updateShape({
          id: shape.id,
          type: "browser",
          x: currentX,
          y:
            startY +
            depth * ((shape.props as BrowserShape["props"]).h + spacingY),
        });

        currentX += (shape.props as BrowserShape["props"]).w + spacingX;
      });
    });
  }

  override component(shape: BrowserShape) {
    const isEditing = useIsEditing(shape.id);
    const ref = useRef<HTMLIFrameElement>(null);
    const [isLoading, setIsLoading] = useState(false);
    const formRef = useRef<HTMLFormElement>(null);

    useEffect(() => {
      if (shape.props.url && !shape.props.html && !isLoading) {
        formRef.current?.submit();
        setIsLoading(true);
        const newUrl = formRef.current?.url.value;
        this.editor.updateShape({
          id: shape.id,
          type: "browser",
          props: { ...shape.props, url: newUrl, html: null },
        });
      }
    }, [shape.props, shape.id, isLoading]);

    useEffect(() => {
      const iframe = ref.current;
      const onMessage = (event: MessageEvent) => {
        if (event.source !== iframe?.contentWindow) {
          return;
        }
        if (event.data.type === "linkClick") {
          const { href } = event.data;

          const newX = shape.x;
          const newY = shape.y + shape.props.h + 100;
          const newId = `shape: ${crypto.randomUUID()}` as TLShapeId;
          this.editor.createShape({
            id: newId,
            type: "browser",
            x: newX,
            y: newY,
            props: {
              url: href,
              w: shape.props.w,
              h: shape.props.h,
            },
          });

          this.editor.createShape({
            type: "arrow",
            props: {
              start: {
                type: "binding",
                boundShapeId: shape.id,
                normalizedAnchor: { x: 0.5, y: 1 },
                isExact: false,
                isPrecise: false,
              },
              end: {
                type: "binding",
                boundShapeId: newId,
                normalizedAnchor: { x: 0.5, y: 0 },
                isExact: false,
                isPrecise: false,
              },
            },
          });

          this.layoutTree(shape.id);
        }
      };
      window.addEventListener("message", onMessage);

      return () => {
        window.removeEventListener("message", onMessage);
      };
    }, [
      shape.id,
      shape.props.h,
      shape.props.url,
      shape.props.w,
      shape.x,
      shape.y,
    ]);

    const boxShadow = useValue(
      "box shadow",
      () => {
        const rotation = this.editor.getShapePageTransform(shape)!.rotation();
        return getRotatedBoxShadow(rotation);
      },
      [this.editor]
    );

    // The deps are in top to bottom order
    const depsParams = useValue(
      "deps",
      () => {
        const ancestors = this.getAncestors(shape.id);
        const deps = ancestors.map((s) => {
          return {
            url: (s.props as BrowserShape["props"]).url,
            html: (s.props as BrowserShape["props"]).html,
          };
        });
        const param = JSON.stringify(deps);
        return param;
      },
      [shape.id]
    );

    const { url } = shape.props;

    return (
      <HTMLContainer
        className="tl-embed-container flex flex-col border"
        id={shape.id}
        style={{
          boxShadow,
          width: toDomPrecision(shape.props.w),
          height: toDomPrecision(shape.props.h),
        }}
      >
        {isLoading && <LoadingBar />}
        <form
          method="POST"
          ref={formRef}
          action="/api/html"
          target={`iframe-1-${shape.id}`}
          className="flex items-center p-2 w-full gap-2 bg-background border-b"
          onSubmit={(e) => {
            e.preventDefault();
            const newUrl = formRef.current?.url.value;
            this.editor.updateShape({
              id: shape.id,
              type: "browser",
              props: { ...shape.props, url: newUrl, html: null },
            });
          }}
        >
          <Button
            type="submit"
            variant="ghost"
            size="icon"
            onMouseDown={() => {
              const newUrl = formRef.current?.url.value;
              this.editor.updateShape({
                id: shape.id,
                type: "browser",
                props: { ...shape.props, url: newUrl, html: null },
              });
            }}
          >
            <RotateCw />
          </Button>
          <Input
            name="url"
            type="text"
            defaultValue={url}
            placeholder="Enter a url to explore the imagined web"
          />
          <input type="hidden" name="deps" value={depsParams} />
          <Button
            type="submit"
            variant="ghost"
            size="icon"
            onMouseDown={() => {
              const newUrl = formRef.current?.url.value;
              this.editor.updateShape({
                id: shape.id,
                type: "browser",
                props: { ...shape.props, url: newUrl, html: null },
              });
            }}
          >
            <Play />
          </Button>
        </form>
        <iframe
          name={`iframe-1-${shape.id}`}
          id={`iframe-1-${shape.id}`}
          onLoad={(e) => {
            const iframe = e.target as HTMLIFrameElement;
            const html = iframe.contentDocument?.documentElement.outerHTML;
            if (html === `<html><head></head><body></body></html>`) {
              return;
            }
            this.editor.updateShape({
              id: shape.id,
              type: "browser",
              props: { ...shape.props, html },
            });
            setIsLoading(false);
          }}
          srcDoc={shape.props.html ?? undefined}
          width="100%"
          height="100%"
          draggable={false}
          style={{
            pointerEvents: isEditing ? "auto" : "none",
            backgroundColor: "var(--color-panel)",
          }}
          ref={ref}
        />

        <div
          style={{
            textAlign: "center",
            position: "absolute",
            bottom: isEditing ? -40 : 0,
            padding: 4,
            fontFamily: "inherit",
            fontSize: 12,
            left: 0,
            width: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            pointerEvents: "none",
          }}
        >
          <span
            style={{
              background: "var(--color-panel)",
              padding: "4px 12px",
              borderRadius: 99,
              border: "1px solid var(--color-muted-1)",
            }}
          >
            {isEditing
              ? "Click the canvas to exit"
              : "Double click to interact"}
          </span>
        </div>
      </HTMLContainer>
    );
  }

  indicator(shape: BrowserShape) {
    return <rect width={shape.props.w} height={shape.props.h} />;
  }
}

// todo: export these from tldraw

const ROTATING_BOX_SHADOWS = [
  {
    offsetX: 0,
    offsetY: 2,
    blur: 4,
    spread: -1,
    color: "#0000003a",
  },
  {
    offsetX: 0,
    offsetY: 3,
    blur: 12,
    spread: -2,
    color: "#0000001f",
  },
];

function getRotatedBoxShadow(rotation: number) {
  const cssStrings = ROTATING_BOX_SHADOWS.map((shadow) => {
    const { offsetX, offsetY, blur, spread, color } = shadow;
    const vec = new Vec(offsetX, offsetY);
    const { x, y } = vec.rot(-rotation);
    return `${x}px ${y}px ${blur}px ${spread}px ${color}`;
  });
  return cssStrings.join(", ");
}

function LoadingBar() {
  return <div className="w-full h-2 bg-blue-600 animate-pulse" />;
}
