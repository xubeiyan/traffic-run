import * as THREE from "./three.module.js";

// 车辆颜色
const vehicleColors = [0xa52523, 0xbdb638, 0x78b14b];

const pickRandom = (arr) => {
  return arr[Math.floor(Math.random() * arr.length)];
};

// 车窗(前)纹理
const getCarFrontTexture = () => {
  const canvas = document.createElement("canvas");
  canvas.width = 64;
  canvas.height = 32;
  const context = canvas.getContext("2d");

  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, 64, 32);

  context.fillStyle = "#666666";
  context.fillRect(8, 8, 48, 24);

  return new THREE.CanvasTexture(canvas);
};

const getCarSideTexture = () => {
  const canvas = document.createElement("canvas");
  canvas.width = 128;
  canvas.height = 32;
  const context = canvas.getContext("2d");

  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, 128, 32);

  context.fillStyle = "#666666";
  context.fillRect(10, 8, 38, 24);
  context.fillRect(58, 8, 60, 24);

  return new THREE.CanvasTexture(canvas);
};

// 车轮
const Wheel = () => {
  const wheel = new THREE.Mesh(
    new THREE.BoxBufferGeometry(12, 33, 12),
    new THREE.MeshLambertMaterial({ color: 0x333333 })
  );
  wheel.position.z = 6;
  return wheel;
};

// 车辆
const Car = () => {
  const car = new THREE.Group();
  const backWheel = Wheel();
  backWheel.position.x = -18;
  car.add(backWheel);

  const frontWheel = Wheel();
  frontWheel.position.x = 18;
  car.add(frontWheel);

  const main = new THREE.Mesh(
    new THREE.BoxBufferGeometry(60, 30, 15),
    new THREE.MeshLambertMaterial({ color: pickRandom(vehicleColors) })
  );
  main.position.z = 12;
  car.add(main);

  // 引入车窗纹理
  const carFrontTexture = getCarFrontTexture();
  carFrontTexture.center = new THREE.Vector2(0.5, 0.5);
  carFrontTexture.rotation = Math.PI / 2;

  const carBackTexture = getCarFrontTexture();
  carBackTexture.center = new THREE.Vector2(0.5, 0.5);
  carBackTexture.rotation = -Math.PI / 2;

  const carRightSideTexture = getCarSideTexture();

  const carLeftSideTexture = getCarSideTexture();
  carLeftSideTexture.flipY = false;

  const cabin = new THREE.Mesh(new THREE.BoxBufferGeometry(33, 24, 12), [
    new THREE.MeshLambertMaterial({ map: carFrontTexture }),
    new THREE.MeshLambertMaterial({ map: carBackTexture }),
    new THREE.MeshLambertMaterial({ map: carLeftSideTexture }),
    new THREE.MeshLambertMaterial({ map: carRightSideTexture }),
    new THREE.MeshLambertMaterial({ color: 0xffffff }),
    new THREE.MeshLambertMaterial({ color: 0xffffff }),
  ]);
  cabin.position.x = -6;
  cabin.position.z = 25.5;
  car.add(cabin);

  return car;
};



// 路
const trackRadius = 225;
const realRadius = trackRadius - 20;
const trackWidth = 45;
const innerTrackRadius = trackRadius - trackWidth;
const outerTrackRadius = trackRadius + trackWidth;

// 弧1
const arcAngle1 = (1 / 3) * Math.PI; // 60度

const deltaY = Math.sin(arcAngle1) * innerTrackRadius;
const arcAngle2 = Math.asin(deltaY / outerTrackRadius);

const arcCenterX =
  (Math.cos(arcAngle1) * innerTrackRadius +
    Math.cos(arcAngle2) * outerTrackRadius) /
  2;

const arcAngle3 = Math.acos(arcCenterX / innerTrackRadius);
const arcAngle4 = Math.acos(arcCenterX / outerTrackRadius);



// 场景
const scene = new THREE.Scene();

const playerCar = Car();
const playerAngleInintial = Math.PI;
let playerAngleMoved;
const speed = 0.0017;
let accelerate = false;
let decelerate = false;

const getPlayerSpeed = () => {
  if (accelerate) return speed * 2;
  if (decelerate) return speed * 0.5;
  return speed;
};

const movePlayerCar = (timeDelta) => {
  const playerSpeed = getPlayerSpeed();
  playerAngleMoved -= playerSpeed * timeDelta;

  const totalPlayerAngle = playerAngleInintial + playerAngleMoved;

  const playerX = Math.cos(totalPlayerAngle) * realRadius - arcCenterX;
  const playerY = Math.sin(totalPlayerAngle) * realRadius;

  playerCar.position.x = playerX;
  playerCar.position.y = playerY;

  // 旋转车辆，让车体朝前
  playerCar.rotation.z = totalPlayerAngle - Math.PI / 2;
};

scene.add(playerCar);

// 光照(环境光)
const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
scene.add(ambientLight);

// 直射光
const dirLight = new THREE.DirectionalLight(0xffffff, 0.6);
dirLight.position.set(100, -300, 400);

dirLight.castShadow = true;
dirLight.shadow.mapSize.width = 1024;
dirLight.shadow.mapSize.height = 1024;
dirLight.shadow.camera.left = -400;
dirLight.shadow.camera.right = 350;
dirLight.shadow.camera.top = 400;
dirLight.shadow.camera.bottom = -300;
dirLight.shadow.camera.near = 100;
dirLight.shadow.camera.far = 800;

scene.add(dirLight);

// 镜头位置（使用正交投影）
const aspectRatio = window.innerWidth / window.innerHeight;
const cameraWidth = 960;
const cameraHeight = cameraWidth / aspectRatio;

const camera = new THREE.OrthographicCamera(
  cameraWidth / -2,
  cameraWidth / 2,
  cameraHeight / 2,
  cameraHeight / -2,
  0, // 近
  1000 // 远
);

camera.position.set(0, -210, 300);
// camera.up.set(0, 0, 1);
camera.lookAt(0, 0, 0);

const renderMap = (mapWidth, mapHeight) => {
  // 路上画的线平面
  const lineMarkingsTexture = getLineMarkings(mapWidth, mapHeight);

  const planeGeometry = new THREE.PlaneBufferGeometry(mapWidth, mapHeight);
  const planeMaterial = new THREE.MeshLambertMaterial({
    map: lineMarkingsTexture,
  });
  const plane = new THREE.Mesh(planeGeometry, planeMaterial);
  plane.receiveShadow = true;
  scene.add(plane);

  // 草坪
  const islandLeft = getLeftIsland();
  const islandMiddle = getMiddleIsland();
  const islandRight = getRightIsland();
  const outerField = getOuterField(mapWidth, mapHeight);

  const fieldGeometry = new THREE.ExtrudeBufferGeometry(
    [islandLeft, islandMiddle, islandRight, outerField],
    {
      depth: 6,
      bevelEnabled: false,
    }
  );

  const fieldMesh = new THREE.Mesh(fieldGeometry, [
    new THREE.MeshLambertMaterial({ color: 0x67c240 }),
    new THREE.MeshLambertMaterial({ color: 0x23311c }),
  ]);
  fieldMesh.receiveShadow = true;

  scene.add(fieldMesh);
};

// 左边草坪
const getLeftIsland = () => {
  const islandLeft = new THREE.Shape();

  islandLeft.absarc(
    -arcCenterX,
    0,
    innerTrackRadius,
    arcAngle1,
    -arcAngle1,
    false
  );

  islandLeft.absarc(
    arcCenterX,
    0,
    outerTrackRadius,
    Math.PI + arcAngle2,
    Math.PI - arcAngle2,
    true
  );

  return islandLeft;
};

// 中间草坪
const getMiddleIsland = () => {
  const islandMiddle = new THREE.Shape();

  islandMiddle.absarc(
    -arcCenterX,
    0,
    innerTrackRadius,
    arcAngle3,
    -arcAngle3,
    true
  );

  islandMiddle.absarc(
    arcCenterX,
    0,
    innerTrackRadius,
    Math.PI + arcAngle3,
    Math.PI - arcAngle3,
    true
  );

  return islandMiddle;
};

// 右边草坪
const getRightIsland = () => {
  const islandRight = new THREE.Shape();

  islandRight.absarc(
    arcCenterX,
    0,
    innerTrackRadius,
    Math.PI - arcAngle1,
    Math.PI + arcAngle1,
    true
  );

  islandRight.absarc(
    -arcCenterX,
    0,
    outerTrackRadius,
    -arcAngle2,
    arcAngle2,
    false
  );

  return islandRight;
};

// 外部草坪
const getOuterField = (mapWidth, mapHeight) => {
  const field = new THREE.Shape();

  field.moveTo(-mapWidth / 2, -mapHeight / 2);
  field.lineTo(0, -mapHeight / 2);

  field.absarc(-arcCenterX, 0, outerTrackRadius, -arcAngle4, arcAngle4, true);

  field.absarc(
    arcCenterX,
    0,
    outerTrackRadius,
    Math.PI - arcAngle4,
    Math.PI + arcAngle4,
    true
  );

  field.lineTo(0, -mapHeight / 2);
  field.lineTo(mapWidth / 2, -mapHeight / 2);
  field.lineTo(mapWidth / 2, mapHeight / 2);
  field.lineTo(-mapWidth / 2, mapHeight / 2);

  return field;
};

const getLineMarkings = (mapWidth, mapHeight) => {
  const canvas = document.createElement("canvas");
  canvas.width = mapWidth;
  canvas.height = mapHeight;
  const context = canvas.getContext("2d");
  // 背景颜色
  context.fillStyle = "#546E90";
  context.fillRect(0, 0, mapWidth, mapHeight);

  context.lineWidth = 2;
  context.strokeStyle = "#E0FFFF";
  context.setLineDash([10, 14]);

  // 左边圆圈
  context.beginPath();
  context.arc(
    mapWidth / 2 - arcCenterX,
    mapHeight / 2,
    trackRadius,
    0,
    Math.PI * 2
  );
  context.stroke();

  // 右边圆圈
  context.beginPath();
  context.arc(
    mapWidth / 2 + arcCenterX,
    mapHeight / 2,
    trackRadius,
    0,
    Math.PI * 2
  );
  context.stroke();

  return new THREE.CanvasTexture(canvas);
};

// 树
const treeCrownColor = 0x498c2c;
const treeTrunkColor = 0x4b3f2f;

const treeTrunkGeometry = new THREE.BoxBufferGeometry(15, 15, 30);
const treeTrunkMaterial = new THREE.MeshLambertMaterial({
  color: treeTrunkColor
});
const treeCrownMaterial = new THREE.MeshLambertMaterial({
  color: treeCrownColor
});

const Tree = () => {
  const tree = new THREE.Group();

  const trunk = new THREE.Mesh(treeTrunkGeometry, treeTrunkMaterial);
  trunk.position.z = 10;
  trunk.castShadow = true;
  trunk.receiveShadow = true;
  trunk.matrixAutoUpdate = false;
  tree.add(trunk);

  const treeHeights = [45, 60, 75];
  const height = pickRandom(treeHeights);

  const crown = new THREE.Mesh(
    new THREE.SphereGeometry(height / 2, 30, 30),
    treeCrownMaterial
  );
  crown.position.z = height / 2 + 30;
  crown.castShadow = true;
  crown.receiveShadow = false;
  tree.add(crown);

  return tree;
};

// 添加树
const addTrees = () => {
  const tree1 = Tree();
  tree1.position.x = arcCenterX * 1.3;
  scene.add(tree1);

  const tree2 = Tree();
  tree2.position.y = arcCenterX * 1.9;
  tree2.position.x = arcCenterX * 1.3;
  scene.add(tree2);

  const tree3 = Tree();
  tree3.position.x = arcCenterX * 0.8;
  tree3.position.y = arcCenterX * 2;
  scene.add(tree3);

  const tree4 = Tree();
  tree4.position.x = arcCenterX * 1.8;
  tree4.position.y = arcCenterX * 2;
  scene.add(tree4);

  const tree5 = Tree();
  tree5.position.x = -arcCenterX * 1;
  tree5.position.y = arcCenterX * 2;
  scene.add(tree5);

  const tree6 = Tree();
  tree6.position.x = -arcCenterX * 2;
  tree6.position.y = arcCenterX * 1.8;
  scene.add(tree6);

  const tree7 = Tree();
  tree7.position.x = arcCenterX * 0.8;
  tree7.position.y = -arcCenterX * 2;
  scene.add(tree7);

  const tree8 = Tree();
  tree8.position.x = arcCenterX * 1.8;
  tree8.position.y = -arcCenterX * 2;
  scene.add(tree8);

  const tree9 = Tree();
  tree9.position.x = -arcCenterX * 1;
  tree9.position.y = -arcCenterX * 2;
  scene.add(tree9);

  const tree10 = Tree();
  tree10.position.x = -arcCenterX * 2;
  tree10.position.y = -arcCenterX * 1.8;
  scene.add(tree10);

  const tree11 = Tree();
  tree11.position.x = arcCenterX * 0.6;
  tree11.position.y = -arcCenterX * 2.3;
  scene.add(tree11);

  const tree12 = Tree();
  tree12.position.x = arcCenterX * 1.5;
  tree12.position.y = -arcCenterX * 2.4;
  scene.add(tree12);

  const tree13 = Tree();
  tree13.position.x = -arcCenterX * 0.7;
  tree13.position.y = -arcCenterX * 2.4;
  scene.add(tree13);

  const tree14 = Tree();
  tree14.position.x = -arcCenterX * 1.5;
  tree14.position.y = -arcCenterX * 1.8;
  scene.add(tree14);
};

addTrees();

renderMap(cameraWidth, cameraHeight * 2);

// 渲染器
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.type = THREE.PCFShadowMap;
renderer.shadowMap.enabled = true;
renderer.render(scene, camera);

document.body.appendChild(renderer.domElement);


// 游戏控制部分
let ready;
let score;
const scoreElement = document.getElementById("score");
let otherVehicles = [];
let lastTimestamp;

const animation = (timestamp) => {
  if (!lastTimestamp) {
    lastTimestamp = timestamp;
    return;
  }

  const timeDelta = timestamp - lastTimestamp;

  movePlayerCar(timeDelta);

  // 圈数
  const laps = Math.floor(Math.abs(playerAngleMoved) / (Math.PI * 2));

  // 更新圈数至分数
  if (laps != score) {
    score = laps;
    scoreElement.textContent = score;
  }

  renderer.render(scene, camera);
  lastTimestamp = timestamp;
};

const reset = () => {
  // 重置位置和分数
  playerAngleMoved = 0;
  movePlayerCar(0);
  score = 0;
  scoreElement.textContent = score;
  lastTimestamp = undefined;

  // 去掉其他的车辆
  otherVehicles.forEach((vehicle) => {
    scene.remove(vehicle.mesh);
  });
  otherVehicles = [];

  renderer.render(scene, camera);
  ready = true;
};
reset();

const startGame = () => {
  if (ready) {
    ready = false;
    renderer.setAnimationLoop(animation);
  }
};

const up = document.getElementById("up");
const down = document.getElementById("down");

up.addEventListener("mousedown", () => {
  startGame();
  accelerate = true;
});

down.addEventListener("mousedown", () => {
  decelerate = true;
});

up.addEventListener("mouseup", () => {
  accelerate = false;
});

down.addEventListener("mouseup", () => {
  decelerate = false;
});

// 处理按键，由于ArrowKey存在只能绑定keydown
window.addEventListener("keydown", (e) => {
  if (e.key == "ArrowUp") {
    startGame();
    accelerate = true;
    return;
  }

  if (e.key == "ArrowDown") {
    decelerate = true;
    return;
  }

  if (e.key == "R" || e.key == "r") {
    reset();
    return;
  }
});

window.addEventListener("keyup", (e) => {
  if (e.key == "ArrowUp") {
    accelerate = false;
    return;
  }

  if (e.key == "ArrowDown") {
    decelerate = false;
    return;
  }
});
