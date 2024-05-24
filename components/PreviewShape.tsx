/* eslint-disable react-hooks/rules-of-hooks */
import { ReactElement, useEffect, useRef, useState } from "react";
import {
  BaseBoxShapeUtil,
  HTMLContainer,
  SvgExportContext,
  TLArrowShapeProps,
  TLBaseShape,
  TLShape,
  TLShapeId,
  Vec,
  toDomPrecision,
  useIsEditing,
  useValue,
} from "tldraw";

export type PreviewShape = TLBaseShape<
  "preview",
  {
    url: string;
    w: number;
    h: number;
    dateCreated?: number;
    html?: string;
  }
>;

export class PreviewShapeUtil extends BaseBoxShapeUtil<PreviewShape> {
  static override type = "preview" as const;

  getDefaultProps(): PreviewShape["props"] {
    return {
      url: "",
      w: (960 * 2) / 3,
      h: (540 * 2) / 3,
      dateCreated: Date.now(),
    };
  }

  override canEdit = () => true;
  override isAspectRatioLocked = (_shape: PreviewShape) => false;
  override canResize = (_shape: PreviewShape) => true;
  override canBind = (_shape: PreviewShape) => true;

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
    const centerX = root.x + (root.props as PreviewShape["props"]).w / 2;

    const spacingX = 100; // Define the spacing between shapes
    const spacingY = 200; // Define the spacing between shapes

    const startY = root.y;

    layers.forEach((layer, depth) => {
      const totalWidth = layer.reduce(
        (sum, shape) => sum + (shape.props as PreviewShape["props"]).w,
        0
      );
      const totalSpacing = (layer.length - 1) * spacingX;
      const startX = centerX - (totalWidth + totalSpacing) / 2;

      let currentX = startX;
      layer.forEach((shape) => {
        this.editor.updateShape({
          id: shape.id,
          type: "preview",
          x: currentX,
          y:
            startY +
            depth * ((shape.props as PreviewShape["props"]).h + spacingY),
        });

        currentX += (shape.props as PreviewShape["props"]).w + spacingX;
      });
    });
  }

  override component(shape: PreviewShape) {
    const isEditing = useIsEditing(shape.id);
    const ref = useRef<HTMLIFrameElement>(null);
    const [isLoading, setIsLoading] = useState(!!shape.props.url);

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
            type: "preview",
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

    const depsParams = useValue(
      "deps",
      () => {
        const ancestors = this.getAncestors(shape.id);
        let deps = ancestors.map((s) => {
          return {
            url: (s.props as PreviewShape["props"]).url,
            html: (s.props as PreviewShape["props"]).html,
          };
        });
        deps = deps[deps.length - 2] ? [deps[deps.length - 2]] : [];
        const param = encodeURIComponent(JSON.stringify(deps));
        console.log(param);
        console.log(JSON.parse(decodeURIComponent(param)));
        return param;
      },
      [shape.id]
    );

    const { url } = shape.props;

    return (
      <HTMLContainer
        className="tl-embed-container flex flex-col rounded"
        id={shape.id}
        style={{
          boxShadow,
          border: "1px solid var(--color-panel-contrast)",
        }}
      >
        {isLoading && <LoadingBar />}
        <form
          className="flex items-center p-2 bg-gray-100 border-b border-gray-300 w-full"
          onSubmit={(e) => {
            e.preventDefault();
            const newUrl = (e.target as HTMLFormElement).url.value;
            setIsLoading(true);
            this.editor.updateShape({
              id: shape.id,
              type: "preview",
              props: { ...shape.props, url: newUrl, html: undefined },
            });
          }}
        >
          <span className="text-gray-600 text-sm">URL:</span>
          <input
            name="url"
            type="text"
            className="flex-1 ml-2 p-1 text-gray-800 text-sm border-none bg-white"
            defaultValue={url}
          />
        </form>
        <iframe
          id={`iframe-1-${shape.id}`}
          onLoad={(e) => {
            const iframe = e.target as HTMLIFrameElement;
            const html = iframe.contentDocument?.documentElement.outerHTML;
            if (html === `<html><head></head><body></body></html>`) {
              return;
            }
            this.editor.updateShape({
              id: shape.id,
              type: "preview",
              props: { ...shape.props, html },
            });
            setIsLoading(false);
          }}
          src={
            url && !shape.props.html
              ? `/api/html?url=${encodeURIComponent(url)}&deps=${depsParams}`
              : ""
          }
          srcDoc={shape.props.html ?? undefined}
          width={toDomPrecision(shape.props.w)}
          height={toDomPrecision(shape.props.h)}
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

  override toSvg(shape: PreviewShape, _ctx: SvgExportContext) {
    // while screenshot is the same as the old one, keep waiting for a new one
    return new Promise<ReactElement>((resolve, reject) => {
      if (window === undefined) {
        reject();
        return;
      }

      const windowListener = (event: MessageEvent) => {
        if (event.data.screenshot && event.data?.shapeid === shape.id) {
          // const image = document.createElementNS('http://www.w3.org/2000/svg', 'image')
          // image.setAttributeNS('http://www.w3.org/1999/xlink', 'href', event.data.screenshot)
          // image.setAttribute('width', shape.props.w.toString())
          // image.setAttribute('height', shape.props.h.toString())
          // g.appendChild(image)
          window.removeEventListener("message", windowListener);
          clearTimeout(timeOut);

          resolve(<PreviewImage href={event.data.screenshot} shape={shape} />);
        }
      };
      const timeOut = setTimeout(() => {
        reject();
        window.removeEventListener("message", windowListener);
      }, 2000);
      window.addEventListener("message", windowListener);
      //request new screenshot
      const firstLevelIframe = document.getElementById(
        `iframe-1-${shape.id}`
      ) as HTMLIFrameElement;
      if (firstLevelIframe) {
        firstLevelIframe.contentWindow!.postMessage(
          { action: "take-screenshot", shapeid: shape.id },
          "*"
        );
      } else {
        console.log("first level iframe not found or not accessible");
      }
    });
  }

  indicator(shape: PreviewShape) {
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

function PreviewImage({ shape, href }: { shape: PreviewShape; href: string }) {
  return (
    <image
      href={href}
      width={shape.props.w.toString()}
      height={shape.props.h.toString()}
    />
  );
}

function LoadingBar() {
  return <div className="w-full h-2 bg-blue-600 animate-pulse" />;
}
