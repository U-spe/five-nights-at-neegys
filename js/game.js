const screens = {
    menu: document.querySelector("#menuScreen"),
    nights: document.querySelector("#nightSelectScreen"),
    office: document.querySelector("#officeScreen"),
    result: document.querySelector("#resultScreen")
};

const newGameButton =
    document.querySelector("#newGameButton");

const selectNightButton =
    document.querySelector("#selectNightButton");

const nightBackButton =
    document.querySelector("#nightBackButton");

const settingsButton =
    document.querySelector("#settingsButton");

const soundButton =
    document.querySelector("#soundButton");

const returnMenuButton =
    document.querySelector("#returnMenuButton");

const cameraButton =
    document.querySelector("#cameraButton");

const cameraSystem =
    document.querySelector("#cameraSystem");

const nightGrid =
    document.querySelector("#nightGrid");

const cameraGrid =
    document.querySelector("#cameraGrid");

const menuMessage =
    document.querySelector("#menuMessage");

const systemMessage =
    document.querySelector("#systemMessage");

const nightNumber =
    document.querySelector("#nightNumber");

const gameHour =
    document.querySelector("#gameHour");

const shiftTimer =
    document.querySelector("#shiftTimer");

const powerText =
    document.querySelector("#powerText");

const powerFill =
    document.querySelector("#powerFill");

const usageBars =
    document.querySelectorAll("#usageBars i");

const cameraCode =
    document.querySelector("#cameraCode");

const cameraName =
    document.querySelector("#cameraName");

const selectedCameraName =
    document.querySelector("#selectedCameraName");

const cameraMovement =
    document.querySelector("#cameraMovement");

const leftDoorButton =
    document.querySelector("#leftDoorButton");

const rightDoorButton =
    document.querySelector("#rightDoorButton");

const leftLightButton =
    document.querySelector("#leftLightButton");

const rightLightButton =
    document.querySelector("#rightLightButton");

const leftDoor =
    document.querySelector("#leftDoor");

const rightDoor =
    document.querySelector("#rightDoor");

const leftHall =
    document.querySelector("#leftHall");

const rightHall =
    document.querySelector("#rightHall");

const resultLabel =
    document.querySelector("#resultLabel");

const resultTitle =
    document.querySelector("#resultTitle");


let gameData = null;
let cameras = [];
let enemies = [];

let currentNight = 1;
let currentCamera = "1a";

let elapsedSeconds = 0;
let power = 100;

let camerasOpen = false;
let soundEnabled = true;

let leftDoorClosed = false;
let rightDoorClosed = false;

let leftLightOn = false;
let rightLightOn = false;

let gameTimer = null;


const backupGameData = {
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
    }
};


async function loadGameData() {
    try {
        const responses = await Promise.all([
            fetch("data/game.json"),
            fetch("data/cameras.json"),
            fetch("data/enemies.json")
        ]);

        gameData = await responses[0].json();
        cameras = await responses[1].json();
        enemies = await responses[2].json();

        menuMessage.textContent =
            "All systems loaded";

        createCameraButtons();
    } catch (error) {
        console.error(error);

        gameData = backupGameData;

        menuMessage.textContent =
            "Run this using Live Server";

        cameras = getBackupCameras();

        createCameraButtons();
    }
}


function getBackupCameras() {
    return [
        { id: "1a", code: "1A", name: "Bank Safe" },
        { id: "1b", code: "1B", name: "Teller Room 1" },
        { id: "1c", code: "1C", name: "Main Entrance" },
        { id: "1d", code: "1D", name: "Main Room" },
        { id: "2a", code: "2A", name: "Teller Room 2" },
        { id: "2b", code: "2B", name: "Men's Bathroom" },
        { id: "2c", code: "2C", name: "Women's Bathroom" },
        { id: "3a", code: "3A", name: "Teller Room 3" },
        { id: "3b", code: "3B", name: "Stock Market Room" },
        { id: "3d", code: "3D", name: "Teller Room 4" },
        { id: "2d", code: "2D", name: "Main Desk" },
        { id: "1e", code: "1E", name: "Left Hallway" },
        { id: "2e", code: "2E", name: "Right Hallway" },
        { id: "3e", code: "3E", name: "Left Door" },
        { id: "4e", code: "4E", name: "Right Door" },
        { id: "1f", code: "1F", name: "Office (Locked)" },
        { id: "2f", code: "2F", name: "Teller Room 5" }
    ];
}


function showScreen(screenName) {
    Object.values(screens).forEach((screen) => {
        screen.classList.add("hidden");
    });

    screens[screenName].classList.remove("hidden");
}


function createNightButtons() {
    nightGrid.innerHTML = "";

    const unlockedNight = Number(
        localStorage.getItem("neegysUnlockedNight") || "1"
    );

    for (let night = 1; night <= 7; night++) {
        const button =
            document.createElement("button");

        const locked =
            night > unlockedNight;

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

        button.addEventListener("click", () => {
            startNight(night);
        });

        nightGrid.appendChild(button);
    }
}


function createCameraButtons() {
    cameraGrid.innerHTML = "";

    cameras.forEach((camera) => {
        const button =
            document.createElement("button");

        button.textContent =
            camera.code;

        button.dataset.cameraId =
            camera.id;

        if (camera.id === currentCamera) {
            button.classList.add("active");
        }

        button.addEventListener("click", () => {
            selectCamera(camera.id);
        });

        cameraGrid.appendChild(button);
    });
}


function selectCamera(cameraId) {
    currentCamera = cameraId;

    const selectedCamera =
        cameras.find((camera) => {
            return camera.id === cameraId;
        });

    document
        .querySelectorAll(".camera-grid button")
        .forEach((button) => {
            button.classList.toggle(
                "active",
                button.dataset.cameraId === cameraId
            );
        });

    if (!selectedCamera) {
        return;
    }

    cameraCode.textContent =
        `CAM ${selectedCamera.code}`;

    cameraName.textContent =
        selectedCamera.name;

    selectedCameraName.textContent =
        selectedCamera.name;

    const presentEnemies =
        enemies.filter((enemy) => {
            return enemy.startCamera === cameraId;
        });

    if (presentEnemies.length > 0) {
        cameraMovement.textContent =
            presentEnemies
                .map((enemy) => enemy.name)
                .join(" • ");
    } else {
        cameraMovement.textContent =
            "NO MOVEMENT DETECTED";
    }
}


function startNight(night) {
    clearInterval(gameTimer);

    currentNight = night;
    currentCamera = "1a";

    elapsedSeconds = 0;
    power = 100;

    camerasOpen = false;

    leftDoorClosed = false;
    rightDoorClosed = false;

    leftLightOn = false;
    rightLightOn = false;

    resetControls();

    nightNumber.textContent =
        String(currentNight);

    gameHour.textContent =
        "12 AM";

    shiftTimer.textContent =
        "0:00";

    systemMessage.textContent =
        `Night ${currentNight} started`;

    cameraSystem.classList.add("hidden");

    cameraButton.textContent =
        "OPEN CAMERAS";

    cameraButton.classList.remove("active");

    updatePowerDisplay();
    selectCamera("1a");

    showScreen("office");

    gameTimer = setInterval(gameLoop, 1000);
}


function gameLoop() {
    elapsedSeconds++;

    updateGameClock();
    drainPower();
    updatePowerDisplay();

    if (
        elapsedSeconds >=
        gameData.nightLengthSeconds
    ) {
        winNight();
    }

    if (power <= 0) {
        loseNight();
    }
}


function updateGameClock() {
    const totalLength =
        gameData.nightLengthSeconds;

    const progress =
        elapsedSeconds / totalLength;

    const hourIndex =
        Math.min(
            6,
            Math.floor(progress * 6)
        );

    gameHour.textContent =
        gameData.hourLabels[hourIndex];

    const minutes =
        Math.floor(elapsedSeconds / 60);

    const seconds =
        elapsedSeconds % 60;

    shiftTimer.textContent =
        `${minutes}:${String(seconds).padStart(2, "0")}`;
}


function drainPower() {
    const drain =
        gameData.powerDrainPerMinute;

    let drainPerMinute =
        drain.clock;

    if (camerasOpen) {
        drainPerMinute +=
            drain.cameras;
    }

    if (leftLightOn) {
        drainPerMinute +=
            drain.lights;
    }

    if (rightLightOn) {
        drainPerMinute +=
            drain.lights;
    }

    if (leftDoorClosed) {
        drainPerMinute +=
            drain.doors;
    }

    if (rightDoorClosed) {
        drainPerMinute +=
            drain.doors;
    }

    power -=
        drainPerMinute / 60;

    power = Math.max(0, power);
}


function updatePowerDisplay() {
    const roundedPower =
        Math.ceil(power);

    powerText.textContent =
        `${roundedPower}%`;

    powerFill.style.width =
        `${power}%`;

    let usage = 1;

    usage += Number(camerasOpen);
    usage += Number(leftLightOn);
    usage += Number(rightLightOn);
    usage += Number(leftDoorClosed);
    usage += Number(rightDoorClosed);

    usageBars.forEach((bar, index) => {
        bar.classList.toggle(
            "active",
            index < usage
        );

        bar.classList.toggle(
            "warning",
            index < usage && index >= 4
        );
    });

    if (power <= 20) {
        powerFill.style.background =
            "#e64242";
    } else {
        powerFill.style.background =
            "#8dff68";
    }
}


function resetControls() {
    leftDoor.classList.remove("closed");
    rightDoor.classList.remove("closed");

    leftHall.classList.remove("light-on");
    rightHall.classList.remove("light-on");

    leftDoorButton.classList.remove("active");
    rightDoorButton.classList.remove("active");

    leftLightButton.classList.remove("active");
    rightLightButton.classList.remove("active");
}


function toggleCameraSystem() {
    camerasOpen =
        !camerasOpen;

    cameraSystem.classList.toggle(
        "hidden",
        !camerasOpen
    );

    cameraButton.classList.toggle(
        "active",
        camerasOpen
    );

    cameraButton.textContent =
        camerasOpen
            ? "LOWER MONITOR"
            : "OPEN CAMERAS";

    systemMessage.textContent =
        camerasOpen
            ? "Camera system active"
            : "Camera system lowered";
}


function toggleLeftDoor() {
    leftDoorClosed =
        !leftDoorClosed;

    leftDoor.classList.toggle(
        "closed",
        leftDoorClosed
    );

    leftDoorButton.classList.toggle(
        "active",
        leftDoorClosed
    );

    systemMessage.textContent =
        leftDoorClosed
            ? "Left door closed"
            : "Left door opened";
}


function toggleRightDoor() {
    rightDoorClosed =
        !rightDoorClosed;

    rightDoor.classList.toggle(
        "closed",
        rightDoorClosed
    );

    rightDoorButton.classList.toggle(
        "active",
        rightDoorClosed
    );

    systemMessage.textContent =
        rightDoorClosed
            ? "Right door closed"
            : "Right door opened";
}


function toggleLeftLight() {
    leftLightOn =
        !leftLightOn;

    leftHall.classList.toggle(
        "light-on",
        leftLightOn
    );

    leftLightButton.classList.toggle(
        "active",
        leftLightOn
    );

    systemMessage.textContent =
        leftLightOn
            ? "Left hall light on"
            : "Left hall light off";
}


function toggleRightLight() {
    rightLightOn =
        !rightLightOn;

    rightHall.classList.toggle(
        "light-on",
        rightLightOn
    );

    rightLightButton.classList.toggle(
        "active",
        rightLightOn
    );

    systemMessage.textContent =
        rightLightOn
            ? "Right hall light on"
            : "Right hall light off";
}


function winNight() {
    clearInterval(gameTimer);

    const unlockedNight =
        Math.min(7, currentNight + 1);

    localStorage.setItem(
        "neegysUnlockedNight",
        String(unlockedNight)
    );

    resultLabel.textContent =
        "SHIFT COMPLETE";

    resultTitle.textContent =
        "6:00 AM";

    showScreen("result");
}


function loseNight() {
    clearInterval(gameTimer);

    camerasOpen = false;

    resultLabel.textContent =
        "POWER DEPLETED";

    resultTitle.textContent =
        "THE BANK WENT DARK";

    showScreen("result");
}


newGameButton.addEventListener(
    "click",
    () => startNight(1)
);

selectNightButton.addEventListener(
    "click",
    () => {
        createNightButtons();
        showScreen("nights");
    }
);

nightBackButton.addEventListener(
    "click",
    () => showScreen("menu")
);

returnMenuButton.addEventListener(
    "click",
    () => showScreen("menu")
);

settingsButton.addEventListener(
    "click",
    () => {
        menuMessage.textContent =
            "Settings coming next";
    }
);

soundButton.addEventListener(
    "click",
    () => {
        soundEnabled =
            !soundEnabled;

        soundButton.textContent =
            soundEnabled
                ? "SOUND ON"
                : "SOUND OFF";
    }
);

cameraButton.addEventListener(
    "click",
    toggleCameraSystem
);

leftDoorButton.addEventListener(
    "click",
    toggleLeftDoor
);

rightDoorButton.addEventListener(
    "click",
    toggleRightDoor
);

leftLightButton.addEventListener(
    "click",
    toggleLeftLight
);

rightLightButton.addEventListener(
    "click",
    toggleRightLight
);


loadGameData();
