export type DoorSide =
  "left" |
  "right";

export type ScreenName =
  "title" |
  "intro" |
  "playing" |
  "won" |
  "lost";

export interface CameraDefinition {
  id: string;
  code: string;
  name: string;

  position: [
    number,
    number,
    number
  ];

  target: [
    number,
    number,
    number
  ];
}

export interface EnemyConfig {
  id: string;
  name: string;
  color: number;
  start: string;
  route: string[];
  side: DoorSide;
  interval: number;
  backtrack: number;
  ai: number[];
}

export interface RuntimeEnemy
  extends EnemyConfig {
  camera: string;
  routeIndex: number;
  nextMove: number;
  insideOffice: boolean;
  attackAt: number;
}

export interface NeegyGameAPI {
  getState(): Record<
    string,
    unknown
  >;

  showCamera(
    id: string
  ): void;

  setMonitor(
    open: boolean
  ): void;

  toggleDoor(
    side: DoorSide
  ): void;

  startNight(): void;
}

declare global {
  interface Window {
    NeegyGame:
      NeegyGameAPI;
  }
}
