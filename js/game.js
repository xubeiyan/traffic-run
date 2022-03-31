import * as THREE from "./three.module.js";

// 汽车和卡车
import { Car } from "./Car.js";
import { Truck } from "./Truck.js";

// 路
const trackRadius = 225;
const cwRadius = trackRadius - 20;
const ccwRadius = trackRadius + 20;
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

  const playerX = Math.cos(totalPlayerAngle) * cwRadius - arcCenterX;
  const playerY = Math.sin(totalPlayerAngle) * cwRadius;

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

import { addTrees } from "./Tree.js";
import { pickRandom } from "./tools.js";

addTrees(scene, arcCenterX);

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

const getVehicleSpeed = (type) => {
  if (type == "car") {
    const minimumSpeed = 1;
    const maximumSpeed = 2;
    return minimumSpeed + Math.random() * (maximumSpeed - minimumSpeed);
  }

  if ((type = "truck")) {
    const minimumSpeed = 0.6;
    const maximumSpeed = 1.5;
    return minimumSpeed + Math.random() * (maximumSpeed - minimumSpeed);
  }
};

const addVechicle = () => {
  const vehicleTypes = ["car", "truck"];

  const type = pickRandom(vehicleTypes);
  const mesh = type == "car" ? Car() : Truck();
  scene.add(mesh);

  const clockwise = Math.random() >= 0.5;
  const angle = clockwise ? Math.PI / 2 : -Math.PI / 2;

  const speed = getVehicleSpeed(type);
  otherVehicles.push({ mesh, type, clockwise, angle, speed });
};

const moveOtherVehicles = (timeDelta) => {
  otherVehicles.forEach((vehicle) => {
    let radius = 0;
    if (vehicle.clockwise) {
      vehicle.angle -= speed * timeDelta * vehicle.speed;
      radius = cwRadius;
    } else {
      vehicle.angle += speed * timeDelta * vehicle.speed;
      radius = ccwRadius;
    }

    const vehicleX = Math.cos(vehicle.angle) * radius + arcCenterX;
    const vehicleY = Math.sin(vehicle.angle) * radius;
    const rotation =
      vehicle.angle + (vehicle.clockwise ? -Math.PI / 2 : Math.PI / 2);

    vehicle.mesh.position.x = vehicleX;
    vehicle.mesh.position.y = vehicleY;
    vehicle.mesh.rotation.z = rotation;
  });
};

const getHitZonePosition = (center, angle, clockwise, distance) => {
  const directionAngle = angle + clockwise ? -Math.PI / 2 : +Math.PI / 2;
  return {
    x: center.x + Math.cos(directionAngle) * distance,
    y: center.y + Math.sin(directionAngle) * distance,
  };
};

const getDistance = (coordinate1, coordinate2) => {
  return Math.sqrt(
    (coordinate2.x - coordinate1.x) ** 2 + (coordinate2.y - coordinate1.y) ** 2
  );
};

const hitDetection = () => {
  const playerHitZone1 = getHitZonePosition(
    playerCar.position,
    playerAngleInintial + playerAngleMoved,
    true,
    15
  );

  const playerHitZone2 = getHitZonePosition(
    playerCar.position,
    playerAngleInintial + playerAngleMoved,
    true,
    -15
  );

  const hit = otherVehicles.some((vehicle) => {
    if (vehicle.type == "car") {
      const vehicleHitZone1 = getHitZonePosition(
        vehicle.mesh.position,
        vehicle.angle,
        vehicle.clockwise,
        15
      );

      const vehicleHitZone2 = getHitZonePosition(
        vehicle.mesh.position,
        vehicle.angle,
        vehicle.clockwise,
        -15
      );

      // 玩家车撞到其他车的头部或尾部
      if (getDistance(playerHitZone1, vehicleHitZone1) < 40) return true;
      if (getDistance(playerHitZone1, vehicleHitZone2) < 40) return true;

      // 玩家车被追尾
      if (getDistance(playerHitZone2, vehicleHitZone1) < 40) return true;
    }

    if (vehicle.type == "truck") {
      const vehicleHitZone1 = getHitZonePosition(
        vehicle.mesh.position,
        vehicle.angle,
        vehicle.clockwise,
        35
      );

      const vehicleHitZone2 = getHitZonePosition(
        vehicle.mesh.position,
        vehicle.angle,
        vehicle.clockwise,
        0
      );

      const vehicleHitZone3 = getHitZonePosition(
        vehicle.mesh.position,
        vehicle.angle,
        vehicle.clockwise,
        -35
      );

      // 玩家车撞上了其他车的头中尾
      if (getDistance(playerHitZone1, vehicleHitZone1) < 40) return true;
      if (getDistance(playerHitZone1, vehicleHitZone2) < 40) return true;
      if (getDistance(playerHitZone1, vehicleHitZone3) < 40) return true;

      // 玩家车被追尾
      if (getDistance(playerHitZone2, vehicleHitZone1) < 40) return true;
    }
  });

  // 撞到了就结束游戏
  if (hit) {
    renderer.setAnimationLoop(null);
    endGame();
  }
};

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

  // 每5圈增加一辆车，达到MAX就不再增加
  if (otherVehicles.length < (laps + 1) / 5 && otherVehicles.length < 6)
    addVechicle();

  moveOtherVehicles(timeDelta);

  hitDetection();

  renderer.render(scene, camera);
  lastTimestamp = timestamp;
};

const endTip = document.getElementById("end-tip");
const restartButton = document.getElementById("restart");

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
  // 去掉endgame
  endTip.classList.add("hide");
};

reset();

const startGame = () => {
  if (ready) {
    ready = false;
    renderer.setAnimationLoop(animation);
  }
};

// 结束游戏
const endGame = () => {
  endTip.classList.remove("hide");
  restartButton.addEventListener("click", () => {
    reset();
  });
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

up.addEventListener("touchstart", () => {
  accelerate = true;
});

down.addEventListener("touchstart", () => {
  decelerate = true;
});

up.addEventListener("touchend", () => {
  accelerate = false;
});

down.addEventListener("touchend", () => {
  decelerate = false;
});

up.addEventListener('contextmenu', (e) => e.preventDefault());
down.addEventListener('contextmenu', (e) => e.preventDefault());

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
