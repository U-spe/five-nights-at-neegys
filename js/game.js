// @ts-check

(() => {
  "use strict";

  const canvas =
    document.querySelector("#sceneCanvas");

  const gameShell =
    document.querySelector("#gameShell");

  const titleScreen =
    document.querySelector("#titleScreen");

  const nightIntro =
    document.querySelector("#nightIntro");

  const resultScreen =
    document.querySelector("#resultScreen");

  const hud =
    document.querySelector("#hud");

  const officeControls =
    document.querySelector("#officeControls");

  const cameraInterface =
    document.querySelector("#cameraInterface");

  const cameraMap =
    document.querySelector("#cameraMap");

  const cameraNoise =
    document.querySelector("#cameraNoise");

  const flash =
    document.querySelector("#flash");

  const message =
    document.querySelector("#message");

  const monitorButton =
    document.querySelector("#monitorButton");

  const monitorButtonText =
    document.querySelector("#monitorButtonText");

  const leftDoorButton =
    document.querySelector("#leftDoorButton");

  const rightDoorButton =
    document.querySelector("#rightDoorButton");

  const leftLightButton =
    document.querySelector("#leftLightButton");

  const rightLightButton =
    document.querySelector("#rightLightButton");

  const hourLabel =
    document.querySelector("#hourLabel");

  const nightLabel =
    document.querySelector("#nightLabel");

  const powerLabel =
    document.querySelector("#powerLabel");

  const powerFill =
    document.querySelector("#powerFill");

  const usageBars = [
    ...document.querySelectorAll(
      "#usageBars i"
    )
  ];

  const cameraCode =
    document.querySelector("#cameraCode");

  const cameraName =
    document.querySelector("#cameraName");

  const introNight =
    document.querySelector("#introNight");

  const resultTitle =
    document.querySelector("#resultTitle");

  const resultText =
    document.querySelector("#resultText");

  const renderer =
    new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      powerPreference: "high-performance"
    });

  renderer.setSize(
    1280,
    720,
    false
  );

  renderer.setPixelRatio(
    Math.min(
      window.devicePixelRatio || 1,
      1.35
    )
  );

  renderer.outputColorSpace =
    THREE.SRGBColorSpace;

  renderer.toneMapping =
    THREE.ACESFilmicToneMapping;

  renderer.toneMappingExposure = 1.1;
  renderer.shadowMap.enabled = true;

  renderer.shadowMap.type =
    THREE.PCFSoftShadowMap;

  const cameraSystem =
    window.NeegyCameras.create();

  const NIGHT_SECONDS = 360;

  const POWER_RATES = {
    clock: 1,
    cameras: 2.5,
    lights: 2,
    doors: 4
  };

  const ENEMY_CONFIGS = [
    {
      id: "regular",
      name: "Regular Neegy",
      color: 0x60ff8a,
      start: "1a",

      route: [
        "1a",
        "1d",
        "2d",
        "1e",
        "3e"
      ],

      side: "left",
      interval: 7.4,
      backtrack: 0.18,

      ai: [
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
      color: 0xff6fb7,
      start: "1a",

      route: [
        "1a",
        "1b",
        "3a",
        "2e",
        "4e"
      ],

      side: "right",
      interval: 8.1,
      backtrack: 0.24,

      ai: [
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
      color: 0xff8b38,
      start: "1a",

      route: [
        "1a",
        "1c",
        "1d",
        "2d",
        "2e",
        "4e"
      ],

      side: "right",
      interval: 6.2,
      backtrack: 0,

      ai: [
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
      color: 0xffdd55,
      start: "2f",

      route: [
        "2f",
        "1e",
        "3e"
      ],

      side: "left",
      interval: 9.2,
      backtrack: 0,

      ai: [
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
      color: 0xc79bff,
      start: "3b",

      route: [
        "3b",
        "3d",
        "2d",
        "2e",
        "4e"
      ],

      side: "right",
      interval: 8.8,
      backtrack: 0.12,

      ai: [
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

  const state = {
    screen: "title",
    night: 1,
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

  let enemies = [];
  let lastFrame = performance.now();
  let audioContext = null;

  function material(
    color,
    options = {}
  ) {
    return new THREE.MeshStandardMaterial({
      color,
      roughness: 0.7,
      metalness: 0.04,
      ...options
    });
  }

  function canvasTexture(
    width,
    height,
    paint
  ) {
    const textureCanvas =
      document.createElement("canvas");

    textureCanvas.width = width;
    textureCanvas.height = height;

    const context =
      textureCanvas.getContext("2d");

    paint(
      context,
      textureCanvas
    );

    const texture =
      new THREE.CanvasTexture(
        textureCanvas
      );

    texture.colorSpace =
      THREE.SRGBColorSpace;

    return {
      texture,
      canvas: textureCanvas,
      context
    };
  }

  function buildOffice() {
    const scene =
      new THREE.Scene();

    scene.background =
      new THREE.Color(0x030504);

    scene.fog =
      new THREE.FogExp2(
        0x020302,
        0.028
      );

    const camera =
      new THREE.PerspectiveCamera(
        68,
        16 / 9,
        0.1,
        80
      );

    camera.position.set(
      0,
      3.25,
      10
    );

    const mats = {
      wall: material(0x777a74, {
        roughness: 0.96
      }),

      lowerWall: material(0x26352d, {
        roughness: 0.88
      }),

      floor: material(0x1b1d1b, {
        roughness: 0.92
      }),

      ceiling: material(0x4f534f, {
        roughness: 0.95
      }),

      wood: material(0x5d3925, {
        roughness: 0.5
      }),

      woodTop: material(0x7d5436, {
        roughness: 0.4
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

      paper: material(0xd9d8ca, {
        roughness: 0.78
      }),

      red: material(0x6d1713, {
        emissive: 0x350300,
        emissiveIntensity: 0.4
      }),

      screen: material(0x06100a, {
        emissive: 0x42f57b,
        emissiveIntensity: 1.7
      })
    };

    function box(
      x,
      y,
      z,
      width,
      height,
      depth,
      boxMaterial,
      rotationY = 0,
      parent = scene
    ) {
      const mesh =
        new THREE.Mesh(
          new THREE.BoxGeometry(
            width,
            height,
            depth
          ),
          boxMaterial
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
      cylinderMaterial,
      rotationX = 0,
      rotationZ = 0,
      parent = scene,
      segments = 24
    ) {
      const mesh =
        new THREE.Mesh(
          new THREE.CylinderGeometry(
            radius,
            radius,
            depth,
            segments
          ),
          cylinderMaterial
        );

      mesh.position.set(x, y, z);
      mesh.rotation.x = rotationX;
      mesh.rotation.z = rotationZ;
      mesh.castShadow = true;
      mesh.receiveShadow = true;

      parent.add(mesh);

      return mesh;
    }

    function sphere(
      x,
      y,
      z,
      radius,
      sphereMaterial,
      parent = scene
    ) {
      const mesh =
        new THREE.Mesh(
          new THREE.SphereGeometry(
            radius,
            18,
            12
          ),
          sphereMaterial
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
      const mesh =
        new THREE.Mesh(
          new THREE.PlaneGeometry(
            width,
            height
          ),

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

          ctx.fillRect(
            0,
            0,
            image.width,
            image.height
          );

          ctx.strokeStyle =
            "rgba(77,255,130,.25)";

          ctx.lineWidth = 2;

          for (
            let x = 0;
            x < image.width;
            x += 42
          ) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(
              x,
              image.height
            );
            ctx.stroke();
          }

          for (
            let y = 0;
            y < image.height;
            y += 36
          ) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(
              image.width,
              y
            );
            ctx.stroke();
          }

          ctx.fillStyle = "#74ff9d";
          ctx.font =
            "bold 34px monospace";

          ctx.fillText(
            `CAM ${seed}`,
            22,
            48
          );

          ctx.font =
            "22px monospace";

          ctx.fillText(
            "NEEGY NATIONAL BANK",
            22,
            292
          );

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

    function deskMonitor(
      x,
      y,
      z,
      screenId,
      rotationY = 0
    ) {
      const group =
        new THREE.Group();

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
        screenTexture(screenId),
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

    function officeStickFigure(
      color
    ) {
      const group =
        new THREE.Group();

      const figureMaterial =
        material(color, {
          roughness: 0.45
        });

      sphere(
        0,
        2.55,
        0,
        0.38,
        figureMaterial,
        group
      );

      cylinder(
        0,
        1.64,
        0,
        0.14,
        1.48,
        figureMaterial,
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
        figureMaterial,
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
        figureMaterial,
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
        figureMaterial,
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
        figureMaterial,
        0,
        0.18,
        group,
        10
      );

      group.visible = false;

      scene.add(group);

      return group;
    }

    function createDoor(
      side,
      x
    ) {
      const shutter =
        new THREE.Group();

      shutter.position.set(
        x,
        5.4,
        -3.2
      );

      scene.add(shutter);

      for (
        let panel = 0;
        panel < 10;
        panel++
      ) {
        box(
          0,
          0.27 + panel * 0.48,
          0,
          0.42,
          0.42,
          4.25,
          panel % 2
            ? mats.steel
            : mats.chrome,
          0,
          shutter
        );
      }

      box(
        x,
        5.2,
        -3.2,
        0.7,
        0.55,
        4.9,
        mats.dark
      );

      box(
        x,
        2.45,
        -5.48,
        0.65,
        4.9,
        0.42,
        mats.dark
      );

      box(
        x,
        2.45,
        -0.92,
        0.65,
        4.9,
        0.42,
        mats.dark
      );

      box(
        x +
          (
            side === "left"
              ? 0.38
              : -0.38
          ),
        2.2,
        -0.45,
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

    /*
     * OFFICE SHELL
     */

    box(
      0,
      -0.15,
      -1,
      18,
      0.3,
      19,
      mats.floor
    );

    box(
      0,
      6,
      -1,
      18,
      0.25,
      19,
      mats.ceiling
    );

    box(
      0,
      3,
      -9.3,
      18,
      6,
      0.35,
      mats.wall
    );

    box(
      -8.8,
      3,
      -7.2,
      0.35,
      6,
      4.2,
      mats.wall
    );

    box(
      -8.8,
      3,
      1.6,
      0.35,
      6,
      4.1,
      mats.wall
    );

    box(
      8.8,
      3,
      -7.2,
      0.35,
      6,
      4.2,
      mats.wall
    );

    box(
      8.8,
      3,
      1.6,
      0.35,
      6,
      4.1,
      mats.wall
    );

    box(
      0,
      1.15,
      -9.08,
      17.5,
      2.3,
      0.08,
      mats.lowerWall
    );

    /*
     * DARK HALLWAYS
     */

    box(
      -10.8,
      0,
      -3.2,
      4,
      0.12,
      4.7,
      mats.black
    );

    box(
      10.8,
      0,
      -3.2,
      4,
      0.12,
      4.7,
      mats.black
    );

    box(
      -11.8,
      3,
      -3.2,
      0.2,
      6,
      4.7,
      mats.black
    );

    box(
      11.8,
      3,
      -3.2,
      0.2,
      6,
      4.7,
      mats.black
    );

    /*
     * OFFICE DESK
     */

    box(
      0,
      1.05,
      2.2,
      9.2,
      1.8,
      2.35,
      mats.wood
    );

    box(
      0,
      2,
      2.2,
      9.35,
      0.14,
      2.5,
      mats.woodTop
    );

    box(
      -3.65,
      0.65,
      2.22,
      1.3,
      1.25,
      1.9,
      mats.wood
    );

    box(
      3.65,
      0.65,
      2.22,
      1.3,
      1.25,
      1.9,
      mats.wood
    );

    deskMonitor(
      -2.25,
      3.02,
      1.45,
      1,
      0.08
    );

    deskMonitor(
      0,
      3.15,
      1.28,
      2
    );

    deskMonitor(
      2.25,
      3.02,
      1.45,
      3,
      -0.08
    );

    /*
     * KEYBOARD
     */

    box(
      0,
      2.13,
      3.08,
      2.15,
      0.12,
      0.72,
      mats.dark
    );

    for (
      let row = 0;
      row < 4;
      row++
    ) {
      for (
        let key = 0;
        key < 10;
        key++
      ) {
        box(
          -0.85 + key * 0.19,
          2.205,
          2.82 + row * 0.14,
          0.13,
          0.025,
          0.08,
          mats.chrome
        );
      }
    }

    /*
     * PAPERS
     */

    box(
      -3.3,
      2.12,
      2.7,
      1.45,
      0.035,
      0.95,
      mats.paper,
      -0.08
    );

    box(
      -3.1,
      2.17,
      2.82,
      1.35,
      0.035,
      0.85,
      mats.paper,
      0.06
    );

    /*
     * PHONE
     */

    box(
      3.4,
      2.2,
      2.7,
      0.62,
      0.2,
      1.08,
      mats.dark,
      -0.15
    );

    box(
      3.4,
      2.32,
      2.52,
      0.45,
      0.08,
      0.55,
      mats.red,
      -0.15
    );

    /*
     * MUG
     */

    cylinder(
      2.8,
      2.43,
      3.25,
      0.32,
      0.62,
      mats.paper,
      0,
      0,
      scene,
      20
    );

    /*
     * BANK LOGO PICTURE
     */

    const bankLogo =
      canvasTexture(
        512,
        512,
        (ctx, image) => {
          ctx.fillStyle = "#07140c";

          ctx.fillRect(
            0,
            0,
            image.width,
            image.height
          );

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

          ctx.fillText(
            "N",
            256,
            275
          );

          ctx.fillStyle = "#f4e8b0";
          ctx.font = "bold 38px Arial";

          ctx.fillText(
            "NEEGY NATIONAL",
            256,
            405
          );

          ctx.font = "30px Arial";

          ctx.fillText(
            "BANK",
            256,
            452
          );
        }
      ).texture;

    box(
      -4.1,
      3.05,
      1.45,
      1.75,
      1.7,
      0.16,
      mats.wood,
      0.1
    );

    texturedPlane(
      -4.1,
      3.05,
      1.355,
      1.48,
      1.43,
      bankLogo,
      Math.PI + 0.1
    );

    /*
     * DIGITAL CLOCK
     */

    const clockSurface =
      canvasTexture(
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

          ctx.fillText(
            "12:00",
            256,
            135
          );
        }
      );

    box(
      0,
      4.65,
      -9.03,
      3.25,
      1.3,
      0.22,
      mats.dark
    );

    texturedPlane(
      0,
      4.65,
      -8.905,
      2.9,
      1.05,
      clockSurface.texture
    );

    /*
     * DESK FAN
     */

    const fan =
      new THREE.Group();

    fan.position.set(
      4.15,
      2.2,
      1.35
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

    const blades =
      new THREE.Group();

    blades.position.set(
      0,
      0.72,
      0.08
    );

    fan.add(blades);

    for (
      let blade = 0;
      blade < 4;
      blade++
    ) {
      const fanBlade =
        box(
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

    /*
     * LIGHTING
     */

    box(
      0,
      5.82,
      -2.5,
      4.5,
      0.08,
      0.72,

      material(0xffffff, {
        emissive: 0xffffff,
        emissiveIntensity: 3.3
      })
    );

    const officeAmbient =
      new THREE.HemisphereLight(
        0xcde0d2,
        0x07100a,
        1.05
      );

    scene.add(officeAmbient);

    const officeLight =
      new THREE.PointLight(
        0xdfffe8,
        42,
        22
      );

    officeLight.position.set(
      0,
      5.35,
      -1.5
    );

    officeLight.castShadow = true;

    scene.add(officeLight);

    const leftLight =
      new THREE.SpotLight(
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

    const rightLight =
      new THREE.SpotLight(
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

    const leftDoor =
      createDoor(
        "left",
        -8.45
      );

    const rightDoor =
      createDoor(
        "right",
        8.45
      );

    const leftFigure =
      officeStickFigure(
        0x101310
      );

    leftFigure.position.set(
      -9.4,
      0,
      -3.2
    );

    leftFigure.rotation.y =
      Math.PI / 2;

    const rightFigure =
      officeStickFigure(
        0x101310
      );

    rightFigure.position.set(
      9.4,
      0,
      -3.2
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
        text.replace(
          " AM",
          ":00"
        ),
        256,
        135
      );

      clockSurface.texture.needsUpdate =
        true;
    }

    function update(
      delta,
      elapsed
    ) {
      const leftTarget =
        state.leftDoor
          ? 0
          : 5.4;

      const rightTarget =
        state.rightDoor
          ? 0
          : 5.4;

      leftDoor.shutter.position.y +=
        (
          leftTarget -
          leftDoor.shutter.position.y
        ) *
        Math.min(
          1,
          delta * 9
        );

      rightDoor.shutter.position.y +=
        (
          rightTarget -
          rightDoor.shutter.position.y
        ) *
        Math.min(
          1,
          delta * 9
        );

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
        Math.min(
          1,
          delta * 13
        );

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
        Math.min(
          1,
          delta * 13
        );

      officeAmbient.intensity +=
        (
          (
            state.powerOut
              ? 0.03
              : 1.05
          ) -
          officeAmbient.intensity
        ) *
        Math.min(
          1,
          delta * 2.4
        );

      officeLight.intensity +=
        (
          (
            state.powerOut
              ? 0
              : 42
          ) -
          officeLight.intensity
        ) *
        Math.min(
          1,
          delta * 2.4
        );

      blades.rotation.z -=
        delta * 8;

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

      leftFigure.visible =
        Boolean(
          leftThreat &&
          state.leftLight &&
          !state.monitorUp
        );

      rightFigure.visible =
        Boolean(
          rightThreat &&
          state.rightLight &&
          !state.monitorUp
        );

      if (leftThreat) {
        leftFigure.traverse(
          child => {
            if (child.material) {
              child.material.color.setHex(
                leftThreat.color
              );
            }
          }
        );
      }

      if (rightThreat) {
        rightFigure.traverse(
          child => {
            if (child.material) {
              child.material.color.setHex(
                rightThreat.color
              );
            }
          }
        );
      }

      state.pan +=
        (
          state.panTarget -
          state.pan
        ) *
        Math.min(
          1,
          delta * 3.2
        );

      camera.position.x =
        state.pan * 1.2;

      camera.lookAt(
        state.pan * 4.4,
        2.25,
        -3.4
      );
    }

    return {
      scene,
      camera,
      update,
      setClock
    };
  }

  const office =
    buildOffice();

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
    if (!audioContext) {
      return;
    }

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
    if (!audioContext) {
      return;
    }

    const samples =
      Math.floor(
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
    enemies =
      ENEMY_CONFIGS.map(
        config => ({
          ...config,

          camera:
            config.start,

          routeIndex: 0,

          nextMove:
            now +
            (
              config.interval +
              Math.random() * 4
            ) *
            1000,

          insideOffice: false,
          attackAt: 0
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

    message.classList.remove(
      "hidden"
    );

    state.messageUntil =
      performance.now() +
      seconds * 1000;
  }

  function moveEnemy(
    enemy,
    now
  ) {
    if (enemy.insideOffice) {
      return;
    }

    const level =
      enemy.ai[
        Math.min(
          enemy.ai.length - 1,
          state.night - 1
        )
      ] || 0;

    const moveChance =
      0.3 + level * 0.032;

    enemy.nextMove =
      now +
      (
        enemy.interval +
        Math.random() * 4.5
      ) *
      1000;

    if (
      Math.random() >
      moveChance
    ) {
      return;
    }

    if (
      enemy.routeIndex ===
      enemy.route.length - 1
    ) {
      if (
        doorClosed(enemy.side)
      ) {
        enemy.routeIndex =
          Math.max(
            0,
            enemy.routeIndex - 2
          );

        enemy.camera =
          enemy.route[
            enemy.routeIndex
          ];

        enemy.nextMove += 3500;

        tone(
          75,
          0.16,
          0.035,
          "sawtooth"
        );

        return;
      }

      enemy.insideOffice = true;

      enemy.attackAt =
        now +
        1500 +
        Math.random() * 1800;

      showMessage(
        "MOVEMENT INSIDE OFFICE",
        1.1
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

    enemy.camera =
      enemy.route[
        enemy.routeIndex
      ];

    if (
      state.monitorUp &&
      enemy.camera ===
        state.selectedCamera
    ) {
      switchStatic();
    }
  }

  function updateEnemies(now) {
    for (const enemy of enemies) {
      if (
        !enemy.insideOffice &&
        now >= enemy.nextMove
      ) {
        moveEnemy(
          enemy,
          now
        );
      }

      if (
        enemy.insideOffice &&
        now >= enemy.attackAt
      ) {
        loseNight(enemy.name);
      }
    }
  }

  function startNight() {
    enableAudio();

    const now =
      performance.now();

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

    staticBurst(
      0.12,
      0.03
    );
  }

  function beginOffice(now) {
    state.screen = "playing";
    state.startedAt = now;

    nightIntro.classList.add(
      "hidden"
    );

    hud.classList.remove(
      "hidden"
    );

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
    }

    if (!silent) {
      staticBurst(
        0.09,
        0.03
      );
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

    staticBurst(
      0.055,
      0.018
    );
  }

  function selectCamera(id) {
    if (
      !cameraSystem.show(id)
    ) {
      return;
    }

    state.selectedCamera = id;

    const selected =
      cameraSystem.getCurrent();

    cameraCode.textContent =
      `CAM ${selected.code}`;

    cameraName.textContent =
      selected.name.toUpperCase();

    [
      ...cameraMap.children
    ].forEach(button => {
      button.classList.toggle(
        "active",
        button.dataset.camera === id
      );
    });

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

  function setLight(
    side,
    enabled
  ) {
    if (
      state.powerOut ||
      state.monitorUp ||
      state.screen !== "playing"
    ) {
      enabled = false;
    }

    if (side === "left") {
      state.leftLight = enabled;
    } else {
      state.rightLight = enabled;
    }

    if (enabled) {
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

    [
      ...cameraMap.children
    ].forEach(button => {
      const occupied =
        enemies.some(
          enemy =>
            !enemy.insideOffice &&
            enemy.camera ===
              button.dataset.camera
        );

      button.classList.toggle(
        "enemy",
        occupied
      );
    });
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

    state.power =
      Math.max(
        0,

        state.power -
        (
          perMinute /
          60
        ) *
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

    setTimeout(
      () => {
        resultTitle.textContent =
          "GAME OVER";

        resultText.textContent =
          `CAUGHT BY ${enemyName.toUpperCase()}`;

        resultScreen.classList.remove(
          "hidden"
        );
      },
      650
    );
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

    tone(
      880,
      0.45,
      0.06,
      "square"
    );
  }

  function update(
    delta,
    now
  ) {
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
      (
        now -
        state.startedAt
      ) /
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
      updateEnemies(now);

      if (state.power <= 0) {
        beginPowerOut(now);
      }
    } else if (
      now >=
      state.blackoutEndsAt
    ) {
      loseNight(
        "Power Failure"
      );
    }

    updateUI();
  }

  function render(
    delta,
    now
  ) {
    const elapsed =
      now / 1000;

    office.update(
      delta,
      elapsed
    );

    cameraSystem.update(
      delta,
      elapsed,

      enemies.map(
        enemy => ({
          id: enemy.id,
          camera: enemy.camera,
          color: enemy.color,
          insideOffice:
            enemy.insideOffice
        })
      )
    );

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
        1.08;

      renderer.render(
        office.scene,
        office.camera
      );
    }
  }

  /*
   * CAMERA MAP BUTTONS
   */

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

      button.innerHTML =
        `CAM ${cameraData.code}` +
        `<small>${cameraData.name}</small>`;

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

  selectCamera("1a");

  /*
   * BUTTON INPUT
   */

  document
    .querySelector("#startButton")
    .addEventListener(
      "click",
      startNight
    );

  document
    .querySelector("#restartButton")
    .addEventListener(
      "click",
      startNight
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

        setLight(
          side,
          true
        );
      }
    );

    button.addEventListener(
      "pointerup",
      () =>
        setLight(
          side,
          false
        )
    );

    button.addEventListener(
      "pointercancel",
      () =>
        setLight(
          side,
          false
        )
    );

    button.addEventListener(
      "pointerleave",
      event => {
        if (event.buttons) {
          setLight(
            side,
            false
          );
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

  /*
   * OFFICE VIEW PANNING
   */

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

  /*
   * KEYBOARD CONTROLS
   */

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
        state.screen !==
        "playing"
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
        setLight(
          "left",
          true
        );
      }

      if (
        event.key.toLowerCase() ===
        "e"
      ) {
        setLight(
          "right",
          true
        );
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
          cameraSystem.cameras
            .findIndex(
              item =>
                item.id ===
                state.selectedCamera
            );

        const direction =
          event.key ===
          "ArrowLeft"
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
          cameraSystem.cameras[
            next
          ].id
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
        setLight(
          "left",
          false
        );
      }

      if (
        event.key.toLowerCase() ===
        "e"
      ) {
        setLight(
          "right",
          false
        );
      }
    }
  );

  window.addEventListener(
    "blur",
    () => {
      setLight(
        "left",
        false
      );

      setLight(
        "right",
        false
      );
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
    }
  );

  /*
   * MAIN LOOP
   */

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

    lastFrame = now;

    update(
      delta,
      now
    );

    render(
      delta,
      now
    );

    requestAnimationFrame(frame);
  }

  updateControlButtons();
  requestAnimationFrame(frame);

  /*
   * PUBLIC API
   */

  window.NeegyGame = {
    getState() {
      return {
        ...state,

        enemies:
          enemies.map(
            enemy => ({
              ...enemy
            })
          )
      };
    },

    showCamera:
      selectCamera,

    setMonitor,

    toggleDoor,

    startNight
  };
})();
