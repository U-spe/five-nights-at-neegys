// @ts-check

(() => {
  "use strict";

  /** @typedef {{id:string, code:string, name:string, position:number[], target:number[]}} CameraDefinition */
  /** @typedef {{id:string, camera:string, previousCamera?:string, moveProgress?:number, color:number, insideOffice?:boolean}} CameraEnemy */

  /** @type {CameraDefinition[]} */
  const CAMERA_DEFINITIONS = [
    { id: "1a", code: "1A", name: "Bank Safe", position: [-3.5, 4.35, -12.9], target: [0, 1.65, -17.2] },
    { id: "2d", code: "2D", name: "Main Desk", position: [-3.7, 4.15, -7.2], target: [0, 1.35, -10.2] },
    { id: "1d", code: "1D", name: "Main Room", position: [-5.5, 4.65, -4.4], target: [0, 1.25, .3] },
    { id: "1c", code: "1C", name: "Main Entrance", position: [-12.5, 4.25, -3.2], target: [-10, 1.35, -.3] },
    { id: "2b", code: "2B", name: "Men's Bathroom", position: [12.3, 4.15, -5.35], target: [10, 1.3, -2.7] },
    { id: "2c", code: "2C", name: "Women's Bathroom", position: [12.3, 4.15, -.05], target: [10, 1.3, 2.75] },
    { id: "1e", code: "1E", name: "Left Hallway", position: [-4.5, 4.55, 5.15], target: [-4.5, 1.25, 18.7] },
    { id: "2e", code: "2E", name: "Right Hallway", position: [4.5, 4.55, 5.15], target: [4.5, 1.25, 18.7] },
    { id: "1b", code: "1B", name: "Teller Room 1", position: [-12.3, 4.15, 5.55], target: [-10, 1.25, 8] },
    { id: "3d", code: "3D", name: "Teller Room 4", position: [-12.3, 4.15, 11.05], target: [-10, 1.25, 13.5] },
    { id: "2f", code: "2F", name: "Teller Room 5", position: [-12.3, 4.15, 16.55], target: [-10, 1.25, 19] },
    { id: "3b", code: "3B", name: "Stock Market Room", position: [12.3, 4.15, 5.55], target: [10, 1.25, 8] },
    { id: "2a", code: "2A", name: "Teller Room 2", position: [12.3, 4.15, 11.05], target: [10, 1.25, 13.5] },
    { id: "3a", code: "3A", name: "Teller Room 3", position: [12.3, 4.15, 16.55], target: [10, 1.25, 19] },
    { id: "3e", code: "3E", name: "Left Door", position: [-4.5, 3.75, 17.25], target: [-4.5, 1.45, 21.5] },
    { id: "4e", code: "4E", name: "Right Door", position: [4.5, 3.75, 17.25], target: [4.5, 1.45, 21.5] }
  ];

  const ROOM_SPOTS = {
    "1a": [[-1.45, 0, -18.2], [-.72, 0, -18.3], [0, 0, -18.38], [.72, 0, -18.3], [1.45, 0, -18.2]],
    "2d": [[-2.7, 0, -8.35], [-1.35, 0, -8.1], [0, 0, -8.25], [1.35, 0, -8.1], [2.7, 0, -8.35]],
    "1d": [[-3.9, 0, -.5], [-2.15, 0, 2.25], [0, 0, .45], [2.15, 0, 2.25], [3.9, 0, -.5]],
    "1c": [[-10.2, 0, 1.35], [-9.65, 0, .35], [-9.1, 0, 1.25], [-8.55, 0, .25], [-8, 0, 1.15]],
    "2b": [[8.75, 0, -1.8], [9.35, 0, -1.45], [10, 0, -1.75], [10.65, 0, -1.45], [11.25, 0, -1.8]],
    "2c": [[8.75, 0, 3.7], [9.35, 0, 4.05], [10, 0, 3.7], [10.65, 0, 4.05], [11.25, 0, 3.7]],
    "1e": [[-5.05, 0, 7.1], [-3.95, 0, 9.9], [-5.05, 0, 12.8], [-3.95, 0, 15.7], [-5.05, 0, 18.2]],
    "2e": [[3.95, 0, 7.1], [5.05, 0, 9.9], [3.95, 0, 12.8], [5.05, 0, 15.7], [3.95, 0, 18.2]],
    "1b": [[-11.55, 0, 9.25], [-10.8, 0, 9.55], [-10, 0, 9.25], [-9.2, 0, 9.55], [-8.45, 0, 9.25]],
    "3d": [[-11.55, 0, 14.75], [-10.8, 0, 15.05], [-10, 0, 14.75], [-9.2, 0, 15.05], [-8.45, 0, 14.75]],
    "2f": [[-11.55, 0, 20.25], [-10.8, 0, 20.55], [-10, 0, 20.25], [-9.2, 0, 20.55], [-8.45, 0, 20.25]],
    "3b": [[8.5, 0, 9.4], [9.25, 0, 9.75], [10, 0, 9.4], [10.75, 0, 9.75], [11.5, 0, 9.4]],
    "2a": [[8.45, 0, 14.75], [9.2, 0, 15.05], [10, 0, 14.75], [10.8, 0, 15.05], [11.55, 0, 14.75]],
    "3a": [[8.45, 0, 20.25], [9.2, 0, 20.55], [10, 0, 20.25], [10.8, 0, 20.55], [11.55, 0, 20.25]],
    "3e": [[-5.25, 0, 19.55], [-4.9, 0, 20.05], [-4.5, 0, 19.55], [-4.1, 0, 20.05], [-3.75, 0, 19.55]],
    "4e": [[3.75, 0, 19.55], [4.1, 0, 20.05], [4.5, 0, 19.55], [4.9, 0, 20.05], [5.25, 0, 19.55]]
  };

  const ROOM_ENTRIES = {
    "1a": { "2d": [0, 0, -14.15] },
    "2d": { "1a": [0, 0, -11.8], "1d": [0, 0, -7.45] },
    "1d": { "2d": [0, 0, -5.05], "1c": [-5.65, 0, -.8], "2b": [5.65, 0, -2.2], "2c": [5.65, 0, 2.1], "1e": [-3.3, 0, 4.05], "2e": [3.3, 0, 4.05] },
    "1c": { "1d": [-7.25, 0, -.3] },
    "2b": { "1d": [7.2, 0, -2.15] },
    "2c": { "1d": [7.2, 0, 3.25] },
    "1e": { "1d": [-4.5, 0, 5.1], "1b": [-5.9, 0, 7.2], "3d": [-5.9, 0, 12.7], "2f": [-5.9, 0, 18.2], "3e": [-4.5, 0, 19.2] },
    "2e": { "1d": [4.5, 0, 5.1], "3b": [5.9, 0, 7.2], "2a": [5.9, 0, 12.7], "3a": [5.9, 0, 18.2], "4e": [4.5, 0, 19.2] },
    "1b": { "1e": [-7.05, 0, 8.65] },
    "3d": { "1e": [-7.05, 0, 14.15] },
    "2f": { "1e": [-7.05, 0, 19.65] },
    "3b": { "2e": [7.05, 0, 8.65] },
    "2a": { "2e": [7.05, 0, 14.15] },
    "3a": { "2e": [7.05, 0, 19.65] },
    "3e": { "1e": [-4.5, 0, 18.9] },
    "4e": { "2e": [4.5, 0, 18.9] }
  };

  const CHARACTER_SLOT = Object.freeze({
    regular: 0,
    girl: 1,
    rapper: 2,
    banana: 3,
    farmer: 4
  });

  const makeTexture = (size, paint, repeatX = 1, repeatY = 1) => {
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = size;

    paint(canvas.getContext("2d"), size);

    const map = new THREE.CanvasTexture(canvas);
    map.colorSpace = THREE.SRGBColorSpace;
    map.wrapS = map.wrapT = THREE.RepeatWrapping;
    map.repeat.set(repeatX, repeatY);
    map.anisotropy = 4;

    return map;
  };

  function createMaterials() {
    const tile = makeTexture(192, (ctx, size) => {
      ctx.fillStyle = "#aeb4b0";
      ctx.fillRect(0, 0, size, size);

      for (let i = 0; i < 900; i++) {
        const shade = 135 + Math.random() * 45;
        ctx.fillStyle = `rgba(${shade},${shade + 5},${shade},.09)`;
        ctx.fillRect(Math.random() * size, Math.random() * size, 2, 2);
      }

      ctx.strokeStyle = "rgba(30,40,35,.42)";
      ctx.lineWidth = 3;
      ctx.strokeRect(1.5, 1.5, size - 3, size - 3);
    }, 14, 16);

    const carpet = makeTexture(192, (ctx, size) => {
      ctx.fillStyle = "#183127";
      ctx.fillRect(0, 0, size, size);

      for (let i = 0; i < 3200; i++) {
        ctx.fillStyle = Math.random() > .5
          ? "rgba(130,160,142,.07)"
          : "rgba(0,0,0,.09)";

        ctx.fillRect(Math.random() * size, Math.random() * size, 1, 2);
      }
    }, 10, 10);

    const wood = makeTexture(192, (ctx, size) => {
      ctx.fillStyle = "#6f4930";
      ctx.fillRect(0, 0, size, size);

      for (let y = 0; y < size; y += 8) {
        ctx.strokeStyle = `rgba(35,15,6,${.08 + Math.random() * .1})`;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.bezierCurveTo(50, y - 5, 120, y + 7, size, y);
        ctx.stroke();
      }
    }, 3, 3);

    const material = (color, options = {}) => new THREE.MeshStandardMaterial({
      color,
      roughness: .7,
      metalness: .04,
      ...options
    });

    return {
      floor: material(0xffffff, { map: tile, roughness: .8 }),
      carpet: material(0xffffff, { map: carpet, roughness: .96 }),
      wood: material(0xffffff, { map: wood, roughness: .5 }),
      wall: material(0xdadbd4, { roughness: .9 }),
      ceiling: material(0xbfc4bf, { roughness: .92 }),
      dark: material(0x111512, { roughness: .76 }),
      green: material(0x155f3c),
      blue: material(0x173d67),
      white: material(0xf0f0e9, { roughness: .46 }),
      steel: material(0x737c7e, { metalness: .82, roughness: .22 }),
      chrome: material(0xc6cecf, { metalness: .95, roughness: .1 }),
      glass: material(0x96d9df, {
        transparent: true,
        opacity: .2,
        depthWrite: false,
        roughness: .08
      }),
      mirror: material(0xbde1e6, { metalness: .85, roughness: .04 }),
      light: material(0xffffff, {
        emissive: 0xffffff,
        emissiveIntensity: 4
      }),
      screen: material(0x07120b, {
        emissive: 0x31ff75,
        emissiveIntensity: 2.3
      }),
      screenRed: material(0x1a0705, {
        emissive: 0xff332b,
        emissiveIntensity: 2.4
      })
    };
  }

  function createCameraSystem() {
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x060807);
    scene.fog = new THREE.Fog(0x060807, 38, 82);

    const camera = new THREE.PerspectiveCamera(72, 16 / 9, .1, 150);
    const materials = createMaterials();
    const figures = new Map();
    const doorMeshes = {};

    let selected = CAMERA_DEFINITIONS[0];

    function box(x, y, z, width, height, depth, mat, rotationY = 0, parent = scene) {
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

    function cylinder(x, y, z, radius, depth, mat, rotationX = 0, rotationZ = 0, parent = scene, segments = 24) {
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

    function sign(text, x, y, z, rotationY = 0, width = 5, background = "#113a28") {
      const canvas = document.createElement("canvas");
      canvas.width = 1024;
      canvas.height = 256;

      const ctx = canvas.getContext("2d");
      ctx.fillStyle = background;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      let size = 104;
      ctx.font = `800 ${size}px Arial`;

      while (ctx.measureText(text).width > 900 && size > 38) {
        size -= 4;
        ctx.font = `800 ${size}px Arial`;
      }

      ctx.fillStyle = "#eaffef";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(text, 512, 128);

      const map = new THREE.CanvasTexture(canvas);
      map.colorSpace = THREE.SRGBColorSpace;

      const mesh = new THREE.Mesh(
        new THREE.PlaneGeometry(width, width / 4),
        new THREE.MeshBasicMaterial({
          map,
          side: THREE.DoubleSide
        })
      );

      mesh.position.set(x, y, z);
      mesh.rotation.y = rotationY;
      scene.add(mesh);

      return mesh;
    }

    const ceilingLight = (x, z, width = 4) =>
      box(x, 5.9, z, width, .08, .65, materials.light);

    function chair(x, z, rotationY = 0) {
      const group = new THREE.Group();
      group.position.set(x, 0, z);
      group.rotation.y = rotationY;
      scene.add(group);

      box(0, .55, 0, 1.05, .18, 1, materials.blue, 0, group);
      box(0, 1.15, -.43, 1.05, 1.18, .15, materials.blue, 0, group);

      for (const sideX of [-.38, .38]) {
        for (const sideZ of [-.34, .34]) {
          cylinder(
            sideX,
            .26,
            sideZ,
            .05,
            .5,
            materials.chrome,
            0,
            0,
            group,
            10
          );
        }
      }
    }

    function monitor(x, y, z, red = false, rotationY = 0) {
      const group = new THREE.Group();
      group.position.set(x, y, z);
      group.rotation.y = rotationY;
      scene.add(group);

      box(0, 0, 0, 1.1, .72, .12, materials.dark, 0, group);
      box(
        0,
        0,
        .067,
        .92,
        .55,
        .025,
        red ? materials.screenRed : materials.screen,
        0,
        group
      );

      cylinder(0, -.47, 0, .05, .54, materials.chrome, 0, 0, group, 10);
      box(0, -.75, 0, .5, .06, .36, materials.chrome, 0, group);
    }

    function roomShell(x, z, width, depth, label, floorMaterial = materials.carpet) {
      box(x, .03, z, width, .08, depth, floorMaterial);
      box(x, 3, z - depth / 2, width, 6, .25, materials.wall);
      box(x - width / 2, 3, z, .25, 6, depth, materials.wall);
      box(x + width / 2, 3, z, .25, 6, depth, materials.wall);

      sign(
        label,
        x,
        4.72,
        z - depth / 2 + .14,
        0,
        Math.min(5.6, width - .6)
      );

      ceilingLight(x, z, Math.min(3.2, width - 1));
    }

    function tellerRoom(x, z, label) {
      roomShell(x, z, 7.2, 5.1, label);

      for (const station of [-1, 1]) {
        const stationX = x + station * 1.65;

        box(stationX, .72, z - .65, 1.45, 1.42, 1, materials.wood);
        box(stationX, 1.46, z - .65, 1.38, .1, .94, materials.white);
        box(stationX, 2.25, z - .62, .05, 1.55, 1.45, materials.glass);

        monitor(stationX, 1.98, z - 1.02, station > 0);
        chair(stationX, z - 1.72, Math.PI);
      }

      box(x, .06, z + 1.45, 5.5, .02, .04, materials.chrome);
    }

    function bathroom(x, z, label, mens) {
      roomShell(x, z, 6.2, 4.8, label, materials.floor);

      for (let stall = 0; stall < 2; stall++) {
        const stallX = x + .6 + stall * 1.28;

        box(stallX, 1.35, z - 1.55, 1.08, 2.7, .1, materials.steel);
        box(stallX - .58, 1.35, z - .95, .08, 2.7, 1.3, materials.steel);
      }

      box(x - 1.75, .84, z - 1.45, 1.9, .24, .82, materials.white);
      box(x - 1.75, 2.05, z - 2.28, 2, 1.35, .05, materials.mirror);

      if (mens) {
        box(x - 2.3, .78, z - .82, .52, 1.05, .36, materials.white);
      }

      box(x, .055, z + 1.45, 4.7, .02, .04, materials.chrome);
    }

    function vault(x, z) {
      roomShell(x, z, 8, 6.2, "BANK SAFE", materials.floor);

      for (let row = 0; row < 4; row++) {
        for (let column = 0; column < 7; column++) {
          const depositX = x - 3 + column;

          box(
            depositX,
            .6 + row * .78,
            z - 2.94,
            .82,
            .62,
            .1,
            materials.steel
          );
        }
      }

      cylinder(
        x,
        2.25,
        z - 2.72,
        2.25,
        .24,
        materials.dark,
        Math.PI / 2
      );

      const safeGlow = new THREE.PointLight(0xb4d4bd, 24, 7.5, 2);
      safeGlow.position.set(x, 2.5, z - 1.55);
      scene.add(safeGlow);

      const hinge = new THREE.Group();
      hinge.position.set(x - 2.1, 2.25, z - 2.46);
      hinge.rotation.y = -.58;
      scene.add(hinge);

      cylinder(
        2.1,
        0,
        0,
        2.18,
        .34,
        materials.steel,
        Math.PI / 2,
        0,
        hinge
      );

      cylinder(
        2.1,
        0,
        .23,
        .68,
        .2,
        materials.chrome,
        Math.PI / 2,
        0,
        hinge
      );

      const rim = new THREE.Mesh(
        new THREE.TorusGeometry(1.94, .12, 10, 48),
        materials.chrome
      );

      rim.position.set(2.1, 0, .22);
      rim.castShadow = true;
      hinge.add(rim);

      for (let angle = 0; angle < Math.PI * 2; angle += Math.PI / 3) {
        const spoke = box(
          2.1 + Math.cos(angle) * .5,
          Math.sin(angle) * .5,
          .36,
          .075,
          1.05,
          .075,
          materials.chrome,
          0,
          hinge
        );

        spoke.rotation.z = -angle;
      }
    }

    function stockRoom(x, z) {
      roomShell(x, z, 7.2, 5.1, "STOCK MARKET ROOM");

      for (const deskX of [x - 2.1, x, x + 2.1]) {
        box(deskX, .72, z - .8, 1.7, .16, .92, materials.wood);
        monitor(deskX, 1.52, z - 1.08, Math.random() > .5);
        chair(deskX, z - 1.68, Math.PI);
      }

      box(x, .055, z + 1.5, 5.8, .02, .04, materials.chrome);
    }

    function hallway(x, label) {
      const centerZ = 12.5;
      const depth = 16;

      box(x, .04, centerZ, 4, .08, depth, materials.carpet);

      for (const wallX of [x - 2, x + 2]) {
        for (const segmentZ of [5.7, 10.1, 15.6, 20]) {
          box(wallX, 3, segmentZ, .24, 6, 2.2, materials.wall);
        }
      }

      sign(label, x, 4.55, 4.62, Math.PI, 3.4);

      for (const lightZ of [7, 12.5, 18]) {
        ceilingLight(x, lightZ, 2.4);
      }

      for (const trimZ of [8.8, 14.3, 19.8]) {
        box(x - 1.88, 2.05, trimZ, .12, 4.1, .55, materials.wood);
        box(x + 1.88, 2.05, trimZ, .12, 4.1, .55, materials.wood);
      }
    }

    function securityDoor(side, x, z) {
      const silver = materials.chrome.clone();
      silver.color.setHex(0xd4dadd);
      silver.roughness = .2;

      const statusMaterial = new THREE.MeshStandardMaterial({
        color: 0x43ff79,
        emissive: 0x20c950,
        emissiveIntensity: 2.5,
        roughness: .35
      });

      const shutter = new THREE.Group();
      shutter.position.set(x, 4.8, z);
      scene.add(shutter);

      for (let panel = 0; panel < 10; panel++) {
        box(
          0,
          .24 + panel * .44,
          0,
          3.9,
          .39,
          .18,
          silver,
          0,
          shutter
        );

        box(
          0,
          .42 + panel * .44,
          -.105,
          3.9,
          .035,
          .025,
          materials.dark,
          0,
          shutter
        );
      }

      box(x, 4.72, z, 4.7, .5, .52, materials.steel);
      box(x - 2.18, 2.25, z, .42, 4.7, .5, materials.steel);
      box(x + 2.18, 2.25, z, .42, 4.7, .5, materials.steel);

      const indicator = sphere(
        x + (side === "left" ? 1.65 : -1.65),
        4.72,
        z - .32,
        .13,
        statusMaterial
      );

      sign(
        `${side.toUpperCase()} DOOR`,
        x,
        5.18,
        z - .18,
        Math.PI,
        3.6,
        "#26302a"
      );

      doorMeshes[side] = {
        shutter,
        targetY: 4.8,
        closed: false,
        indicator,
        statusMaterial
      };
    }

    function createStickFigure(color) {
      const group = new THREE.Group();

      const mat = new THREE.MeshStandardMaterial({
        color,
        roughness: .45,
        metalness: .05
      });

      const joint = new THREE.MeshStandardMaterial({
        color: 0x0a0d0b,
        roughness: .8
      });

      sphere(0, 2.52, 0, .35, mat, group);

      const body = cylinder(
        0,
        1.65,
        0,
        .13,
        1.42,
        mat,
        0,
        0,
        group,
        12
      );

      const leftArm = cylinder(
        -.36,
        1.68,
        0,
        .075,
        1.08,
        mat,
        0,
        -.48,
        group,
        10
      );

      const rightArm = cylinder(
        .36,
        1.68,
        0,
        .075,
        1.08,
        mat,
        0,
        .48,
        group,
        10
      );

      const leftLeg = cylinder(
        -.2,
        .58,
        0,
        .09,
        1.22,
        mat,
        0,
        -.19,
        group,
        10
      );

      const rightLeg = cylinder(
        .2,
        .58,
        0,
        .09,
        1.22,
        mat,
        0,
        .19,
        group,
        10
      );

      sphere(0, 2.52, -.3, .07, joint, group);

      group.userData.parts = {
        body,
        leftArm,
        rightArm,
        leftLeg,
        rightLeg
      };

      group.userData.start = new THREE.Vector3();
      group.userData.goal = new THREE.Vector3();
      group.userData.moveProgress = 1;
      group.userData.room = "";
      group.visible = false;

      scene.add(group);

      return group;
    }

    box(0, -.16, 1.5, 31, .3, 45, materials.floor);
    box(0, 6.08, 1.5, 31, .2, 45, materials.ceiling);
    box(-15.5, 3, 1.5, .35, 6, 45, materials.wall);
    box(15.5, 3, 1.5, .35, 6, 45, materials.wall);
    box(0, 3, -21, 31, 6, .35, materials.wall);
    box(0, 3, 23.8, 31, 6, .35, materials.wall);

    vault(0, -17);

    roomShell(0, -10, 9, 4, "MAIN DESK", materials.carpet);
    box(0, .8, -10.7, 6.4, 1.6, 1.05, materials.wood);
    box(0, 1.64, -10.7, 6.25, .1, .98, materials.white);
    monitor(-1.55, 2.1, -11.03);
    monitor(0, 2.1, -11.03, true);
    monitor(1.55, 2.1, -11.03);
    chair(-2.2, -11.35, Math.PI);
    chair(2.2, -11.35, Math.PI);

    roomShell(0, -.5, 12, 9, "MAIN ROOM");

    for (const benchX of [-4.65, 4.65]) {
      box(benchX, .48, .1, 1.05, .22, 4.5, materials.blue);

      box(
        benchX + (benchX < 0 ? -.42 : .42),
        1.15,
        .1,
        .16,
        1.4,
        4.5,
        materials.blue
      );
    }

    box(0, .12, .35, 3.6, .04, 3.1, materials.green);
    sign("NEEGY NATIONAL BANK", 0, 3.55, -4.86, 0, 6.6);

    roomShell(-10, -.3, 6.2, 5, "MAIN ENTRANCE", materials.floor);
    box(-12.95, 2.05, -.3, .12, 4.1, 4, materials.glass);
    box(-12.86, 2.05, -.3, .18, 4.1, .16, materials.steel);

    for (const scannerZ of [-1.25, 1.05]) {
      box(-10.7, .62, scannerZ, .55, 1.24, .8, materials.dark);
      box(-10.7, 1.28, scannerZ, .42, .08, .55, materials.screen);
    }

    bathroom(10, -3.2, "MEN'S BATHROOM", true);
    bathroom(10, 2.3, "WOMEN'S BATHROOM", false);

    hallway(-4.5, "LEFT HALLWAY");
    hallway(4.5, "RIGHT HALLWAY");

    tellerRoom(-10, 7.2, "TELLER ROOM 1");
    tellerRoom(-10, 12.7, "TELLER ROOM 4");
    tellerRoom(-10, 18.2, "TELLER ROOM 5");

    stockRoom(10, 7.2);

    tellerRoom(10, 12.7, "TELLER ROOM 2");
    tellerRoom(10, 18.2, "TELLER ROOM 3");

    securityDoor("left", -4.5, 21.5);
    securityDoor("right", 4.5, 21.5);

    scene.add(
      new THREE.HemisphereLight(
        0xeafff2,
        0x111a14,
        1.65
      )
    );

    const sun = new THREE.DirectionalLight(0xfff5df, 1.65);
    sun.position.set(10, 18, 12);
    sun.castShadow = true;
    sun.shadow.mapSize.set(1536, 1536);
    sun.shadow.camera.left = -18;
    sun.shadow.camera.right = 18;
    sun.shadow.camera.top = 25;
    sun.shadow.camera.bottom = -25;
    scene.add(sun);

    const mainLight = new THREE.PointLight(0xd8ffe6, 48, 23);
    mainLight.position.set(0, 5.2, -1);
    scene.add(mainLight);

    const northLight = new THREE.PointLight(0xd9e8ff, 42, 18);
    northLight.position.set(0, 5.1, -15);
    scene.add(northLight);

    const hallLight = new THREE.PointLight(0xe5ffe9, 52, 24);
    hallLight.position.set(0, 5.15, 14);
    scene.add(hallLight);

    function show(id) {
      const found = CAMERA_DEFINITIONS.find(
        item => item.id === String(id).toLowerCase()
      );

      if (!found) return false;

      selected = found;
      camera.position.set(...found.position);
      camera.lookAt(...found.target);

      return true;
    }

    function setDoorState(side, closed) {
      const door = doorMeshes[side];

      if (!door) return;

      door.closed = closed;
      door.targetY = closed ? 0 : 4.8;

      door.statusMaterial.color.setHex(
        closed ? 0xff4c43 : 0x43ff79
      );

      door.statusMaterial.emissive.setHex(
        closed ? 0xd51d16 : 0x20c950
      );
    }

    /** @param {CameraEnemy[]} enemies */
    function syncEnemies(enemies) {
      const livingIds = new Set(
        enemies.map(enemy => enemy.id)
      );

      for (const [id, figure] of figures) {
        if (!livingIds.has(id)) {
          figure.visible = false;
        }
      }

      enemies.forEach((enemy, index) => {
        let figure = figures.get(enemy.id);

        if (!figure) {
          figure = createStickFigure(enemy.color || 0x83ff9c);
          figures.set(enemy.id, figure);
        }

        if (enemy.insideOffice || !ROOM_SPOTS[enemy.camera]) {
          figure.visible = false;
          return;
        }

        figure.visible = true;

        const spots = ROOM_SPOTS[enemy.camera];
        const reservedSlot = CHARACTER_SLOT[enemy.id] ?? index;
        const target = spots[reservedSlot % spots.length];

        const start = figure.userData.start;
        const goal = figure.userData.goal;

        if (figure.userData.room !== enemy.camera) {
          figure.userData.room = enemy.camera;

          const roomEntries = ROOM_ENTRIES[enemy.camera] || {};
          const entry = roomEntries[enemy.previousCamera] || target;
          const laneOffset = (reservedSlot - 2) * .12;

          start.set(
            entry[0] + laneOffset,
            entry[1],
            entry[2]
          );

          goal.set(
            target[0],
            target[1],
            target[2]
          );

          figure.position.copy(start);
        } else {
          goal.set(
            target[0],
            target[1],
            target[2]
          );
        }

        figure.userData.moveProgress = Number.isFinite(enemy.moveProgress)
          ? enemy.moveProgress
          : 1;

        const scale = enemy.camera === "1a" ? .78 : .94;
        figure.scale.setScalar(scale);
      });
    }

    function update(delta, elapsed, enemies) {
      syncEnemies(enemies);

      for (const door of Object.values(doorMeshes)) {
        door.shutter.position.y +=
          (door.targetY - door.shutter.position.y) *
          Math.min(1, delta * 9);
      }

      for (const figure of figures.values()) {
        if (!figure.visible) continue;

        const progress = THREE.MathUtils.clamp(
          figure.userData.moveProgress,
          0,
          1
        );

        const eased = progress * progress * (3 - 2 * progress);

        figure.position.lerpVectors(
          figure.userData.start,
          figure.userData.goal,
          eased
        );

        const walking = progress < .995;
        const strideRate = 8.5 + figure.id % 3;

        const swing = walking
          ? Math.sin(elapsed * strideRate) * .3
          : Math.sin(elapsed * 1.4 + figure.id) * .025;

        const parts = figure.userData.parts;

        parts.leftArm.rotation.z = -.48 + swing;
        parts.rightArm.rotation.z = .48 - swing;
        parts.leftLeg.rotation.z = -.19 - swing * .7;
        parts.rightLeg.rotation.z = .19 + swing * .7;

        if (walking) {
          const directionX =
            figure.userData.goal.x -
            figure.userData.start.x;

          const directionZ =
            figure.userData.goal.z -
            figure.userData.start.z;

          figure.rotation.y = Math.atan2(
            -directionX,
            -directionZ
          );
        } else {
          figure.rotation.y +=
            (
              Math.sin(elapsed * .7 + figure.id) * .045 -
              figure.rotation.y
            ) *
            Math.min(1, delta * 2);
        }
      }

      camera.position.set(
        selected.position[0] +
          Math.sin(elapsed * 1.7 + selected.code.length) * .012,
        selected.position[1] +
          Math.sin(elapsed * 1.13) * .008,
        selected.position[2]
      );

      camera.lookAt(
        selected.target[0] +
          Math.sin(elapsed * .73) * .018,
        selected.target[1],
        selected.target[2]
      );
    }

    show("1a");

    return {
      scene,
      camera,
      cameras: CAMERA_DEFINITIONS,
      show,
      update,
      setDoorState,
      getDoorState: side => Boolean(doorMeshes[side]?.closed),
      getCurrent: () => ({ ...selected })
    };
  }

  window.NeegyCameras = {
    definitions: CAMERA_DEFINITIONS,
    create: createCameraSystem
  };
})();
