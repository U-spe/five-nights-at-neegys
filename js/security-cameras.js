// @ts-check

(() => {
  "use strict";

  /** @typedef {{id:string, code:string, name:string, position:number[], target:number[]}} CameraDefinition */
  /** @typedef {{id:string, camera:string, color:number, insideOffice?:boolean}} CameraEnemy */

  /** @type {CameraDefinition[]} */
  const CAMERA_DEFINITIONS = [
    { id: "1a", code: "1A", name: "Bank Safe", position: [17, 4.7, -16], target: [17, 1.8, -23] },
    { id: "1b", code: "1B", name: "Teller Room 1", position: [-17, 4.7, 22.4], target: [-17, 1.5, 17] },
    { id: "1c", code: "1C", name: "Main Entrance", position: [-7, 4.9, 24], target: [0, 1.8, 29.5] },
    { id: "1d", code: "1D", name: "Main Room", position: [-7, 5, 23], target: [0, 1.3, 17] },
    { id: "2a", code: "2A", name: "Teller Room 2", position: [17, 4.7, 22.4], target: [17, 1.5, 17] },
    { id: "2b", code: "2B", name: "Men's Bathroom", position: [-17, 4.5, -4.8], target: [-17, 1.3, -10] },
    { id: "2c", code: "2C", name: "Women's Bathroom", position: [17, 4.5, -4.8], target: [17, 1.3, -10] },
    { id: "3a", code: "3A", name: "Teller Room 4", position: [17, 4.7, 8.3], target: [17, 1.5, 3] },
    { id: "3b", code: "3B", name: "Stock Market Room", position: [-17, 4.7, -16], target: [-17, 1.5, -23] },
    { id: "3d", code: "3D", name: "Teller Room 3", position: [-17, 4.7, 8.3], target: [-17, 1.5, 3] },
    { id: "2d", code: "2D", name: "Main Desk", position: [-6, 4.4, 15], target: [0, 1.5, 10] },
    { id: "1e", code: "1E", name: "Left Hallway", position: [-9, 4.8, 10], target: [-9, 1.5, -9] },
    { id: "2e", code: "2E", name: "Right Hallway", position: [9, 4.8, 10], target: [9, 1.5, -9] },
    { id: "3e", code: "3E", name: "Left Door", position: [-5, 4, -1], target: [-11, 1.9, -4] },
    { id: "4e", code: "4E", name: "Right Door", position: [5, 4, -1], target: [11, 1.9, -4] },
    { id: "2f", code: "2F", name: "Teller Room 5", position: [0, 4.7, -15], target: [0, 1.5, -21] }
  ];

  // Five reserved positions per room. A character always uses the same
  // numbered slot, so two characters can never occupy the same coordinates.
  const ROOM_SPOTS = {
    "1a": [[15.45, 0, -25.95], [16.35, 0, -26.08], [17.25, 0, -26.16], [18.15, 0, -26.04], [19.05, 0, -25.88]],
    "1b": [[-19.4, 0, 18.1], [-18, 0, 16.3], [-16.6, 0, 18.2], [-15.2, 0, 16.4], [-13.9, 0, 18]],
    "1c": [[-3.7, 0, 28], [-1.8, 0, 26.3], [0, 0, 28], [1.8, 0, 26.3], [3.7, 0, 28]],
    "1d": [[-4.8, 0, 18.5], [-2.4, 0, 15.6], [0, 0, 18.3], [2.4, 0, 15.5], [4.8, 0, 18.4]],
    "2a": [[14.3, 0, 18], [15.7, 0, 16.2], [17.1, 0, 18.1], [18.5, 0, 16.3], [19.8, 0, 18]],
    "2b": [[-19.2, 0, -8.1], [-18.1, 0, -10.5], [-17, 0, -7.2], [-15.9, 0, -10.4], [-14.8, 0, -8]],
    "2c": [[14.8, 0, -8.1], [15.9, 0, -10.5], [17, 0, -7.2], [18.1, 0, -10.4], [19.2, 0, -8]],
    "3a": [[14.2, 0, 4.2], [15.7, 0, 2.2], [17.1, 0, 4.4], [18.5, 0, 2.3], [19.8, 0, 4.1]],
    "3b": [[-19.6, 0, -22.5], [-18.2, 0, -20.2], [-16.8, 0, -23], [-15.4, 0, -20.3], [-14, 0, -22.4]],
    "3d": [[-19.8, 0, 4.2], [-18.4, 0, 2.2], [-17, 0, 4.4], [-15.6, 0, 2.3], [-14.2, 0, 4.1]],
    "2d": [[-3.8, 0, 10.8], [-1.9, 0, 8.6], [0, 0, 11.1], [1.9, 0, 8.6], [3.8, 0, 10.8]],
    "1e": [[-9.45, 0, 7], [-8.55, 0, 3.4], [-9.45, 0, 0], [-8.55, 0, -3.5], [-9.45, 0, -7]],
    "2e": [[8.55, 0, 7], [9.45, 0, 3.4], [8.55, 0, 0], [9.45, 0, -3.5], [8.55, 0, -7]],
    "3e": [[-10.45, 0, -3.4], [-11.25, 0, -4.5], [-10.55, 0, -5.3], [-11.3, 0, -3.5], [-10.4, 0, -4.4]],
    "4e": [[10.45, 0, -3.4], [11.25, 0, -4.5], [10.55, 0, -5.3], [11.3, 0, -3.5], [10.4, 0, -4.4]],
    "2f": [[-3.7, 0, -20.2], [-1.9, 0, -22.1], [0, 0, -20.2], [1.9, 0, -22.1], [3.7, 0, -20.2]]
  };

  const CHARACTER_SLOT = Object.freeze({ regular: 0, girl: 1, rapper: 2, banana: 3, farmer: 4 });

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
        ctx.fillStyle = Math.random() > .5 ? "rgba(130,160,142,.07)" : "rgba(0,0,0,.09)";
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
      glass: material(0x96d9df, { transparent: true, opacity: .2, depthWrite: false, roughness: .08 }),
      mirror: material(0xbde1e6, { metalness: .85, roughness: .04 }),
      light: material(0xffffff, { emissive: 0xffffff, emissiveIntensity: 4 }),
      screen: material(0x07120b, { emissive: 0x31ff75, emissiveIntensity: 2.3 }),
      screenRed: material(0x1a0705, { emissive: 0xff332b, emissiveIntensity: 2.4 })
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
      const mesh = new THREE.Mesh(new THREE.BoxGeometry(width, height, depth), mat);
      mesh.position.set(x, y, z);
      mesh.rotation.y = rotationY;
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      parent.add(mesh);
      return mesh;
    }

    function cylinder(x, y, z, radius, depth, mat, rotationX = 0, rotationZ = 0, parent = scene, segments = 24) {
      const mesh = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, depth, segments), mat);
      mesh.position.set(x, y, z);
      mesh.rotation.x = rotationX;
      mesh.rotation.z = rotationZ;
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      parent.add(mesh);
      return mesh;
    }

    function sphere(x, y, z, radius, mat, parent = scene) {
      const mesh = new THREE.Mesh(new THREE.SphereGeometry(radius, 18, 12), mat);
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
        new THREE.MeshBasicMaterial({ map, side: THREE.DoubleSide })
      );
      mesh.position.set(x, y, z);
      mesh.rotation.y = rotationY;
      scene.add(mesh);
      return mesh;
    }

    const ceilingLight = (x, z, width = 4) => box(x, 5.9, z, width, .08, .65, materials.light);

    function chair(x, z, rotationY = 0) {
      const group = new THREE.Group();
      group.position.set(x, 0, z);
      group.rotation.y = rotationY;
      scene.add(group);
      box(0, .55, 0, 1.05, .18, 1, materials.blue, 0, group);
      box(0, 1.15, -.43, 1.05, 1.18, .15, materials.blue, 0, group);
      for (const sideX of [-.38, .38]) {
        for (const sideZ of [-.34, .34]) {
          cylinder(sideX, .26, sideZ, .05, .5, materials.chrome, 0, 0, group, 10);
        }
      }
    }

    function monitor(x, y, z, red = false, rotationY = 0) {
      const group = new THREE.Group();
      group.position.set(x, y, z);
      group.rotation.y = rotationY;
      scene.add(group);
      box(0, 0, 0, 1.1, .72, .12, materials.dark, 0, group);
      box(0, 0, .067, .92, .55, .025, red ? materials.screenRed : materials.screen, 0, group);
      cylinder(0, -.47, 0, .05, .54, materials.chrome, 0, 0, group, 10);
      box(0, -.75, 0, .5, .06, .36, materials.chrome, 0, group);
    }

    function tellerRoom(x, z, label) {
      box(x, .03, z, 10.5, .08, 8, materials.carpet);
      box(x, 3, z - 3.4, 10.5, 6, .3, materials.wall);
      box(x - 5.1, 3, z, .3, 6, 7, materials.wall);
      box(x + 5.1, 3, z, .3, 6, 7, materials.wall);
      for (let station = -1; station <= 1; station++) {
        const stationX = x + station * 2.8;
        box(stationX, .72, z, 2.42, 1.44, 1.18, materials.wood);
        box(stationX, 1.47, z + .02, 2.28, .12, 1.08, materials.white);
        box(stationX, 2.45, z + .05, .06, 1.9, 1.85, materials.glass);
        monitor(stationX, 2.05, z - .38, station === 1);
        chair(stationX, z - 1.48, Math.PI);
      }
      sign(label, x, 4.68, z - 3.2);
      ceilingLight(x, z - 1);
      ceilingLight(x, z + 2);
    }

    function bathroom(x, z, label, mens) {
      box(x, .03, z, 10, .08, 7.5, materials.floor);
      box(x, 3, z - 3.5, 10, 6, .3, materials.wall);
      box(x - 4.8, 3, z, .3, 6, 7, materials.wall);
      box(x + 4.8, 3, z, .3, 6, 7, materials.wall);
      for (let stall = 0; stall < 3; stall++) {
        const stallX = x + .25 + stall * 1.45;
        box(stallX, 1.42, z - 2.15, 1.13, 2.84, .11, materials.dark);
        box(stallX - .65, 1.4, z - 1.48, .08, 2.8, 1.55, materials.steel);
      }
      box(x - 2.75, .85, z - 2.15, 2.7, .25, 1, materials.white);
      box(x - 2.75, 2.12, z - 3.31, 2.85, 1.55, .06, materials.mirror);
      if (mens) {
        for (let i = 0; i < 3; i++) box(x - 3.7 + i * 1.05, .78, z - 2.72, .63, 1.12, .42, materials.white);
      }
      sign(label, x, 4.72, z - 3.3);
      ceilingLight(x, z);
    }

    function vault(x, z) {
      box(x, .03, z, 11, .08, 10, materials.floor);
      box(x, 3, z - 4.2, 11, 6, .35, materials.dark);
      for (let row = 0; row < 5; row++) {
        for (let column = 0; column < 8; column++) {
          const depositX = x - 4.1 + column * 1.17;
          box(depositX, .55 + row * .82, z - 3.92, .98, .68, .12, materials.steel);
        }
      }

      // The safe starts cracked open. The dark portal and interior light make
      // the starting characters visible behind the heavy hinged door.
      cylinder(x, 2.3, z - 3.7, 2.42, .28, materials.dark, Math.PI / 2);
      const safeGlow = new THREE.PointLight(0x9bb59f, 18, 8, 2);
      safeGlow.position.set(x, 2.7, z - 2.8);
      scene.add(safeGlow);

      const hinge = new THREE.Group();
      hinge.position.set(x - 2.25, 2.3, z - 3.35);
      hinge.rotation.y = -.5;
      scene.add(hinge);

      cylinder(2.25, 0, 0, 2.35, .36, materials.steel, Math.PI / 2, 0, hinge);
      cylinder(2.25, 0, .24, .72, .2, materials.wood, Math.PI / 2, 0, hinge);

      const rim = new THREE.Mesh(
        new THREE.TorusGeometry(2.08, .12, 10, 48),
        materials.chrome
      );
      rim.position.set(2.25, 0, .24);
      rim.castShadow = true;
      hinge.add(rim);

      for (let angle = 0; angle < Math.PI * 2; angle += Math.PI / 3) {
        const spoke = box(2.25 + Math.cos(angle) * .55, Math.sin(angle) * .55, .37, .08, 1.15, .08, materials.chrome, 0, hinge);
        spoke.rotation.z = -angle;
      }

      sign("BANK SAFE", x, 5, z - 4);
      ceilingLight(x, z - 1);
    }

    function stockRoom(x, z) {
      box(x, .03, z, 11, .08, 10, materials.carpet);
      box(x, 3, z - 4.2, 11, 6, .35, materials.dark);
      sign("STOCK MARKET ROOM", x, 5, z - 4);
      for (let row = 0; row < 2; row++) {
        for (let desk = 0; desk < 4; desk++) {
          const deskX = x - 3.75 + desk * 2.45;
          const deskZ = z - 1.3 + row * 2.5;
          box(deskX, .75, deskZ, 2, .16, 1.15, materials.wood);
          monitor(deskX - .46, 1.54, deskZ - .25, (desk + row) % 2 === 0);
          monitor(deskX + .46, 1.54, deskZ - .25, (desk + row) % 2 !== 0);
          chair(deskX, deskZ + .86);
        }
      }
      ceilingLight(x, z);
    }

    function hallway(x, label) {
      box(x, .04, 1, 4, .08, 22, materials.carpet);
      box(x - 2, 3, 1, .25, 6, 22, materials.wall);
      box(x + 2, 3, 1, .25, 6, 22, materials.wall);
      for (let hallZ = -6; hallZ <= 6; hallZ += 6) {
        box(x - 1.86, 2, hallZ, .16, 4, 2.2, materials.wood);
        box(x + 1.86, 2, hallZ + 2.6, .16, 4, 2.2, materials.wood);
      }
      sign(label, x, 4.5, -9.84);
      ceilingLight(x, -5, 2.5);
      ceilingLight(x, 1, 2.5);
      ceilingLight(x, 7, 2.5);
    }

    function securityDoor(side, x, z) {
      const shutter = new THREE.Group();
      shutter.position.set(x, 4.7, z);
      scene.add(shutter);
      for (let panel = 0; panel < 9; panel++) {
        box(0, .28 + panel * .49, 0, .32, .43, 3.45, panel % 2 ? materials.steel : materials.chrome, 0, shutter);
      }
      box(x, 4.45, z, .72, .48, 4.15, materials.dark);
      box(x, 2.1, z - 1.92, .7, 4.2, .36, materials.dark);
      box(x, 2.1, z + 1.92, .7, 4.2, .36, materials.dark);
      sign(side === "left" ? "LEFT SECURITY DOOR" : "RIGHT SECURITY DOOR", x, 4.75, z, side === "left" ? -Math.PI / 2 : Math.PI / 2, 4.2, "#421515");
      doorMeshes[side] = { shutter, targetY: 4.7 };
    }

    function createStickFigure(color) {
      const group = new THREE.Group();
      const mat = new THREE.MeshStandardMaterial({ color, roughness: .45, metalness: .05 });
      const joint = new THREE.MeshStandardMaterial({ color: 0x0a0d0b, roughness: .8 });
      sphere(0, 2.52, 0, .35, mat, group);
      const body = cylinder(0, 1.65, 0, .13, 1.42, mat, 0, 0, group, 12);
      const leftArm = cylinder(-.36, 1.68, 0, .075, 1.08, mat, 0, -.48, group, 10);
      const rightArm = cylinder(.36, 1.68, 0, .075, 1.08, mat, 0, .48, group, 10);
      const leftLeg = cylinder(-.2, .58, 0, .09, 1.22, mat, 0, -.19, group, 10);
      const rightLeg = cylinder(.2, .58, 0, .09, 1.22, mat, 0, .19, group, 10);
      sphere(0, 2.52, -.3, .07, joint, group);
      group.userData.parts = { body, leftArm, rightArm, leftLeg, rightLeg };
      group.userData.goal = new THREE.Vector3();
      group.userData.room = "";
      group.visible = false;
      scene.add(group);
      return group;
    }

    // Entire bank camera world lives here, not in the HTML.
    box(0, -.16, 0, 52, .3, 60, materials.floor);
    box(0, 6.08, 0, 52, .2, 60, materials.ceiling);
    box(-26, 3, 0, .4, 6, 60, materials.wall);
    box(26, 3, 0, .4, 6, 60, materials.wall);
    box(0, 3, -30, 52, 6, .4, materials.wall);
    box(-15, 3, 30, 22, 6, .4, materials.wall);
    box(15, 3, 30, 22, 6, .4, materials.wall);
    box(0, 5.25, 30, 8, 1.5, .4, materials.wall);
    box(-2.05, 2.15, 29.85, 3.8, 4.3, .12, materials.glass);
    box(2.05, 2.15, 29.85, 3.8, 4.3, .12, materials.glass);
    box(0, 2.15, 29.72, .16, 4.3, .22, materials.steel);
    sign("NEEGY NATIONAL BANK", 0, 5.15, 29.7, Math.PI, 8);

    for (const atmX of [-6.1, 6.1]) {
      box(atmX, 1.55, 28.9, 2.05, 3.1, .7, materials.dark);
      monitor(atmX, 2.05, 28.5, false, Math.PI);
    }

    box(0, .05, 18, 18, .1, 12, materials.carpet);
    sign("MAIN ROOM", 0, 4.8, 12.2);
    chair(-3.2, 18);
    chair(-1.5, 18);
    chair(1.5, 18, Math.PI);
    chair(3.2, 18, Math.PI);
    box(0, .8, 10, 7, 1.6, 1.5, materials.wood);
    box(0, 1.65, 10.1, 6.8, .12, 1.35, materials.white);
    monitor(-1.5, 2.18, 9.65);
    monitor(1.5, 2.18, 9.65, true);
    sign("MAIN DESK", 0, 1, 10.78, Math.PI, 4.6);

    tellerRoom(-17, 18, "TELLER ROOM 1");
    tellerRoom(17, 18, "TELLER ROOM 2");
    tellerRoom(-17, 4, "TELLER ROOM 3");
    tellerRoom(17, 4, "TELLER ROOM 4");
    tellerRoom(0, -20, "TELLER ROOM 5");
    bathroom(-17, -9, "MEN'S BATHROOM", true);
    bathroom(17, -9, "WOMEN'S BATHROOM", false);
    vault(17, -23);
    stockRoom(-17, -23);
    hallway(-9, "LEFT HALLWAY");
    hallway(9, "RIGHT HALLWAY");
    securityDoor("left", -11, -4);
    securityDoor("right", 11, -4);

    scene.add(new THREE.HemisphereLight(0xeafff2, 0x142018, 2));
    const sun = new THREE.DirectionalLight(0xfff5df, 2.2);
    sun.position.set(14, 20, 18);
    sun.castShadow = true;
    sun.shadow.mapSize.set(1024, 1024);
    sun.shadow.camera.left = -35;
    sun.shadow.camera.right = 35;
    sun.shadow.camera.top = 35;
    sun.shadow.camera.bottom = -35;
    scene.add(sun);
    const lobbyLight = new THREE.PointLight(0xd8ffe6, 65, 38);
    lobbyLight.position.set(0, 5.2, 14);
    scene.add(lobbyLight);
    const rearLight = new THREE.PointLight(0xd9e8ff, 55, 34);
    rearLight.position.set(0, 5.2, -19);
    scene.add(rearLight);

    function show(id) {
      const found = CAMERA_DEFINITIONS.find(item => item.id === String(id).toLowerCase());
      if (!found) return false;
      selected = found;
      camera.position.set(...found.position);
      camera.lookAt(...found.target);
      return true;
    }

    function setDoorState(side, closed) {
      const door = doorMeshes[side];
      if (!door) return;
      door.targetY = closed ? 0 : 4.7;
    }

    /** @param {CameraEnemy[]} enemies */
    function syncEnemies(enemies) {
      const livingIds = new Set(enemies.map(enemy => enemy.id));
      for (const [id, figure] of figures) {
        if (!livingIds.has(id)) figure.visible = false;
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
        const goal = figure.userData.goal;

        if (figure.userData.room !== enemy.camera) {
          figure.userData.room = enemy.camera;
          const entryDirection = reservedSlot % 2 ? -1 : 1;
          figure.position.set(target[0] + entryDirection * 1.1, target[1], target[2] + 1.35);
          goal.set(target[0], target[1], target[2]);
        } else {
          goal.set(target[0], target[1], target[2]);
        }

        const scale = enemy.camera === "1a" ? .82 : 1;
        figure.scale.setScalar(scale);
      });
    }

    function update(delta, elapsed, enemies) {
      syncEnemies(enemies);
      for (const door of Object.values(doorMeshes)) {
        door.shutter.position.y += (door.targetY - door.shutter.position.y) * Math.min(1, delta * 9);
      }
      for (const figure of figures.values()) {
        if (!figure.visible) continue;
        const walking = figure.position.distanceToSquared(figure.userData.goal) > .006;
        figure.position.lerp(figure.userData.goal, Math.min(1, delta * 2.5));
        const swing = walking ? Math.sin(elapsed * 10) * .28 : 0;
        const parts = figure.userData.parts;
        parts.leftArm.rotation.z = -.48 + swing;
        parts.rightArm.rotation.z = .48 - swing;
        parts.leftLeg.rotation.z = -.19 - swing * .7;
        parts.rightLeg.rotation.z = .19 + swing * .7;
        figure.rotation.y = Math.sin(elapsed * .7 + figure.id) * .05;
      }
    }

    show("1a");

    return {
      scene,
      camera,
      cameras: CAMERA_DEFINITIONS,
      show,
      update,
      setDoorState,
      getCurrent: () => ({ ...selected })
    };
  }

  window.NeegyCameras = {
    definitions: CAMERA_DEFINITIONS,
    create: createCameraSystem
  };
})();
