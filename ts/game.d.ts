export type DoorSide = "left" | "right";
export type ScreenName = "title" | "intro" | "playing" | "won" | "lost";
export type CameraId =
  | "1a" | "1b" | "1c" | "1d"
  | "2a" | "2b" | "2c" | "2d" | "2e" | "2f"
  | "3a" | "3b" | "3d" | "3e"
  | "4e";

export interface CameraDefinition {
  id: CameraId;
  code: string;
  name: string;
  position: [number, number, number];
  target: [number, number, number];
}

export interface EnemyConfig {
  id: string;
  name: string;
  color: number;
  start: CameraId;
  route: CameraId[];
  side: DoorSide;
  interval: number;
  backtrack: number;
  ai: number[];
}

export interface RuntimeEnemy extends EnemyConfig {
  camera: CameraId;
  routeIndex: number;
  nextMove: number;
  insideOffice: boolean;
  attackAt: number;
}

export interface NeegyGameAPI {
  getState(): GameStateSnapshot;
  showCamera(id: CameraId): void;
  setMonitor(open: boolean): void;
  toggleDoor(side: DoorSide): void;
  startNight(night?: number): void;
}

export interface GameStateSnapshot {
  screen: ScreenName;
  night: number;
  unlockedNight: number;
  power: number;
  elapsed: number;
  powerOut: boolean;
  monitorUp: boolean;
  selectedCamera: CameraId;
  leftDoor: boolean;
  rightDoor: boolean;
  enemies: RuntimeEnemy[];
  [key: string]: unknown;
}

export interface NeegyCameraAPI {
  definitions: CameraDefinition[];
  create(): {
    scene: unknown;
    camera: unknown;
    cameras: CameraDefinition[];
    show(id: CameraId): boolean;
    update(delta: number, elapsed: number, enemies: Array<Pick<RuntimeEnemy, "id" | "camera" | "color" | "insideOffice">>): void;
    setDoorState(side: DoorSide, closed: boolean): void;
    getCurrent(): CameraDefinition;
  };
}

declare global {
  interface Window {
    NeegyGame: NeegyGameAPI;
    NeegyCameras: NeegyCameraAPI;
  }
}
