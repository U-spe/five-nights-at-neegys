// @ts-check

(() => {
  "use strict";

  /** @typedef {"title"|"intro"|"playing"|"won"|"lost"} ScreenName */
  /** @typedef {"left"|"right"} DoorSide */
  /** @typedef {"wanderer"|"lurker"|"stalker"|"runner"|"corruptor"} EnemyBehavior */
  /** @typedef {{id:string,name:string,color:number,behavior:EnemyBehavior,start:string,route:string[],side:DoorSide,interval:number,backtrack:number,grace:number,ai:number[]}} EnemyConfig */
  /** @typedef {EnemyConfig & {camera:string,previousCamera:string,routeIndex:number,nextMove:number,moveStartedAt:number,moveDuration:number,insideOffice:boolean,breaching:boolean,breachAt:number,attackAt:number,pressure:number}} RuntimeEnemy */

  const canvas = /** @type {HTMLCanvasElement} */ (
    document.querySelector("#sceneCanvas")
  );

  const gameShell = document.querySelector("#gameShell");
  const titleScreen = document.querySelector("#titleScreen");
  const nightIntro = document.querySelector("#nightIntro");
  const resultScreen = document.querySelector("#resultScreen");
  const hud = document.querySelector("#hud");
  const officeControls = document.querySelector("#officeControls");
  const cameraInterface = document.querySelector("#cameraInterface");
  const cameraMap = document.querySelector("#cameraMap");
  const cameraNoise = document.querySelector("#cameraNoise");
  const flash = document.querySelector("#flash");
  const message = document.querySelector("#message");

  const monitorButton = /** @type {HTMLButtonElement} */ (
    document.querySelector("#monitorButton")
  );

  const monitorButtonText = document.querySelector("#monitorButtonText");

  const leftDoorButton = /** @type {HTMLButtonElement} */ (
    document.querySelector("#leftDoorButton")
  );

  const rightDoorButton = /** @type {HTMLButtonElement} */ (
    document.querySelector("#rightDoorButton")
  );

  const leftLightButton = /** @type {HTMLButtonElement} */ (
    document.querySelector("#leftLightButton")
  );

  const rightLightButton = /** @type {HTMLButtonElement} */ (
    document.querySelector("#rightLightButton")
  );

  const hourLabel = document.querySelector("#hourLabel");
  const nightLabel = document.querySelector("#nightLabel");
  const powerLabel = document.querySelector("#powerLabel");

  const powerFill = /** @type {HTMLElement} */ (
    document.querySelector("#powerFill")
  );

  const usageBars = [...document.querySelectorAll("#usageBars i")];
  const cameraCode = document.querySelector("#cameraCode");
  const cameraName = document.querySelector("#cameraName");
  const cameraTimestamp = document.querySelector("#cameraTimestamp");
  const cameraSignal = document.querySelector("#cameraSignal");
  const cameraStatus = document.querySelector("#cameraStatus");
  const introNight = document.querySelector("#introNight");
  const resultTitle = document.querySelector("#resultTitle");
  const resultText = document.querySelector("#resultText");
  const continueNight = document.querySelector("#continueNight");
  const titleMenuButtons = [...document.querySelectorAll(".menu-item")];

  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    powerPreference: "high-performance"
  });

  renderer.setSize(1280, 720, false);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.35));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.1;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  const cameraSystem = window.NeegyCameras.create();

  const NIGHT_SECONDS = 360;

  const POWER_RATES = {
    clock: 1,
    cameras: 2.5,
    lights: 2,
    doors: 4
  };

  const CAMERA_GRAPH = Object.freeze({
    "1a": ["2d"],
    "2d": ["1a", "1d"],
    "1d": ["2d", "1c", "2b", "2c", "1e", "2e"],
    "1c": ["1d"],
    "2b": ["1d"],
    "2c": ["1d"],
    "1e": ["1d", "1b", "3d", "2f", "3e"],
    "1b": ["1e"],
    "3d": ["1e"],
    "2f": ["1e"],
    "3e": ["1e"],
    "2e": ["1d", "3b", "2a", "3a", "4e"],
    "3b": ["2e"],
    "2a": ["2e"],
    "3a": ["2e"],
    "4e": ["2e"]
  });

  /** @type {EnemyConfig[]} */
  const ENEMY_CONFIGS = [
    {
      id: "regular",
      name: "Regular Neegy",
      color: 0x60ff8a,
      behavior: "wanderer",
      start: "1a",
      route: [
        "1a",
        "2d",
        "1d",
        "1c",
        "1d",
        "1e",
        "3d",
        "1e",
        "3e"
      ],
      side: "left",
      interval: 7.4,
      backtrack: 0.18,
      grace: 5.2,
      ai: [3, 5, 7, 10, 12, 15, 20]
    },
    {
      id: "girl",
      name: "Girl Neegy",
      color: 0xff6fb7,
      behavior: "lurker",
      start: "1a",
      route: [
        "1a",
        "2d",
        "1d",
        "2b",
        "1d",
        "2e",
        "2a",
        "2e",
        "4e"
      ],
      side: "right",
      interval: 8.1,
      backtrack: 0.24,
      grace: 5.8,
      ai: [1, 3, 5, 8, 11, 14, 20]
    },
    {
      id: "rapper",
      name: "Rapper Neegy",
      color: 0xff8b38,
      behavior: "stalker",
      start: "1a",
      route: [
        "1a",
        "2d",
        "1d",
        "2c",
        "1d",
        "2e",
        "3a",
        "2e",
        "4e"
      ],
      side: "right",
      interval: 6.2,
      backtrack: 0,
      grace: 3.2,
      ai: [0, 0, 2, 4, 7, 10, 20]
    },
    {
      id: "farmer",
      name: "Farmer Neegy",
      color: 0xffdd55,
      behavior: "runner",
      start: "2f",
      route: ["2f", "1e", "3e"],
      side: "left",
      interval: 9.2,
      backtrack: 0,
      grace: 2.4,
      ai: [1, 2, 4, 6, 9, 12, 20]
    },
    {
      id: "banana",
      name: "Banana Neegy",
      color: 0xc79bff,
      behavior: "corruptor",
      start: "1a",
      route: [
        "1a",
        "2d",
        "1d",
        "2e",
        "3b",
        "2e",
        "4e"
      ],
      side: "right",
      interval: 8.8,
      backtrack: 0.12,
      grace: 4.8,
      ai: [0, 0, 0, 3, 6, 10, 20]
    }
  ];

  for (const enemy of ENEMY_CONFIGS) {
    for (let step = 0; step < enemy.route.length - 1; step++) {
      const from = enemy.route[step];
      const to = enemy.route[step + 1];

      if (!CAMERA_GRAPH[from]?.includes(to)) {
        throw new Error(
          `Invalid movement route for ${enemy.name}: ${from} -> ${to}`
        );
      }
    }
  }

  const state = {
    /** @type {ScreenName} */
    screen: "title",
    night: 1,
    unlockedNight: Math.max(
      1,
      Math.min(
        7,
        Number(localStorage.getItem("neegysUnlockedNight")) || 1
      )
    ),
    menuIndex: 0,
    power: 100,
    elapsed: 0,
    startedAt: 0,
    introEndsAt: 0,
    powerOut: false,
    blackoutEndsAt: 0,
    monitorUp: false,
    selectedCamera: "1a",
    leftDoor: false,
    rightDoor: false,
    leftLight: false,
    rightLight: false,
    pan: 0,
    panTarget: 0,
    messageUntil: 0
  };

  /** @type {RuntimeEnemy[]} */
  let enemies = [];
  let lastFrame = performance.now();
  let audioContext = null;

  function material(color, options = {}) {
    return new THREE.MeshStandardMaterial({
      color,
      roughness: 0.7,
      metalness: 0.04,
      ...options
    });
  }

  function canvasTexture(width, height, paint) {
    const textureCanvas = document.createElement("canvas");
    textureCanvas.width = width;
    textureCanvas.height = height;

    const context = textureCanvas.getContext("2d");
    paint(context, textureCanvas);

    const texture = new THREE.CanvasTexture(textureCanvas);
    texture.colorSpace = THREE.SRGBColorSpace;

    return {
      texture,
      canvas: textureCanvas,
      context
    };
  }

  function repeatedTexture(size, repeatX, repeatY, paint) {
    const surface = canvasTexture(size, size, paint);

    surface.texture.wrapS = THREE.RepeatWrapping;
    surface.texture.wrapT = THREE.RepeatWrapping;
    surface.texture.repeat.set(repeatX, repeatY);
    surface.texture.anisotropy = Math.min(
      8,
      renderer.capabilities.getMaxAnisotropy()
    );

    return surface.texture;
  }

  function buildOffice() {
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x030504);
    scene.fog = new THREE.FogExp2(0x020302, 0.028);

    const camera = new THREE.PerspectiveCamera(68, 16 / 9, 0.1, 80);
    camera.position.set(0, 2.72, 7.35);

    const paintedWall = repeatedTexture(
      256,
      8,
      4,
      (ctx, image) => {
        ctx.fillStyle = "#8a8d87";
        ctx.fillRect(0, 0, image.width, image.height);

        for (let dot = 0; dot < 2400; dot++) {
          const shade = Math.floor(70 + Math.random() * 85);

          ctx.fillStyle =
            `rgba(${shade},${shade + 4},${shade},` +
            `${0.018 + Math.random() * 0.035})`;

          ctx.fillRect(
            Math.random() * image.width,
            Math.random() * image.height,
            1.5,
            1.5
          );
        }

        const stain = ctx.createRadialGradient(
          44,
          195,
          2,
          44,
          195,
          75
        );

        stain.addColorStop(0, "rgba(28,38,30,.16)");
        stain.addColorStop(1, "rgba(28,38,30,0)");

        ctx.fillStyle = stain;
        ctx.fillRect(0, 0, image.width, image.height);
      }
    );

    const concreteFloor = repeatedTexture(
      256,
      7,
      7,
      (ctx, image) => {
        ctx.fillStyle = "#353936";
        ctx.fillRect(0, 0, image.width, image.height);

        for (let chip = 0; chip < 3400; chip++) {
          const light = Math.random() > 0.55;

          ctx.fillStyle = light
            ? "rgba(180,190,182,.055)"
            : "rgba(0,0,0,.075)";

          const size = 0.5 + Math.random() * 2;

          ctx.fillRect(
            Math.random() * image.width,
            Math.random() * image.height,
            size,
            size
          );
        }

        ctx.strokeStyle = "rgba(10,12,10,.35)";
        ctx.lineWidth = 3;

        ctx.strokeRect(
          1.5,
          1.5,
          image.width - 3,
          image.height - 3
        );
      }
    );

    const woodGrain = repeatedTexture(
      256,
      5,
      2,
      (ctx, image) => {
        ctx.fillStyle = "#6f452b";
        ctx.fillRect(0, 0, image.width, image.height);

        for (let y = 5; y < image.height; y += 9) {
          ctx.strokeStyle =
            `rgba(33,13,5,${0.07 + Math.random() * 0.11})`;

          ctx.beginPath();
          ctx.moveTo(0, y);

          ctx.bezierCurveTo(
            62,
            y - 7,
            150,
            y + 8,
            image.width,
            y - 2
          );

          ctx.stroke();
        }
      }
    );

    const mats = {
      wall: material(0xb4b6af, {
        map: paintedWall,
        roughness: 0.98
      }),

      lowerWall: material(0x26352d, {
        map: paintedWall,
        roughness: 0.9
      }),

      floor: material(0xffffff, {
        map: concreteFloor,
        roughness: 0.94
      }),

      ceiling: material(0x696d68, {
        map: paintedWall,
        roughness: 0.97
      }),

      wood: material(0x8a5837, {
        map: woodGrain,
        roughness: 0.58
      }),

      woodTop: material(0xa06c43, {
        map: woodGrain,
        roughness: 0.38
      }),

      dark: material(0x090c0a, {
        roughness: 0.68
      }),

      black: material(0x020303, {
        roughness: 0.8
      }),

      steel: material(0x71797a, {
        metalness: 0.84,
        roughness: 0.22
      }),

      chrome: material(0xbec7c8, {
        metalness: 0.95,
        roughness: 0.1
      }),

      silver: material(0xd0d6d8, {
        metalness: 0.94,
        roughness: 0.2
      }),

      paper: material(0xd9d8ca, {
        roughness: 0.78
      }),

      red: material(0x6d1713, {
        emissive: 0x350300,
        emissiveIntensity: 0.4
      }),

      cork: material(0x8a755b, {
        roughness: 0.98
      }),

      rubber: material(0x241d19, {
        roughness: 0.86
      }),

      bottle: material(0x285477, {
        transparent: true,
        opacity: 0.78,
        roughness: 0.22
      }),

      yellow: material(0xe1b84a, {
        roughness: 0.72
      }),

      screen: material(0x06100a, {
        emissive: 0x42f57b,
        emissiveIntensity: 1.7
      }),

      clock: material(0x070908, {
        emissive: 0xff372f,
        emissiveIntensity: 1.8
      })
    };

    function box(
      x,
      y,
      z,
      width,
      height,
      depth,
      mat,
      rotationY = 0,
      parent = scene
    ) {
      const mesh = new THREE.Mesh(
        new THREE.BoxGeometry(width, height, depth),
        mat
      );

      mesh.position.set(x, y, z);
      mesh.rotation.y = rotationY;
      mesh.castShadow = true;
      mesh.receiveShadow = true;

      parent.add(mesh);

      return mesh;
    }

    function cylinder(
      x,
      y,
      z,
      radius,
      depth,
      mat,
      rotationX = 0,
      rotationZ = 0,
      parent = scene,
      segments = 24
    ) {
      const mesh = new THREE.Mesh(
        new THREE.CylinderGeometry(radius, radius, depth, segments),
        mat
      );

      mesh.position.set(x, y, z);
      mesh.rotation.x = rotationX;
      mesh.rotation.z = rotationZ;
      mesh.castShadow = true;
      mesh.receiveShadow = true;

      parent.add(mesh);

      return mesh;
    }

    function sphere(x, y, z, radius, mat, parent = scene) {
      const mesh = new THREE.Mesh(
        new THREE.SphereGeometry(radius, 18, 12),
        mat
      );

      mesh.position.set(x, y, z);
      mesh.castShadow = true;

      parent.add(mesh);

      return mesh;
    }

    function texturedPlane(
      x,
      y,
      z,
      width,
      height,
      texture,
      rotationY = 0,
      parent = scene
    ) {
      const mesh = new THREE.Mesh(
        new THREE.PlaneGeometry(width, height),
        new THREE.MeshBasicMaterial({
          map: texture,
          side: THREE.DoubleSide
        })
      );

      mesh.position.set(x, y, z);
      mesh.rotation.y = rotationY;

      parent.add(mesh);

      return mesh;
    }

    function screenTexture(seed) {
      return canvasTexture(
        512,
        320,
        (ctx, image) => {
          ctx.fillStyle = "#031008";
          ctx.fillRect(0, 0, image.width, image.height);

          ctx.strokeStyle = "rgba(77,255,130,.25)";
          ctx.lineWidth = 2;

          for (let x = 0; x < image.width; x += 42) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, image.height);
            ctx.stroke();
          }

          for (let y = 0; y < image.height; y += 36) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(image.width, y);
            ctx.stroke();
          }

          ctx.fillStyle = "#74ff9d";
          ctx.font = "bold 34px monospace";
          ctx.fillText(`CAM ${seed}`, 22, 48);

          ctx.font = "22px monospace";
          ctx.fillText("NEEGY NATIONAL BANK", 22, 292);

          ctx.strokeStyle = "#42db73";
          ctx.strokeRect(
            40 + seed * 13,
            75,
            180,
            120
          );
        }
      ).texture;
    }

    function posterTexture(
      title,
      subtitle,
      background,
      ink = "#171713"
    ) {
      return canvasTexture(
        512,
        640,
        (ctx, image) => {
          ctx.fillStyle = background;
          ctx.fillRect(0, 0, image.width, image.height);

          for (let grain = 0; grain < 1800; grain++) {
            ctx.fillStyle = Math.random() > 0.5
              ? "rgba(255,255,255,.035)"
              : "rgba(0,0,0,.04)";

            ctx.fillRect(
              Math.random() * image.width,
              Math.random() * image.height,
              2,
              2
            );
          }

          ctx.fillStyle = ink;
          ctx.textAlign = "center";
          ctx.font = "900 62px Arial";
          ctx.fillText(title, image.width / 2, 105);

          ctx.font = "700 29px Arial";

          const words = subtitle.split(" ");
          let line = "";
          let y = 166;

          for (const word of words) {
            const test = `${line}${word} `;

            if (ctx.measureText(test).width > 420) {
              ctx.fillText(line.trim(), image.width / 2, y);
              line = `${word} `;
              y += 38;
            } else {
              line = test;
            }
          }

          ctx.fillText(line.trim(), image.width / 2, y);

          ctx.strokeStyle = ink;
          ctx.lineWidth = 15;

          ctx.strokeRect(
            42,
            42,
            image.width - 84,
            image.height - 84
          );

          ctx.beginPath();
          ctx.arc(256, 410, 94, 0, Math.PI * 2);
          ctx.stroke();

          ctx.beginPath();
          ctx.moveTo(205, 410);
          ctx.lineTo(245, 455);
          ctx.lineTo(323, 355);
          ctx.stroke();
        }
      ).texture;
    }

    function wallPoster(
      title,
      subtitle,
      x,
      y,
      width,
      height,
      background,
      ink = "#171713",
      rotationY = 0,
      z = -5.06
    ) {
      const poster = texturedPlane(
        x,
        y,
        z,
        width,
        height,
        posterTexture(
          title,
          subtitle,
          background,
          ink
        ),
        rotationY
      );

      poster.rotation.z =
        THREE.MathUtils.randFloat(
          -0.035,
          0.035
        );

      return poster;
    }

    const deskFeedTarget = new THREE.WebGLRenderTarget(
      512,
      288,
      {
        minFilter: THREE.LinearFilter,
        magFilter: THREE.LinearFilter,
        depthBuffer: true
      }
    );

    deskFeedTarget.texture.colorSpace =
      THREE.SRGBColorSpace;

    function deskMonitor(
      x,
      y,
      z,
      screenId,
      rotationY = 0,
      screenMap = null
    ) {
      const group = new THREE.Group();

      group.position.set(x, y, z);
      group.rotation.y = rotationY;
      scene.add(group);

      box(
        0,
        0,
        0,
        1.75,
        1.08,
        0.18,
        mats.dark,
        0,
        group
      );

      texturedPlane(
        0,
        0,
        0.096,
        1.48,
        0.82,
        screenMap || screenTexture(screenId),
        0,
        group
      );

      cylinder(
        0,
        -0.72,
        0,
        0.06,
        0.55,
        mats.chrome,
        0,
        0,
        group,
        12
      );

      box(
        0,
        -1,
        0,
        0.7,
        0.08,
        0.45,
        mats.chrome,
        0,
        group
      );
    }

    function officeStickFigure(color) {
      const group = new THREE.Group();

      const figureMat = material(color, {
        roughness: 0.45
      });

      sphere(
        0,
        2.55,
        0,
        0.38,
        figureMat,
        group
      );

      cylinder(
        0,
        1.64,
        0,
        0.14,
        1.48,
        figureMat,
        0,
        0,
        group,
        12
      );

      cylinder(
        -0.38,
        1.7,
        0,
        0.08,
        1.15,
        figureMat,
        0,
        -0.5,
        group,
        10
      );

      cylinder(
        0.38,
        1.7,
        0,
        0.08,
        1.15,
        figureMat,
        0,
        0.5,
        group,
        10
      );

      cylinder(
        -0.2,
        0.58,
        0,
        0.1,
        1.25,
        figureMat,
        0,
        -0.18,
        group,
        10
      );

      cylinder(
        0.2,
        0.58,
        0,
        0.1,
        1.25,
        figureMat,
        0,
        0.18,
        group,
        10
      );

      group.visible = false;
      scene.add(group);

      return group;
    }

    function createDoor(side, x) {
      const shutter = new THREE.Group();

      shutter.position.set(x, 5.4, -1.1);
      scene.add(shutter);

      for (let panel = 0; panel < 10; panel++) {
        box(
          0,
          0.27 + panel * 0.48,
          0,
          0.42,
          0.42,
          4.25,
          mats.silver,
          0,
          shutter
        );

        box(
          side === "left" ? 0.225 : -0.225,
          0.46 + panel * 0.48,
          0,
          0.035,
          0.04,
          4.18,
          mats.steel,
          0,
          shutter
        );
      }

      box(
        x,
        5.2,
        -1.1,
        0.7,
        0.55,
        4.9,
        mats.silver
      );

      box(
        x,
        2.45,
        -3.32,
        0.65,
        4.9,
        0.42,
        mats.steel
      );

      box(
        x,
        2.45,
        1.12,
        0.65,
        4.9,
        0.42,
        mats.steel
      );

      box(
        x + (side === "left" ? 0.38 : -0.38),
        2.2,
        1.3,
        0.2,
        1.1,
        0.65,
        mats.dark
      );

      return {
        shutter,
        targetY: 5.4
      };
    }

    box(
      0,
      -0.12,
      0.6,
      14.6,
      0.24,
      13.2,
      mats.floor
    );

    box(
      0,
      5.75,
      0.6,
      14.6,
      0.22,
      13.2,
      mats.ceiling
    );

    box(
      0,
      2.88,
      -5.3,
      14.6,
      5.75,
      0.28,
      mats.cork
    );

    box(
      -7.15,
      2.88,
      -3.95,
      0.28,
      5.75,
      2.7,
      mats.cork
    );

    box(
      -7.15,
      2.88,
      3.35,
      0.28,
      5.75,
      4.1,
      mats.wall
    );

    box(
      7.15,
      2.88,
      -3.95,
      0.28,
      5.75,
      2.7,
      mats.cork
    );

    box(
      7.15,
      2.88,
      3.35,
      0.28,
      5.75,
      4.1,
      mats.wall
    );

    box(
      -9.2,
      -0.03,
      -1.1,
      4.2,
      0.1,
      4.25,
      mats.black
    );

    box(
      9.2,
      -0.03,
      -1.1,
      4.2,
      0.1,
      4.25,
      mats.black
    );

    box(
      -9.8,
      2.8,
      -1.1,
      0.2,
      5.6,
      4.25,
      mats.black
    );

    box(
      9.8,
      2.8,
      -1.1,
      0.2,
      5.6,
      4.25,
      mats.black
    );

    box(
      -7.12,
      2.85,
      -3.1,
      0.42,
      5.7,
      0.35,
      mats.wood
    );

    box(
      -7.12,
      2.85,
      0.9,
      0.42,
      5.7,
      0.35,
      mats.wood
    );

    box(
      7.12,
      2.85,
      -3.1,
      0.42,
      5.7,
      0.35,
      mats.wood
    );

    box(
      7.12,
      2.85,
      0.9,
      0.42,
      5.7,
      0.35,
      mats.wood
    );

    box(
      -6.96,
      2.85,
      -0.96,
      0.12,
      5.35,
      3.55,
      mats.steel
    );

    box(
      6.96,
      2.85,
      -0.96,
      0.12,
      5.35,
      3.55,
      mats.steel
    );

    wallPoster(
      "BANK NOTICE",
      "AUTHORIZED STAFF ONLY",
      -6.88,
      3.5,
      1.5,
      2.05,
      "#abb0ad",
      "#252a27",
      Math.PI / 2,
      -0.95
    );

    wallPoster(
      "STAY ALERT",
      "REPORT ALL ACTIVITY",
      6.88,
      3.5,
      1.5,
      2.05,
      "#abb0ad",
      "#252a27",
      -Math.PI / 2,
      -0.95
    );

    wallPoster(
      "NNB",
      "YOUR MONEY IS SAFE",
      -4.85,
      4.15,
      1.1,
      1.4,
      "#d9d5c4"
    );

    wallPoster(
      "ALERT",
      "WATCH EVERY HALL",
      -3.45,
      3.5,
      1.15,
      1.65,
      "#812d27",
      "#f2dfbd"
    );

    wallPoster(
      "SAVE",
      "TODAY FOR TOMORROW",
      -2.05,
      4.35,
      1.05,
      1.25,
      "#d7d2ba"
    );

    wallPoster(
      "CITY",
      "WHY THE VAULT HUMS",
      0.15,
      4.15,
      2.1,
      1.42,
      "#c9c2a9"
    );

    wallPoster(
      "SECURITY",
      "SEE SOMETHING SAY SOMETHING",
      2.25,
      3.6,
      1.15,
      1.6,
      "#263b31",
      "#e8eadb"
    );

    wallPoster(
      "SHIFT",
      "CHECK EVERY CAMERA",
      3.75,
      4.25,
      1.05,
      1.25,
      "#d5cdb4"
    );

    wallPoster(
      "NEEGY",
      "NATIONAL BANK",
      5.05,
      3.65,
      1.15,
      1.55,
      "#354936",
      "#ece4c7"
    );

    wallPoster(
      "LOG",
      "SIGN EVERY HOUR",
      -4.7,
      2.45,
      0.9,
      1.05,
      "#d8d3c2"
    );

    wallPoster(
      "CAM",
      "NO BLIND SPOTS",
      -3.2,
      2.25,
      1.15,
      1.05,
      "#252a27",
      "#d8e5d8"
    );

    wallPoster(
      "ROUTES",
      "LEFT AND RIGHT",
      -1.55,
      2.55,
      1.05,
      1.25,
      "#d5d0bc"
    );

    wallPoster(
      "6 AM",
      "KEEP THE DOORS READY",
      0.05,
      2.2,
      1.1,
      1.05,
      "#29362e",
      "#e4eadc"
    );

    wallPoster(
      "POWER",
      "USE ONLY WHAT YOU NEED",
      1.7,
      2.55,
      1.05,
      1.25,
      "#d8d1b8"
    );

    wallPoster(
      "VAULT",
      "COUNT TWICE",
      3.15,
      2.25,
      1.05,
      1.05,
      "#2d332f",
      "#e5ddc6"
    );

    wallPoster(
      "NIGHT",
      "STAY UNTIL SIX",
      4.7,
      2.5,
      1,
      1.2,
      "#d8d1bc"
    );

    box(
      0,
      1.58,
      -3.45,
      10.9,
      0.18,
      1.68,
      mats.woodTop
    );

    box(
      -5.05,
      0.75,
      -3.45,
      0.12,
      1.5,
      1.35,
      mats.steel
    );

    box(
      5.05,
      0.75,
      -3.45,
      0.12,
      1.5,
      1.35,
      mats.steel
    );

    box(
      -4.78,
      0.75,
      -3.45,
      0.06,
      1.5,
      1.28,
      mats.chrome,
      -0.18
    );

    box(
      4.78,
      0.75,
      -3.45,
      0.06,
      1.5,
      1.28,
      mats.chrome,
      0.18
    );

    box(
      -4.1,
      1.72,
      -3.25,
      1.55,
      0.035,
      0.95,
      mats.paper,
      -0.08
    );

    box(
      -3.82,
      1.77,
      -3.15,
      1.45,
      0.035,
      0.84,
      mats.paper,
      0.055
    );

    box(
      -2.65,
      1.82,
      -3.58,
      1.18,
      0.26,
      0.58,
      mats.dark,
      -0.08
    );

    box(
      -2.65,
      1.99,
      -3.6,
      0.78,
      0.08,
      0.4,
      mats.rubber,
      -0.08
    );

    cylinder(
      -1.3,
      1.88,
      -3.28,
      0.16,
      0.9,
      mats.dark,
      0,
      Math.PI / 2,
      scene,
      16
    );

    sphere(
      -0.25,
      1.82,
      -3.3,
      0.22,
      mats.red
    );

    cylinder(
      0.65,
      1.84,
      -3.3,
      0.13,
      0.78,
      mats.red,
      0,
      Math.PI / 2,
      scene,
      16
    );

    cylinder(
      1.65,
      1.91,
      -3.55,
      0.15,
      0.72,
      mats.dark,
      Math.PI / 2,
      0,
      scene,
      16
    );

    sphere(
      2.55,
      1.86,
      -3.45,
      0.22,
      mats.paper
    );

    sphere(
      3.1,
      1.86,
      -3.42,
      0.22,
      mats.paper
    );

    cylinder(
      4.15,
      2.02,
      -3.52,
      0.19,
      0.78,
      mats.bottle,
      0,
      0,
      scene,
      18
    );

    cylinder(
      4.15,
      2.45,
      -3.52,
      0.11,
      0.14,
      mats.blue,
      0,
      0,
      scene,
      14
    );

    sphere(
      4.72,
      1.84,
      -3.22,
      0.25,
      mats.red
    );

    const banana = new THREE.Mesh(
      new THREE.TorusGeometry(
        0.42,
        0.095,
        10,
        28,
        Math.PI * 1.25
      ),
      mats.yellow
    );

    banana.position.set(
      4.3,
      1.88,
      -2.9
    );

    banana.rotation.set(
      Math.PI / 2,
      0.1,
      -0.45
    );

    banana.castShadow = true;
    scene.add(banana);

    deskMonitor(
      3.2,
      2.37,
      -4.08,
      2,
      -0.04,
      deskFeedTarget.texture
    );

    cylinder(
      -5.65,
      0.48,
      -3.65,
      0.42,
      0.9,
      mats.dark,
      0,
      0,
      scene,
      12
    );

    sphere(
      -1.55,
      0.16,
      -1.25,
      0.17,
      mats.red
    );

    box(
      1.4,
      0.07,
      -0.75,
      1.35,
      0.035,
      0.48,
      mats.paper,
      0.18
    );

    const bankLogo = canvasTexture(
      512,
      512,
      (ctx, image) => {
        ctx.fillStyle = "#07140c";
        ctx.fillRect(0, 0, image.width, image.height);

        ctx.fillStyle = "#d3b657";
        ctx.beginPath();

        ctx.arc(
          256,
          205,
          135,
          0,
          Math.PI * 2
        );

        ctx.fill();

        ctx.fillStyle = "#123a24";
        ctx.font = "bold 210px Georgia";
        ctx.textAlign = "center";
        ctx.fillText("N", 256, 275);

        ctx.fillStyle = "#f4e8b0";
        ctx.font = "bold 38px Arial";

        ctx.fillText(
          "NEEGY NATIONAL",
          256,
          405
        );

        ctx.font = "30px Arial";
        ctx.fillText("BANK", 256, 452);
      }
    ).texture;

    box(
      -5.65,
      2.05,
      -5.08,
      1.15,
      1.25,
      0.12,
      mats.wood
    );

    texturedPlane(
      -5.65,
      2.05,
      -5,
      0.96,
      1.04,
      bankLogo
    );

    const clockSurface = canvasTexture(
      512,
      190,
      (ctx, image) => {
        ctx.fillStyle = "#050505";

        ctx.fillRect(
          0,
          0,
          image.width,
          image.height
        );

        ctx.fillStyle = "#ff3a30";
        ctx.textAlign = "center";
        ctx.font = "bold 120px monospace";
        ctx.fillText("12:00", 256, 135);
      }
    );

    box(
      5.45,
      4.82,
      -5.08,
      1.55,
      0.62,
      0.14,
      mats.dark
    );

    texturedPlane(
      5.45,
      4.82,
      -4.99,
      1.34,
      0.46,
      clockSurface.texture
    );

    const fan = new THREE.Group();

    fan.position.set(
      -4.65,
      1.72,
      -3.75
    );

    scene.add(fan);

    cylinder(
      0,
      0.35,
      0,
      0.08,
      0.7,
      mats.chrome,
      0,
      0,
      fan,
      12
    );

    cylinder(
      0,
      0.72,
      0,
      0.48,
      0.08,
      mats.dark,
      Math.PI / 2,
      0,
      fan,
      20
    );

    const blades = new THREE.Group();
    blades.position.set(0, 0.72, 0.08);
    fan.add(blades);

    for (let blade = 0; blade < 4; blade++) {
      const fanBlade = box(
        0,
        0.42,
        0,
        0.18,
        0.72,
        0.045,
        mats.steel,
        0,
        blades
      );

      fanBlade.rotation.z =
        blade * Math.PI / 2;
    }

    sphere(
      0,
      0.72,
      0.12,
      0.11,
      mats.chrome,
      fan
    );

    box(
      -4.65,
      1.76,
      -3.74,
      1.05,
      0.06,
      0.62,
      mats.dark
    );

    box(
      0,
      5.58,
      -2.05,
      3.2,
      0.07,
      0.56,
      material(0xfff4dc, {
        emissive: 0xffeed0,
        emissiveIntensity: 2.3
      })
    );

    const officeAmbient =
      new THREE.HemisphereLight(
        0xd8c8aa,
        0x090807,
        0.78
      );

    scene.add(officeAmbient);

    const officeLight = new THREE.PointLight(
      0xffe5bd,
      38,
      18
    );

    officeLight.position.set(
      0,
      5.1,
      -2.2
    );

    officeLight.castShadow = true;

    officeLight.shadow.mapSize.set(
      2048,
      2048
    );

    officeLight.shadow.bias =
      -0.0008;

    scene.add(officeLight);

    const dustGeometry =
      new THREE.BufferGeometry();

    const dustPositions =
      new Float32Array(180 * 3);

    for (
      let index = 0;
      index < dustPositions.length;
      index += 3
    ) {
      dustPositions[index] =
        THREE.MathUtils.randFloatSpread(17);

      dustPositions[index + 1] =
        Math.random() * 5.7;

      dustPositions[index + 2] =
        THREE.MathUtils.randFloat(
          -8.5,
          7.5
        );
    }

    dustGeometry.setAttribute(
      "position",
      new THREE.BufferAttribute(
        dustPositions,
        3
      )
    );

    const dust = new THREE.Points(
      dustGeometry,
      new THREE.PointsMaterial({
        color: 0xcfe1d3,
        size: 0.025,
        transparent: true,
        opacity: 0.28,
        depthWrite: false
      })
    );

    scene.add(dust);

    const leftLight = new THREE.SpotLight(
      0xfff1bf,
      0,
      25,
      Math.PI / 3.4,
      0.55,
      1.2
    );

    leftLight.position.set(
      -7.4,
      4.5,
      -1.2
    );

    leftLight.target.position.set(
      -9.8,
      1.2,
      -3.2
    );

    scene.add(
      leftLight,
      leftLight.target
    );

    const rightLight = new THREE.SpotLight(
      0xfff1bf,
      0,
      25,
      Math.PI / 3.4,
      0.55,
      1.2
    );

    rightLight.position.set(
      7.4,
      4.5,
      -1.2
    );

    rightLight.target.position.set(
      9.8,
      1.2,
      -3.2
    );

    scene.add(
      rightLight,
      rightLight.target
    );

    const leftDoor = createDoor(
      "left",
      -7.45
    );

    const rightDoor = createDoor(
      "right",
      7.45
    );

    const leftFigure =
      officeStickFigure(0x101310);

    leftFigure.position.set(
      -8.2,
      0,
      -1.1
    );

    leftFigure.rotation.y =
      Math.PI / 2;

    const rightFigure =
      officeStickFigure(0x101310);

    rightFigure.position.set(
      8.2,
      0,
      -1.1
    );

    rightFigure.rotation.y =
      -Math.PI / 2;

    function setClock(text) {
      const ctx =
        clockSurface.context;

      ctx.fillStyle = "#050505";

      ctx.fillRect(
        0,
        0,
        clockSurface.canvas.width,
        clockSurface.canvas.height
      );

      ctx.fillStyle = "#ff3a30";
      ctx.textAlign = "center";
      ctx.font = "bold 120px monospace";

      ctx.fillText(
        text.replace(" AM", ":00"),
        256,
        135
      );

      clockSurface.texture.needsUpdate =
        true;
    }

    function update(delta, elapsed) {
      const leftClosedY =
        state.leftDoor ? 0 : 5.4;

      const rightClosedY =
        state.rightDoor ? 0 : 5.4;

      leftDoor.shutter.position.y +=
        (
          leftClosedY -
          leftDoor.shutter.position.y
        ) *
        Math.min(1, delta * 9);

      rightDoor.shutter.position.y +=
        (
          rightClosedY -
          rightDoor.shutter.position.y
        ) *
        Math.min(1, delta * 9);

      leftLight.intensity +=
        (
          (
            state.leftLight &&
            !state.powerOut
              ? 90
              : 0
          ) -
          leftLight.intensity
        ) *
        Math.min(1, delta * 13);

      rightLight.intensity +=
        (
          (
            state.rightLight &&
            !state.powerOut
              ? 90
              : 0
          ) -
          rightLight.intensity
        ) *
        Math.min(1, delta * 13);

      officeAmbient.intensity +=
        (
          (
            state.powerOut
              ? 0.03
              : 0.78
          ) -
          officeAmbient.intensity
        ) *
        Math.min(1, delta * 2.4);

      const fluorescentFlicker =
        38 *
        (
          1 +
          Math.sin(elapsed * 8.1) *
            0.012 +
          Math.sin(elapsed * 27.4) *
            0.009
        );

      officeLight.intensity +=
        (
          (
            state.powerOut
              ? 0
              : fluorescentFlicker
          ) -
          officeLight.intensity
        ) *
        Math.min(1, delta * 2.4);

      blades.rotation.z -= delta * 8;

      dust.rotation.y =
        Math.sin(elapsed * 0.08) *
        0.035;

      dust.position.y =
        Math.sin(elapsed * 0.19) *
        0.025;

      const leftThreat =
        enemies.find(
          enemy =>
            enemy.camera === "3e" &&
            !enemy.insideOffice
        );

      const rightThreat =
        enemies.find(
          enemy =>
            enemy.camera === "4e" &&
            !enemy.insideOffice
        );

      leftFigure.visible = Boolean(
        leftThreat &&
        state.leftLight &&
        !state.monitorUp
      );

      rightFigure.visible = Boolean(
        rightThreat &&
        state.rightLight &&
        !state.monitorUp
      );

      if (leftThreat) {
        leftFigure.traverse(child => {
          if (child.material) {
            child.material.color.setHex(
              leftThreat.color
            );
          }
        });
      }

      if (rightThreat) {
        rightFigure.traverse(child => {
          if (child.material) {
            child.material.color.setHex(
              rightThreat.color
            );
          }
        });
      }

      state.pan +=
        (
          state.panTarget -
          state.pan
        ) *
        Math.min(1, delta * 3.2);

      camera.position.x =
        state.pan * 1.05;

      camera.position.y =
        2.72 +
        Math.sin(elapsed * 0.55) *
          0.008;

      camera.position.z =
        7.35 +
        Math.sin(elapsed * 0.31) *
          0.012;

      camera.lookAt(
        state.pan * 3.65,
        2.25 +
          Math.sin(elapsed * 0.4) *
            0.006,
        -2.7
      );
    }

    return {
      scene,
      camera,
      update,
      setClock,
      deskFeedTarget
    };
  }

  const office = buildOffice();
  let lastDeskFeed = 0;

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
      audioContext?.state ===
      "suspended"
    ) {
      audioContext.resume();
    }
  }

  function tone(
    frequency,
    duration = 0.08,
    volume = 0.035,
    type = "square"
  ) {
    if (!audioContext) return;

    const oscillator =
      audioContext.createOscillator();

    const gain =
      audioContext.createGain();

    oscillator.frequency.value =
      frequency;

    oscillator.type = type;

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
    gain.connect(
      audioContext.destination
    );

    oscillator.start();

    oscillator.stop(
      audioContext.currentTime +
        duration
    );
  }

  function staticBurst(
    duration = 0.1,
    volume = 0.025
  ) {
    if (!audioContext) return;

    const samples = Math.floor(
      audioContext.sampleRate *
        duration
    );

    const buffer =
      audioContext.createBuffer(
        1,
        samples,
        audioContext.sampleRate
      );

    const channel =
      buffer.getChannelData(0);

    for (
      let i = 0;
      i < samples;
      i++
    ) {
      channel[i] =
        Math.random() * 2 - 1;
    }

    const source =
      audioContext.createBufferSource();

    const gain =
      audioContext.createGain();

    source.buffer = buffer;
    gain.gain.value = volume;

    source.connect(gain);
    gain.connect(
      audioContext.destination
    );

    source.start();
  }

  function createEnemies(now) {
    enemies = ENEMY_CONFIGS.map(
      config => ({
        ...config,
        camera: config.start,
        previousCamera: config.start,
        routeIndex: 0,

        nextMove:
          now +
          (
            config.interval +
            Math.random() * 4
          ) *
          1000,

        moveStartedAt: 0,
        moveDuration: 1,
        insideOffice: false,
        breaching: false,
        breachAt: 0,
        attackAt: 0,
        pressure: 0
      })
    );
  }

  function doorClosed(side) {
    return side === "left"
      ? state.leftDoor
      : state.rightDoor;
  }

  function showMessage(
    text,
    seconds = 1.5
  ) {
    message.textContent = text;
    message.classList.remove("hidden");

    state.messageUntil =
      performance.now() +
      seconds * 1000;
  }

  function startEnemyTransition(
    enemy,
    nextCamera,
    now,
    duration =
      1100 + Math.random() * 650
  ) {
    const oldCamera = enemy.camera;

    enemy.previousCamera = oldCamera;
    enemy.camera = nextCamera;
    enemy.moveStartedAt = now;
    enemy.moveDuration = duration;

    if (
      state.monitorUp &&
      (
        state.selectedCamera ===
          oldCamera ||
        state.selectedCamera ===
          nextCamera
      )
    ) {
      switchStatic();
    }
  }

  function retreatFromDoor(
    enemy,
    now
  ) {
    enemy.breaching = false;
    enemy.breachAt = 0;

    enemy.routeIndex = Math.max(
      0,
      enemy.routeIndex - 2
    );

    startEnemyTransition(
      enemy,
      enemy.route[enemy.routeIndex],
      now,
      900 + Math.random() * 500
    );

    enemy.nextMove =
      now +
      (
        enemy.interval +
        4 +
        Math.random() * 3
      ) *
      1000;

    tone(
      75,
      0.16,
      0.035,
      "sawtooth"
    );
  }

  function moveEnemy(
    enemy,
    now,
    forceMove = false
  ) {
    if (
      enemy.insideOffice ||
      enemy.breaching
    ) {
      return;
    }

    const level =
      enemy.ai[
        Math.min(
          enemy.ai.length - 1,
          state.night - 1
        )
      ] || 0;

    enemy.nextMove =
      now +
      (
        enemy.interval +
        Math.random() * 4.5
      ) *
      1000;

    if (level <= 0) return;

    if (!forceMove) {
      const movementRoll =
        Math.floor(
          Math.random() * 20
        ) + 1;

      if (movementRoll > level) {
        return;
      }
    }

    const watchedHere =
      state.monitorUp &&
      state.selectedCamera ===
        enemy.camera;

    if (
      enemy.behavior ===
        "wanderer" &&
      watchedHere &&
      Math.random() < 0.68
    ) {
      return;
    }

    if (
      enemy.behavior ===
        "lurker" &&
      watchedHere &&
      Math.random() < 0.82
    ) {
      return;
    }

    if (
      enemy.behavior ===
        "stalker" &&
      state.monitorUp &&
      Math.random() < 0.58
    ) {
      return;
    }

    if (
      enemy.routeIndex ===
      enemy.route.length - 1
    ) {
      if (doorClosed(enemy.side)) {
        retreatFromDoor(enemy, now);
        return;
      }

      enemy.breaching = true;

      enemy.breachAt =
        now + enemy.grace * 1000;

      showMessage(
        `${enemy.side.toUpperCase()} DOOR ACTIVITY`,
        1.35
      );

      tone(
        62,
        0.22,
        0.05,
        "sawtooth"
      );

      return;
    }

    if (
      enemy.routeIndex > 0 &&
      Math.random() <
        enemy.backtrack
    ) {
      enemy.routeIndex--;
    } else {
      enemy.routeIndex++;
    }

    const travelTime =
      enemy.behavior === "runner"
        ? 620 + Math.random() * 260
        : enemy.behavior === "stalker"
          ? 850 +
            Math.random() * 360
          : 1050 +
            Math.random() * 650;

    startEnemyTransition(
      enemy,
      enemy.route[enemy.routeIndex],
      now,
      travelTime
    );

    if (
      enemy.behavior ===
        "corruptor" &&
      state.monitorUp
    ) {
      staticBurst(
        0.12,
        0.035
      );
    }
  }

  function updateEnemies(
    delta,
    now
  ) {
    for (const enemy of enemies) {
      const level =
        enemy.ai[
          Math.min(
            enemy.ai.length - 1,
            state.night - 1
          )
        ] || 0;

      if (
        enemy.behavior === "runner" &&
        enemy.routeIndex === 0 &&
        !enemy.breaching &&
        !enemy.insideOffice
      ) {
        const watchingStart =
          state.monitorUp &&
          state.selectedCamera === "2f";

        const pressureRate =
          0.01 +
          level * 0.00235;

        enemy.pressure =
          THREE.MathUtils.clamp(
            enemy.pressure +
              (
                watchingStart
                  ? -delta * 0.22
                  : delta *
                    pressureRate
              ),
            0,
            1
          );

        if (
          enemy.pressure >= 1 &&
          now >= enemy.nextMove
        ) {
          enemy.pressure = 0.18;

          moveEnemy(
            enemy,
            now,
            true
          );
        }
      } else if (
        !enemy.insideOffice &&
        !enemy.breaching &&
        now >= enemy.nextMove
      ) {
        moveEnemy(enemy, now);
      }

      if (enemy.breaching) {
        if (
          doorClosed(enemy.side)
        ) {
          showMessage(
            `${enemy.side.toUpperCase()} DOOR BLOCKED`,
            1.1
          );

          retreatFromDoor(
            enemy,
            now
          );

          continue;
        }

        if (now >= enemy.breachAt) {
          enemy.breaching = false;
          enemy.insideOffice = true;

          enemy.attackAt =
            now +
            850 +
            Math.random() * 650;

          showMessage(
            "MOVEMENT INSIDE OFFICE",
            1
          );
        }
      }

      if (
        enemy.insideOffice &&
        now >= enemy.attackAt
      ) {
        loseNight(enemy.name);
      }
    }
  }

  function startNight(
    night = state.night
  ) {
    enableAudio();

    const now =
      performance.now();

    state.night = Math.max(
      1,
      Math.min(
        7,
        Number(night) || 1
      )
    );

    state.screen = "intro";
    state.power = 100;
    state.elapsed = 0;
    state.powerOut = false;
    state.monitorUp = false;
    state.leftDoor = false;
    state.rightDoor = false;
    state.leftLight = false;
    state.rightLight = false;
    state.selectedCamera = "1a";
    state.introEndsAt =
      now + 2500;

    introNight.textContent =
      `NIGHT ${state.night}`;

    titleScreen.classList.add(
      "hidden"
    );

    resultScreen.classList.add(
      "hidden"
    );

    nightIntro.classList.remove(
      "hidden"
    );

    hud.classList.add("hidden");

    officeControls.classList.add(
      "hidden"
    );

    monitorButton.classList.add(
      "hidden"
    );

    createEnemies(now);
    setMonitor(false, true);
    staticBurst(0.12, 0.03);
  }

  function setMenuIndex(index) {
    state.menuIndex =
      (
        index +
        titleMenuButtons.length
      ) %
      titleMenuButtons.length;

    titleMenuButtons.forEach(
      (button, buttonIndex) => {
        button.classList.toggle(
          "active",
          buttonIndex ===
            state.menuIndex
        );
      }
    );

    tone(
      135 +
        state.menuIndex * 18,
      0.035,
      0.018
    );
  }

  function activateMenu(
    index = state.menuIndex
  ) {
    setMenuIndex(index);

    if (state.menuIndex === 0) {
      startNight(1);
    }

    if (state.menuIndex === 1) {
      startNight(
        state.unlockedNight
      );
    }

    if (state.menuIndex === 2) {
      startNight(7);
    }
  }

  function beginOffice(now) {
    state.screen = "playing";
    state.startedAt = now;

    nightIntro.classList.add(
      "hidden"
    );

    hud.classList.remove("hidden");

    officeControls.classList.remove(
      "hidden"
    );

    monitorButton.classList.remove(
      "hidden"
    );

    updateUI();
  }

  function setMonitor(
    open,
    silent = false
  ) {
    if (
      state.powerOut &&
      open
    ) {
      return;
    }

    state.monitorUp = open;

    gameShell.classList.toggle(
      "monitor-open",
      open
    );

    cameraInterface.classList.toggle(
      "hidden",
      !open
    );

    officeControls.classList.toggle(
      "hidden",
      open ||
        state.screen !== "playing"
    );

    monitorButtonText.textContent =
      open
        ? "CLOSE CAMERAS"
        : "OPEN CAMERAS";

    if (open) {
      cameraSystem.show(
        state.selectedCamera
      );

      switchStatic();

      requestAnimationFrame(
        drawMapConnections
      );
    }

    if (!silent) {
      staticBurst(0.09, 0.03);
    }
  }

  function switchStatic() {
    cameraNoise.classList.remove(
      "switching"
    );

    void cameraNoise.offsetWidth;

    cameraNoise.classList.add(
      "switching"
    );

    staticBurst(0.055, 0.018);
  }

  function selectCamera(id) {
    if (!cameraSystem.show(id)) {
      return;
    }

    state.selectedCamera = id;

    const selected =
      cameraSystem.getCurrent();

    cameraCode.textContent =
      `CAM ${selected.code}`;

    cameraName.textContent =
      selected.name.toUpperCase();

    [...cameraMap.children].forEach(
      button => {
        button.classList.toggle(
          "active",
          button.dataset.camera === id
        );
      }
    );

    switchStatic();
  }

  function toggleDoor(side) {
    if (
      state.powerOut ||
      state.screen !== "playing"
    ) {
      return;
    }

    if (side === "left") {
      state.leftDoor =
        !state.leftDoor;
    } else {
      state.rightDoor =
        !state.rightDoor;
    }

    tone(
      95,
      0.14,
      0.045
    );

    updateControlButtons();
  }

  function setLight(side, on) {
    if (
      state.powerOut ||
      state.monitorUp ||
      state.screen !== "playing"
    ) {
      on = false;
    }

    if (side === "left") {
      state.leftLight = on;
    } else {
      state.rightLight = on;
    }

    if (on) {
      tone(
        205,
        0.055,
        0.02
      );
    }

    updateControlButtons();
  }

  function updateControlButtons() {
    leftDoorButton.classList.toggle(
      "active",
      state.leftDoor
    );

    rightDoorButton.classList.toggle(
      "active",
      state.rightDoor
    );

    leftLightButton.classList.toggle(
      "active",
      state.leftLight
    );

    rightLightButton.classList.toggle(
      "active",
      state.rightLight
    );

    cameraSystem.setDoorState(
      "left",
      state.leftDoor
    );

    cameraSystem.setDoorState(
      "right",
      state.rightDoor
    );
  }

  function currentHourIndex() {
    return Math.min(
      6,
      Math.floor(
        (
          state.elapsed /
          NIGHT_SECONDS
        ) *
        6
      )
    );
  }

  function currentHourText() {
    const index =
      currentHourIndex();

    return index === 0
      ? "12 AM"
      : `${index} AM`;
  }

  function updateUI() {
    const roundedPower =
      Math.max(
        0,
        Math.ceil(state.power)
      );

    powerLabel.textContent =
      `${roundedPower}%`;

    powerFill.style.width =
      `${state.power}%`;

    powerFill.style.background =
      state.power > 50
        ? "#77ff9c"
        : state.power > 20
          ? "#ffe45c"
          : "#ff493f";

    hourLabel.textContent =
      currentHourText();

    nightLabel.textContent =
      `NIGHT ${state.night}`;

    office.setClock(
      currentHourText()
    );

    const gameMinute =
      Math.min(
        359,
        Math.floor(state.elapsed)
      );

    const displayHour =
      Math.floor(gameMinute / 60);

    const displayMinute =
      String(
        gameMinute % 60
      ).padStart(2, "0");

    cameraTimestamp.textContent =
      `NIGHT ${state.night} · ` +
      `${displayHour === 0 ? 12 : displayHour}:` +
      `${displayMinute}:00 AM`;

    const selectedEnemies =
      enemies.filter(
        enemy =>
          !enemy.insideOffice &&
          enemy.camera ===
            state.selectedCamera
      );

    const cameraJammed =
      state.monitorUp &&
      selectedEnemies.some(
        enemy =>
          enemy.behavior ===
          "corruptor"
      );

    const signalStrength =
      cameraJammed
        ? 72 +
          Math.floor(
            (
              Math.sin(
                state.elapsed * 6.3
              ) + 1
            ) * 8
          )
        : 97 +
          Math.floor(
            (
              Math.sin(
                state.elapsed * 1.7
              ) + 1
            ) * 1.45
          );

    cameraSignal.textContent =
      `NNB-SEC · SIGNAL ${signalStrength}%`;

    gameShell.classList.toggle(
      "camera-jammed",
      cameraJammed
    );

    if (
      state.selectedCamera === "3e"
    ) {
      cameraStatus.textContent =
        `LEFT SECURITY DOOR · ` +
        `${
          state.leftDoor
            ? "CLOSED"
            : "OPEN"
        }`;

      cameraStatus.dataset.state =
        state.leftDoor
          ? "closed"
          : "open";
    } else if (
      state.selectedCamera === "4e"
    ) {
      cameraStatus.textContent =
        `RIGHT SECURITY DOOR · ` +
        `${
          state.rightDoor
            ? "CLOSED"
            : "OPEN"
        }`;

      cameraStatus.dataset.state =
        state.rightDoor
          ? "closed"
          : "open";
    } else {
      cameraStatus.textContent =
        selectedEnemies.length
          ? "MOTION DETECTED"
          : "NO MOTION";

      cameraStatus.dataset.state =
        selectedEnemies.length
          ? "motion"
          : "clear";
    }

    const usage =
      1 +
      Number(state.monitorUp) +
      Number(state.leftDoor) +
      Number(state.rightDoor) +
      Number(state.leftLight) +
      Number(state.rightLight);

    usageBars.forEach(
      (bar, index) => {
        bar.className = "";

        if (index < usage) {
          bar.classList.add(
            "active"
          );
        }

        if (
          index < usage &&
          usage >= 4
        ) {
          bar.classList.add(
            "hot"
          );
        }

        if (
          index < usage &&
          usage >= 6
        ) {
          bar.classList.add(
            "danger"
          );
        }
      }
    );

    [...cameraMap.children].forEach(
      button =>
        button.classList.remove(
          "enemy"
        )
    );
  }

  function drainPower(delta) {
    let perMinute =
      POWER_RATES.clock;

    if (state.monitorUp) {
      perMinute +=
        POWER_RATES.cameras;
    }

    if (state.leftLight) {
      perMinute +=
        POWER_RATES.lights;
    }

    if (state.rightLight) {
      perMinute +=
        POWER_RATES.lights;
    }

    if (state.leftDoor) {
      perMinute +=
        POWER_RATES.doors;
    }

    if (state.rightDoor) {
      perMinute +=
        POWER_RATES.doors;
    }

    state.power = Math.max(
      0,
      state.power -
        (perMinute / 60) *
        delta
    );
  }

  function beginPowerOut(now) {
    if (state.powerOut) {
      return;
    }

    state.powerOut = true;
    state.power = 0;
    state.leftDoor = false;
    state.rightDoor = false;
    state.leftLight = false;
    state.rightLight = false;

    state.blackoutEndsAt =
      now +
      8500 +
      Math.random() * 7000;

    setMonitor(false);
    updateControlButtons();

    showMessage(
      "POWER OUT",
      3
    );

    tone(
      42,
      1.3,
      0.07,
      "sawtooth"
    );
  }

  function loseNight(
    enemyName = "Power Failure"
  ) {
    if (
      state.screen !== "playing"
    ) {
      return;
    }

    state.screen = "lost";

    setMonitor(false, true);

    hud.classList.add("hidden");

    officeControls.classList.add(
      "hidden"
    );

    monitorButton.classList.add(
      "hidden"
    );

    flash.classList.remove(
      "active"
    );

    void flash.offsetWidth;

    flash.classList.add(
      "active"
    );

    staticBurst(
      0.75,
      0.1
    );

    tone(
      58,
      0.7,
      0.09,
      "sawtooth"
    );

    setTimeout(() => {
      resultTitle.textContent =
        "GAME OVER";

      resultText.textContent =
        `CAUGHT BY ${enemyName.toUpperCase()}`;

      resultScreen.classList.remove(
        "hidden"
      );
    }, 650);
  }

  function winNight() {
    if (
      state.screen !== "playing"
    ) {
      return;
    }

    state.screen = "won";

    setMonitor(false, true);

    hud.classList.add("hidden");

    officeControls.classList.add(
      "hidden"
    );

    monitorButton.classList.add(
      "hidden"
    );

    resultTitle.textContent =
      "6 AM";

    resultText.textContent =
      "SHIFT COMPLETE";

    resultScreen.classList.remove(
      "hidden"
    );

    state.unlockedNight =
      Math.max(
        state.unlockedNight,
        Math.min(
          7,
          state.night + 1
        )
      );

    localStorage.setItem(
      "neegysUnlockedNight",
      String(state.unlockedNight)
    );

    continueNight.textContent =
      `NIGHT ${state.unlockedNight}`;

    tone(
      880,
      0.45,
      0.06,
      "square"
    );
  }

  function update(delta, now) {
    if (
      state.screen === "intro" &&
      now >= state.introEndsAt
    ) {
      beginOffice(now);
    }

    if (
      state.screen !== "playing"
    ) {
      return;
    }

    state.elapsed =
      (now - state.startedAt) /
      1000;

    if (
      state.elapsed >=
      NIGHT_SECONDS
    ) {
      winNight();
      return;
    }

    if (
      state.messageUntil &&
      now >= state.messageUntil
    ) {
      message.classList.add(
        "hidden"
      );

      state.messageUntil = 0;
    }

    if (!state.powerOut) {
      drainPower(delta);
      updateEnemies(delta, now);

      if (state.power <= 0) {
        beginPowerOut(now);
      }
    } else if (
      now >= state.blackoutEndsAt
    ) {
      loseNight(
        "Power Failure"
      );
    }

    updateUI();
  }

  function render(delta, now) {
    const elapsed = now / 1000;

    office.update(
      delta,
      elapsed
    );

    cameraSystem.update(
      delta,
      elapsed,
      enemies.map(enemy => ({
        id: enemy.id,
        camera: enemy.camera,
        previousCamera:
          enemy.previousCamera,

        moveProgress:
          enemy.moveStartedAt
            ? THREE.MathUtils.clamp(
                (
                  now -
                  enemy.moveStartedAt
                ) /
                  enemy.moveDuration,
                0,
                1
              )
            : 1,

        color: enemy.color,
        insideOffice:
          enemy.insideOffice
      }))
    );

    if (
      !state.monitorUp &&
      state.screen === "playing" &&
      now - lastDeskFeed >= 125
    ) {
      renderer.setRenderTarget(
        office.deskFeedTarget
      );

      renderer.toneMappingExposure =
        0.78;

      renderer.render(
        cameraSystem.scene,
        cameraSystem.camera
      );

      renderer.setRenderTarget(null);
      lastDeskFeed = now;
    }

    if (
      state.monitorUp &&
      state.screen === "playing"
    ) {
      renderer.toneMappingExposure =
        0.82;

      renderer.render(
        cameraSystem.scene,
        cameraSystem.camera
      );
    } else {
      renderer.toneMappingExposure =
        1.16;

      renderer.render(
        office.scene,
        office.camera
      );
    }
  }

  cameraSystem.cameras.forEach(
    cameraData => {
      const button =
        document.createElement(
          "button"
        );

      button.type = "button";

      button.className =
        "camera-map-button";

      button.dataset.camera =
        cameraData.id;

      button.textContent =
        `CAM ${cameraData.code}`;

      button.title =
        cameraData.name;

      button.addEventListener(
        "click",
        () =>
          selectCamera(
            cameraData.id
          )
      );

      cameraMap.append(button);
    }
  );

  function drawMapConnections() {
    cameraMap
      .querySelector(".map-links")
      ?.remove();

    const bounds =
      cameraMap.getBoundingClientRect();

    if (
      !bounds.width ||
      !bounds.height
    ) {
      return;
    }

    const svg =
      document.createElementNS(
        "http://www.w3.org/2000/svg",
        "svg"
      );

    svg.setAttribute(
      "class",
      "map-links"
    );

    svg.setAttribute(
      "viewBox",
      `0 0 ${bounds.width} ${bounds.height}`
    );

    const drawn = new Set();

    for (
      const [
        from,
        destinations
      ] of Object.entries(
        CAMERA_GRAPH
      )
    ) {
      for (const to of destinations) {
        const edge =
          [from, to]
            .sort()
            .join("-");

        if (drawn.has(edge)) {
          continue;
        }

        drawn.add(edge);

        const fromButton =
          cameraMap.querySelector(
            `[data-camera="${from}"]`
          );

        const toButton =
          cameraMap.querySelector(
            `[data-camera="${to}"]`
          );

        if (
          !fromButton ||
          !toButton
        ) {
          continue;
        }

        const fromBounds =
          fromButton.getBoundingClientRect();

        const toBounds =
          toButton.getBoundingClientRect();

        const line =
          document.createElementNS(
            "http://www.w3.org/2000/svg",
            "line"
          );

        line.setAttribute(
          "x1",
          String(
            fromBounds.left -
              bounds.left +
              fromBounds.width / 2
          )
        );

        line.setAttribute(
          "y1",
          String(
            fromBounds.top -
              bounds.top +
              fromBounds.height / 2
          )
        );

        line.setAttribute(
          "x2",
          String(
            toBounds.left -
              bounds.left +
              toBounds.width / 2
          )
        );

        line.setAttribute(
          "y2",
          String(
            toBounds.top -
              bounds.top +
              toBounds.height / 2
          )
        );

        svg.append(line);
      }
    }

    cameraMap.prepend(svg);
  }

  requestAnimationFrame(
    drawMapConnections
  );

  selectCamera("1a");

  continueNight.textContent =
    `NIGHT ${state.unlockedNight}`;

  titleMenuButtons.forEach(
    (button, index) => {
      button.addEventListener(
        "pointerenter",
        () => setMenuIndex(index)
      );

      button.addEventListener(
        "click",
        () => activateMenu(index)
      );
    }
  );

  document
    .querySelector("#restartButton")
    .addEventListener(
      "click",
      () =>
        startNight(state.night)
    );

  monitorButton.addEventListener(
    "click",
    () =>
      setMonitor(
        !state.monitorUp
      )
  );

  leftDoorButton.addEventListener(
    "click",
    () => toggleDoor("left")
  );

  rightDoorButton.addEventListener(
    "click",
    () => toggleDoor("right")
  );

  function bindMomentaryLight(
    button,
    side
  ) {
    button.addEventListener(
      "pointerdown",
      event => {
        event.preventDefault();

        button.setPointerCapture?.(
          event.pointerId
        );

        setLight(side, true);
      }
    );

    button.addEventListener(
      "pointerup",
      () => setLight(side, false)
    );

    button.addEventListener(
      "pointercancel",
      () => setLight(side, false)
    );

    button.addEventListener(
      "pointerleave",
      event => {
        if (event.buttons) {
          setLight(side, false);
        }
      }
    );
  }

  bindMomentaryLight(
    leftLightButton,
    "left"
  );

  bindMomentaryLight(
    rightLightButton,
    "right"
  );

  window.addEventListener(
    "pointermove",
    event => {
      if (state.monitorUp) {
        return;
      }

      const bounds =
        gameShell.getBoundingClientRect();

      const normalized =
        (
          (
            event.clientX -
            bounds.left
          ) /
          bounds.width
        ) *
          2 -
        1;

      state.panTarget =
        THREE.MathUtils.clamp(
          normalized,
          -1,
          1
        );
    }
  );

  window.addEventListener(
    "keydown",
    event => {
      if (
        event.key.toLowerCase() ===
        "f"
      ) {
        document.documentElement
          .requestFullscreen?.();

        return;
      }

      if (
        state.screen === "title"
      ) {
        if (
          event.key === "ArrowUp"
        ) {
          event.preventDefault();

          setMenuIndex(
            state.menuIndex - 1
          );
        }

        if (
          event.key === "ArrowDown"
        ) {
          event.preventDefault();

          setMenuIndex(
            state.menuIndex + 1
          );
        }

        if (
          event.key === "Enter" ||
          event.code === "Space"
        ) {
          event.preventDefault();
          activateMenu();
        }

        return;
      }

      if (
        state.screen !== "playing"
      ) {
        return;
      }

      if (
        event.code === "Space"
      ) {
        event.preventDefault();

        setMonitor(
          !state.monitorUp
        );
      }

      if (
        event.key.toLowerCase() ===
        "a"
      ) {
        toggleDoor("left");
      }

      if (
        event.key.toLowerCase() ===
        "d"
      ) {
        toggleDoor("right");
      }

      if (
        event.key.toLowerCase() ===
        "q"
      ) {
        setLight("left", true);
      }

      if (
        event.key.toLowerCase() ===
        "e"
      ) {
        setLight("right", true);
      }

      if (
        state.monitorUp &&
        (
          event.key ===
            "ArrowLeft" ||
          event.key ===
            "ArrowRight"
        )
      ) {
        const current =
          cameraSystem.cameras.findIndex(
            item =>
              item.id ===
              state.selectedCamera
          );

        const direction =
          event.key === "ArrowLeft"
            ? -1
            : 1;

        const next =
          (
            current +
            direction +
            cameraSystem.cameras.length
          ) %
          cameraSystem.cameras.length;

        selectCamera(
          cameraSystem.cameras[next].id
        );
      }
    }
  );

  window.addEventListener(
    "keyup",
    event => {
      if (
        event.key.toLowerCase() ===
        "q"
      ) {
        setLight("left", false);
      }

      if (
        event.key.toLowerCase() ===
        "e"
      ) {
        setLight("right", false);
      }
    }
  );

  window.addEventListener(
    "blur",
    () => {
      setLight("left", false);
      setLight("right", false);
    }
  );

  window.addEventListener(
    "resize",
    () => {
      renderer.setPixelRatio(
        Math.min(
          window.devicePixelRatio || 1,
          1.35
        )
      );

      drawMapConnections();
    }
  );

  function frame(now) {
    const delta = Math.min(
      0.1,
      (now - lastFrame) / 1000
    );

    lastFrame = now;

    update(delta, now);
    render(delta, now);

    requestAnimationFrame(frame);
  }

  updateControlButtons();
  requestAnimationFrame(frame);

  window.NeegyGame = {
    getState: () => ({
      ...state,
      enemies: enemies.map(
        enemy => ({ ...enemy })
      )
    }),

    showCamera: selectCamera,
    setMonitor,
    toggleDoor,
    startNight
  };
})();
