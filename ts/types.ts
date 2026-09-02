export type ScreenName = "title" | "intro" | "playing" | "won" | "lost";
export type DoorSide = "left" | "right";
export type CameraZone = "vault" | "bank" | "entrance" | "hall" | "door";
export type EnemyBehavior = "wanderer" | "lurker" | "stalker" | "runner" | "corruptor";

export type CameraId =
  | "1a" | "1b" | "1c" | "1d"
  | "2a" | "2b" | "2c" | "2d" | "2e" | "2f"
  | "3a" | "3b" | "3d" | "3e"
  | "4e";

export interface PowerDrainRates {
  clock: number;
  cameras: number;
  lights: number;
  doors: number;
}

export interface CameraMapPosition {
  column: number;
  row: number;
}

export interface CameraConfig {
  id: CameraId;
  code: string;
  name: string;
  zone: CameraZone;
  mapPosition: CameraMapPosition;
  adjacent: CameraId[];
}

export interface MovementSystemConfig {
  aiRollSides: 20;
  usesWalkTransitions: boolean;
  usesReservedRoomSlots: boolean;
  farmerStartCamera: "2f";
  sharedSafeStartCamera: "1a";
  doorCameras: {
    left: "3e";
    right: "4e";
  };
}

export interface GameConfig {
  title: string;
  location: string;
  nightLengthSeconds: number;
  hourLabels: string[];
  powerDrainPerMinute: PowerDrainRates;
  movementSystem: MovementSystemConfig;
}

export interface EnemyConfig {
  id: string;
  name: string;
  behavior: EnemyBehavior;
  startCamera: CameraId;
  route: CameraId[];
  attackSide: DoorSide;
  movementInterval: number;
  backtrackChance: number;
  doorGraceSeconds: number;
  aiByNight: number[];
}

export interface RuntimeEnemy {
  id: string;
  name: string;
  behavior: EnemyBehavior;
  camera: CameraId;
  previousCamera: CameraId;
  route: CameraId[];
  routeIndex: number;
  nextMove: number;
  moveStartedAt: number;
  moveDuration: number;
  insideOffice: boolean;
  breaching: boolean;
  breachAt: number;
  attackAt: number;
  pressure: number;
  color: number;
}

export interface DoorState {
  left: boolean;
  right: boolean;
}

export interface LightState {
  left: boolean;
  right: boolean;
}

export interface GameState {
  screen: ScreenName;
  night: number;
  elapsed: number;
  power: number;
  powerOut: boolean;
  monitorUp: boolean;
  selectedCamera: CameraId;
  leftDoor: boolean;
  rightDoor: boolean;
  leftLight: boolean;
  rightLight: boolean;
  enemies: RuntimeEnemy[];
}
