import { TLShapeId } from "tldraw";

export const makeShapeID = () => `shape: ${crypto.randomUUID()}` as TLShapeId;
