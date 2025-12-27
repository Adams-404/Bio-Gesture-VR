export interface Atom {
  id: number;
  name: string;
  element: string;
  residue: string;
  resSeq: number;
  x: number;
  y: number;
  z: number;
}

export interface MoleculeData {
  atoms: Atom[];
  center: { x: number; y: number; z: number };
}

export enum GestureType {
  NONE = 'NONE',
  GRIP = 'GRIP', // Rotate
  PINCH_ZOOM = 'PINCH_ZOOM', // Scale
  POINT = 'POINT' // Inspect
}

export interface GestureState {
  type: GestureType;
  rotationDelta: { x: number; y: number };
  scaleFactor: number; // 1.0 is neutral
  pointerPosition: { x: number; y: number }; // Normalized -1 to 1
  handPresent: boolean;
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
  isError?: boolean;
}
