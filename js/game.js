"use strict";


/* ========================================================
   CANVAS SETUP
   ======================================================== */

const WIDTH = 1280;
const HEIGHT = 720;
const ASPECT = WIDTH / HEIGHT;


const gameShell =
    document.querySelector("#gameShell");

const sceneCanvas =
    document.querySelector("#sceneCanvas");

const uiCanvas =
    document.querySelector("#uiCanvas");


const scene =
    sceneCanvas.getContext("2d");

const ui =
    uiCanvas.getContext("2d");


scene.imageSmoothingEnabled = false;
ui.imageSmoothingEnabled = false;


/* ========================================================
   DOM
   ======================================================== */

const audioPermission =
    document.querySelector("#audioPermission");

const allowAudioButton =
    document.querySelector("#allowAudioButton");

const fullscreenDialog =
    document.querySelector("#fullscreenDialog");

const enterFullscreenButton =
    document.querySelector("#enterFullscreenButton");

const closeFullscreenButton =
    document.querySelector("#closeFullscreenButton");


/* ========================================================
   DATA
   ======================================================== */

let gameData = null;
let cameraData = [];
let enemyData = [];


const fallbackGameData = {
    nightLengthSeconds: 360,

    hourLabels: [
        "12 AM",
        "1 AM",
        "2 AM",
        "3 AM",
        "4 AM",
        "5 AM",
        "6 AM"
    ],

    powerDrainPerMinute: {
        clock: 1,
        cameras: 2.5,
        lights: 2,
        doors: 4
    },

    hourBoosts: []
};


const fallbackCameras = [
    ["1a", "1A", "Bank Safe"],
    ["1b", "1B", "Teller Room 1"],
    ["1c", "1C", "Main Entrance"],
    ["1d", "1D", "Main Room"],

    ["2a", "2A", "Teller Room 2"],
    ["2b", "2B", "Men's Bathroom"],
    ["2c", "2C", "Women's Bathroom"],
    ["2d", "2D", "Main Desk"],

    ["3a", "3A", "Teller Room 3"],
    ["3b", "3B", "Stock Market Room"],
    ["3d", "3D", "Teller Room 4"],

    ["1e", "1E", "Left Hallway"],
    ["2e", "2E", "Right Hallway"],
    ["3e", "3E", "Left Door"],
    ["4e", "4E", "Right Door"],

    ["1f", "1F", "Office"],
    ["2f", "2F", "Teller Room 5"]
].map(([id, code, name]) => ({
    id,
    code,
    name
}));


const fallbackEnemies = [
    {
        id: "regular",
        name: "Regular Neegy",
        behavior: "wanderer",

        startCamera: "1a",

        route: [
            "1a",
            "1d",
            "2d",
            "1e",
            "3e"
        ],

        attackSide: "left",

        movementInterval: 4.9,
        backtrackChance: 0.2,
        doorGraceSeconds: 6,

        aiByNight: [
            3,
            5,
            7,
            10,
            12,
            15,
            20
        ]
    },

    {
        id: "girl",
        name: "Girl Neegy",
        behavior: "wanderer",

        startCamera: "1a",

        route: [
            "1a",
            "1b",
            "3a",
            "2e",
            "4e"
        ],

        attackSide: "right",

        movementInterval: 5,
        backtrackChance: 0.3,
        doorGraceSeconds: 7,

        aiByNight: [
            1,
            3,
            5,
            8,
            11,
            14,
            20
        ]
    },

    {
        id: "rapper",
        name: "Rapper Neegy",
        behavior: "stalker",

        startCamera: "1a",

        route: [
            "1a",
            "1c",
            "1d",
            "2d",
            "2e",
            "4e"
        ],

        attackSide: "right",

        movementInterval: 3.1,
        backtrackChance: 0,
        doorGraceSeconds: 0,

        aiByNight: [
            0,
            0,
            2,
            4,
            7,
            10,
            20
        ]
    },

    {
        id: "farmer",
        name: "Farmer Neegy",
        behavior: "runner",

        startCamera: "2f",

        route: [
            "2f",
            "1e",
            "3e"
        ],

        attackSide: "left",

        movementInterval: 5.1,
        backtrackChance: 0,
        doorGraceSeconds: 0,

        aiByNight: [
            1,
            2,
            4,
            6,
            9,
            12,
            20
        ]
    },

    {
        id: "banana",
        name: "Banana Neegy",
        behavior: "corruptor",

        startCamera: "3b",

        route: [
            "3b",
            "3d",
            "2d",
            "2e",
            "4e"
        ],

        attackSide: "right",

        movementInterval: 5.4,
        backtrackChance: 0.15,
        doorGraceSeconds: 5,

        aiByNight: [
            0,
            0,
            0,
            3,
            6,
            10,
            20
        ]
    }
];


/* ========================================================
   OPTIONAL IMAGE ASSETS
   ======================================================== */

/*
Add your own original images using these names:

assets/img/ui/title.jpg
assets/img/office/normal.jpg
assets/img/office/left-light.jpg
assets/img/office/right-light.jpg

assets/img/cameras/1a.jpg
assets/img/cameras/1b.jpg
etc.

The engine still works without them.
*/

const assets = {
    title: null,
    office: null,
    leftLight: null,
    rightLight: null,
    cameras: {}
};


async function loadImage(path) {
    return new Promise((resolve) => {
        const image =
            new Image();

        image.onload =
            () => resolve(image);

        image.onerror =
            () => resolve(null);

        image.src =
            path;
    });
}


async function loadAssets() {
    const jobs = [
        loadImage(
            "assets/img/ui/title.jpg"
        ).then((image) => {
            assets.title = image;
        }),

        loadImage(
            "assets/img/office/normal.jpg"
        ).then((image) => {
            assets.office = image;
        }),

        loadImage(
            "assets/img/office/left-light.jpg"
        ).then((image) => {
            assets.leftLight = image;
        }),

        loadImage(
            "assets/img/office/right-light.jpg"
        ).then((image) => {
            assets.rightLight = image;
        })
    ];

    cameraData.forEach((camera) => {
        jobs.push(
            loadImage(
                `assets/img/cameras/${camera.id}.jpg`
            ).then((image) => {
                assets.cameras[camera.id] =
                    image;
            })
        );
    });

    await Promise.all(jobs);
}


/* ========================================================
   GAME STATE
   ======================================================== */

const state = {
    screen: "loading",

    night: 1,
    unlockedNight: Number(
        localStorage.getItem(
            "neegysUnlockedNight"
        ) || "1"
    ),

    menuIndex: 0,

    running: false,
    powerOut: false,

    nightStart: 0,
    elapsed: 0,

    power: 100,

    officePan: 192,
    officeTargetPan: 192,

    leftDoor: false,
    rightDoor: false,

    leftDoorVisual: 0,
    rightDoorVisual: 0,

    leftLight: false,
    rightLight: false,

    cameraUp: false,
    monitorAnimation: 0,

    selectedCamera: "1a",

    cameraJamUntil: 0,

    blackoutAttackAt: 0,

    jumpscareEnemy: null,
    jumpscareStartedAt: 0,

    message: "",

    audioEnabled: false
};


const pointer = {
    x: WIDTH / 2,
    y: HEIGHT / 2,

    down: false,
    pressed: false,
    released: false
};


let enemies = [];
let lastFrame = performance.now();


/* ========================================================
   AUDIO
   ======================================================== */

let audioContext = null;


function enableAudio() {
    if (!audioContext) {
        const AudioContextClass =
            window.AudioContext ||
            window.webkitAudioContext;

        if (AudioContextClass) {
            audioContext =
                new AudioContextClass();
        }
    }

    if (
        audioContext &&
        audioContext.state ===
            "suspended"
    ) {
        audioContext.resume();
    }

    state.audioEnabled = true;

    audioPermission.classList.add(
        "hidden"
    );
}


function playTone(
    frequency,
    duration = 0.08,
    volume = 0.04,
    type = "square"
) {
    if (
        !state.audioEnabled ||
        !audioContext
    ) {
        return;
    }

    const oscillator =
        audioContext.createOscillator();

    const gain =
        audioContext.createGain();

    oscillator.frequency.value =
        frequency;

    oscillator.type =
        type;

    gain.gain.setValueAtTime(
        volume,
        audioContext.currentTime
    );

    gain.gain.exponentialRampToValueAtTime(
        0.0001,
        audioContext.currentTime +
            duration
    );

    oscillator.connect(gain);
    gain.connect(audioContext.destination);

    oscillator.start();
    oscillator.stop(
        audioContext.currentTime +
        duration
    );
}


function playStaticBurst(
    duration = 0.12,
    volume = 0.04
) {
    if (
        !state.audioEnabled ||
        !audioContext
    ) {
        return;
    }

    const sampleCount =
        Math.floor(
            audioContext.sampleRate *
            duration
        );

    const buffer =
        audioContext.createBuffer(
            1,
            sampleCount,
            audioContext.sampleRate
        );

    const channel =
        buffer.getChannelData(0);

    for (
        let index = 0;
        index < sampleCount;
        index++
    ) {
        channel[index] =
            Math.random() * 2 - 1;
    }

    const source =
        audioContext.createBufferSource();

    const gain =
        audioContext.createGain();

    source.buffer =
        buffer;

    gain.gain.value =
        volume;

    source.connect(gain);
    gain.connect(audioContext.destination);

    source.start();
}


/* ========================================================
   RESIZING AND FULLSCREEN
   ======================================================== */

function resizeGame() {
    const scale =
        Math.min(
            window.innerWidth / WIDTH,
            window.innerHeight / HEIGHT
        );

    gameShell.style.transform =
        `translate(-50%, -50%) scale(${scale})`;
}


async function enterFullscreen() {
    try {
        await document.documentElement
            .requestFullscreen();

        fullscreenDialog.classList.add(
            "hidden"
        );
    } catch (error) {
        console.warn(
            "Fullscreen is unavailable.",
            error
        );
    }
}


/* ========================================================
   POINTER CONVERSION
   ======================================================== */

function updatePointer(event) {
    const bounds =
        gameShell.getBoundingClientRect();

    pointer.x =
        (
            event.clientX -
            bounds.left
        ) /
        bounds.width *
        WIDTH;

    pointer.y =
        (
            event.clientY -
            bounds.top
        ) /
        bounds.height *
        HEIGHT;

    pointer.x =
        Math.max(
            0,
            Math.min(WIDTH, pointer.x)
        );

    pointer.y =
        Math.max(
            0,
            Math.min(HEIGHT, pointer.y)
        );
}


function inside(
    x,
    y,
    width,
    height
) {
    return (
        pointer.x >= x &&
        pointer.x <= x + width &&
        pointer.y >= y &&
        pointer.y <= y + height
    );
}


/* ========================================================
   DATA LOADING
   ======================================================== */

async function loadJSON(
    path,
    fallback
) {
    try {
        const response =
            await fetch(path);

        if (!response.ok) {
            throw new Error(path);
        }

        return await response.json();
    } catch {
        return fallback;
    }
}


async function bootGame() {
    gameData =
        await loadJSON(
            "data/game.json",
            fallbackGameData
        );

    cameraData =
        await loadJSON(
            "data/cameras.json",
            fallbackCameras
        );

    enemyData =
        await loadJSON(
            "data/enemies.json",
            fallbackEnemies
        );

    await loadAssets();

    state.screen = "title";

    const touchDevice =
        matchMedia(
            "(pointer: coarse)"
        ).matches;

    if (touchDevice) {
        audioPermission.classList.remove(
            "hidden"
        );
    }
}


/* ========================================================
   ENEMY SYSTEM
   ======================================================== */

function createEnemies() {
    const now =
        performance.now();

    enemies =
        enemyData.map((enemy) => ({
            ...enemy,

            routeIndex: 0,

            nextMovement:
                now +
                enemy.movementInterval *
                    1000 +
                Math.random() * 2500,

            doorReachedAt: 0,

            insideOffice: false,
            insideOfficeAt: 0,

            runnerStage: 0,
            runnerHits: 0,
            runnerAttackAt: 0,

            corruption: 0
        }));
}


function enemyCamera(enemy) {
    return enemy.route[
        enemy.routeIndex
    ];
}


function currentHour() {
    const percentage =
        state.elapsed /
        gameData.nightLengthSeconds;

    return Math.min(
        6,
        Math.floor(
            percentage * 6
        )
    );
}


function enemyAI(enemy) {
    const nightIndex =
        Math.min(
            state.night - 1,
            enemy.aiByNight.length - 1
        );

    let ai =
        enemy.aiByNight[nightIndex];

    const boosts =
        gameData.hourBoosts || [];

    boosts.forEach((boost) => {
        if (
            currentHour() >= boost.hour &&
            boost.enemies.includes(enemy.id)
        ) {
            ai += boost.amount;
        }
    });

    return Math.min(ai, 20);
}


function successfulMovement(enemy) {
    const roll =
        Math.floor(
            Math.random() * 20
        ) + 1;

    return roll <= enemyAI(enemy);
}


function updateEnemies(now, delta) {
    enemies.forEach((enemy) => {
        if (enemy.insideOffice) {
            if (
                now -
                enemy.insideOfficeAt >=
                25000
            ) {
                startJumpscare(enemy);
            }

            return;
        }

        if (
            enemy.behavior ===
            "corruptor"
        ) {
            updateCorruptor(
                enemy,
                now,
                delta
            );
        }

        if (
            enemy.behavior ===
                "runner" &&
            enemy.runnerAttackAt > 0
        ) {
            resolveRunner(
                enemy,
                now
            );

            return;
        }

        if (
            now <
            enemy.nextMovement
        ) {
            return;
        }

        enemy.nextMovement =
            now +
            enemy.movementInterval *
                1000;

        if (
            enemy.behavior ===
            "runner"
        ) {
            updateRunner(enemy, now);

            return;
        }

        if (
            enemy.behavior ===
                "stalker" &&
            state.cameraUp
        ) {
            return;
        }

        if (
            !successfulMovement(enemy)
        ) {
            return;
        }

        advanceEnemy(enemy, now);
    });
}


function advanceEnemy(enemy, now) {
    const finalIndex =
        enemy.route.length - 1;

    if (
        enemy.routeIndex ===
        finalIndex
    ) {
        attemptOfficeEntry(
            enemy,
            now
        );

        return;
    }

    const canBacktrack =
        enemy.behavior ===
            "wanderer" ||
        enemy.behavior ===
            "corruptor";

    const backtrack =
        canBacktrack &&
        enemy.routeIndex > 0 &&
        Math.random() <
            enemy.backtrackChance;

    if (backtrack) {
        enemy.routeIndex--;
    } else {
        enemy.routeIndex++;
    }

    if (
        enemy.routeIndex ===
        finalIndex
    ) {
        enemy.doorReachedAt =
            now;

        state.message =
            `${enemy.name} reached the ${enemy.attackSide} side`;
    } else {
        state.message =
            "Movement detected";
    }
}


function attemptOfficeEntry(
    enemy,
    now
) {
    const closed =
        enemy.attackSide === "left"
            ? state.leftDoor
            : state.rightDoor;

    if (closed) {
        if (
            enemy.behavior ===
            "stalker"
        ) {
            state.message =
                "Something remains outside";

            return;
        }

        enemy.routeIndex =
            enemy.behavior ===
                "corruptor"
                ? 0
                : 1;

        enemy.doorReachedAt = 0;

        state.message =
            `${enemy.name} moved away`;

        return;
    }

    enemy.insideOffice = true;

    enemy.insideOfficeAt =
        now;

    state.message =
        "Something entered the office";
}


/* ========================================================
   FARMER
   ======================================================== */

function updateRunner(enemy, now) {
    if (state.cameraUp) {
        return;
    }

    if (!successfulMovement(enemy)) {
        return;
    }

    enemy.runnerStage++;

    state.message =
        "Movement near Teller Room 5";

    if (enemy.runnerStage < 3) {
        return;
    }

    enemy.routeIndex =
        enemy.route.length - 1;

    enemy.runnerAttackAt =
        now + 1400;

    state.message =
        "FAST FOOTSTEPS FROM THE LEFT";

    playTone(
        85,
        0.35,
        0.05,
        "sawtooth"
    );
}


function resolveRunner(enemy, now) {
    if (
        now <
        enemy.runnerAttackAt
    ) {
        return;
    }

    enemy.runnerAttackAt = 0;

    if (state.leftDoor) {
        const damage =
            1 +
            enemy.runnerHits * 5;

        state.power =
            Math.max(
                0,
                state.power -
                    damage
            );

        enemy.runnerHits++;
        enemy.runnerStage = 0;
        enemy.routeIndex = 0;

        state.message =
            `Door impact: -${damage}%`;

        playTone(
            45,
            0.4,
            0.1,
            "square"
        );

        return;
    }

    startJumpscare(enemy);
}


/* ========================================================
   BANANA
   ======================================================== */

function updateCorruptor(
    enemy,
    now,
    delta
) {
    const beingWatched =
        state.cameraUp &&
        state.selectedCamera ===
            enemyCamera(enemy);

    if (!beingWatched) {
        enemy.corruption = 0;

        return;
    }

    enemy.corruption +=
        delta;

    if (enemy.corruption < 4) {
        return;
    }

    enemy.corruption = 0;

    advanceEnemy(enemy, now);

    state.cameraJamUntil =
        now + 5000;

    state.message =
        "CAMERA NETWORK JAMMED";

    playStaticBurst(
        0.5,
        0.09
    );
}


/* ========================================================
   NIGHT CONTROL
   ======================================================== */

function startNight(night) {
    const now =
        performance.now();

    state.night =
        night;

    state.screen =
        "nightIntro";

    state.running =
        false;

    state.powerOut =
        false;

    state.power =
        100;

    state.elapsed =
        0;

    state.leftDoor =
        false;

    state.rightDoor =
        false;

    state.leftDoorVisual =
        0;

    state.rightDoorVisual =
        0;

    state.leftLight =
        false;

    state.rightLight =
        false;

    state.cameraUp =
        false;

    state.monitorAnimation =
        0;

    state.selectedCamera =
        "1a";

    state.cameraJamUntil =
        0;

    state.blackoutAttackAt =
        0;

    state.jumpscareEnemy =
        null;

    state.message =
        "";

    state.nightStart =
        now + 3000;

    createEnemies();

    playStaticBurst(
        0.1,
        0.03
    );
}


function beginOffice() {
    state.screen =
        "office";

    state.running =
        true;

    state.nightStart =
        performance.now();
}


function completeNight() {
    state.running =
        false;

    state.screen =
        "victory";

    const nextNight =
        Math.min(
            7,
            state.night + 1
        );

    state.unlockedNight =
        Math.max(
            state.unlockedNight,
            nextNight
        );

    localStorage.setItem(
        "neegysUnlockedNight",
        String(
            state.unlockedNight
        )
    );

    playTone(
        880,
        0.5,
        0.06,
        "square"
    );
}


function startJumpscare(enemy) {
    if (
        state.screen ===
        "jumpscare"
    ) {
        return;
    }

    state.running =
        false;

    state.screen =
        "jumpscare";

    state.jumpscareEnemy =
        enemy;

    state.jumpscareStartedAt =
        performance.now();

    playStaticBurst(
        0.9,
        0.15
    );

    playTone(
        65,
        0.8,
        0.12,
        "sawtooth"
    );
}


function beginPowerFailure(now) {
    if (state.powerOut) {
        return;
    }

    state.powerOut =
        true;

    state.power =
        0;

    state.cameraUp =
        false;

    state.leftDoor =
        false;

    state.rightDoor =
        false;

    state.leftLight =
        false;

    state.rightLight =
        false;

    state.blackoutAttackAt =
        now +
        8000 +
        Math.random() * 12000;

    state.message =
        "POWER FAILURE";

    playTone(
        35,
        1.5,
        0.08,
        "sawtooth"
    );
}


/* ========================================================
   UPDATE
   ======================================================== */

function update(delta, now) {
    state.leftDoorVisual +=
        (
            Number(state.leftDoor) -
            state.leftDoorVisual
        ) *
        Math.min(
            1,
            delta * 9
        );

    state.rightDoorVisual +=
        (
            Number(state.rightDoor) -
            state.rightDoorVisual
        ) *
        Math.min(
            1,
            delta * 9
        );

    state.monitorAnimation +=
        (
            Number(state.cameraUp) -
            state.monitorAnimation
        ) *
        Math.min(
            1,
            delta * 11
        );

    if (
        state.screen ===
            "nightIntro" &&
        now >= state.nightStart
    ) {
        beginOffice();
    }

    if (
        state.screen !== "office" ||
        !state.running
    ) {
        return;
    }

    state.elapsed =
        (
            now -
            state.nightStart
        ) /
        1000;

    if (
        state.elapsed >=
        gameData.nightLengthSeconds
    ) {
        completeNight();

        return;
    }

    if (state.powerOut) {
        if (
            now >=
            state.blackoutAttackAt
        ) {
            const rapper =
                enemies.find(
                    (enemy) =>
                        enemy.id ===
                        "rapper"
                ) ||
                enemies[0];

            startJumpscare(
                rapper
            );
        }

        return;
    }

    updateOfficePan(delta);

    drainPower(delta);

    updateEnemies(
        now,
        delta
    );

    if (state.power <= 0) {
        beginPowerFailure(now);
    }
}


function updateOfficePan(delta) {
    if (
        pointer.x < 260
    ) {
        state.officeTargetPan = 0;
    } else if (
        pointer.x > 1020
    ) {
        state.officeTargetPan = 384;
    } else {
        state.officeTargetPan =
            (
                pointer.x /
                WIDTH
            ) *
            384;
    }

    state.officePan +=
        (
            state.officeTargetPan -
            state.officePan
        ) *
        Math.min(
            1,
            delta * 3.5
        );
}


function drainPower(delta) {
    const rates =
        gameData.powerDrainPerMinute;

    let drain =
        rates.clock;

    if (state.cameraUp) {
        drain +=
            rates.cameras;
    }

    if (state.leftLight) {
        drain +=
            rates.lights;
    }

    if (state.rightLight) {
        drain +=
            rates.lights;
    }

    if (state.leftDoor) {
        drain +=
            rates.doors;
    }

    if (state.rightDoor) {
        drain +=
            rates.doors;
    }

    state.power -=
        (
            drain /
            60
        ) *
        delta;

    state.power =
        Math.max(
            0,
            state.power
        );
}


/* ========================================================
   DRAWING HELPERS
   ======================================================== */

function clearCanvases() {
    scene.clearRect(
        0,
        0,
        WIDTH,
        HEIGHT
    );

    ui.clearRect(
        0,
        0,
        WIDTH,
        HEIGHT
    );
}


function centeredText(
    context,
    text,
    y
) {
    context.fillText(
        text,
        (
            WIDTH -
            context.measureText(text).width
        ) /
        2,
        y
    );
}


function fillButton(
    context,
    rectangle,
    active = false
) {
    context.fillStyle =
        active
            ? "#d9d9d2"
            : "#101410";

    context.fillRect(
        rectangle.x,
        rectangle.y,
        rectangle.width,
        rectangle.height
    );

    context.strokeStyle =
        active
            ? "#ffffff"
            : "#505850";

    context.lineWidth =
        active ? 4 : 2;

    context.strokeRect(
        rectangle.x,
        rectangle.y,
        rectangle.width,
        rectangle.height
    );
}


function drawStatic(
    context,
    opacity = 0.12
) {
    context.save();

    context.globalAlpha =
        opacity;

    for (
        let line = 0;
        line < 70;
        line++
    ) {
        const y =
            Math.random() *
            HEIGHT;

        const brightness =
            Math.floor(
                Math.random() * 255
            );

        context.fillStyle =
            `rgb(${brightness}, ${brightness}, ${brightness})`;

        context.fillRect(
            Math.random() * WIDTH,
            y,
            20 +
                Math.random() *
                250,
            Math.random() < 0.8
                ? 1
                : 3
        );
    }

    context.restore();
}


function drawVignette(context) {
    const gradient =
        context.createRadialGradient(
            WIDTH / 2,
            HEIGHT / 2,
            150,
            WIDTH / 2,
            HEIGHT / 2,
            700
        );

    gradient.addColorStop(
        0,
        "rgba(0,0,0,0)"
    );

    gradient.addColorStop(
        1,
        "rgba(0,0,0,0.78)"
    );

    context.fillStyle =
        gradient;

    context.fillRect(
        0,
        0,
        WIDTH,
        HEIGHT
    );
}


/* ========================================================
   TITLE
   ======================================================== */

function drawTitle(now) {
    if (assets.title) {
        scene.drawImage(
            assets.title,
            0,
            0,
            WIDTH,
            HEIGHT
        );
    } else {
        const background =
            scene.createLinearGradient(
                0,
                0,
                WIDTH,
                HEIGHT
            );

        background.addColorStop(
            0,
            "#030403"
        );

        background.addColorStop(
            0.55,
            "#090d09"
        );

        background.addColorStop(
            1,
            "#010201"
        );

        scene.fillStyle =
            background;

        scene.fillRect(
            0,
            0,
            WIDTH,
            HEIGHT
        );

        drawVault();
    }

    drawVignette(scene);

    ui.fillStyle =
        "#ffffff";

    ui.font =
        "78px VT323";

    ui.fillText(
        "5 NIGHTS",
        95,
        185
    );

    ui.font =
        "43px VT323";

    ui.fillStyle =
        "#9a9a9a";

    ui.fillText(
        "AT",
        103,
        230
    );

    ui.font =
        "126px VT323";

    ui.fillStyle =
        "#9cff79";

    ui.fillText(
        "NEEGYS",
        90,
        335
    );

    ui.font =
        "25px VT323";

    ui.fillStyle =
        "#c6a85c";

    ui.fillText(
        "NEEGY NATIONAL BANK",
        97,
        380
    );

    drawTitleMenu();

    ui.font =
        "20px VT323";

    ui.fillStyle =
        "#6c726d";

    ui.fillText(
        "F: FULLSCREEN",
        30,
        690
    );

    ui.fillText(
        "v0.2 CANVAS BUILD",
        1070,
        690
    );

    drawStatic(
        ui,
        0.05 +
        Math.sin(now / 100) *
        0.015
    );
}


function drawVault() {
    scene.save();

    scene.translate(
        985,
        355
    );

    scene.strokeStyle =
        "#1c261e";

    scene.lineWidth =
        35;

    scene.beginPath();

    scene.arc(
        0,
        0,
        230,
        0,
        Math.PI * 2
    );

    scene.stroke();

    scene.strokeStyle =
        "#344038";

    scene.lineWidth =
        5;

    scene.beginPath();

    scene.arc(
        0,
        0,
        172,
        0,
        Math.PI * 2
    );

    scene.stroke();

    for (
        let index = 0;
        index < 12;
        index++
    ) {
        const angle =
            index /
            12 *
            Math.PI *
            2;

        scene.save();

        scene.rotate(angle);

        scene.fillStyle =
            "#222b24";

        scene.fillRect(
            150,
            -8,
            65,
            16
        );

        scene.restore();
    }

    scene.fillStyle =
        "#090c09";

    scene.beginPath();

    scene.arc(
        0,
        0,
        105,
        0,
        Math.PI * 2
    );

    scene.fill();

    scene.strokeStyle =
        "#4a554c";

    scene.lineWidth =
        4;

    scene.stroke();

    scene.fillStyle =
        "#273629";

    scene.font =
        "150px VT323";

    scene.textAlign =
        "center";

    scene.fillText(
        "N",
        0,
        50
    );

    scene.restore();
}


function titleButtons() {
    return [
        {
            text: "NEW GAME",
            subtext: "NIGHT 1",
            x: 95,
            y: 430,
            width: 310,
            height: 48
        },

        {
            text: "CONTINUE",
            subtext:
                `NIGHT ${state.unlockedNight}`,
            x: 95,
            y: 488,
            width: 310,
            height: 48
        },

        {
            text: "CUSTOM NIGHT",
            subtext: "20 / 20",
            x: 95,
            y: 546,
            width: 310,
            height: 48
        }
    ];
}


function drawTitleMenu() {
    const buttons =
        titleButtons();

    buttons.forEach(
        (button, index) => {
            const active =
                state.menuIndex === index;

            ui.fillStyle =
                active
                    ? "rgba(156,255,121,0.16)"
                    : "rgba(0,0,0,0.4)";

            ui.fillRect(
                button.x,
                button.y,
                button.width,
                button.height
            );

            ui.fillStyle =
                active
                    ? "#9cff79"
                    : "#aaaaaa";

            ui.fillRect(
                button.x,
                button.y,
                active ? 6 : 2,
                button.height
            );

            ui.font =
                "31px VT323";

            ui.fillText(
                button.text,
                button.x + 18,
                button.y + 33
            );

            ui.font =
                "18px VT323";

            ui.fillStyle =
                active
                    ? "#c6d5c8"
                    : "#575d58";

            ui.textAlign =
                "right";

            ui.fillText(
                button.subtext,
                button.x +
                    button.width -
                    14,
                button.y + 31
            );

            ui.textAlign =
                "left";
        }
    );
}


/* ========================================================
   NIGHT INTRO
   ======================================================== */

function drawNightIntro() {
    scene.fillStyle =
        "black";

    scene.fillRect(
        0,
        0,
        WIDTH,
        HEIGHT
    );

    ui.fillStyle =
        "white";

    ui.font =
        "70px VT323";

    centeredText(
        ui,
        `Night ${state.night}`,
        330
    );

    ui.font =
        "35px VT323";

    ui.fillStyle =
        "#a4aaa5";

    centeredText(
        ui,
        "12:00 AM",
        380
    );
}


/* ========================================================
   OFFICE DRAWING
   ======================================================== */

function drawOffice(now) {
    if (assets.office) {
        scene.drawImage(
            assets.office,
            -state.officePan,
            0,
            1664,
            720
        );
    } else {
        drawFallbackOffice();
    }

    if (
        state.leftLight &&
        assets.leftLight
    ) {
        scene.drawImage(
            assets.leftLight,
            -state.officePan,
            0,
            1664,
            720
        );
    }

    if (
        state.rightLight &&
        assets.rightLight
    ) {
        scene.drawImage(
            assets.rightLight,
            -state.officePan,
            0,
            1664,
            720
        );
    }

    drawDoor(
        "left",
        state.leftDoorVisual
    );

    drawDoor(
        "right",
        state.rightDoorVisual
    );

    drawDoorEnemies();

    if (state.cameraUp) {
        drawCameraView(
            now
        );
    }

    drawMonitorAnimation();

    if (!state.cameraUp) {
        drawOfficeUI();
    }

    drawHUD();
    drawVignette(ui);

    if (state.powerOut) {
        ui.fillStyle =
            "rgba(0,0,0,0.92)";

        ui.fillRect(
            0,
            0,
            WIDTH,
            HEIGHT
        );

        ui.font =
            "35px VT323";

        ui.fillStyle =
            "#381d1d";

        centeredText(
            ui,
            "POWER FAILURE",
            675
        );
    }
}


function drawFallbackOffice() {
    const pan =
        state.officePan;

    scene.save();

    scene.translate(
        -pan,
        0
    );

    const wall =
        scene.createRadialGradient(
            832,
            400,
            50,
            832,
            400,
            800
        );

    wall.addColorStop(
        0,
        "#242820"
    );

    wall.addColorStop(
        0.5,
        "#0e110e"
    );

    wall.addColorStop(
        1,
        "#010201"
    );

    scene.fillStyle =
        wall;

    scene.fillRect(
        0,
        0,
        1664,
        720
    );

    scene.fillStyle =
        "#020302";

    scene.fillRect(
        0,
        70,
        300,
        530
    );

    scene.fillRect(
        1364,
        70,
        300,
        530
    );

    drawHallLight(
        scene,
        140,
        state.leftLight,
        "left"
    );

    drawHallLight(
        scene,
        1524,
        state.rightLight,
        "right"
    );

    scene.fillStyle =
        "#151914";

    scene.beginPath();

    scene.moveTo(
        350,
        0
    );

    scene.lineTo(
        1314,
        0
    );

    scene.lineTo(
        1210,
        480
    );

    scene.lineTo(
        455,
        480
    );

    scene.closePath();
    scene.fill();

    scene.fillStyle =
        "#161713";

    scene.fillRect(
        390,
        500,
        885,
        220
    );

    scene.fillStyle =
        "#303027";

    scene.fillRect(
        365,
        490,
        935,
        25
    );

    scene.fillStyle =
        "#070a07";

    scene.fillRect(
        525,
        305,
        240,
        175
    );

    scene.strokeStyle =
        "#343d35";

    scene.lineWidth =
        14;

    scene.strokeRect(
        525,
        305,
        240,
        175
    );

    scene.fillStyle =
        "#2f5730";

    scene.font =
        "35px VT323";

    scene.fillText(
        "SECURITY",
        577,
        397
    );

    scene.fillStyle =
        "#343934";

    scene.font =
        "100px VT323";

    scene.fillText(
        "✣",
        860,
        470
    );

    scene.fillStyle =
        "#aca36e";

    scene.fillRect(
        1050,
        530,
        150,
        95
    );

    scene.fillStyle =
        "#3f3a2a";

    scene.font =
        "19px VT323";

    scene.fillText(
        "CHECK",
        1097,
        565
    );

    scene.fillText(
        "THE CAMS",
        1080,
        590
    );

    scene.restore();
}


function drawHallLight(
    context,
    centerX,
    enabled,
    side
) {
    if (!enabled) {
        return;
    }

    const gradient =
        context.createRadialGradient(
            centerX,
            330,
            20,
            centerX,
            330,
            260
        );

    gradient.addColorStop(
        0,
        "rgba(255,238,160,0.75)"
    );

    gradient.addColorStop(
        0.4,
        "rgba(170,150,75,0.22)"
    );

    gradient.addColorStop(
        1,
        "rgba(0,0,0,0)"
    );

    context.fillStyle =
        gradient;

    context.fillRect(
        side === "left"
            ? 0
            : 1260,
        50,
        405,
        590
    );
}


function drawDoor(
    side,
    progress
) {
    const width =
        250;

    const height =
        520 * progress;

    const worldX =
        side === "left"
            ? 0
            : 1414;

    const x =
        worldX -
        state.officePan;

    scene.save();

    scene.fillStyle =
        "#242924";

    scene.fillRect(
        x,
        75,
        width,
        height
    );

    scene.strokeStyle =
        "#4b514b";

    scene.lineWidth =
        5;

    scene.strokeRect(
        x,
        75,
        width,
        height
    );

    scene.fillStyle =
        "#0d100d";

    for (
        let stripe = 0;
        stripe < height;
        stripe += 42
    ) {
        scene.fillRect(
            x,
            75 + stripe,
            width,
            8
        );
    }

    scene.fillStyle =
        "#626a63";

    scene.font =
        "23px VT323";

    scene.fillText(
        "SECURITY",
        x + 82,
        115
    );

    scene.restore();
}


function doorEnemy(side) {
    return enemies.find((enemy) => {
        return (
            !enemy.insideOffice &&
            enemy.attackSide === side &&
            enemy.routeIndex ===
                enemy.route.length - 1
        );
    });
}


function drawDoorEnemies() {
    const leftEnemy =
        doorEnemy("left");

    const rightEnemy =
        doorEnemy("right");

    if (
        leftEnemy &&
        state.leftLight
    ) {
        drawEnemySilhouette(
            145 - state.officePan,
            310,
            leftEnemy.name
        );
    }

    if (
        rightEnemy &&
        state.rightLight
    ) {
        drawEnemySilhouette(
            1515 - state.officePan,
            310,
            rightEnemy.name
        );
    }
}


function drawEnemySilhouette(
    x,
    y,
    name
) {
    scene.save();

    scene.fillStyle =
        "rgba(0,0,0,0.94)";

    scene.beginPath();

    scene.arc(
        x,
        y,
        72,
        0,
        Math.PI * 2
    );

    scene.fill();

    scene.fillRect(
        x - 64,
        y + 55,
        128,
        220
    );

    scene.fillStyle =
        "#e8e8dd";

    scene.fillRect(
        x - 32,
        y - 12,
        14,
        9
    );

    scene.fillRect(
        x + 18,
        y - 12,
        14,
        9
    );

    scene.fillStyle =
        "#a44545";

    scene.font =
        "20px VT323";

    scene.textAlign =
        "center";

    scene.fillText(
        name.toUpperCase(),
        x,
        y + 310
    );

    scene.restore();
}


/* ========================================================
   OFFICE UI
   ======================================================== */

const controls = {
    leftLight: {
        x: 38,
        y: 320,
        width: 85,
        height: 60
    },

    leftDoor: {
        x: 38,
        y: 400,
        width: 85,
        height: 85
    },

    rightLight: {
        x: 1157,
        y: 320,
        width: 85,
        height: 60
    },

    rightDoor: {
        x: 1157,
        y: 400,
        width: 85,
        height: 85
    },

    cameraFlip: {
        x: 340,
        y: 660,
        width: 600,
        height: 60
    }
};


function drawOfficeUI() {
    drawControlButton(
        controls.leftLight,
        "LIGHT",
        state.leftLight
    );

    drawControlButton(
        controls.leftDoor,
        "DOOR",
        state.leftDoor,
        true
    );

    drawControlButton(
        controls.rightLight,
        "LIGHT",
        state.rightLight
    );

    drawControlButton(
        controls.rightDoor,
        "DOOR",
        state.rightDoor,
        true
    );

    ui.fillStyle =
        inside(
            controls.cameraFlip.x,
            controls.cameraFlip.y,
            controls.cameraFlip.width,
            controls.cameraFlip.height
        )
            ? "rgba(255,255,255,0.25)"
            : "rgba(255,255,255,0.08)";

    ui.fillRect(
        controls.cameraFlip.x,
        controls.cameraFlip.y,
        controls.cameraFlip.width,
        controls.cameraFlip.height
    );

    ui.strokeStyle =
        "#8a928b";

    ui.strokeRect(
        controls.cameraFlip.x,
        controls.cameraFlip.y,
        controls.cameraFlip.width,
        controls.cameraFlip.height
    );

    ui.font =
        "23px VT323";

    ui.fillStyle =
        "#d7dbd8";

    centeredText(
        ui,
        "OPEN CAMERA MONITOR",
        699
    );
}


function drawControlButton(
    rectangle,
    label,
    active,
    dangerous = false
) {
    fillButton(
        ui,
        rectangle,
        active
    );

    if (active) {
        ui.fillStyle =
            dangerous
                ? "#9f2727"
                : "#9cff79";

        ui.fillRect(
            rectangle.x + 8,
            rectangle.y + 8,
            rectangle.width - 16,
            12
        );
    }

    ui.fillStyle =
        active
            ? "#ffffff"
            : "#89918a";

    ui.font =
        "24px VT323";

    ui.textAlign =
        "center";

    ui.fillText(
        label,
        rectangle.x +
            rectangle.width / 2,
        rectangle.y +
            rectangle.height /
                2 +
            10
    );

    ui.textAlign =
        "left";
}


/* ========================================================
   CAMERA VIEW
   ======================================================== */

const mapPositions = {
    "1a": [960, 340],
    "1b": [890, 385],
    "1c": [1030, 385],
    "1d": [960, 430],

    "2a": [890, 475],
    "2b": [820, 430],
    "2c": [1100, 430],
    "2d": [1030, 475],

    "3a": [820, 520],
    "3b": [890, 565],
    "3d": [1030, 565],

    "1e": [890, 610],
    "2e": [1030, 610],
    "3e": [820, 650],
    "4e": [1100, 650],

    "1f": [960, 665],
    "2f": [1170, 520]
};


function drawCameraView(now) {
    const camera =
        cameraData.find(
            (item) =>
                item.id ===
                state.selectedCamera
        ) ||
        cameraData[0];

    const image =
        assets.cameras[
            state.selectedCamera
        ];

    if (image) {
        scene.drawImage(
            image,
            0,
            0,
            WIDTH,
            HEIGHT
        );
    } else {
        drawFallbackCamera(
            camera
        );
    }

    const jammed =
        now <
        state.cameraJamUntil;

    const banana =
        enemies.find(
            (enemy) =>
                enemy.id ===
                "banana"
        );

    const corrupted =
        banana &&
        enemyCamera(banana) ===
            state.selectedCamera;

    drawStatic(
        scene,
        jammed
            ? 0.55
            : corrupted
            ? 0.25
            : 0.12
    );

    ui.fillStyle =
        "#ffffff";

    ui.font =
        "34px VT323";

    ui.fillText(
        `CAM ${camera.code}`,
        35,
        54
    );

    ui.font =
        "25px VT323";

    ui.fillStyle =
        "#b9beb9";

    ui.fillText(
        camera.name,
        35,
        86
    );

    if (
        Math.floor(now / 500) %
            2 ===
        0
    ) {
        ui.fillStyle =
            "#d73d3d";

        ui.beginPath();

        ui.arc(
            625,
            42,
            8,
            0,
            Math.PI * 2
        );

        ui.fill();

        ui.fillStyle =
            "#ffffff";

        ui.font =
            "22px VT323";

        ui.fillText(
            "REC",
            642,
            49
        );
    }

    drawCameraEnemies();
    drawCameraMap();
}


function drawFallbackCamera(camera) {
    const gradient =
        scene.createLinearGradient(
            0,
            0,
            0,
            HEIGHT
        );

    gradient.addColorStop(
        0,
        "#182019"
    );

    gradient.addColorStop(
        0.5,
        "#0b100c"
    );

    gradient.addColorStop(
        1,
        "#020302"
    );

    scene.fillStyle =
        gradient;

    scene.fillRect(
        0,
        0,
        WIDTH,
        HEIGHT
    );

    scene.strokeStyle =
        "#29342b";

    scene.lineWidth =
        7;

    scene.strokeRect(
        120,
        120,
        660,
        460
    );

    scene.fillStyle =
        "#111711";

    scene.fillRect(
        170,
        390,
        550,
        150
    );

    scene.fillStyle =
        "#354137";

    scene.font =
        "70px VT323";

    scene.textAlign =
        "center";

    scene.fillText(
        camera.name.toUpperCase(),
        450,
        330
    );

    scene.textAlign =
        "left";
}


function drawCameraEnemies() {
    const present =
        enemies.filter((enemy) => {
            return (
                !enemy.insideOffice &&
                enemyCamera(enemy) ===
                    state.selectedCamera
            );
        });

    present.forEach(
        (enemy, index) => {
            drawEnemySilhouette(
                350 + index * 180,
                310,
                enemy.name
            );
        }
    );
}


function drawCameraMap() {
    ui.fillStyle =
        "rgba(0,0,0,0.72)";

    ui.fillRect(
        790,
        290,
        470,
        420
    );

    ui.strokeStyle =
        "#767e77";

    ui.lineWidth =
        3;

    ui.strokeRect(
        790,
        290,
        470,
        420
    );

    ui.font =
        "25px VT323";

    ui.fillStyle =
        "#ffffff";

    ui.fillText(
        "NEEGY BANK",
        820,
        325
    );

    cameraData.forEach((camera) => {
        const position =
            mapPositions[camera.id];

        if (!position) {
            return;
        }

        const active =
            camera.id ===
            state.selectedCamera;

        ui.fillStyle =
            active
                ? "#9cff79"
                : "#323a33";

        ui.fillRect(
            position[0],
            position[1],
            55,
            28
        );

        ui.strokeStyle =
            active
                ? "#ffffff"
                : "#737b74";

        ui.strokeRect(
            position[0],
            position[1],
            55,
            28
        );

        ui.fillStyle =
            active
                ? "#071007"
                : "#ffffff";

        ui.font =
            "18px VT323";

        ui.textAlign =
            "center";

        ui.fillText(
            camera.code,
            position[0] + 27,
            position[1] + 21
        );
    });

    ui.textAlign =
        "left";
}


/* ========================================================
   MONITOR ANIMATION
   ======================================================== */

function drawMonitorAnimation() {
    const progress =
        state.monitorAnimation;

    if (
        progress <= 0.01 ||
        progress >= 0.99
    ) {
        return;
    }

    const monitorHeight =
        720 * progress;

    ui.fillStyle =
        "#080a08";

    ui.fillRect(
        0,
        HEIGHT - monitorHeight,
        WIDTH,
        monitorHeight
    );

    ui.strokeStyle =
        "#414841";

    ui.lineWidth =
        8;

    ui.strokeRect(
        0,
        HEIGHT - monitorHeight,
        WIDTH,
        monitorHeight
    );

    drawStatic(
        ui,
        0.18
    );
}


/* ========================================================
   HUD
   ======================================================== */

function drawHUD() {
    const hour =
        gameData.hourLabels[
            currentHour()
        ];

    ui.textAlign =
        "right";

    ui.fillStyle =
        "#ffffff";

    ui.font =
        "42px VT323";

    ui.fillText(
        hour,
        1235,
        52
    );

    ui.font =
        "25px VT323";

    ui.fillText(
        `Night ${state.night}`,
        1235,
        83
    );

    ui.textAlign =
        "left";

    ui.font =
        "28px VT323";

    ui.fillText(
        "Power Left:",
        35,
        645
    );

    ui.fillStyle =
        state.power <= 20
            ? "#e64242"
            : "#ffffff";

    ui.font =
        "39px VT323";

    ui.fillText(
        `${Math.ceil(state.power)}%`,
        177,
        646
    );

    let usage = 1;

    usage +=
        Number(state.cameraUp);

    usage +=
        Number(state.leftDoor);

    usage +=
        Number(state.rightDoor);

    usage +=
        Number(state.leftLight);

    usage +=
        Number(state.rightLight);

    ui.fillStyle =
        "#ffffff";

    ui.font =
        "28px VT323";

    ui.fillText(
        "Usage:",
        35,
        682
    );

    for (
        let index = 0;
        index < 6;
        index++
    ) {
        ui.fillStyle =
            index < usage
                ? index >= 4
                    ? "#d89c32"
                    : "#74c85b"
                : "#273027";

        ui.fillRect(
            125 + index * 25,
            662,
            17,
            22
        );
    }

    if (state.message) {
        ui.textAlign =
            "center";

        ui.fillStyle =
            "#8d968f";

        ui.font =
            "22px VT323";

        ui.fillText(
            state.message,
            WIDTH / 2,
            35
        );

        ui.textAlign =
            "left";
    }
}


/* ========================================================
   JUMPSCARE AND ENDINGS
   ======================================================== */

function drawJumpscare(now) {
    const elapsed =
        now -
        state.jumpscareStartedAt;

    const shakeX =
        Math.random() * 40 - 20;

    const shakeY =
        Math.random() * 40 - 20;

    scene.fillStyle =
        elapsed % 90 < 45
            ? "#d6d6cc"
            : "#060606";

    scene.fillRect(
        0,
        0,
        WIDTH,
        HEIGHT
    );

    scene.save();

    scene.translate(
        WIDTH / 2 + shakeX,
        HEIGHT / 2 + shakeY
    );

    const scale =
        1 +
        elapsed / 450;

    scene.scale(
        scale,
        scale
    );

    scene.fillStyle =
        "#050505";

    scene.beginPath();

    scene.arc(
        0,
        -40,
        210,
        0,
        Math.PI * 2
    );

    scene.fill();

    scene.fillStyle =
        "#ffffff";

    scene.fillRect(
        -110,
        -90,
        60,
        35
    );

    scene.fillRect(
        50,
        -90,
        60,
        35
    );

    scene.strokeStyle =
        "#ffffff";

    scene.lineWidth =
        15;

    scene.beginPath();

    scene.arc(
        0,
        30,
        100,
        0,
        Math.PI
    );

    scene.stroke();

    scene.restore();

    drawStatic(
        ui,
        0.45
    );

    if (elapsed >= 1500) {
        state.screen =
            "gameOver";
    }
}


function drawGameOver() {
    scene.fillStyle =
        "black";

    scene.fillRect(
        0,
        0,
        WIDTH,
        HEIGHT
    );

    ui.fillStyle =
        "#bdbdb6";

    ui.font =
        "85px VT323";

    centeredText(
        ui,
        "GAME OVER",
        330
    );

    ui.font =
        "30px VT323";

    ui.fillStyle =
        "#6f7470";

    centeredText(
        ui,
        state.jumpscareEnemy
            ? `Caught by ${state.jumpscareEnemy.name}`
            : "Shift failed",
        385
    );

    ui.fillStyle =
        "#ffffff";

    centeredText(
        ui,
        "CLICK TO RETURN",
        500
    );

    drawStatic(
        ui,
        0.12
    );
}


function drawVictory() {
    scene.fillStyle =
        "black";

    scene.fillRect(
        0,
        0,
        WIDTH,
        HEIGHT
    );

    ui.fillStyle =
        "#ffffff";

    ui.font =
        "145px VT323";

    centeredText(
        ui,
        "6 AM",
        365
    );

    ui.font =
        "34px VT323";

    ui.fillStyle =
        "#9cff79";

    centeredText(
        ui,
        "SHIFT COMPLETE",
        430
    );

    ui.fillStyle =
        "#ffffff";

    centeredText(
        ui,
        "CLICK TO CONTINUE",
        550
    );
}


/* ========================================================
   INPUT
   ======================================================== */

function handlePress() {
    enableAudio();

    if (
        state.screen === "title"
    ) {
        const buttons =
            titleButtons();

        const selected =
            buttons.findIndex(
                (button) =>
                    inside(
                        button.x,
                        button.y,
                        button.width,
                        button.height
                    )
            );

        if (selected >= 0) {
            state.menuIndex =
                selected;

            activateMenuItem();
        }

        return;
    }

    if (
        state.screen ===
            "gameOver" ||
        state.screen ===
            "victory"
    ) {
        state.screen =
            "title";

        return;
    }

    if (
        state.screen !== "office" ||
        state.powerOut
    ) {
        return;
    }

    if (state.cameraUp) {
        if (
            inside(
                controls.cameraFlip.x,
                controls.cameraFlip.y,
                controls.cameraFlip.width,
                controls.cameraFlip.height
            )
        ) {
            lowerCamera();

            return;
        }

        selectCameraAtPointer();

        return;
    }

    if (
        inside(
            controls.leftDoor.x,
            controls.leftDoor.y,
            controls.leftDoor.width,
            controls.leftDoor.height
        )
    ) {
        state.leftDoor =
            !state.leftDoor;

        playTone(
            state.leftDoor
                ? 95
                : 130,
            0.14,
            0.05
        );

        return;
    }

    if (
        inside(
            controls.rightDoor.x,
            controls.rightDoor.y,
            controls.rightDoor.width,
            controls.rightDoor.height
        )
    ) {
        state.rightDoor =
            !state.rightDoor;

        playTone(
            state.rightDoor
                ? 95
                : 130,
            0.14,
            0.05
        );

        return;
    }

    if (
        inside(
            controls.leftLight.x,
            controls.leftLight.y,
            controls.leftLight.width,
            controls.leftLight.height
        )
    ) {
        state.leftLight =
            true;

        playTone(
            210,
            0.06,
            0.025
        );

        return;
    }

    if (
        inside(
            controls.rightLight.x,
            controls.rightLight.y,
            controls.rightLight.width,
            controls.rightLight.height
        )
    ) {
        state.rightLight =
            true;

        playTone(
            210,
            0.06,
            0.025
        );

        return;
    }

    if (
        inside(
            controls.cameraFlip.x,
            controls.cameraFlip.y,
            controls.cameraFlip.width,
            controls.cameraFlip.height
        )
    ) {
        raiseCamera();
    }
}


function handleRelease() {
    state.leftLight =
        false;

    state.rightLight =
        false;
}


function raiseCamera() {
    if (
        performance.now() <
        state.cameraJamUntil
    ) {
        state.message =
            "CAMERA SYSTEM JAMMED";

        playTone(
            45,
            0.12,
            0.08
        );

        return;
    }

    state.cameraUp =
        true;

    playStaticBurst(
        0.09,
        0.04
    );
}


function lowerCamera() {
    state.cameraUp =
        false;

    playStaticBurst(
        0.07,
        0.035
    );

    const intruder =
        enemies.find(
            (enemy) =>
                enemy.insideOffice
        );

    if (intruder) {
        startJumpscare(
            intruder
        );
    }
}


function selectCameraAtPointer() {
    if (
        performance.now() <
        state.cameraJamUntil
    ) {
        return;
    }

    for (
        const camera of cameraData
    ) {
        const position =
            mapPositions[camera.id];

        if (!position) {
            continue;
        }

        if (
            inside(
                position[0],
                position[1],
                55,
                28
            )
        ) {
            state.selectedCamera =
                camera.id;

            playStaticBurst(
                0.05,
                0.025
            );

            return;
        }
    }

    if (
        pointer.y >= 660
    ) {
        lowerCamera();
    }
}


function activateMenuItem() {
    playTone(
        180,
        0.08,
        0.04
    );

    switch (
        state.menuIndex
    ) {
        case 0:
            startNight(1);
            break;

        case 1:
            startNight(
                state.unlockedNight
            );
            break;

        case 2:
            startNight(7);
            break;
    }
}


/* ========================================================
   EVENTS
   ======================================================== */

window.addEventListener(
    "resize",
    resizeGame
);


window.addEventListener(
    "pointermove",
    updatePointer
);


window.addEventListener(
    "pointerdown",
    (event) => {
        updatePointer(event);

        pointer.down =
            true;

        pointer.pressed =
            true;

        handlePress();
    }
);


window.addEventListener(
    "pointerup",
    (event) => {
        updatePointer(event);

        pointer.down =
            false;

        pointer.released =
            true;

        handleRelease();
    }
);


window.addEventListener(
    "pointercancel",
    () => {
        pointer.down =
            false;

        handleRelease();
    }
);


window.addEventListener(
    "contextmenu",
    (event) => {
        event.preventDefault();
    }
);


window.addEventListener(
    "keydown",
    (event) => {
        if (
            event.key.toLowerCase() ===
            "f"
        ) {
            enterFullscreen();

            return;
        }

        if (
            state.screen === "title"
        ) {
            if (
                event.key ===
                "ArrowUp"
            ) {
                state.menuIndex =
                    (
                        state.menuIndex +
                        2
                    ) %
                    3;

                playTone(
                    120,
                    0.04,
                    0.025
                );
            }

            if (
                event.key ===
                "ArrowDown"
            ) {
                state.menuIndex =
                    (
                        state.menuIndex +
                        1
                    ) %
                    3;

                playTone(
                    140,
                    0.04,
                    0.025
                );
            }

            if (
                event.key ===
                    "Enter" ||
                event.key ===
                    " "
            ) {
                activateMenuItem();
            }

            return;
        }

        if (
            state.screen !== "office"
        ) {
            return;
        }

        if (
            event.key === " "
        ) {
            event.preventDefault();

            if (state.cameraUp) {
                lowerCamera();
            } else {
                raiseCamera();
            }
        }

        if (
            event.key.toLowerCase() ===
            "a"
        ) {
            state.leftDoor =
                !state.leftDoor;
        }

        if (
            event.key.toLowerCase() ===
            "d"
        ) {
            state.rightDoor =
                !state.rightDoor;
        }

        if (
            event.key.toLowerCase() ===
            "q"
        ) {
            state.leftLight =
                true;
        }

        if (
            event.key.toLowerCase() ===
            "e"
        ) {
            state.rightLight =
                true;
        }
    }
);


window.addEventListener(
    "keyup",
    (event) => {
        if (
            event.key.toLowerCase() ===
            "q"
        ) {
            state.leftLight =
                false;
        }

        if (
            event.key.toLowerCase() ===
            "e"
        ) {
            state.rightLight =
                false;
        }
    }
);


document.addEventListener(
    "fullscreenchange",
    () => {
        if (
            !document.fullscreenElement &&
            state.screen === "office"
        ) {
            fullscreenDialog.classList.remove(
                "hidden"
            );
        }
    }
);


allowAudioButton.addEventListener(
    "click",
    enableAudio
);


enterFullscreenButton.addEventListener(
    "click",
    enterFullscreen
);


closeFullscreenButton.addEventListener(
    "click",
    () => {
        fullscreenDialog.classList.add(
            "hidden"
        );
    }
);


/* ========================================================
   RENDER LOOP
   ======================================================== */

function render(now) {
    clearCanvases();

    switch (
        state.screen
    ) {
        case "loading":
            scene.fillStyle =
                "black";

            scene.fillRect(
                0,
                0,
                WIDTH,
                HEIGHT
            );

            ui.fillStyle =
                "white";

            ui.font =
                "38px VT323";

            centeredText(
                ui,
                "LOADING...",
                370
            );

            break;

        case "title":
            drawTitle(now);
            break;

        case "nightIntro":
            drawNightIntro();
            break;

        case "office":
            drawOffice(now);
            break;

        case "jumpscare":
            drawJumpscare(now);
            break;

        case "gameOver":
            drawGameOver();
            break;

        case "victory":
            drawVictory();
            break;
    }
}


function frame(now) {
    const delta =
        Math.min(
            0.1,
            (
                now -
                lastFrame
            ) /
            1000
        );

    lastFrame =
        now;

    update(
        delta,
        now
    );

    render(now);

    pointer.pressed =
        false;

    pointer.released =
        false;

    requestAnimationFrame(frame);
}


/* ========================================================
   START
   ======================================================== */

resizeGame();
bootGame();
requestAnimationFrame(frame);
