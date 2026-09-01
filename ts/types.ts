export type ScreenName =
    | "menu"
    | "nights"
    | "office"
    | "result";


export type CameraZone =
    | "bank"
    | "hall"
    | "office";


export type AttackSide =
    | "left"
    | "right";


export interface PowerDrainRates {
    clock: number;
    cameras: number;
    lights: number;
    doors: number;
}


export interface GameConfig {
    title: string;
    location: string;
    nightLengthSeconds: number;
    hourLabels: string[];
    powerDrainPerMinute: PowerDrainRates;
}


export interface Camera {
    id: string;
    code: string;
    name: string;
    zone: CameraZone;
}


export interface Enemy {
    id: string;
    name: string;
    role: string;

    startCamera: string;
    route: string[];

    attackSide: AttackSide;
    mechanic: string;
}


export interface EnemyState {
    enemyId: string;

    routeIndex: number;
    currentCamera: string;

    movementTimer: number;
    attackTimer: number;

    active: boolean;
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
    currentNight: number;
    elapsedSeconds: number;
    power: number;

    camerasOpen: boolean;
    currentCamera: string;

    doors: DoorState;
    lights: LightState;

    enemies: EnemyState[];

    gameOver: boolean;
    nightComplete: boolean;
}
