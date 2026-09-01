const $ = (selector) =>
    document.querySelector(selector);


const screens = {
    menu: $("#menuScreen"),
    nights: $("#nightSelectScreen"),
    office: $("#officeScreen"),
    result: $("#resultScreen")
};


const elements = {
    newGame: $("#newGameButton"),
    selectNight: $("#selectNightButton"),
    nightBack: $("#nightBackButton"),
    settings: $("#settingsButton"),
    sound: $("#soundButton"),
    returnMenu: $("#returnMenuButton"),

    menuMessage: $("#menuMessage"),
    systemMessage: $("#systemMessage"),

    nightGrid: $("#nightGrid"),
    nightNumber: $("#nightNumber"),

    gameHour: $("#gameHour"),
    shiftTimer: $("#shiftTimer"),

    powerText: $("#powerText"),
    powerFill: $("#powerFill"),
    usageBars: document.querySelectorAll(
        "#usageBars i"
    ),

    cameraButton: $("#cameraButton"),
    cameraSystem: $("#cameraSystem"),
    cameraGrid: $("#cameraGrid"),

    cameraCode: $("#cameraCode"),
    cameraName: $("#cameraName"),
    selectedCameraName: $("#selectedCameraName"),
    cameraMovement: $("#cameraMovement"),

    leftDoorButton: $("#leftDoorButton"),
    rightDoorButton: $("#rightDoorButton"),

    leftLightButton: $("#leftLightButton"),
    rightLightButton: $("#rightLightButton"),

    leftDoor: $("#leftDoor"),
    rightDoor: $("#rightDoor"),

    leftHall: $("#leftHall"),
    rightHall: $("#rightHall"),

    resultLabel: $("#resultLabel"),
    resultTitle: $("#resultTitle")
};


let gameData = null;
let cameras = [];
let enemyConfigs = [];
let enemies = [];


const state = {
    running: false,
    gameOver: false,
    powerOut: false,

    night: 1,

    shiftStartedAt: 0,
    elapsedSeconds: 0,
    previousTick: 0,

    power: 100,

    cameraOpen: false,
    currentCamera: "1a",
    camerasJammedUntil: 0,

    leftDoorClosed: false,
    rightDoorClosed: false,

    leftLightOn: false,
    rightLightOn: false,

    blackoutAttackAt: 0,

    soundEnabled: true
};


let gameTimer = null;


/* ---------------------------------- */
/* DATA */
/* ---------------------------------- */

async function loadGameData() {
    try {
        const [
            gameResponse,
            camerasResponse,
            enemiesResponse
        ] = await Promise.all([
            fetch("data/game.json"),
            fetch("data/cameras.json"),
            fetch("data/enemies.json")
        ]);

        if (
            !gameResponse.ok ||
            !camerasResponse.ok ||
            !enemiesResponse.ok
        ) {
            throw new Error("Game data failed to load.");
        }

        gameData =
            await gameResponse.json();

        cameras =
            await camerasResponse.json();

        enemyConfigs =
            await enemiesResponse.json();

        elements.menuMessage.textContent =
            "Night systems ready";

        createCameraButtons();
        createNightButtons();
    } catch (error) {
        console.error(error);

        elements.menuMessage.textContent =
            "Open the project using Live Server";
    }
}


/* ---------------------------------- */
/* SCREENS */
/* ---------------------------------- */

function showScreen(screenName) {
    Object.values(screens).forEach((screen) => {
        screen.classList.add("hidden");
    });

    screens[screenName].classList.remove("hidden");
}


/* ---------------------------------- */
/* NIGHT SELECTION */
/* ---------------------------------- */

function createNightButtons() {
    elements.nightGrid.innerHTML = "";

    const unlockedNight = Number(
        localStorage.getItem(
            "neegysUnlockedNight"
        ) || "1"
    );

    for (let night = 1; night <= 7; night++) {
        const locked =
            night > unlockedNight;

        const button =
            document.createElement("button");

        button.className =
            "night-card";

        button.disabled =
            locked;

        button.innerHTML = `
            <span>
                ${night === 7 ? "CUSTOM" : "NIGHT"}
            </span>

            <strong>${night}</strong>

            <small>
                ${
                    locked
                        ? "LOCKED"
                        : night === 7
                        ? "20 / 20"
                        : "AVAILABLE"
                }
            </small>
        `;

        button.addEventListener(
            "click",
            () => startNight(night)
        );

        elements.nightGrid.appendChild(
            button
        );
    }
}


/* ---------------------------------- */
/* CAMERA MAP */
/* ---------------------------------- */

function createCameraButtons() {
    elements.cameraGrid.innerHTML = "";

    cameras.forEach((camera) => {
        const button =
            document.createElement("button");

        button.textContent =
            camera.code;

        button.dataset.cameraId =
            camera.id;

        button.title =
            camera.name;

        button.addEventListener(
            "click",
            () => selectCamera(camera.id)
        );

        elements.cameraGrid.appendChild(
            button
        );
    });

    selectCamera("1a");
}


function selectCamera(cameraId) {
    if (
        Date.now() <
        state.camerasJammedUntil
    ) {
        elements.systemMessage.textContent =
            "CAMERA SYSTEM JAMMED";

        return;
    }

    state.currentCamera =
        cameraId;

    const camera =
        cameras.find((item) => {
            return item.id === cameraId;
        });

    document
        .querySelectorAll(
            ".camera-grid button"
        )
        .forEach((button) => {
            button.classList.toggle(
                "active",
                button.dataset.cameraId === cameraId
            );
        });

    if (!camera) {
        return;
    }

    elements.cameraCode.textContent =
        `CAM ${camera.code}`;

    elements.cameraName.textContent =
        camera.name;

    elements.selectedCameraName.textContent =
        camera.name;

    renderCameraFeed();
}


function renderCameraFeed() {
    const presentEnemies =
        enemies.filter((enemy) => {
            return (
                !enemy.insideOffice &&
                getEnemyCamera(enemy) ===
                    state.currentCamera
            );
        });

    const farmer =
        enemies.find((enemy) => {
            return enemy.id === "farmer";
        });

    if (
        farmer &&
        state.currentCamera ===
            farmer.startCamera
    ) {
        const stageText = [
            "Farmer Neegy is watching.",
            "Farmer Neegy is leaning forward.",
            "Farmer Neegy is preparing to run.",
            "THE ROOM IS EMPTY."
        ];

        elements.cameraMovement.textContent =
            stageText[
                Math.min(
                    farmer.runnerStage,
                    3
                )
            ];

        return;
    }

    if (presentEnemies.length === 0) {
        elements.cameraMovement.textContent =
            "NO MOVEMENT DETECTED";

        return;
    }

    elements.cameraMovement.textContent =
        presentEnemies
            .map((enemy) => enemy.name)
            .join(" • ");
}


/* ---------------------------------- */
/* ENEMY CREATION */
/* ---------------------------------- */

function createEnemyStates() {
    const now =
        performance.now();

    enemies =
        enemyConfigs.map((config) => {
            return {
                ...config,

                routeIndex: 0,

                nextMoveAt:
                    now +
                    config.movementInterval *
                        1000 +
                    Math.random() * 2500,

                insideOffice: false,
                enteredOfficeAt: 0,

                doorReachedAt: 0,

                runnerStage: 0,
                runnerHits: 0,

                corruptionExposure: 0
            };
        });
}


function getEnemyCamera(enemy) {
    return enemy.route[
        enemy.routeIndex
    ];
}


function getEnemyAI(enemy) {
    const nightIndex =
        Math.min(
            state.night - 1,
            enemy.aiByNight.length - 1
        );

    let ai =
        enemy.aiByNight[nightIndex];

    const currentHour =
        getCurrentHourIndex();

    gameData.hourBoosts.forEach((boost) => {
        if (
            currentHour >= boost.hour &&
            boost.enemies.includes(enemy.id)
        ) {
            ai += boost.amount;
        }
    });

    return Math.min(ai, 20);
}


function movementRoll(enemy) {
    const ai =
        getEnemyAI(enemy);

    const roll =
        Math.floor(Math.random() * 20) + 1;

    return roll <= ai;
}


/* ---------------------------------- */
/* START NIGHT */
/* ---------------------------------- */

function startNight(night) {
    clearInterval(gameTimer);

    state.running = true;
    state.gameOver = false;
    state.powerOut = false;

    state.night = night;

    state.shiftStartedAt =
        performance.now();

    state.previousTick =
        performance.now();

    state.elapsedSeconds = 0;
    state.power = 100;

    state.cameraOpen = false;
    state.currentCamera = "1a";
    state.camerasJammedUntil = 0;

    state.leftDoorClosed = false;
    state.rightDoorClosed = false;

    state.leftLightOn = false;
    state.rightLightOn = false;

    state.blackoutAttackAt = 0;

    createEnemyStates();
    resetOfficeControls();

    elements.nightNumber.textContent =
        String(night);

    elements.gameHour.textContent =
        "12 AM";

    elements.shiftTimer.textContent =
        "0:00";

    elements.systemMessage.textContent =
        `Night ${night} started`;

    elements.cameraSystem.classList.add(
        "hidden"
    );

    elements.cameraSystem.classList.remove(
        "corrupted"
    );

    elements.cameraButton.classList.remove(
        "active"
    );

    elements.cameraButton.textContent =
        "OPEN CAMERAS";

    updatePowerDisplay();
    selectCamera("1a");
    renderHallThreats();

    showScreen("office");

    gameTimer =
        setInterval(gameLoop, 100);
}


/* ---------------------------------- */
/* MAIN LOOP */
/* ---------------------------------- */

function gameLoop() {
    if (!state.running) {
        return;
    }

    const now =
        performance.now();

    const deltaSeconds =
        Math.min(
            0.25,
            (now - state.previousTick) /
                1000
        );

    state.previousTick =
        now;

    state.elapsedSeconds =
        (now - state.shiftStartedAt) /
        1000;

    updateGameClock();

    if (
        state.elapsedSeconds >=
        gameData.nightLengthSeconds
    ) {
        completeNight();

        return;
    }

    if (state.powerOut) {
        updateBlackout(now);

        return;
    }

    drainPower(deltaSeconds);
    updateEnemyMovement(now);
    updateOfficeIntruders(now);
    updateBananaCorruption(deltaSeconds);
    updateCameraJam(now);

    updatePowerDisplay();
    renderHallThreats();

    if (state.power <= 0) {
        beginPowerFailure(now);
    }
}


/* ---------------------------------- */
/* TIME */
/* ---------------------------------- */

function getCurrentHourIndex() {
    const progress =
        state.elapsedSeconds /
        gameData.nightLengthSeconds;

    return Math.min(
        6,
        Math.floor(progress * 6)
    );
}


function updateGameClock() {
    const hourIndex =
        getCurrentHourIndex();

    elements.gameHour.textContent =
        gameData.hourLabels[hourIndex];

    const totalSeconds =
        Math.floor(
            state.elapsedSeconds
        );

    const minutes =
        Math.floor(
            totalSeconds / 60
        );

    const seconds =
        totalSeconds % 60;

    elements.shiftTimer.textContent =
        `${minutes}:${String(seconds).padStart(2, "0")}`;
}


/* ---------------------------------- */
/* MOVEMENT OPPORTUNITIES */
/* ---------------------------------- */

function updateEnemyMovement(now) {
    enemies.forEach((enemy) => {
        if (
            enemy.insideOffice ||
            now < enemy.nextMoveAt
        ) {
            return;
        }

        enemy.nextMoveAt =
            now +
            enemy.movementInterval *
                1000;

        if (
            enemy.behavior ===
            "runner"
        ) {
            handleFarmerOpportunity(
                enemy
            );

            return;
        }

        if (
            enemy.behavior ===
                "stalker" &&
            state.cameraOpen
        ) {
            return;
        }

        if (!movementRoll(enemy)) {
            return;
        }

        advanceEnemy(enemy, now);
    });

    renderCameraFeed();
}


function advanceEnemy(enemy, now) {
    const finalRouteIndex =
        enemy.route.length - 1;

    if (
        enemy.routeIndex ===
        finalRouteIndex
    ) {
        attemptDoorEntry(
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

    const shouldBacktrack =
        canBacktrack &&
        enemy.routeIndex > 0 &&
        Math.random() <
            enemy.backtrackChance;

    if (shouldBacktrack) {
        enemy.routeIndex--;
    } else {
        enemy.routeIndex++;
    }

    if (
        enemy.routeIndex ===
        finalRouteIndex
    ) {
        enemy.doorReachedAt =
            now;

        elements.systemMessage.textContent =
            `${enemy.name} reached the ${enemy.attackSide} side`;
    } else {
        elements.systemMessage.textContent =
            "Movement detected";
    }
}


/* ---------------------------------- */
/* DOOR ATTACKS */
/* ---------------------------------- */

function attemptDoorEntry(enemy, now) {
    const doorClosed =
        enemy.attackSide === "left"
            ? state.leftDoorClosed
            : state.rightDoorClosed;

    if (doorClosed) {
        repelEnemy(enemy, now);

        return;
    }

    enterOffice(enemy, now);
}


function repelEnemy(enemy, now) {
    if (
        enemy.behavior ===
        "stalker"
    ) {
        /*
        Rapper stays near the right side.

        The player must keep checking
        the cameras and manage the door.
        */

        enemy.nextMoveAt =
            now +
            enemy.movementInterval *
                1000;

        elements.systemMessage.textContent =
            "Something remains outside the right door";

        return;
    }

    enemy.routeIndex =
        enemy.behavior ===
            "corruptor"
            ? 0
            : 1;

    enemy.doorReachedAt = 0;

    elements.systemMessage.textContent =
        `${enemy.name} moved away`;
}


function enterOffice(enemy, now) {
    if (enemy.insideOffice) {
        return;
    }

    enemy.insideOffice = true;
    enemy.enteredOfficeAt = now;

    elements.systemMessage.textContent =
        "Something entered the office";

    /*
    Closing the door now does nothing.

    The enemy is already inside.
    It attacks when the monitor comes
    down or after the hidden timer.
    */
}


function updateOfficeIntruders(now) {
    enemies.forEach((enemy) => {
        if (!enemy.insideOffice) {
            return;
        }

        const timeInside =
            now -
            enemy.enteredOfficeAt;

        if (timeInside >= 25000) {
            triggerGameOver(enemy.name);
        }
    });
}


/* ---------------------------------- */
/* FARMER NEEGY */
/* ---------------------------------- */

function handleFarmerOpportunity(enemy) {
    /*
    Any camera usage freezes Farmer's
    movement opportunity.

    It does not matter which camera
    the player is viewing.
    */

    if (state.cameraOpen) {
        return;
    }

    if (!movementRoll(enemy)) {
        return;
    }

    enemy.runnerStage++;

    if (enemy.runnerStage < 3) {
        elements.systemMessage.textContent =
            "Movement near Teller Room 5";

        return;
    }

    startFarmerRun(enemy);
}


function startFarmerRun(enemy) {
    enemy.routeIndex =
        enemy.route.length - 1;

    renderHallThreats();
    renderCameraFeed();

    elements.systemMessage.textContent =
        "FAST FOOTSTEPS FROM THE LEFT";

    setTimeout(() => {
        if (
            !state.running ||
            state.powerOut
        ) {
            return;
        }

        if (state.leftDoorClosed) {
            const powerDamage =
                1 +
                enemy.runnerHits * 5;

            state.power =
                Math.max(
                    0,
                    state.power -
                        powerDamage
                );

            enemy.runnerHits++;
            enemy.runnerStage = 0;
            enemy.routeIndex = 0;

            elements.systemMessage.textContent =
                `Farmer hit the door: -${powerDamage}% power`;

            renderHallThreats();
            renderCameraFeed();

            return;
        }

        triggerGameOver(
            enemy.name
        );
    }, 1400);
}


/* ---------------------------------- */
/* BANANA NEEGY */
/* ---------------------------------- */

function updateBananaCorruption(
    deltaSeconds
) {
    const banana =
        enemies.find((enemy) => {
            return enemy.id === "banana";
        });

    if (
        !banana ||
        banana.insideOffice ||
        !state.cameraOpen ||
        getEnemyCamera(banana) !==
            state.currentCamera
    ) {
        if (banana) {
            banana.corruptionExposure = 0;
        }

        elements.cameraSystem.classList.remove(
            "corrupted"
        );

        return;
    }

    banana.corruptionExposure +=
        deltaSeconds;

    elements.cameraSystem.classList.add(
        "corrupted"
    );

    elements.cameraMovement.textContent =
        "SIGNAL CORRUPTED — SWITCH CAMERAS";

    if (
        banana.corruptionExposure >=
        4
    ) {
        banana.corruptionExposure = 0;

        elements.cameraSystem.classList.remove(
            "corrupted"
        );

        advanceEnemy(
            banana,
            performance.now()
        );

        state.camerasJammedUntil =
            performance.now() +
            5000;

        elements.systemMessage.textContent =
            "CAMERA NETWORK JAMMED";
    }
}


function updateCameraJam(now) {
    const jammed =
        now <
        state.camerasJammedUntil;

    elements.cameraButton.classList.toggle(
        "jammed",
        jammed
    );

    if (
        !jammed &&
        elements.systemMessage.textContent ===
            "CAMERA NETWORK JAMMED"
    ) {
        elements.systemMessage.textContent =
            "Camera network restored";
    }
}


/* ---------------------------------- */
/* HALL LIGHTS */
/* ---------------------------------- */

function getDoorEnemy(side) {
    return enemies.find((enemy) => {
        return (
            !enemy.insideOffice &&
            enemy.attackSide === side &&
            enemy.routeIndex ===
                enemy.route.length - 1
        );
    });
}


function renderHallThreats() {
    const leftEnemy =
        getDoorEnemy("left");

    const rightEnemy =
        getDoorEnemy("right");

    elements.leftHall.classList.toggle(
        "threat",
        Boolean(
            leftEnemy &&
            state.leftLightOn
        )
    );

    elements.rightHall.classList.toggle(
        "threat",
        Boolean(
            rightEnemy &&
            state.rightLightOn
        )
    );

    const leftLabel =
        elements.leftHall.querySelector(
            "span"
        );

    const rightLabel =
        elements.rightHall.querySelector(
            "span"
        );

    leftLabel.textContent =
        leftEnemy &&
        state.leftLightOn
            ? leftEnemy.name.toUpperCase()
            : "LEFT HALL";

    rightLabel.textContent =
        rightEnemy &&
        state.rightLightOn
            ? rightEnemy.name.toUpperCase()
            : "RIGHT HALL";
}


/* ---------------------------------- */
/* DOOR CONTROLS */
/* ---------------------------------- */

function toggleLeftDoor() {
    if (
        !state.running ||
        state.powerOut
    ) {
        return;
    }

    state.leftDoorClosed =
        !state.leftDoorClosed;

    elements.leftDoor.classList.toggle(
        "closed",
        state.leftDoorClosed
    );

    elements.leftDoorButton.classList.toggle(
        "active",
        state.leftDoorClosed
    );

    elements.systemMessage.textContent =
        state.leftDoorClosed
            ? "Left door closed"
            : "Left door opened";
}


function toggleRightDoor() {
    if (
        !state.running ||
        state.powerOut
    ) {
        return;
    }

    state.rightDoorClosed =
        !state.rightDoorClosed;

    elements.rightDoor.classList.toggle(
        "closed",
        state.rightDoorClosed
    );

    elements.rightDoorButton.classList.toggle(
        "active",
        state.rightDoorClosed
    );

    elements.systemMessage.textContent =
        state.rightDoorClosed
            ? "Right door closed"
            : "Right door opened";
}


function toggleLeftLight() {
    if (
        !state.running ||
        state.powerOut
    ) {
        return;
    }

    state.leftLightOn =
        !state.leftLightOn;

    elements.leftHall.classList.toggle(
        "light-on",
        state.leftLightOn
    );

    elements.leftLightButton.classList.toggle(
        "active",
        state.leftLightOn
    );

    renderHallThreats();
}


function toggleRightLight() {
    if (
        !state.running ||
        state.powerOut
    ) {
        return;
    }

    state.rightLightOn =
        !state.rightLightOn;

    elements.rightHall.classList.toggle(
        "light-on",
        state.rightLightOn
    );

    elements.rightLightButton.classList.toggle(
        "active",
        state.rightLightOn
    );

    renderHallThreats();
}


/* ---------------------------------- */
/* CAMERA MONITOR */
/* ---------------------------------- */

function toggleCameraSystem() {
    if (
        !state.running ||
        state.powerOut
    ) {
        return;
    }

    if (
        performance.now() <
        state.camerasJammedUntil
    ) {
        elements.systemMessage.textContent =
            "CAMERA SYSTEM JAMMED";

        return;
    }

    const wasOpen =
        state.cameraOpen;

    state.cameraOpen =
        !state.cameraOpen;

    elements.cameraSystem.classList.toggle(
        "hidden",
        !state.cameraOpen
    );

    elements.cameraButton.classList.toggle(
        "active",
        state.cameraOpen
    );

    elements.cameraButton.textContent =
        state.cameraOpen
            ? "LOWER MONITOR"
            : "OPEN CAMERAS";

    if (state.cameraOpen) {
        elements.systemMessage.textContent =
            "Camera system active";

        renderCameraFeed();
    } else {
        elements.systemMessage.textContent =
            "Monitor lowered";
    }

    /*
    If a Neegy entered while the monitor
    was raised, lowering it triggers the
    attack.
    */

    if (
        wasOpen &&
        !state.cameraOpen
    ) {
        const intruder =
            enemies.find((enemy) => {
                return enemy.insideOffice;
            });

        if (intruder) {
            setTimeout(() => {
                triggerGameOver(
                    intruder.name
                );
            }, 350);
        }
    }
}


/* ---------------------------------- */
/* POWER */
/* ---------------------------------- */

function drainPower(deltaSeconds) {
    const rates =
        gameData.powerDrainPerMinute;

    let drainPerMinute =
        rates.clock;

    if (state.cameraOpen) {
        drainPerMinute +=
            rates.cameras;
    }

    if (state.leftLightOn) {
        drainPerMinute +=
            rates.lights;
    }

    if (state.rightLightOn) {
        drainPerMinute +=
            rates.lights;
    }

    if (state.leftDoorClosed) {
        drainPerMinute +=
            rates.doors;
    }

    if (state.rightDoorClosed) {
        drainPerMinute +=
            rates.doors;
    }

    state.power -=
        (
            drainPerMinute /
            60
        ) *
        deltaSeconds;

    state.power =
        Math.max(
            0,
            state.power
        );
}


function updatePowerDisplay() {
    elements.powerText.textContent =
        `${Math.ceil(state.power)}%`;

    elements.powerFill.style.width =
        `${state.power}%`;

    let usage = 1;

    usage +=
        Number(state.cameraOpen);

    usage +=
        Number(state.leftLightOn);

    usage +=
        Number(state.rightLightOn);

    usage +=
        Number(state.leftDoorClosed);

    usage +=
        Number(state.rightDoorClosed);

    elements.usageBars.forEach(
        (bar, index) => {
            bar.classList.toggle(
                "active",
                index < usage
            );

            bar.classList.toggle(
                "warning",
                index < usage &&
                index >= 4
            );
        }
    );

    elements.powerFill.classList.toggle(
        "critical",
        state.power <= 20
    );
}


/* ---------------------------------- */
/* POWER FAILURE */
/* ---------------------------------- */

function beginPowerFailure(now) {
    if (state.powerOut) {
        return;
    }

    state.powerOut = true;
    state.power = 0;

    state.cameraOpen = false;

    state.leftDoorClosed = false;
    state.rightDoorClosed = false;

    state.leftLightOn = false;
    state.rightLightOn = false;

    resetOfficeControls();

    elements.cameraSystem.classList.add(
        "hidden"
    );

    elements.cameraButton.textContent =
        "NO POWER";

    elements.cameraButton.disabled =
        true;

    elements.systemMessage.textContent =
        "POWER FAILURE";

    document.body.classList.add(
        "power-out"
    );

    const blackoutDelay =
        8000 +
        Math.random() * 12000;

    state.blackoutAttackAt =
        now +
        blackoutDelay;
}


function updateBlackout(now) {
    if (
        now >=
        state.blackoutAttackAt
    ) {
        triggerGameOver(
            "Rapper Neegy"
        );
    }
}


/* ---------------------------------- */
/* NIGHT ENDING */
/* ---------------------------------- */

function completeNight() {
    if (!state.running) {
        return;
    }

    state.running = false;

    clearInterval(gameTimer);

    const unlockedNight =
        Math.min(
            7,
            state.night + 1
        );

    localStorage.setItem(
        "neegysUnlockedNight",
        String(unlockedNight)
    );

    document.body.classList.remove(
        "power-out"
    );

    elements.resultLabel.textContent =
        "SHIFT COMPLETE";

    elements.resultTitle.textContent =
        "6:00 AM";

    showScreen("result");
}


function triggerGameOver(enemyName) {
    if (
        state.gameOver ||
        !state.running
    ) {
        return;
    }

    state.gameOver = true;
    state.running = false;

    clearInterval(gameTimer);

    document.body.classList.remove(
        "power-out"
    );

    elements.resultLabel.textContent =
        `CAUGHT BY ${enemyName.toUpperCase()}`;

    elements.resultTitle.textContent =
        "GAME OVER";

    screens.result.classList.add(
        "danger"
    );

    showScreen("result");
}


/* ---------------------------------- */
/* RESET */
/* ---------------------------------- */

function resetOfficeControls() {
    elements.leftDoor.classList.remove(
        "closed"
    );

    elements.rightDoor.classList.remove(
        "closed"
    );

    elements.leftHall.classList.remove(
        "light-on",
        "threat"
    );

    elements.rightHall.classList.remove(
        "light-on",
        "threat"
    );

    elements.leftDoorButton.classList.remove(
        "active"
    );

    elements.rightDoorButton.classList.remove(
        "active"
    );

    elements.leftLightButton.classList.remove(
        "active"
    );

    elements.rightLightButton.classList.remove(
        "active"
    );

    elements.cameraButton.disabled =
        false;

    document.body.classList.remove(
        "power-out"
    );
}


/* ---------------------------------- */
/* BUTTON EVENTS */
/* ---------------------------------- */

elements.newGame.addEventListener(
    "click",
    () => startNight(1)
);


elements.selectNight.addEventListener(
    "click",
    () => {
        createNightButtons();
        showScreen("nights");
    }
);


elements.nightBack.addEventListener(
    "click",
    () => showScreen("menu")
);


elements.returnMenu.addEventListener(
    "click",
    () => {
        screens.result.classList.remove(
            "danger"
        );

        showScreen("menu");
    }
);


elements.settings.addEventListener(
    "click",
    () => {
        elements.menuMessage.textContent =
            "Settings will be added later";
    }
);


elements.sound.addEventListener(
    "click",
    () => {
        state.soundEnabled =
            !state.soundEnabled;

        elements.sound.textContent =
            state.soundEnabled
                ? "SOUND ON"
                : "SOUND OFF";
    }
);


elements.cameraButton.addEventListener(
    "click",
    toggleCameraSystem
);


elements.leftDoorButton.addEventListener(
    "click",
    toggleLeftDoor
);


elements.rightDoorButton.addEventListener(
    "click",
    toggleRightDoor
);


elements.leftLightButton.addEventListener(
    "click",
    toggleLeftLight
);


elements.rightLightButton.addEventListener(
    "click",
    toggleRightLight
);


/* ---------------------------------- */
/* KEYBOARD CONTROLS */
/* ---------------------------------- */

window.addEventListener(
    "keydown",
    (event) => {
        if (
            !state.running ||
            event.repeat
        ) {
            return;
        }

        switch (
            event.key.toLowerCase()
        ) {
            case " ":
                event.preventDefault();
                toggleCameraSystem();
                break;

            case "a":
                toggleLeftDoor();
                break;

            case "d":
                toggleRightDoor();
                break;

            case "q":
                toggleLeftLight();
                break;

            case "e":
                toggleRightLight();
                break;
        }
    }
);


loadGameData();
