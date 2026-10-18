"use strict";

// 游戏配置
const CONFIG = {
  canvasWidth: 1024,
  canvasHeight: 576,
  tileSize: 40,
  mapLeft: 32,
  groundTop: 440,
  playerWidth: 18,
  playerHeight: 34,
  doorWidth: 28,
  doorHeight: 58,
  moveSpeed: 200,
  jumpSpeed: -600,
  gravity: 1800,
  maxDeltaTime: 0.05,
  respawnDelay: 0.5
};

// # 是地面，. 是坑
const LEVEL_ONE_MAP = "###..##..##..##..##..###";
const LEVEL_FOUR_PLATFORM_XS = [80, 280, 480, 680, 880, 1080];
const LEVEL_FOUR_UPPER_Y = 160;
const LEVEL_FOUR_LOWER_Y = 440;
const LEVEL_FIVE_STEPS = [
  { x: 1200, y: 400 },
  { x: 1320, y: 360 },
  { x: 1440, y: 320 },
  { x: 1560, y: 280 },
  { x: 1680, y: 240 }
];
const LEVEL_FIVE_SAW_CONFIG = {
  sawBaseSpeed: CONFIG.moveSpeed * 1.08,
  sawAcceleration: 2,
  sawMaxSpeed: CONFIG.moveSpeed * 1.4,
  sawRotationSpeed: 5,
  sawInitialDistance: 500,
  radius: 30,
  collisionRadius: 26
};
const LEVEL_SIX_SAW_CONFIG = {
  wheelCount: 4,
  wheelRadius: 15,
  collisionRadius: 12,
  moveSpeed: CONFIG.moveSpeed * 0.9,
  rotationSpeed: 5,
  riseSpeed: 400,
  blockY: 330
};
const LEVEL_SIX_SAW_STATE = {
  HIDDEN: "HIDDEN",
  MOVING_RIGHT: "MOVING_RIGHT",
  RISING: "RISING",
  BLOCKING: "BLOCKING"
};
const LEVEL_SEVEN_TURRET_CONFIG = {
  triggerLeft: CONFIG.tileSize * 2,
  triggerRight: CONFIG.tileSize * 3,
  transformX: CONFIG.tileSize * 4,
  projectileSize: 40,
  projectileSpeed: CONFIG.moveSpeed * 0.9,
  turnSpeed: 3.5,
  acceleration: 30,
  maximumSpeed: CONFIG.moveSpeed * 1.2,
  wallWidth: 24,
  explosionDuration: 0.5
};
const LEVEL_SEVEN_TURRET_STATE = {
  HIDDEN: "HIDDEN",
  PROJECTILE: "PROJECTILE",
  HOMING: "HOMING",
  ACCELERATING: "ACCELERATING",
  EXPLODING: "EXPLODING",
  DESTROYED: "DESTROYED"
};
const LEVEL_SEVEN_PILLAR_CONFIG = {
  warningDuration: 0.8,
  fallSpeed: 900,
  dwellDuration: 0.7,
  retractSpeed: 900
};
const LEVEL_SEVEN_PILLAR_STATE = {
  HIDDEN: "HIDDEN",
  WARNING: "WARNING",
  FALLING: "FALLING",
  DWELLING: "DWELLING",
  RETRACTING: "RETRACTING",
  COMPLETE: "COMPLETE"
};
const SAW_STATE = {
  HIDDEN: "HIDDEN",
  CHASING: "CHASING",
  EXITED: "EXITED"
};

function createLevelFiveSawRoute() {
  const radius = LEVEL_FIVE_SAW_CONFIG.radius;
  const firstStep = LEVEL_FIVE_STEPS[0];
  const route = [
    { x: firstStep.x - radius - 30, y: CONFIG.groundTop - radius },
    { x: firstStep.x - radius, y: firstStep.y - radius }
  ];

  for (let index = 0; index < LEVEL_FIVE_STEPS.length; index += 1) {
    const step = LEVEL_FIVE_STEPS[index];
    const nextStep = LEVEL_FIVE_STEPS[index + 1];

    route.push({
      x: step.x + 80 - radius,
      y: step.y - radius
    });

    if (nextStep) {
      route.push({
        x: nextStep.x - radius,
        y: nextStep.y - radius
      });
    }
  }

  route.push(
    { x: 1800, y: LEVEL_FIVE_STEPS[4].y - radius },
    { x: 1830, y: LEVEL_FIVE_STEPS[4].y - radius },
    { x: 1830, y: 160 - radius },
    { x: 1000, y: 160 - radius },
    { x: -radius - 1, y: 160 - radius }
  );

  return route;
}
const LEVEL_FIVE_SAW_ROUTE = createLevelFiveSawRoute();
const LEVEL_SIX_START_Y = 360;
const LEVEL_SIX_SPIKE_PLATFORM_YS = [360, 360, 360, 360, 360, 360];
const LEVEL_SIX_GOAL_Y = 360;
// 第六关循环下落时限制速度，避免速度逐圈累积而错过尖刺间隙。
const LEVEL_SIX_MAX_FALL_SPEED = 450;

function createLevelSevenMap() {
  const roomOneCeiling = { x: 0, y: 264, width: 400, height: 16 };
  const roomTwoCeiling = { x: 640, y: 184, width: 600, height: 16 };
  const platforms = [
    { x: 160, y: 360, width: 80, height: 16 },
    { x: 250, y: 350, width: 80, height: 16 },
    { x: 340, y: 340, width: 80, height: 16 },
    { x: 430, y: 340, width: 80, height: 16 },
    { x: 550, y: 300, width: 80, height: 16 }
  ].map((platform) => ({
    ...platform,
    color: "rgba(190, 198, 200, 0.28)"
  }));

  const finalGround = [
    { x: 640, y: 360, width: 600 },
    { x: 1320, y: 360, width: 80 },
    { x: 1480, y: 360, width: 80 },
    { x: 1640, y: 360, width: 160 }
  ].map((surface) => ({
    ...surface,
    height: CONFIG.canvasHeight - surface.y,
    color: "#777777"
  }));

  const roomOneFloor = {
    x: 0,
    y: 400,
    width: 400,
    height: CONFIG.canvasHeight - 400,
    color: "#777777"
  };
  const roomOneWall = {
    x: 0,
    y: roomOneCeiling.y,
    width: 16,
    height: 136,
    color: "#5e6265"
  };
  return {
    start: { x: 40, y: roomOneFloor.y - CONFIG.playerHeight },
    bounds: { left: 0, right: 1800 },
    roomOne: { x: 0, y: 280, width: 400, height: 120 },
    roomTwo: { x: 640, y: 200, width: 600, height: 160 },
    floorSurfaces: [roomOneFloor, ...finalGround, roomOneCeiling, roomTwoCeiling],
    ground: [
      roomOneFloor,
      roomOneWall,
      roomOneCeiling,
      ...finalGround,
      roomTwoCeiling
    ],
    ceilings: [roomOneCeiling, roomTwoCeiling],
    solidWalls: [roomOneWall, roomOneCeiling, roomTwoCeiling],
    platforms,
    turret: { x: 360, y: 280, width: 40, height: 80 },
    button: { x: 800, y: 344, width: 40, height: 16 },
    exitGate: { x: 1240, y: 200, width: 24, height: 160 },
    pillarSpace: { x: 1680, y: 180, width: 120, height: 180 },
    door: {
      x: 1640 + (160 - CONFIG.doorWidth) / 2,
      y: 360 - CONFIG.doorHeight,
      width: CONFIG.doorWidth,
      height: CONFIG.doorHeight
    }
  };
}

function createLevelSixMap() {
  const startPlatform = {
    x: 40,
    y: LEVEL_SIX_START_Y,
    width: 80,
    height: 16,
    color: "#777777"
  };
  const spikePlatforms = Array.from({ length: 6 }, (_, index) => ({
    x: 320 + index * 240,
    y: LEVEL_SIX_SPIKE_PLATFORM_YS[index],
    width: 120,
    height: 16,
    color: "#777777"
  }));
  const goalPlatform = {
    x: 1760,
    y: LEVEL_SIX_GOAL_Y,
    width: 80,
    height: 16,
    color: "#777777"
  };

  return {
    start: {
      x: startPlatform.x + startPlatform.width / 2 - CONFIG.playerWidth / 2,
      y: startPlatform.y - CONFIG.playerHeight
    },
    bounds: {
      left: 0,
      right: goalPlatform.x + goalPlatform.width
    },
    ground: [startPlatform, ...spikePlatforms, goalPlatform],
    spikePlatforms,
    door: {
      x: goalPlatform.x + (goalPlatform.width - CONFIG.doorWidth) / 2,
      y: goalPlatform.y - CONFIG.doorHeight,
      width: CONFIG.doorWidth,
      height: CONFIG.doorHeight
    }
  };
}

function createLevelFivePlatforms() {
  return [
    ...LEVEL_FIVE_STEPS.map((step) => ({
      x: step.x,
      y: step.y,
      width: 80,
      height: 16,
      color: "rgba(190, 198, 200, 0.2)"
    })),
    {
      x: 880,
      y: 80,
      width: 80,
      height: 16,
      color: "rgba(190, 198, 200, 0.2)"
    }
  ];
}

function createLevelFourPlatforms() {
  const platforms = [];

  for (const x of LEVEL_FOUR_PLATFORM_XS) {
    platforms.push(
      { x, y: LEVEL_FOUR_UPPER_Y, row: "upper", width: 80, height: 16, color: "#777777" },
      { x, y: LEVEL_FOUR_LOWER_Y, row: "lower", width: 80, height: 16, color: "#777777" }
    );
  }

  return platforms;
}

const GAME_STATE = {
  PLAYING: "PLAYING",
  DEAD: "DEAD",
  WON: "WON",
  PAUSED: "PAUSED",
  MAIN_MENU: "MAIN_MENU",
  SAVE_SLOTS: "SAVE_SLOTS"
};

const SAVE_KEY = "levelDevilMiniSaveSlots";
const LEGACY_SAVE_KEY = "levelDevilMiniSave";
const SAVE_VERSION = 2;
const LEGACY_SAVE_VERSION = 1;
const SAVE_SLOT_COUNT = 3;
const MENU_STARS = Array.from({ length: 120 }, (_, index) => ({
  x: (index * 137 + 29) % CONFIG.canvasWidth,
  y: (index * 97 + 53) % CONFIG.canvasHeight,
  radius: 1.2 + (index % 5) * 0.42,
  shade: index % 4
}));

const ANIMATION_STATE = {
  IDLE: "IDLE",
  WALK: "WALK",
  JUMP: "JUMP",
  FALL: "FALL"
};

const SPIKE_STATE = {
  HIDDEN: "HIDDEN",
  WARNING: "WARNING",
  ACTIVE: "ACTIVE"
};

const SPIKE_CONFIG = {
  height: 20,
  hitboxWidth: 14,
  hitboxHeight: 11,
  warningColor: "#f4c542",
  activeColor: "#d93636"
};

const PILLAR_STATE = {
  HIDDEN: "HIDDEN",
  WARNING: "WARNING",
  PUSHING: "PUSHING",
  VANISHED: "VANISHED"
};

const PILLAR_CONFIG = {
  width: 40,
  height: 80,
  speed: 100,
  warningDuration: 0.3
};

const PLATFORM_COMPRESSION_STATE = {
  IDLE: "IDLE",
  WARNING: "WARNING",
  MOVING: "MOVING",
  STOPPED: "STOPPED"
};

const FIRST_PIT_INDEX = 3;
const PILLAR_TRAPS = Array.from({ length: 5 }, (_, index) => {
  const pitLeft =
    CONFIG.mapLeft +
    (FIRST_PIT_INDEX + index * 4) * CONFIG.tileSize;
  const pitRight = pitLeft + CONFIG.tileSize * 2;
  const startX = pitRight + CONFIG.tileSize;

  return {
    pit: index + 1,
    startX,
    endX: pitRight,
    triggerLeft: pitLeft,
    triggerRight: pitRight,
    x: startX,
    y: CONFIG.groundTop - PILLAR_CONFIG.height,
    width: PILLAR_CONFIG.width,
    height: PILLAR_CONFIG.height,
    state: PILLAR_STATE.HIDDEN,
    triggered: false,
    vanished: false,
    warningTime: 0
  };
});

// 火柴人动画参数集中放在这里，角度使用弧度
const ANIMATION_CONFIG = {
  walkCycle: 0.4,
  legMaxAngle: degreesToRadians(30),
  armMaxAngle: degreesToRadians(20),
  idleLegAngle: degreesToRadians(8),
  idleArmAngle: degreesToRadians(8),
  jumpLegAngle: degreesToRadians(25),
  jumpKneeBend: degreesToRadians(65),
  jumpArmAngle: degreesToRadians(75),
  fallLegAngle: degreesToRadians(12),
  fallArmAngle: degreesToRadians(45),
  transitionSpeed: 24,
  armLength: 9,
  upperLegLength: 5,
  lowerLegLength: 5
};

function createGroundFromMap(map) {
  const ground = [];

  for (let index = 0; index < map.length; index += 1) {
    if (map[index] === "#") {
      ground.push({
        x: CONFIG.mapLeft + index * CONFIG.tileSize,
        y: CONFIG.groundTop,
        width: CONFIG.tileSize,
        height: CONFIG.canvasHeight - CONFIG.groundTop,
        color: "#777777"
      });
    }
  }

  return ground;
}

const LEVELS = {
  1: {
    start: {
      x: CONFIG.mapLeft + CONFIG.tileSize * 1.5 - CONFIG.playerWidth / 2,
      y: CONFIG.groundTop - CONFIG.playerHeight
    },
    bounds: {
      left: CONFIG.mapLeft,
      right: CONFIG.mapLeft + LEVEL_ONE_MAP.length * CONFIG.tileSize
    },
    ground: createGroundFromMap(LEVEL_ONE_MAP),
    door: {
      x:
        CONFIG.mapLeft +
        (LEVEL_ONE_MAP.length - 3) * CONFIG.tileSize +
        CONFIG.tileSize * 1.5 -
        CONFIG.doorWidth / 2,
      y: CONFIG.groundTop - CONFIG.doorHeight,
      width: CONFIG.doorWidth,
      height: CONFIG.doorHeight
    }
  },
  2: {
    start: {
      x: 32 + 60 - CONFIG.playerWidth / 2,
      y: CONFIG.groundTop - CONFIG.playerHeight
    },
    bounds: {
      left: 32,
      right: 960
    },
    ground: [
      {
        x: 32,
        y: CONFIG.groundTop,
        width: 120,
        height: CONFIG.canvasHeight - CONFIG.groundTop,
        color: "#777777"
      },
      {
        x: 760,
        y: CONFIG.groundTop,
        width: 200,
        height: CONFIG.canvasHeight - CONFIG.groundTop,
        color: "#777777"
      }
    ],
    movingPlatform: {
      startX: 232,
      endX: 640,
      y: CONFIG.groundTop,
      width: 120,
      height: 14,
      speed: 70,
      color: "#607d8b",
      spikes: [
        {
          localX: 0,
          warningStart: 1,
          activeStart: 1.6,
          activeEnd: 2
        },
        {
          localX: 40,
          warningStart: 3,
          activeStart: 3.6,
          activeEnd: 4
        }
      ]
    },
    door: {
      x: 880,
      y: CONFIG.groundTop - CONFIG.doorHeight,
      width: CONFIG.doorWidth,
      height: CONFIG.doorHeight
    }
  },
  3: {
    start: {
      x: CONFIG.mapLeft + CONFIG.tileSize * 1.5 - CONFIG.playerWidth / 2,
      y: CONFIG.groundTop - CONFIG.playerHeight
    },
    bounds: {
      left: CONFIG.mapLeft,
      right: CONFIG.mapLeft + LEVEL_ONE_MAP.length * CONFIG.tileSize
    },
    ground: createGroundFromMap(LEVEL_ONE_MAP),
    door: {
      x:
        CONFIG.mapLeft +
        (LEVEL_ONE_MAP.length - 3) * CONFIG.tileSize +
        CONFIG.tileSize * 1.5 -
        CONFIG.doorWidth / 2,
      y: CONFIG.groundTop - CONFIG.doorHeight,
      width: CONFIG.doorWidth,
      height: CONFIG.doorHeight
    }
  },
  4: {
    gravityDirection: 1,
    gravity: 250,
    jumpImpulse: 150,
    isJumping: false,
    compression: {
      state: PLATFORM_COMPRESSION_STATE.IDLE,
      triggered: false,
      warningTimer: 0,
      speed: 18,
      minimumGap: 50
    },
    start: {
      x: LEVEL_FOUR_PLATFORM_XS[0] + 40 - CONFIG.playerWidth / 2,
      y: LEVEL_FOUR_LOWER_Y - CONFIG.playerHeight
    },
    bounds: {
      left: 0,
      right: LEVEL_FOUR_PLATFORM_XS[5] + 80
    },
    ground: createLevelFourPlatforms(),
    door: {
      x: LEVEL_FOUR_PLATFORM_XS[5] + 40 - CONFIG.doorWidth / 2,
      y: LEVEL_FOUR_LOWER_Y - CONFIG.doorHeight,
      width: CONFIG.doorWidth,
      height: CONFIG.doorHeight
    }
  },
  5: {
    start: {
      x: 80,
      y: CONFIG.groundTop - CONFIG.playerHeight
    },
    bounds: {
      left: 0,
      right: 1800
    },
    reservedPit: {
      x: 120,
      width: CONFIG.tileSize,
      active: false,
      triggered: false
    },
    ground: [
      {
        x: 0,
        y: CONFIG.groundTop,
        width: 1760,
        height: CONFIG.canvasHeight - CONFIG.groundTop,
        color: "#777777"
      },
      {
        x: 1760,
        y: 240,
        width: 40,
        height: 200,
        color: "#5e6265",
        isWall: true
      },
      {
        x: 1000,
        y: 160,
        width: 800,
        height: 16,
        color: "#777777"
      },
      {
        x: 640,
        y: 240,
        width: 240,
        height: CONFIG.canvasHeight - 240,
        color: "#777777"
      }
    ],
    platforms: createLevelFivePlatforms(),
    walls: [
      { x: 1760, y: 240, width: 40, height: 200 }
    ],
    door: {
      x: 650,
      y: 240 - CONFIG.doorHeight,
      width: CONFIG.doorWidth,
      height: CONFIG.doorHeight
    }
  },
  6: createLevelSixMap(),
  7: createLevelSevenMap()
};

function getDebugLevel() {
  const requestedLevel = new URLSearchParams(window.location.search).get("level");
  const levelNumber = Number(requestedLevel);
  return LEVELS[levelNumber] ? levelNumber : null;
}

function getCurrentLevel() {
  return LEVELS[currentLevel];
}

// Canvas 初始化
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
canvas.width = CONFIG.canvasWidth;
canvas.height = CONFIG.canvasHeight;

const debugLevel = getDebugLevel();
let currentLevel = debugLevel || 1;

const player = {
  x: getCurrentLevel().start.x,
  y: getCurrentLevel().start.y,
  width: CONFIG.playerWidth,
  height: CONFIG.playerHeight,
  velocityX: 0,
  velocityY: 0,
  inheritedVelocityX: 0,
  onGround: true,
  onMovingPlatform: false,
  supportSurfaceIndex: null,
  facing: 1
};

const levelFiveSaw = {
  state: SAW_STATE.HIDDEN,
  x: 0,
  y: 0,
  speed: LEVEL_FIVE_SAW_CONFIG.sawBaseSpeed,
  rotation: 0,
  waypointIndex: 0
};

const levelSixSaw = {
  state: LEVEL_SIX_SAW_STATE.HIDDEN,
  x: 0,
  y: 0,
  rotation: 0
};

const levelSevenTurret = {
  state: LEVEL_SEVEN_TURRET_STATE.HIDDEN,
  triggered: false,
  x: 0,
  y: 0,
  angle: Math.PI,
  speed: LEVEL_SEVEN_TURRET_CONFIG.projectileSpeed,
  explosionTimer: 0,
  buttonPressed: false,
  passageOpen: false,
  wall: { active: false, x: 0, y: 0, width: LEVEL_SEVEN_TURRET_CONFIG.wallWidth, height: 0 }
};

const levelSevenPillar = {
  state: LEVEL_SEVEN_PILLAR_STATE.HIDDEN,
  triggered: false,
  y: -180,
  previousY: -180,
  timer: 0
};

const movingPlatform = {
  x: LEVELS[2].movingPlatform.startX,
  y: LEVELS[2].movingPlatform.y,
  width: LEVELS[2].movingPlatform.width,
  height: LEVELS[2].movingPlatform.height,
  color: LEVELS[2].movingPlatform.color,
  deltaX: 0,
  velocityX: 0,
  elapsedTime: 0,
  active: false
};

let gameState = debugLevel ? GAME_STATE.PLAYING : GAME_STATE.MAIN_MENU;
let respawnTimer = 0;
let animationState = ANIMATION_STATE.IDLE;
let animationTime = 0;
let saveMessage = "";
let saveMessageTimer = 0;
let mainMenuMessage = "";
let savePageMessage = "";
let saveSlots = Array(SAVE_SLOT_COUNT).fill(null);
let selectedSaveSlot = 1;
let deleteConfirmOpen = false;
let deleteTargetSlot = null;

const currentPose = createIdlePose();

const keys = {
  left: false,
  right: false
};
let menuButtons = [];

const arrowKeys = ["ArrowLeft", "ArrowRight", "ArrowUp"];

function clearKeys() {
  keys.left = false;
  keys.right = false;
}

window.addEventListener("keydown", (event) => {
  if (arrowKeys.includes(event.code)) {
    event.preventDefault();
  }

  if (event.code === "Escape") {
    event.preventDefault();

    if (!event.repeat && deleteConfirmOpen) {
      cancelDeleteSave();
    } else if (!event.repeat && gameState === GAME_STATE.PLAYING) {
      clearKeys();
      gameState = GAME_STATE.PAUSED;
      saveMessage = "";
    } else if (!event.repeat && gameState === GAME_STATE.PAUSED) {
      clearKeys();
      gameState = GAME_STATE.PLAYING;
    } else if (!event.repeat && gameState === GAME_STATE.SAVE_SLOTS) {
      returnToMainMenu();
    }
    return;
  }

  if (
    gameState === GAME_STATE.PAUSED &&
    !event.repeat &&
    (event.code === "Digit1" || event.code === "Numpad1")
  ) {
    event.preventDefault();
    saveGame();
    return;
  }

  if (gameState === GAME_STATE.MAIN_MENU && event.code === "Enter" && !event.repeat) {
    startNewGame();
    return;
  }

  if (
    event.code === "Enter" &&
    !event.repeat &&
    LEVELS[currentLevel + 1] &&
    gameState === GAME_STATE.WON
  ) {
    event.preventDefault();
    loadLevel(currentLevel + 1);
    return;
  }

  if (gameState === GAME_STATE.PLAYING && event.code === "ArrowLeft" && !event.repeat) {
    keys.left = true;
  }

  if (gameState === GAME_STATE.PLAYING && event.code === "ArrowRight" && !event.repeat) {
    keys.right = true;
  }

  // 只响应一次按键动作，长按上键不会连续起跳
  if (
    event.code === "ArrowUp" &&
    !event.repeat &&
    gameState === GAME_STATE.PLAYING &&
    player.onGround
  ) {
    if (currentLevel === 4) {
      const level = getCurrentLevel();
      level.gravityDirection *= -1;
      player.velocityY = level.gravityDirection * level.jumpImpulse;
      player.inheritedVelocityX = 0;
      level.isJumping = true;
      player.supportSurfaceIndex = null;
    } else {
      player.inheritedVelocityX = player.onMovingPlatform
        ? getMovingPlatformVelocity()
        : 0;
      player.velocityY = CONFIG.jumpSpeed;
    }
    player.onGround = false;
    player.onMovingPlatform = false;
  }
});

window.addEventListener("keyup", (event) => {
  if (arrowKeys.includes(event.code)) {
    event.preventDefault();
  }

  if (event.code === "ArrowLeft") {
    keys.left = false;
  }

  if (event.code === "ArrowRight") {
    keys.right = false;
  }
});

// 切换窗口后清除按键状态，避免角色一直移动
window.addEventListener("blur", () => {
  clearKeys();
});

canvas.addEventListener("click", handleCanvasClick);

function makeEmptySaveSlots() {
  return Array(SAVE_SLOT_COUNT).fill(null);
}

function isValidSaveRecord(save, slotNumber, version = SAVE_VERSION) {
  return Boolean(
    save &&
    save.slot === slotNumber &&
    save.version === version &&
    Number.isInteger(save.level) &&
    Boolean(LEVELS[save.level]) &&
    typeof save.savedAt === "string" &&
    Number.isFinite(Date.parse(save.savedAt))
  );
}

function migrateLegacySave(slots, selectedSlot) {
  if (slots[0] !== null) {
    return { slots, selectedSlot, message: "" };
  }

  const legacyRaw = window.localStorage.getItem(LEGACY_SAVE_KEY);
  if (legacyRaw === null) {
    return { slots, selectedSlot, message: "" };
  }

  const legacySave = JSON.parse(legacyRaw);
  const validLegacySave =
    legacySave &&
    legacySave.version === LEGACY_SAVE_VERSION &&
    Number.isInteger(legacySave.level) &&
    Boolean(LEVELS[legacySave.level]) &&
    typeof legacySave.savedAt === "string" &&
    Number.isFinite(Date.parse(legacySave.savedAt));

  if (!validLegacySave) {
    return {
      slots,
      selectedSlot,
      message: "旧版存档无效，无法读取。"
    };
  }

  const migratedSlots = slots.slice();
  migratedSlots[0] = {
    slot: 1,
    version: SAVE_VERSION,
    level: legacySave.level,
    savedAt: legacySave.savedAt
  };
  const migratedStore = {
    version: SAVE_VERSION,
    selectedSlot,
    slots: migratedSlots
  };

  try {
    window.localStorage.setItem(SAVE_KEY, JSON.stringify(migratedStore));
    return {
      slots: migratedSlots,
      selectedSlot,
      message: "旧存档已迁移到存档1。"
    };
  } catch (error) {
    return {
      slots: migratedSlots,
      selectedSlot,
      message: "旧存档迁移失败，旧数据已保留。"
    };
  }
}

function readSaveStore() {
  try {
    const rawStore = window.localStorage.getItem(SAVE_KEY);

    if (rawStore !== null) {
      let store;
      try {
        store = JSON.parse(rawStore);
      } catch (error) {
        const legacyResult = migrateLegacySave(makeEmptySaveSlots(), 1);
        return legacyResult.slots[0]
          ? legacyResult
          : {
              slots: makeEmptySaveSlots(),
              selectedSlot: 1,
              message: "存档数据无效，无法读取。"
            };
      }
      const validStore =
        store &&
        store.version === SAVE_VERSION &&
        Array.isArray(store.slots) &&
        store.slots.length === SAVE_SLOT_COUNT &&
        Number.isInteger(store.selectedSlot) &&
        store.selectedSlot >= 1 &&
        store.selectedSlot <= SAVE_SLOT_COUNT;

      if (!validStore) {
        const legacyResult = migrateLegacySave(makeEmptySaveSlots(), 1);
        return legacyResult.slots[0]
          ? legacyResult
          : {
              slots: makeEmptySaveSlots(),
              selectedSlot: 1,
              message: "存档数据无效，无法读取。"
            };
      }

      let hasInvalidSlot = false;
      const slots = store.slots.map((save, index) => {
        if (save === null) {
          return null;
        }
        if (isValidSaveRecord(save, index + 1)) {
          return save;
        }
        hasInvalidSlot = true;
        return null;
      });

      let result;
      try {
        result = migrateLegacySave(slots, store.selectedSlot);
      } catch (error) {
        result = {
          slots,
          selectedSlot: store.selectedSlot,
          message: "旧版存档无法读取，已有存档已保留。"
        };
      }
      if (hasInvalidSlot && !result.message) {
        result.message = "部分存档无效，无法读取。";
      }
      return result;
    }

    return migrateLegacySave(makeEmptySaveSlots(), 1);
  } catch (error) {
    return {
      slots: makeEmptySaveSlots(),
      selectedSlot: 1,
      message: "无法读取本地存档。"
    };
  }
}

function refreshSaveStore() {
  const result = readSaveStore();
  saveSlots = result.slots;
  selectedSaveSlot = result.selectedSlot;
  mainMenuMessage = result.message;
  savePageMessage = result.message;
}

function writeSaveStore(nextSlots, nextSelectedSlot) {
  const store = {
    version: SAVE_VERSION,
    selectedSlot: nextSelectedSlot,
    slots: nextSlots
  };

  try {
    window.localStorage.setItem(SAVE_KEY, JSON.stringify(store));
    saveSlots = nextSlots;
    selectedSaveSlot = nextSelectedSlot;
    return true;
  } catch (error) {
    return false;
  }
}

function saveGame() {
  const nextSlots = saveSlots.slice();
  nextSlots[selectedSaveSlot - 1] = {
    slot: selectedSaveSlot,
    version: SAVE_VERSION,
    level: currentLevel,
    savedAt: new Date().toISOString()
  };

  if (writeSaveStore(nextSlots, selectedSaveSlot)) {
    saveMessage = `保存成功！已保存到存档${selectedSaveSlot}。`;
  } else {
    saveMessage = "保存失败，请重试。";
  }
  saveMessageTimer = 1;
}

function startNewGame() {
  mainMenuMessage = "";
  resetMovingPlatform();
  resetPillarTraps();
  loadLevel(1);
}

function getMostRecentSave() {
  return saveSlots
    .filter((save) => save !== null)
    .sort((first, second) => Date.parse(second.savedAt) - Date.parse(first.savedAt))[0] || null;
}

function continueSavedGame() {
  refreshSaveStore();
  const save = getMostRecentSave();

  if (!save) {
    mainMenuMessage = "没有可继续的存档。";
    return;
  }

  loadLevel(save.level);
}

function readSaveSlot(slotNumber) {
  const save = saveSlots[slotNumber - 1];
  if (save && isValidSaveRecord(save, slotNumber)) {
    loadLevel(save.level);
  } else {
    savePageMessage = "这个存档槽是空的或无效。";
  }
}

function requestDeleteSave(slotNumber) {
  const save = saveSlots[slotNumber - 1];
  if (
    gameState !== GAME_STATE.SAVE_SLOTS ||
    !save ||
    !isValidSaveRecord(save, slotNumber)
  ) {
    return;
  }

  deleteTargetSlot = slotNumber;
  deleteConfirmOpen = true;
  savePageMessage = "";
}

function cancelDeleteSave() {
  deleteConfirmOpen = false;
  deleteTargetSlot = null;
  savePageMessage = "";
}

function deleteSaveSlotFromStorage(slotNumber) {
  if (!Number.isInteger(slotNumber) || slotNumber < 1 || slotNumber > SAVE_SLOT_COUNT) {
    return false;
  }

  try {
    const rawStore = window.localStorage.getItem(SAVE_KEY);
    if (rawStore === null) {
      return false;
    }

    const store = JSON.parse(rawStore);
    if (
      !store ||
      store.version !== SAVE_VERSION ||
      !Array.isArray(store.slots) ||
      store.slots.length !== SAVE_SLOT_COUNT
    ) {
      return false;
    }

    const targetSave = store.slots[slotNumber - 1];
    if (!isValidSaveRecord(targetSave, slotNumber)) {
      return false;
    }

    const nextSlots = store.slots.slice();
    nextSlots[slotNumber - 1] = null;
    window.localStorage.setItem(
      SAVE_KEY,
      JSON.stringify({ ...store, slots: nextSlots })
    );
    return true;
  } catch (error) {
    return false;
  }
}

function confirmDeleteSave() {
  if (!deleteConfirmOpen || deleteTargetSlot === null) {
    return;
  }

  const slotNumber = deleteTargetSlot;
  const latestStore = readSaveStore();
  if (latestStore.message === "无法读取本地存档。") {
    savePageMessage = "删除失败，无法读取存档。";
    return;
  }

  saveSlots = latestStore.slots;
  selectedSaveSlot = latestStore.selectedSlot;
  const save = saveSlots[slotNumber - 1];
  if (!save || !isValidSaveRecord(save, slotNumber)) {
    deleteConfirmOpen = false;
    deleteTargetSlot = null;
    savePageMessage = "存档已不存在或无效。";
    return;
  }

  if (deleteSaveSlotFromStorage(slotNumber)) {
    refreshSaveStore();
    deleteConfirmOpen = false;
    deleteTargetSlot = null;
    savePageMessage = "删除成功";
  } else {
    savePageMessage = "删除失败，请重试。";
  }
}

function selectSaveSlot(slotNumber) {
  const success = writeSaveStore(saveSlots.slice(), slotNumber);
  savePageMessage = success
    ? `已选择存档${slotNumber}作为保存位置。`
    : "选择未能保存到本地，请重试。";
  selectedSaveSlot = slotNumber;
}

function startSaveSlotsPage() {
  clearKeys();
  refreshSaveStore();
  gameState = GAME_STATE.SAVE_SLOTS;
}

function returnToMainMenu() {
  clearKeys();
  refreshSaveStore();
  gameState = GAME_STATE.MAIN_MENU;
}

function handleCanvasClick(event) {
  const bounds = canvas.getBoundingClientRect();
  const x = (event.clientX - bounds.left) * (canvas.width / bounds.width);
  const y = (event.clientY - bounds.top) * (canvas.height / bounds.height);
  const button = menuButtons.find(
    (item) =>
      x >= item.x &&
      x <= item.x + item.width &&
      y >= item.y &&
      y <= item.y + item.height
  );

  if (!button || !button.enabled) {
    return;
  }

  if (deleteConfirmOpen) {
    if (button.action === "confirmDelete") {
      confirmDeleteSave();
    } else if (button.action === "cancelDelete") {
      cancelDeleteSave();
    }
    return;
  }

  if (gameState === GAME_STATE.MAIN_MENU) {
    if (button.action === "start") {
      startNewGame();
    } else if (button.action === "continue") {
      continueSavedGame();
    } else if (button.action === "slots") {
      startSaveSlotsPage();
    }
    return;
  }

  if (gameState === GAME_STATE.SAVE_SLOTS) {
    if (button.action === "back") {
      returnToMainMenu();
    } else if (button.action === "selectSlot") {
      selectSaveSlot(button.slotNumber);
    } else if (button.action === "readSlot") {
      readSaveSlot(button.slotNumber);
    } else if (button.action === "deleteSlot") {
      requestDeleteSave(button.slotNumber);
    }
    return;
  }

  if (gameState === GAME_STATE.PAUSED) {
    if (button.action === "save") {
      saveGame();
    } else if (button.action === "home") {
      returnToMainMenu();
    } else if (button.action === "resume") {
      clearKeys();
      gameState = GAME_STATE.PLAYING;
    }
  }
}

function overlapsPlayerHorizontally(surface) {
  const playerLeft = player.x;
  const playerRight = player.x + player.width;
  return playerRight > surface.x && playerLeft < surface.x + surface.width;
}

function findSurfaceUnderPlayer() {
  for (const surface of getCurrentLevel().ground) {
    if (overlapsPlayerHorizontally(surface)) {
      return surface;
    }
  }

  if (currentLevel === 2 && overlapsPlayerHorizontally(movingPlatform)) {
    return movingPlatform;
  }

  return null;
}

function resetMovingPlatform() {
  const config = LEVELS[2].movingPlatform;

  movingPlatform.x = config.startX;
  movingPlatform.deltaX = 0;
  movingPlatform.velocityX = 0;
  movingPlatform.elapsedTime = 0;
  movingPlatform.active = false;
}

function getMovingPlatformVelocity() {
  const config = LEVELS[2].movingPlatform;

  if (
    currentLevel === 2 &&
    movingPlatform.active &&
    movingPlatform.x < config.endX
  ) {
    return config.speed;
  }

  return 0;
}

function updateMovingPlatform(deltaTime) {
  const config = LEVELS[2].movingPlatform;
  movingPlatform.deltaX = 0;
  movingPlatform.velocityX = 0;

  if (currentLevel !== 2 || !movingPlatform.active) {
    return;
  }

  movingPlatform.elapsedTime += deltaTime;
  const previousX = movingPlatform.x;
  movingPlatform.x = Math.min(
    config.endX,
    movingPlatform.x + config.speed * deltaTime
  );
  movingPlatform.deltaX = movingPlatform.x - previousX;

  if (deltaTime > 0) {
    movingPlatform.velocityX = movingPlatform.deltaX / deltaTime;
  }
}

function getSpikeState(spike) {
  if (currentLevel !== 2 || !movingPlatform.active) {
    return SPIKE_STATE.HIDDEN;
  }

  const time = movingPlatform.elapsedTime;

  if (time >= spike.activeStart && time < spike.activeEnd) {
    return SPIKE_STATE.ACTIVE;
  }

  if (time >= spike.warningStart && time < spike.activeStart) {
    return SPIKE_STATE.WARNING;
  }

  return SPIKE_STATE.HIDDEN;
}

function getSpikeHitbox(spike) {
  const cellCenterX =
    movingPlatform.x + spike.localX + CONFIG.tileSize / 2;

  return {
    x: cellCenterX - SPIKE_CONFIG.hitboxWidth / 2,
    y: movingPlatform.y - SPIKE_CONFIG.hitboxHeight,
    width: SPIKE_CONFIG.hitboxWidth,
    height: SPIKE_CONFIG.hitboxHeight
  };
}

function touchesActiveSpike() {
  if (currentLevel !== 2) {
    return false;
  }

  for (const spike of LEVELS[2].movingPlatform.spikes) {
    if (
      getSpikeState(spike) === SPIKE_STATE.ACTIVE &&
      rectanglesOverlap(player, getSpikeHitbox(spike))
    ) {
      return true;
    }
  }

  return false;
}

function triangleTouchesPlayer(triangle) {
  const trianglePoints = [
    { x: triangle.x, y: triangle.y },
    { x: triangle.x + triangle.width, y: triangle.y },
    { x: triangle.x + triangle.width / 2, y: triangle.y - triangle.height }
  ];
  const playerPoints = [
    { x: player.x, y: player.y },
    { x: player.x + player.width, y: player.y },
    { x: player.x + player.width, y: player.y + player.height },
    { x: player.x, y: player.y + player.height }
  ];
  const axes = [
    { x: 1, y: 0 },
    { x: 0, y: 1 }
  ];

  for (let index = 0; index < trianglePoints.length; index += 1) {
    const point = trianglePoints[index];
    const nextPoint = trianglePoints[(index + 1) % trianglePoints.length];
    const edgeX = nextPoint.x - point.x;
    const edgeY = nextPoint.y - point.y;
    axes.push({ x: -edgeY, y: edgeX });
  }

  for (const axis of axes) {
    const triangleProjection = trianglePoints.map(
      (point) => point.x * axis.x + point.y * axis.y
    );
    const playerProjection = playerPoints.map(
      (point) => point.x * axis.x + point.y * axis.y
    );
    const triangleMin = Math.min(...triangleProjection);
    const triangleMax = Math.max(...triangleProjection);
    const playerMin = Math.min(...playerProjection);
    const playerMax = Math.max(...playerProjection);

    if (triangleMax <= playerMin || playerMax <= triangleMin) {
      return false;
    }
  }

  return true;
}

function touchesLevelSixSpike() {
  if (currentLevel !== 6) {
    return false;
  }

  for (const platform of getCurrentLevel().spikePlatforms) {
    for (let x = platform.x; x < platform.x + platform.width; x += 20) {
      if (
        triangleTouchesPlayer({
          x,
          y: platform.y,
          width: 20,
          height: 16
        })
      ) {
        return true;
      }
    }
  }

  return false;
}

function wrapLevelSixPlayerAtBottom() {
  if (currentLevel !== 6 || player.y < CONFIG.canvasHeight) {
    return;
  }

  const wrapDistance = CONFIG.canvasHeight + player.height;
  const overshoot = player.y - CONFIG.canvasHeight;
  player.y = -player.height + (overshoot % wrapDistance);
}

function die() {
  if (gameState !== GAME_STATE.PLAYING) {
    return;
  }

  gameState = GAME_STATE.DEAD;
  respawnTimer = CONFIG.respawnDelay;
}

function respawn() {
  const level = getCurrentLevel();

  player.x = level.start.x;
  player.y = level.start.y;
  player.velocityX = 0;
  player.velocityY = 0;
  player.inheritedVelocityX = 0;
  player.onGround = true;
  player.onMovingPlatform = false;
  player.supportSurfaceIndex = null;
  player.facing = 1;

  if (currentLevel === 4) {
    level.gravityDirection = 1;
    level.isJumping = false;
    resetPlatformCompression();
  }

  if (currentLevel === 2) {
    resetMovingPlatform();
  }

  if (currentLevel === 3) {
    resetPillarTraps();
  }

  if (currentLevel === 5) {
    level.reservedPit.active = false;
    level.reservedPit.triggered = false;
    resetLevelFiveSaw();
  }

  if (currentLevel === 6) {
    resetLevelSixSaw();
  }

  if (currentLevel === 7) {
    resetLevelSevenTurret();
    resetLevelSevenPillar();
  }

  respawnTimer = 0;
  gameState = GAME_STATE.PLAYING;
  resetAnimation();
}

function resetPillarTraps() {
  for (const trap of PILLAR_TRAPS) {
    trap.x = trap.startX;
    trap.state = PILLAR_STATE.HIDDEN;
    trap.triggered = false;
    trap.vanished = false;
    trap.warningTime = 0;
  }
}

function resetLevelFiveSaw() {
  levelFiveSaw.state = SAW_STATE.HIDDEN;
  levelFiveSaw.x = 0;
  levelFiveSaw.y = 0;
  levelFiveSaw.speed = LEVEL_FIVE_SAW_CONFIG.sawBaseSpeed;
  levelFiveSaw.rotation = 0;
  levelFiveSaw.waypointIndex = 0;
}

function resetLevelSixSaw() {
  levelSixSaw.state = LEVEL_SIX_SAW_STATE.HIDDEN;
  levelSixSaw.x = 0;
  levelSixSaw.y = 0;
  levelSixSaw.rotation = 0;
}

function updateLevelSixSaw(deltaTime) {
  if (currentLevel !== 6) {
    return;
  }

  const spikes = getCurrentLevel().spikePlatforms;
  const lastSpike = spikes[spikes.length - 1];

  if (
    levelSixSaw.state === LEVEL_SIX_SAW_STATE.HIDDEN &&
    player.x > lastSpike.x + lastSpike.width
  ) {
    levelSixSaw.state = LEVEL_SIX_SAW_STATE.MOVING_RIGHT;
    levelSixSaw.x = getCameraX() + 24;
    levelSixSaw.y = CONFIG.canvasHeight - LEVEL_SIX_SAW_CONFIG.wheelRadius;
  }

  if (levelSixSaw.state === LEVEL_SIX_SAW_STATE.HIDDEN) {
    return;
  }

  levelSixSaw.rotation =
    (levelSixSaw.rotation + LEVEL_SIX_SAW_CONFIG.rotationSpeed * deltaTime) %
    (Math.PI * 2);

  if (levelSixSaw.state === LEVEL_SIX_SAW_STATE.MOVING_RIGHT) {
    const targetX = lastSpike.x + lastSpike.width;
    levelSixSaw.x = Math.min(
      targetX,
      levelSixSaw.x + LEVEL_SIX_SAW_CONFIG.moveSpeed * deltaTime
    );

    if (levelSixSaw.x >= targetX) {
      levelSixSaw.state = LEVEL_SIX_SAW_STATE.RISING;
    }
  } else if (levelSixSaw.state === LEVEL_SIX_SAW_STATE.RISING) {
    levelSixSaw.y = Math.max(
      LEVEL_SIX_SAW_CONFIG.blockY,
      levelSixSaw.y - LEVEL_SIX_SAW_CONFIG.riseSpeed * deltaTime
    );

    if (levelSixSaw.y <= LEVEL_SIX_SAW_CONFIG.blockY) {
      levelSixSaw.state = LEVEL_SIX_SAW_STATE.BLOCKING;
    }
  }
}

function levelSixSawTouchesPlayer() {
  if (levelSixSaw.state === LEVEL_SIX_SAW_STATE.HIDDEN) {
    return false;
  }

  const diameter = LEVEL_SIX_SAW_CONFIG.wheelRadius * 2;

  for (let index = 0; index < LEVEL_SIX_SAW_CONFIG.wheelCount; index += 1) {
    const centerX = levelSixSaw.x + LEVEL_SIX_SAW_CONFIG.wheelRadius + index * diameter;
    const nearestX = Math.max(player.x, Math.min(centerX, player.x + player.width));
    const nearestY = Math.max(player.y, Math.min(levelSixSaw.y, player.y + player.height));
    const dx = centerX - nearestX;
    const dy = levelSixSaw.y - nearestY;

    if (dx * dx + dy * dy <= LEVEL_SIX_SAW_CONFIG.collisionRadius ** 2) {
      return true;
    }
  }

  return false;
}

function resetLevelSevenTurret() {
  levelSevenTurret.state = LEVEL_SEVEN_TURRET_STATE.HIDDEN;
  levelSevenTurret.triggered = false;
  levelSevenTurret.x = 0;
  levelSevenTurret.y = 0;
  levelSevenTurret.angle = Math.PI;
  levelSevenTurret.speed = LEVEL_SEVEN_TURRET_CONFIG.projectileSpeed;
  levelSevenTurret.explosionTimer = 0;
  levelSevenTurret.buttonPressed = false;
  levelSevenTurret.passageOpen = false;
  levelSevenTurret.wall.active = false;
  levelSevenTurret.wall.x = 0;
  levelSevenTurret.wall.y = 0;
  levelSevenTurret.wall.height = 0;
}

function resetLevelSevenPillar() {
  levelSevenPillar.state = LEVEL_SEVEN_PILLAR_STATE.HIDDEN;
  levelSevenPillar.triggered = false;
  levelSevenPillar.y = -getCurrentLevel().pillarSpace.height;
  levelSevenPillar.previousY = levelSevenPillar.y;
  levelSevenPillar.timer = 0;
}

function updateLevelSevenPillar(deltaTime) {
  if (
    currentLevel !== 7 ||
    levelSevenPillar.state === LEVEL_SEVEN_PILLAR_STATE.COMPLETE
  ) {
    return;
  }

  const level = getCurrentLevel();
  const pillar = level.pillarSpace;
  levelSevenPillar.previousY = levelSevenPillar.y;

  if (levelSevenPillar.state === LEVEL_SEVEN_PILLAR_STATE.HIDDEN) {
    const nearGoal = player.x + player.width >= level.door.x - CONFIG.tileSize * 2;
    if (nearGoal && !levelSevenPillar.triggered) {
      levelSevenPillar.triggered = true;
      levelSevenPillar.state = LEVEL_SEVEN_PILLAR_STATE.WARNING;
      levelSevenPillar.timer = LEVEL_SEVEN_PILLAR_CONFIG.warningDuration;
    }
    return;
  }

  if (levelSevenPillar.state === LEVEL_SEVEN_PILLAR_STATE.WARNING) {
    levelSevenPillar.timer = Math.max(0, levelSevenPillar.timer - deltaTime);
    if (levelSevenPillar.timer === 0) {
      levelSevenPillar.state = LEVEL_SEVEN_PILLAR_STATE.FALLING;
    }
    return;
  }

  if (levelSevenPillar.state === LEVEL_SEVEN_PILLAR_STATE.FALLING) {
    const landingY = pillar.y;
    levelSevenPillar.y = Math.min(
      landingY,
      levelSevenPillar.y + LEVEL_SEVEN_PILLAR_CONFIG.fallSpeed * deltaTime
    );
    if (levelSevenPillar.y === landingY) {
      levelSevenPillar.state = LEVEL_SEVEN_PILLAR_STATE.DWELLING;
      levelSevenPillar.timer = LEVEL_SEVEN_PILLAR_CONFIG.dwellDuration;
    }
    return;
  }

  if (levelSevenPillar.state === LEVEL_SEVEN_PILLAR_STATE.DWELLING) {
    levelSevenPillar.timer = Math.max(0, levelSevenPillar.timer - deltaTime);
    if (levelSevenPillar.timer === 0) {
      levelSevenPillar.state = LEVEL_SEVEN_PILLAR_STATE.RETRACTING;
    }
    return;
  }

  if (levelSevenPillar.state === LEVEL_SEVEN_PILLAR_STATE.RETRACTING) {
    levelSevenPillar.y -= LEVEL_SEVEN_PILLAR_CONFIG.retractSpeed * deltaTime;
    if (levelSevenPillar.y <= -pillar.height) {
      levelSevenPillar.y = -pillar.height;
      levelSevenPillar.state = LEVEL_SEVEN_PILLAR_STATE.COMPLETE;
    }
  }
}

function levelSevenPillarTouchesPlayer() {
  if (
    currentLevel !== 7 ||
    (levelSevenPillar.state !== LEVEL_SEVEN_PILLAR_STATE.FALLING &&
      levelSevenPillar.state !== LEVEL_SEVEN_PILLAR_STATE.DWELLING &&
      levelSevenPillar.state !== LEVEL_SEVEN_PILLAR_STATE.RETRACTING)
  ) {
    return false;
  }

  const pillar = getCurrentLevel().pillarSpace;
  const overlapsHorizontally =
    player.x < pillar.x + pillar.width &&
    player.x + player.width > pillar.x;
  const sweptTop = Math.min(levelSevenPillar.previousY, levelSevenPillar.y);
  const sweptBottom = Math.max(levelSevenPillar.previousY, levelSevenPillar.y) + pillar.height;
  const overlapsVertically =
    player.y < sweptBottom && player.y + player.height > sweptTop;
  return overlapsHorizontally && overlapsVertically;
}

function updateLevelSevenTurret(deltaTime) {
  if (currentLevel !== 7) {
    return;
  }

  const config = LEVEL_SEVEN_TURRET_CONFIG;
  const level = getCurrentLevel();
  const turret = level.turret;

  if (levelSevenTurret.state === LEVEL_SEVEN_TURRET_STATE.HIDDEN) {
    const enteredTrigger =
      player.x + player.width > config.triggerLeft &&
      player.x < config.triggerRight;

    if (!enteredTrigger || levelSevenTurret.triggered) {
      return;
    }

    levelSevenTurret.triggered = true;
    levelSevenTurret.state = LEVEL_SEVEN_TURRET_STATE.PROJECTILE;
    levelSevenTurret.x = turret.x - config.projectileSize;
    levelSevenTurret.y = turret.y + turret.height - config.projectileSize;
    levelSevenTurret.angle = Math.PI;
    levelSevenTurret.speed = config.projectileSpeed;
  }

  if (
    !levelSevenTurret.buttonPressed &&
    levelSevenTurret.state !== LEVEL_SEVEN_TURRET_STATE.HIDDEN &&
    rectanglesOverlap(player, level.button)
  ) {
    levelSevenTurret.buttonPressed = true;
    levelSevenTurret.wall.active = true;
    levelSevenTurret.wall.width = config.wallWidth;
    levelSevenTurret.wall.y = level.roomTwo.y;
    levelSevenTurret.wall.height = level.roomTwo.height;

    const projectileCenterX = levelSevenTurret.x + config.projectileSize / 2;
    const playerCenterX = player.x + player.width / 2;
    levelSevenTurret.wall.x = projectileCenterX < playerCenterX
      ? player.x - config.wallWidth - 4
      : player.x + player.width + 4;
  }

  if (levelSevenTurret.state === LEVEL_SEVEN_TURRET_STATE.EXPLODING) {
    levelSevenTurret.explosionTimer = Math.max(
      0,
      levelSevenTurret.explosionTimer - deltaTime
    );

    if (levelSevenTurret.explosionTimer === 0) {
      levelSevenTurret.state = LEVEL_SEVEN_TURRET_STATE.DESTROYED;
      levelSevenTurret.wall.active = false;
      levelSevenTurret.passageOpen = true;
    }
    return;
  }

  if (levelSevenTurret.state === LEVEL_SEVEN_TURRET_STATE.DESTROYED) {
    return;
  }

  if (levelSevenTurret.state === LEVEL_SEVEN_TURRET_STATE.PROJECTILE) {
    levelSevenTurret.x -= levelSevenTurret.speed * deltaTime;

    if (levelSevenTurret.x <= config.transformX) {
      levelSevenTurret.x = config.transformX;
      levelSevenTurret.state = player.x + player.width > level.roomTwo.x
        ? LEVEL_SEVEN_TURRET_STATE.ACCELERATING
        : LEVEL_SEVEN_TURRET_STATE.HOMING;
    }
  } else if (
    levelSevenTurret.state === LEVEL_SEVEN_TURRET_STATE.HOMING ||
    levelSevenTurret.state === LEVEL_SEVEN_TURRET_STATE.ACCELERATING
  ) {
    if (
      levelSevenTurret.state === LEVEL_SEVEN_TURRET_STATE.HOMING &&
      player.x + player.width > level.roomTwo.x
    ) {
      levelSevenTurret.state = LEVEL_SEVEN_TURRET_STATE.ACCELERATING;
    }

    if (levelSevenTurret.state === LEVEL_SEVEN_TURRET_STATE.ACCELERATING) {
      levelSevenTurret.speed = Math.min(
        config.maximumSpeed,
        levelSevenTurret.speed + config.acceleration * deltaTime
      );
    }

    const missileCenterX = levelSevenTurret.x + config.projectileSize / 2;
    const missileCenterY = levelSevenTurret.y + config.projectileSize / 2;
    const playerCenterX = player.x + player.width / 2;
    const playerCenterY = player.y + player.height / 2;
    const targetAngle = Math.atan2(
      playerCenterY - missileCenterY,
      playerCenterX - missileCenterX
    );
    const angleDifference = Math.atan2(
      Math.sin(targetAngle - levelSevenTurret.angle),
      Math.cos(targetAngle - levelSevenTurret.angle)
    );
    const maximumTurn = config.turnSpeed * deltaTime;
    const turnAmount = Math.max(
      -maximumTurn,
      Math.min(maximumTurn, angleDifference)
    );

    levelSevenTurret.angle += turnAmount;
    levelSevenTurret.x += Math.cos(levelSevenTurret.angle) * levelSevenTurret.speed * deltaTime;
    levelSevenTurret.y += Math.sin(levelSevenTurret.angle) * levelSevenTurret.speed * deltaTime;

  }

  if (
    levelSevenTurret.wall.active &&
    (levelSevenTurret.state === LEVEL_SEVEN_TURRET_STATE.PROJECTILE ||
      levelSevenTurret.state === LEVEL_SEVEN_TURRET_STATE.HOMING ||
      levelSevenTurret.state === LEVEL_SEVEN_TURRET_STATE.ACCELERATING) &&
    rectanglesOverlap(levelSevenTurret.wall, {
      x: levelSevenTurret.x,
      y: levelSevenTurret.y,
      width: config.projectileSize,
      height: config.projectileSize
    })
  ) {
    levelSevenTurret.x = Math.cos(levelSevenTurret.angle) >= 0
      ? levelSevenTurret.wall.x - config.projectileSize
      : levelSevenTurret.wall.x + levelSevenTurret.wall.width;
    levelSevenTurret.state = LEVEL_SEVEN_TURRET_STATE.EXPLODING;
    levelSevenTurret.explosionTimer = config.explosionDuration;
  }
}

function levelSevenProjectileTouchesPlayer() {
  if (
    levelSevenTurret.state !== LEVEL_SEVEN_TURRET_STATE.PROJECTILE &&
    levelSevenTurret.state !== LEVEL_SEVEN_TURRET_STATE.HOMING &&
    levelSevenTurret.state !== LEVEL_SEVEN_TURRET_STATE.ACCELERATING
  ) {
    return false;
  }

  const size = LEVEL_SEVEN_TURRET_CONFIG.projectileSize;
  return rectanglesOverlap(player, {
    x: levelSevenTurret.x,
    y: levelSevenTurret.y,
    width: size,
    height: size
  });
}

function updateLevelFiveSaw(deltaTime) {
  if (currentLevel !== 5 || levelFiveSaw.state === SAW_STATE.EXITED) {
    return;
  }

  const pit = LEVELS[5].reservedPit;
  const safelyPastPit =
    pit.triggered &&
    player.x >= pit.x + pit.width &&
    player.y + player.height <= CONFIG.groundTop;

  if (levelFiveSaw.state === SAW_STATE.HIDDEN && safelyPastPit) {
    levelFiveSaw.state = SAW_STATE.CHASING;
    levelFiveSaw.x = player.x - LEVEL_FIVE_SAW_CONFIG.sawInitialDistance;
    levelFiveSaw.y = CONFIG.groundTop - LEVEL_FIVE_SAW_CONFIG.radius;
    levelFiveSaw.speed = LEVEL_FIVE_SAW_CONFIG.sawBaseSpeed;
    levelFiveSaw.rotation = 0;
    levelFiveSaw.waypointIndex = 0;
  }

  if (levelFiveSaw.state !== SAW_STATE.CHASING) {
    return;
  }

  const oldSpeed = levelFiveSaw.speed;
  levelFiveSaw.speed = Math.min(
    LEVEL_FIVE_SAW_CONFIG.sawMaxSpeed,
    oldSpeed + LEVEL_FIVE_SAW_CONFIG.sawAcceleration * deltaTime
  );
  let distanceToMove = (oldSpeed + levelFiveSaw.speed) * 0.5 * deltaTime;
  levelFiveSaw.rotation =
    (levelFiveSaw.rotation + LEVEL_FIVE_SAW_CONFIG.sawRotationSpeed * deltaTime) %
    (Math.PI * 2);

  while (distanceToMove > 0 && levelFiveSaw.waypointIndex < LEVEL_FIVE_SAW_ROUTE.length) {
    const waypoint = LEVEL_FIVE_SAW_ROUTE[levelFiveSaw.waypointIndex];
    const dx = waypoint.x - levelFiveSaw.x;
    const dy = waypoint.y - levelFiveSaw.y;
    const distanceToWaypoint = Math.hypot(dx, dy);

    if (distanceToWaypoint <= distanceToMove) {
      levelFiveSaw.x = waypoint.x;
      levelFiveSaw.y = waypoint.y;
      distanceToMove -= distanceToWaypoint;
      levelFiveSaw.waypointIndex += 1;
    } else {
      const moveRatio = distanceToMove / distanceToWaypoint;
      levelFiveSaw.x += dx * moveRatio;
      levelFiveSaw.y += dy * moveRatio;
      distanceToMove = 0;
    }
  }

  if (levelFiveSaw.waypointIndex >= LEVEL_FIVE_SAW_ROUTE.length) {
    levelFiveSaw.state = SAW_STATE.EXITED;
  }
}

function sawTouchesPlayer() {
  if (levelFiveSaw.state !== SAW_STATE.CHASING) {
    return false;
  }

  const nearestX = Math.max(player.x, Math.min(levelFiveSaw.x, player.x + player.width));
  const nearestY = Math.max(player.y, Math.min(levelFiveSaw.y, player.y + player.height));
  const dx = levelFiveSaw.x - nearestX;
  const dy = levelFiveSaw.y - nearestY;
  return dx * dx + dy * dy <= LEVEL_FIVE_SAW_CONFIG.collisionRadius ** 2;
}

function resetPlatformCompression() {
  const level = LEVELS[4];
  level.compression.state = PLATFORM_COMPRESSION_STATE.IDLE;
  level.compression.triggered = false;
  level.compression.warningTimer = 0;

  for (const platform of level.ground) {
    platform.y = platform.row === "upper"
      ? LEVEL_FOUR_UPPER_Y
      : LEVEL_FOUR_LOWER_Y;
  }
}

function loadLevel(levelNumber) {
  if (!LEVELS[levelNumber]) {
    return;
  }

  currentLevel = levelNumber;
  keys.left = false;
  keys.right = false;
  respawn();
}

function rectanglesOverlap(first, second) {
  return (
    first.x < second.x + second.width &&
    first.x + first.width > second.x &&
    first.y < second.y + second.height &&
    first.y + first.height > second.y
  );
}

function win() {
  if (gameState !== GAME_STATE.PLAYING) {
    return;
  }

  player.velocityX = 0;
  player.velocityY = 0;
  gameState = GAME_STATE.WON;
}

function update(deltaTime) {
  if (
    gameState === GAME_STATE.MAIN_MENU ||
    gameState === GAME_STATE.SAVE_SLOTS ||
    gameState === GAME_STATE.PAUSED ||
    gameState === GAME_STATE.WON
  ) {
    return;
  }

  if (gameState === GAME_STATE.DEAD) {
    respawnTimer -= deltaTime;

    if (respawnTimer <= 0) {
      respawn();
    }

    return;
  }

  const level = getCurrentLevel();
  const wasOnMovingPlatform =
    player.onGround && player.onMovingPlatform;
  const supportSurface =
    currentLevel === 4 &&
    player.onGround &&
    Number.isInteger(player.supportSurfaceIndex)
      ? level.ground[player.supportSurfaceIndex]
      : null;
  const previousSupportY = supportSurface ? supportSurface.y : 0;

  updatePlatformCompression(deltaTime);

  if (supportSurface) {
    player.y += supportSurface.y - previousSupportY;
  }

  // 先移动平台，再把本帧的平台位移传给站在上面的玩家
  updateMovingPlatform(deltaTime);

  if (wasOnMovingPlatform) {
    player.x += movingPlatform.deltaX;
  }

  const direction = Number(keys.right) - Number(keys.left);
  const inputVelocityX = direction * CONFIG.moveSpeed;
  player.velocityX = player.onGround
    ? inputVelocityX
    : inputVelocityX + player.inheritedVelocityX;

  if (direction !== 0) {
    player.facing = direction;
  }

  player.x += player.velocityX * deltaTime;

  if (
    currentLevel === 5 &&
    !level.reservedPit.triggered &&
    player.x >= level.reservedPit.x
  ) {
    level.reservedPit.active = true;
    level.reservedPit.triggered = true;
  }

  if (currentLevel === 5 && direction !== 0) {
    for (const wall of level.walls) {
      const overlapsWallVertically =
        player.y < wall.y + wall.height &&
        player.y + player.height > wall.y;
      const overlapsWallHorizontally =
        player.x < wall.x + wall.width &&
        player.x + player.width > wall.x;

      if (overlapsWallVertically && overlapsWallHorizontally) {
        player.x = direction > 0
          ? wall.x - player.width
          : wall.x + wall.width;
      }
    }
  }

  if (currentLevel === 7 && direction !== 0) {
    const walls = level.solidWalls.slice();
    if (levelSevenTurret.wall.active) {
      walls.push(levelSevenTurret.wall);
    }
    if (!levelSevenTurret.passageOpen) {
      walls.push(level.exitGate);
    }
    if (
      levelSevenPillar.state !== LEVEL_SEVEN_PILLAR_STATE.HIDDEN &&
      levelSevenPillar.state !== LEVEL_SEVEN_PILLAR_STATE.COMPLETE
    ) {
      walls.push(level.pillarSpace);
    }

    for (const wall of walls) {
      const overlapsWallVertically =
        player.y < wall.y + wall.height &&
        player.y + player.height > wall.y;
      const overlapsWallHorizontally =
        player.x < wall.x + wall.width &&
        player.x + player.width > wall.x;

      if (overlapsWallVertically && overlapsWallHorizontally) {
        player.x = direction > 0
          ? wall.x - player.width
          : wall.x + wall.width;
      }
    }
  }

  // 玩家不能水平移出当前关卡边界
  player.x = Math.max(
    level.bounds.left,
    Math.min(player.x, level.bounds.right - player.width)
  );

  const previousBottom = player.y + player.height;
  const previousTop = player.y;
  const levelGravity = currentLevel === 4 ? level.gravityDirection : 1;
  const gravity = currentLevel === 4 ? level.gravity : CONFIG.gravity;

  // 用匀加速公式更新垂直位置，减少不同帧率造成的跳跃差异
  player.y +=
    player.velocityY * deltaTime +
    0.5 * gravity * levelGravity * deltaTime * deltaTime;
  player.velocityY += gravity * levelGravity * deltaTime;
  if (currentLevel === 6 && player.velocityY > LEVEL_SIX_MAX_FALL_SPEED) {
    player.velocityY = LEVEL_SIX_MAX_FALL_SPEED;
  }

  if (currentLevel === 7 && player.velocityY < 0) {
    for (const ceiling of level.ceilings) {
      const ceilingBottom = ceiling.y + ceiling.height;
      const overlapsCeilingHorizontally =
        player.x < ceiling.x + ceiling.width &&
        player.x + player.width > ceiling.x;

      if (
        overlapsCeilingHorizontally &&
        previousTop >= ceilingBottom &&
        player.y <= ceilingBottom
      ) {
        player.y = ceilingBottom;
        player.velocityY = 0;
        break;
      }
    }
  }
  player.onGround = false;
  player.onMovingPlatform = false;
  player.supportSurfaceIndex = null;

  const currentBottom = player.y + player.height;
  const currentTop = player.y;
  let landingSurface = null;

  if (currentLevel === 5) {
    for (const surface of [...getLevelFiveGroundSurfaces(), ...level.platforms]) {
      if (
        player.velocityY >= 0 &&
        overlapsPlayerHorizontally(surface) &&
        previousBottom <= surface.y &&
        currentBottom >= surface.y &&
        (!landingSurface || surface.y < landingSurface.y)
      ) {
        landingSurface = surface;
      }
    }
  } else if (currentLevel === 6) {
    for (const surface of level.ground) {
      if (
        player.velocityY >= 0 &&
        overlapsPlayerHorizontally(surface) &&
        previousBottom <= surface.y &&
        currentBottom >= surface.y &&
        (!landingSurface || surface.y < landingSurface.y)
      ) {
        landingSurface = surface;
      }
    }
  } else if (currentLevel === 7) {
    for (const surface of [...level.floorSurfaces, ...level.platforms]) {
      if (
        player.velocityY >= 0 &&
        overlapsPlayerHorizontally(surface) &&
        previousBottom <= surface.y &&
        currentBottom >= surface.y &&
        (!landingSurface || surface.y < landingSurface.y)
      ) {
        landingSurface = surface;
      }
    }
  } else if (currentLevel === 4) {
    for (const surface of level.ground) {
      const landedOnLowerTop =
        levelGravity === 1 &&
        surface.row === "lower" &&
        player.velocityY >= 0 &&
        previousBottom <= surface.y &&
        currentBottom >= surface.y;
      const landedOnUpperUnderside =
        levelGravity === -1 &&
        surface.row === "upper" &&
        player.velocityY <= 0 &&
        previousTop >= surface.y + surface.height &&
        currentTop <= surface.y + surface.height;

      if (
        overlapsPlayerHorizontally(surface) &&
        (landedOnLowerTop || landedOnUpperUnderside)
      ) {
        landingSurface = surface;
        break;
      }
    }
  } else if (
    player.velocityY >= 0 &&
    previousBottom <= CONFIG.groundTop &&
    currentBottom >= CONFIG.groundTop
  ) {
    landingSurface = findSurfaceUnderPlayer();
  }

  // Level 4 has several fixed-height ledges; earlier levels keep their original ground rule.
  if (landingSurface) {
    player.y = levelGravity === -1
      ? landingSurface.y + landingSurface.height
      : landingSurface.y - player.height;
    player.velocityY = 0;
    player.inheritedVelocityX = 0;
    player.onGround = true;

    if (currentLevel === 4) {
      level.isJumping = false;
      player.supportSurfaceIndex = level.ground.indexOf(landingSurface);
      startPlatformCompression(landingSurface);
    }

    if (landingSurface === movingPlatform) {
      player.onMovingPlatform = true;
      movingPlatform.active = true;
    }
  }

  if (currentLevel === 5) {
    updateLevelFiveSaw(deltaTime);

    if (sawTouchesPlayer()) {
      die();
      return;
    }
  }

  updateMovingPillar(deltaTime);

  if (touchesActiveSpike()) {
    die();
    return;
  }

  if (touchesLevelSixSpike()) {
    die();
    return;
  }

  updateLevelSevenPillar(deltaTime);
  if (levelSevenPillarTouchesPlayer()) {
    die();
    return;
  }

  const levelSevenGoalReady =
    currentLevel !== 7 ||
    levelSevenPillar.state === LEVEL_SEVEN_PILLAR_STATE.COMPLETE;
  if (levelSevenGoalReady && rectanglesOverlap(player, level.door)) {
    win();
    return;
  }

  wrapLevelSixPlayerAtBottom();

  updateLevelSixSaw(deltaTime);
  if (levelSixSawTouchesPlayer()) {
    die();
    return;
  }

  updateLevelSevenTurret(deltaTime);
  if (levelSevenProjectileTouchesPlayer()) {
    die();
    return;
  }

  // 角色完全掉出画布后进入死亡状态
  const fellOutOfLevelFour =
    currentLevel === 4 &&
    (levelGravity === 1
      ? player.y > CONFIG.canvasHeight
      : player.y + player.height < 0);
  const fellOutOfOtherLevel =
    currentLevel !== 4 &&
    currentLevel !== 6 &&
    player.y > CONFIG.canvasHeight;
  if (fellOutOfLevelFour || fellOutOfOtherLevel) {
    die();
  }
}

function startPlatformCompression(platform) {
  const level = LEVELS[4];
  const compression = level.compression;
  const lastPlatformX = LEVEL_FOUR_PLATFORM_XS[5];

  if (
    compression.triggered ||
    compression.state !== PLATFORM_COMPRESSION_STATE.IDLE ||
    platform.row !== "upper" ||
    platform.x !== lastPlatformX
  ) {
    return;
  }

  compression.triggered = true;
  compression.state = PLATFORM_COMPRESSION_STATE.WARNING;
  compression.warningTimer = 0.5;
}

function updatePlatformCompression(deltaTime) {
  if (currentLevel !== 4) {
    return;
  }

  const level = getCurrentLevel();
  const compression = level.compression;

  if (compression.state === PLATFORM_COMPRESSION_STATE.WARNING) {
    compression.warningTimer = Math.max(0, compression.warningTimer - deltaTime);
    if (compression.warningTimer === 0) {
      compression.state = PLATFORM_COMPRESSION_STATE.MOVING;
    }
    return;
  }

  if (compression.state !== PLATFORM_COMPRESSION_STATE.MOVING) {
    return;
  }

  const upperPlatforms = level.ground.filter((platform) => platform.row === "upper");
  const lowerPlatforms = level.ground.filter((platform) => platform.row === "lower");
  const currentGap =
    lowerPlatforms[0].y - (upperPlatforms[0].y + upperPlatforms[0].height);
  const remainingMovePerSide = (currentGap - compression.minimumGap) / 2;
  const moveDistance = Math.min(
    compression.speed * deltaTime,
    remainingMovePerSide
  );

  for (const platform of upperPlatforms) {
    platform.y += moveDistance;
  }
  for (const platform of lowerPlatforms) {
    platform.y -= moveDistance;
  }

  if (moveDistance >= remainingMovePerSide) {
    compression.state = PLATFORM_COMPRESSION_STATE.STOPPED;
  }
}

function updateMovingPillar(deltaTime) {
  if (currentLevel !== 3) {
    return;
  }

  for (const trap of PILLAR_TRAPS) {
    if (
      trap.state === PILLAR_STATE.HIDDEN &&
      !trap.triggered &&
      player.x + player.width > trap.triggerLeft &&
      player.x < trap.triggerRight
    ) {
      trap.triggered = true;
    }
  }

  let activeTrap = PILLAR_TRAPS.find(
    (trap) =>
      trap.state === PILLAR_STATE.WARNING ||
      trap.state === PILLAR_STATE.PUSHING
  );

  if (!activeTrap) {
    activeTrap = PILLAR_TRAPS.find(
      (trap) => trap.triggered && trap.state === PILLAR_STATE.HIDDEN
    );

    if (activeTrap) {
      const spawnBox = {
        x: activeTrap.startX,
        y: activeTrap.y,
        width: activeTrap.width,
        height: activeTrap.height
      };

      // Wait until the player is clear so a queued pillar never appears inside them.
      if (rectanglesOverlap(player, spawnBox)) {
        activeTrap = null;
      } else {
        activeTrap.x = activeTrap.startX;
        activeTrap.warningTime = 0;
        activeTrap.state = PILLAR_STATE.WARNING;
      }
    }
  }

  if (!activeTrap) {
    return;
  }

  if (activeTrap.state === PILLAR_STATE.WARNING) {
    activeTrap.warningTime += deltaTime;

    if (activeTrap.warningTime >= PILLAR_CONFIG.warningDuration) {
      activeTrap.state = PILLAR_STATE.PUSHING;
    }
  }

  if (activeTrap.state !== PILLAR_STATE.PUSHING) {
    return;
  }

  activeTrap.x = Math.max(
    activeTrap.endX,
    activeTrap.x - PILLAR_CONFIG.speed * deltaTime
  );

  if (rectanglesOverlap(player, activeTrap)) {
    const playerCenter = player.x + player.width / 2;
    const pillarCenter = activeTrap.x + activeTrap.width / 2;
    const bounds = getCurrentLevel().bounds;

    if (playerCenter < pillarCenter) {
      player.x = Math.max(bounds.left, activeTrap.x - player.width);
    } else {
      player.x = Math.min(
        bounds.right - player.width,
        activeTrap.x + activeTrap.width
      );
    }

    // Keep the pillar on its path when the player is pinned against a canvas edge.
    if (player.x === bounds.left) {
      activeTrap.x = Math.max(activeTrap.x, player.x + player.width);
    }
    if (player.x + player.width === bounds.right) {
      activeTrap.x = Math.min(
        activeTrap.x,
        player.x - activeTrap.width
      );
    }
  }

  if (activeTrap.x <= activeTrap.endX) {
    activeTrap.x = activeTrap.endX;
    activeTrap.state = PILLAR_STATE.VANISHED;
    activeTrap.vanished = true;
  }
}

function degreesToRadians(degrees) {
  return degrees * Math.PI / 180;
}

function createIdlePose() {
  return {
    leftArmAngle: -ANIMATION_CONFIG.idleArmAngle,
    rightArmAngle: ANIMATION_CONFIG.idleArmAngle,
    leftLegAngle: -ANIMATION_CONFIG.idleLegAngle,
    rightLegAngle: ANIMATION_CONFIG.idleLegAngle,
    leftKneeBend: 0,
    rightKneeBend: 0
  };
}

function resetAnimation() {
  animationState = ANIMATION_STATE.IDLE;
  animationTime = 0;
  Object.assign(currentPose, createIdlePose());
}

function getAnimationState() {
  if (!player.onGround) {
    if (currentLevel === 4 && getCurrentLevel().isJumping) {
      return ANIMATION_STATE.JUMP;
    }

    const gravityDirection = currentLevel === 4
      ? getCurrentLevel().gravityDirection
      : 1;
    return player.velocityY * gravityDirection < 0
      ? ANIMATION_STATE.JUMP
      : ANIMATION_STATE.FALL;
  }

  const hasHorizontalInput = keys.left !== keys.right;

  return hasHorizontalInput
    ? ANIMATION_STATE.WALK
    : ANIMATION_STATE.IDLE;
}

function getTargetPose() {
  if (animationState === ANIMATION_STATE.WALK) {
    const phase = animationTime / ANIMATION_CONFIG.walkCycle * Math.PI * 2;
    const step = Math.sin(phase);

    return {
      leftArmAngle: -step * ANIMATION_CONFIG.armMaxAngle,
      rightArmAngle: step * ANIMATION_CONFIG.armMaxAngle,
      leftLegAngle: step * ANIMATION_CONFIG.legMaxAngle,
      rightLegAngle: -step * ANIMATION_CONFIG.legMaxAngle,
      leftKneeBend: 0,
      rightKneeBend: 0
    };
  }

  if (animationState === ANIMATION_STATE.JUMP) {
    return {
      leftArmAngle: -ANIMATION_CONFIG.jumpArmAngle,
      rightArmAngle: ANIMATION_CONFIG.jumpArmAngle,
      leftLegAngle: -ANIMATION_CONFIG.jumpLegAngle,
      rightLegAngle: ANIMATION_CONFIG.jumpLegAngle,
      leftKneeBend: -ANIMATION_CONFIG.jumpKneeBend,
      rightKneeBend: ANIMATION_CONFIG.jumpKneeBend
    };
  }

  if (animationState === ANIMATION_STATE.FALL) {
    return {
      leftArmAngle: -ANIMATION_CONFIG.fallArmAngle,
      rightArmAngle: ANIMATION_CONFIG.fallArmAngle,
      leftLegAngle: -ANIMATION_CONFIG.fallLegAngle,
      rightLegAngle: ANIMATION_CONFIG.fallLegAngle,
      leftKneeBend: 0,
      rightKneeBend: 0
    };
  }

  return createIdlePose();
}

function updateAnimation(deltaTime) {
  if (gameState !== GAME_STATE.PLAYING) {
    return;
  }

  const nextState = getAnimationState();

  if (nextState !== animationState) {
    animationState = nextState;
    animationTime = 0;
  }

  animationTime += deltaTime;
  const targetPose = getTargetPose();
  const blend = 1 - Math.exp(-ANIMATION_CONFIG.transitionSpeed * deltaTime);

  // 平滑靠近目标姿势，避免状态切换时手脚突然跳变
  for (const part of Object.keys(currentPose)) {
    currentPose[part] += (targetPose[part] - currentPose[part]) * blend;
  }
}

function getCameraX() {
  if (currentLevel !== 4 && currentLevel !== 5 && currentLevel !== 6 && currentLevel !== 7) {
    return 0;
  }

  const level = getCurrentLevel();
  const maximumX = Math.max(0, level.bounds.right - CONFIG.canvasWidth);
  const playerCenterX = player.x + player.width / 2;
  return Math.max(0, Math.min(playerCenterX - CONFIG.canvasWidth / 2, maximumX));
}

function drawGround(cameraX = 0) {
  const surfaces = currentLevel === 5
    ? getLevelFiveGroundSurfaces()
    : getCurrentLevel().ground;

  for (const surface of surfaces) {
    ctx.fillStyle = surface.color;
    ctx.fillRect(surface.x - cameraX, surface.y, surface.width, surface.height);
  }
}

function drawGiantSaw(cameraX = 0) {
  if (currentLevel !== 5 || levelFiveSaw.state !== SAW_STATE.CHASING) {
    return;
  }

  ctx.save();
  ctx.translate(levelFiveSaw.x - cameraX, levelFiveSaw.y);
  ctx.rotate(levelFiveSaw.rotation);

  ctx.beginPath();
  for (let point = 0; point < 24; point += 1) {
    const angle = (point / 24) * Math.PI * 2;
    const radius = point % 2 === 0
      ? LEVEL_FIVE_SAW_CONFIG.radius
      : LEVEL_FIVE_SAW_CONFIG.radius * 0.82;
    const x = Math.cos(angle) * radius;
    const y = Math.sin(angle) * radius;

    if (point === 0) {
      ctx.moveTo(x, y);
    } else {
      ctx.lineTo(x, y);
    }
  }
  ctx.closePath();
  ctx.fillStyle = "#aeb7bc";
  ctx.fill();
  ctx.strokeStyle = "#454c50";
  ctx.lineWidth = 3;
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(0, 0, 18, 0, Math.PI * 2);
  ctx.strokeStyle = "#687176";
  ctx.lineWidth = 3;
  ctx.stroke();

  for (let spoke = 0; spoke < 8; spoke += 1) {
    const angle = (spoke / 8) * Math.PI * 2;
    ctx.beginPath();
    ctx.moveTo(Math.cos(angle) * 9, Math.sin(angle) * 9);
    ctx.lineTo(Math.cos(angle) * 17, Math.sin(angle) * 17);
    ctx.strokeStyle = "#586166";
    ctx.lineWidth = 2;
    ctx.stroke();
  }

  ctx.beginPath();
  ctx.arc(0, 0, 6, 0, Math.PI * 2);
  ctx.fillStyle = "#626b70";
  ctx.fill();
  ctx.restore();
}

function drawLevelSixSaw(cameraX = 0) {
  if (
    currentLevel !== 6 ||
    levelSixSaw.state === LEVEL_SIX_SAW_STATE.HIDDEN
  ) {
    return;
  }

  const radius = LEVEL_SIX_SAW_CONFIG.wheelRadius;
  const diameter = radius * 2;

  for (let wheel = 0; wheel < LEVEL_SIX_SAW_CONFIG.wheelCount; wheel += 1) {
    const centerX = levelSixSaw.x + radius + wheel * diameter - cameraX;
    ctx.save();
    ctx.translate(centerX, levelSixSaw.y);
    ctx.rotate(levelSixSaw.rotation);

    ctx.beginPath();
    for (let point = 0; point < 24; point += 1) {
      const angle = (point / 24) * Math.PI * 2;
      const pointRadius = point % 2 === 0 ? radius : radius * 0.78;
      const x = Math.cos(angle) * pointRadius;
      const y = Math.sin(angle) * pointRadius;

      if (point === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }
    ctx.closePath();
    ctx.fillStyle = "#aeb7bc";
    ctx.fill();
    ctx.strokeStyle = "#454c50";
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(0, 0, 4, 0, Math.PI * 2);
    ctx.fillStyle = "#687176";
    ctx.fill();
    ctx.restore();
  }
}

function getLevelFiveGroundSurfaces() {
  const level = LEVELS[5];
  const pit = level.reservedPit;

  if (!pit.triggered) {
    return level.ground;
  }

  const startingGround = level.ground[0];
  const holeLeft = pit.x;
  const holeRight = pit.x + pit.width;
  const groundRight = startingGround.x + startingGround.width;

  return [
    {
      ...startingGround,
      width: holeLeft - startingGround.x
    },
    {
      ...startingGround,
      x: holeRight,
      width: groundRight - holeRight
    },
    ...level.ground.slice(1)
  ].filter((surface) => surface.width > 0);
}

function drawLevelFivePlatforms(cameraX = 0) {
  if (currentLevel !== 5) {
    return;
  }

  for (const platform of getCurrentLevel().platforms) {
    const screenX = platform.x - cameraX;
    ctx.fillStyle = platform.color;
    ctx.fillRect(screenX, platform.y, platform.width, platform.height);
    ctx.strokeStyle = "rgba(220, 226, 228, 0.9)";
    ctx.lineWidth = 2;
    ctx.setLineDash([8, 6]);
    ctx.strokeRect(screenX, platform.y, platform.width, platform.height);
  }

  ctx.setLineDash([]);
}

function drawLevelSevenPlatforms(cameraX = 0) {
  if (currentLevel !== 7) {
    return;
  }

  for (const platform of getCurrentLevel().platforms) {
    const screenX = platform.x - cameraX;
    ctx.fillStyle = platform.color;
    ctx.fillRect(screenX, platform.y, platform.width, platform.height);
    ctx.strokeStyle = "rgba(230, 235, 236, 0.95)";
    ctx.lineWidth = 2;
    ctx.setLineDash([8, 6]);
    ctx.strokeRect(screenX, platform.y, platform.width, platform.height);
  }

  ctx.setLineDash([]);
}

function drawLevelSevenDecorations(cameraX = 0) {
  if (currentLevel !== 7) {
    return;
  }

  const level = getCurrentLevel();
  const turretX = level.turret.x - cameraX;
  ctx.fillStyle = "#53595c";
  ctx.fillRect(turretX, level.turret.y, level.turret.width, level.turret.height);
  ctx.fillStyle = "#272b2d";
  ctx.fillRect(turretX + 4, level.turret.y + 12, 18, 18);
  ctx.fillRect(turretX - 12, level.turret.y + 18, 18, 8);
  ctx.strokeStyle = "#858b8e";
  ctx.lineWidth = 2;
  ctx.strokeRect(turretX, level.turret.y, level.turret.width, level.turret.height);

  const buttonX = level.button.x - cameraX;
  ctx.fillStyle = levelSevenTurret.buttonPressed ? "#4b8a62" : "#d7a936";
  ctx.fillRect(buttonX, level.button.y, level.button.width, level.button.height);
  ctx.fillStyle = levelSevenTurret.buttonPressed ? "#9bd0a8" : "#f5d66e";
  ctx.fillRect(buttonX + 4, level.button.y + 3, level.button.width - 8, 5);
  ctx.strokeStyle = levelSevenTurret.buttonPressed ? "#244b32" : "#4b3d1d";
  ctx.strokeRect(buttonX, level.button.y, level.button.width, level.button.height);

}

function drawLevelSevenProjectile(cameraX = 0) {
  if (
    currentLevel !== 7 ||
    levelSevenTurret.state === LEVEL_SEVEN_TURRET_STATE.HIDDEN ||
    levelSevenTurret.state === LEVEL_SEVEN_TURRET_STATE.DESTROYED
  ) {
    return;
  }

  const size = LEVEL_SEVEN_TURRET_CONFIG.projectileSize;
  const screenX = levelSevenTurret.x - cameraX;
  if (levelSevenTurret.state === LEVEL_SEVEN_TURRET_STATE.EXPLODING) {
    const progress = 1 - levelSevenTurret.explosionTimer /
      LEVEL_SEVEN_TURRET_CONFIG.explosionDuration;
    const radius = 8 + progress * 22;
    const centerX = screenX + size / 2;
    const centerY = levelSevenTurret.y + size / 2;

    ctx.save();
    ctx.globalAlpha = 1 - progress * 0.45;
    ctx.fillStyle = "#f2a23a";
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#ffe39a";
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius * 0.48, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    return;
  }

  ctx.fillStyle = levelSevenTurret.state === LEVEL_SEVEN_TURRET_STATE.HOMING ||
    levelSevenTurret.state === LEVEL_SEVEN_TURRET_STATE.ACCELERATING
    ? "#8b4540"
    : "#626b70";
  ctx.fillRect(screenX, levelSevenTurret.y, size, size);
  ctx.strokeStyle = "#c5cdd0";
  ctx.lineWidth = 2;
  ctx.strokeRect(screenX + 1, levelSevenTurret.y + 1, size - 2, size - 2);
  ctx.fillStyle = "#aeb7bc";
  ctx.fillRect(screenX + 5, levelSevenTurret.y + 5, size - 10, 5);

  if (
    levelSevenTurret.state === LEVEL_SEVEN_TURRET_STATE.HOMING ||
    levelSevenTurret.state === LEVEL_SEVEN_TURRET_STATE.ACCELERATING
  ) {
    const centerX = screenX + size / 2;
    const centerY = levelSevenTurret.y + size / 2;
    const tipX = centerX + Math.cos(levelSevenTurret.angle) * 12;
    const tipY = centerY + Math.sin(levelSevenTurret.angle) * 12;
    const wingAngle = levelSevenTurret.angle + Math.PI / 2;

    ctx.strokeStyle = "#f0c0a0";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.lineTo(tipX, tipY);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(tipX, tipY);
    ctx.lineTo(
      tipX - Math.cos(levelSevenTurret.angle) * 6 + Math.cos(wingAngle) * 4,
      tipY - Math.sin(levelSevenTurret.angle) * 6 + Math.sin(wingAngle) * 4
    );
    ctx.lineTo(
      tipX - Math.cos(levelSevenTurret.angle) * 6 - Math.cos(wingAngle) * 4,
      tipY - Math.sin(levelSevenTurret.angle) * 6 - Math.sin(wingAngle) * 4
    );
    ctx.closePath();
    ctx.fillStyle = "#f0c0a0";
    ctx.fill();
  }
}

function drawLevelSevenWalls(cameraX = 0) {
  if (currentLevel !== 7) {
    return;
  }

  const level = getCurrentLevel();
  if (!levelSevenTurret.passageOpen) {
    const gateX = level.exitGate.x - cameraX;
    ctx.fillStyle = "#41484b";
    ctx.fillRect(gateX, level.exitGate.y, level.exitGate.width, level.exitGate.height);
    ctx.strokeStyle = "#aab2b5";
    ctx.lineWidth = 2;
    ctx.strokeRect(gateX + 1, level.exitGate.y + 1, level.exitGate.width - 2, level.exitGate.height - 2);
    ctx.strokeStyle = "#747d80";
    for (let y = level.exitGate.y + 18; y < level.exitGate.y + level.exitGate.height; y += 28) {
      ctx.beginPath();
      ctx.moveTo(gateX + 3, y);
      ctx.lineTo(gateX + level.exitGate.width - 3, y);
      ctx.stroke();
    }
  }

  if (levelSevenTurret.wall.active) {
    const wallX = levelSevenTurret.wall.x - cameraX;
    ctx.fillStyle = "#52666a";
    ctx.fillRect(wallX, levelSevenTurret.wall.y, levelSevenTurret.wall.width, levelSevenTurret.wall.height);
    ctx.strokeStyle = "#c2d0d2";
    ctx.lineWidth = 3;
    ctx.strokeRect(wallX + 1, levelSevenTurret.wall.y + 1, levelSevenTurret.wall.width - 2, levelSevenTurret.wall.height - 2);
    ctx.fillStyle = "rgba(185, 218, 220, 0.45)";
    ctx.fillRect(wallX + 5, levelSevenTurret.wall.y + 8, levelSevenTurret.wall.width - 10, levelSevenTurret.wall.height - 16);
  }
}

function drawLevelSevenPillar(cameraX = 0) {
  if (currentLevel !== 7) {
    return;
  }

  const pillar = getCurrentLevel().pillarSpace;
  const screenX = pillar.x - cameraX;

  if (levelSevenPillar.state === LEVEL_SEVEN_PILLAR_STATE.WARNING) {
    ctx.fillStyle = "rgba(190, 55, 45, 0.2)";
    ctx.fillRect(screenX, pillar.y, pillar.width, pillar.height);
    ctx.strokeStyle = "#db6256";
    ctx.lineWidth = 3;
    ctx.setLineDash([10, 7]);
    ctx.strokeRect(screenX + 2, pillar.y + 2, pillar.width - 4, pillar.height - 4);
    ctx.setLineDash([]);
    ctx.save();
    ctx.fillStyle = "#7e2925";
    ctx.font = 'bold 22px Arial, "Microsoft YaHei", sans-serif';
    ctx.textAlign = "center";
    ctx.fillText("危险！", screenX + pillar.width / 2, pillar.y - 12);
    ctx.restore();
    return;
  }

  if (
    levelSevenPillar.state === LEVEL_SEVEN_PILLAR_STATE.FALLING ||
    levelSevenPillar.state === LEVEL_SEVEN_PILLAR_STATE.DWELLING ||
    levelSevenPillar.state === LEVEL_SEVEN_PILLAR_STATE.RETRACTING
  ) {
    ctx.fillStyle = "#4a5155";
    ctx.fillRect(screenX, levelSevenPillar.y, pillar.width, pillar.height);
    ctx.fillStyle = "#737d81";
    ctx.fillRect(screenX + 8, levelSevenPillar.y + 8, pillar.width - 16, 12);
    ctx.fillStyle = "#343a3d";
    for (let y = levelSevenPillar.y + 34; y < levelSevenPillar.y + pillar.height; y += 36) {
      ctx.fillRect(screenX + 8, y, pillar.width - 16, 8);
    }
    ctx.strokeStyle = "#c0c6c8";
    ctx.lineWidth = 3;
    ctx.strokeRect(screenX + 1, levelSevenPillar.y + 1, pillar.width - 2, pillar.height - 2);
  }
}

function drawMovingPlatform() {
  if (currentLevel !== 2) {
    return;
  }

  ctx.fillStyle = movingPlatform.color;
  ctx.fillRect(
    movingPlatform.x,
    movingPlatform.y,
    movingPlatform.width,
    movingPlatform.height
  );
}

function drawMovingPillar() {
  if (currentLevel !== 3) {
    return;
  }

  for (const trap of PILLAR_TRAPS) {
    if (
      trap.state === PILLAR_STATE.HIDDEN ||
      trap.state === PILLAR_STATE.VANISHED
    ) {
      continue;
    }

    ctx.fillStyle = trap.state === PILLAR_STATE.WARNING
      ? "#b7a16b"
      : "#4a4a4a";
    ctx.fillRect(trap.x, trap.y, trap.width, trap.height);
  }
}

function drawSpikes() {
  if (currentLevel !== 2) {
    return;
  }

  for (const spike of LEVELS[2].movingPlatform.spikes) {
    const state = getSpikeState(spike);

    if (state === SPIKE_STATE.HIDDEN) {
      continue;
    }

    const cellLeft = movingPlatform.x + spike.localX;
    ctx.fillStyle = state === SPIKE_STATE.ACTIVE
      ? SPIKE_CONFIG.activeColor
      : SPIKE_CONFIG.warningColor;
    ctx.beginPath();
    ctx.moveTo(cellLeft + 4, movingPlatform.y);
    ctx.lineTo(
      cellLeft + CONFIG.tileSize / 2,
      movingPlatform.y - SPIKE_CONFIG.height
    );
    ctx.lineTo(cellLeft + CONFIG.tileSize - 4, movingPlatform.y);
    ctx.closePath();
    ctx.fill();
  }
}

function drawLevelSixSpikes(cameraX = 0) {
  if (currentLevel !== 6) {
    return;
  }

  for (const platform of getCurrentLevel().spikePlatforms) {
    for (let x = platform.x; x < platform.x + platform.width; x += 20) {
      const screenX = x - cameraX;
      ctx.beginPath();
      ctx.moveTo(screenX, platform.y);
      ctx.lineTo(screenX + 10, platform.y - 16);
      ctx.lineTo(screenX + 20, platform.y);
      ctx.closePath();
      ctx.fillStyle = "#b84b4b";
      ctx.fill();
      ctx.strokeStyle = "#612626";
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }
  }
}

function addArmPath(startX, startY, length, angle) {
  const handX = startX + Math.sin(angle) * length;
  const handY = startY + Math.cos(angle) * length;

  ctx.moveTo(startX, startY);
  ctx.lineTo(handX, handY);
}

function addLegPath(startX, startY, angle, kneeBend) {
  const kneeX =
    startX + Math.sin(angle) * ANIMATION_CONFIG.upperLegLength;
  const kneeY =
    startY + Math.cos(angle) * ANIMATION_CONFIG.upperLegLength;
  const lowerLegAngle = angle + kneeBend;
  const footX =
    kneeX + Math.sin(lowerLegAngle) * ANIMATION_CONFIG.lowerLegLength;
  const footY =
    kneeY + Math.cos(lowerLegAngle) * ANIMATION_CONFIG.lowerLegLength;

  ctx.moveTo(startX, startY);
  ctx.lineTo(kneeX, kneeY);
  ctx.lineTo(footX, footY);
}

function drawStickman(cameraX = 0) {
  const screenX = player.x - cameraX;

  if (currentLevel === 4 && getCurrentLevel().gravityDirection === -1) {
    ctx.save();
    ctx.translate(0, player.y * 2 + player.height);
    ctx.scale(1, -1);
    drawStickmanAt(screenX, player.y, currentPose, player.facing);
    ctx.restore();
    return;
  }

  drawStickmanAt(screenX, player.y, currentPose, player.facing);
}

function drawStickmanAt(x, y, pose, facing) {
  const centerX = x + CONFIG.playerWidth / 2;
  const headY = y + 6;
  const shoulderY = y + 14;
  const hipY = y + 24;

  ctx.strokeStyle = "#111111";
  ctx.fillStyle = "#111111";
  ctx.lineWidth = 3;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  // 头和朝向小标记
  ctx.beginPath();
  ctx.arc(centerX, headY, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(centerX + facing * 4, headY);
  ctx.lineTo(centerX + facing * 7, headY + 1);
  ctx.stroke();

  // 身体固定，手脚只围绕关节转动，不影响碰撞盒
  ctx.beginPath();
  ctx.moveTo(centerX, shoulderY);
  ctx.lineTo(centerX, hipY);
  addArmPath(
    centerX,
    shoulderY + 2,
    ANIMATION_CONFIG.armLength,
    pose.leftArmAngle * facing
  );
  addArmPath(
    centerX,
    shoulderY + 2,
    ANIMATION_CONFIG.armLength,
    pose.rightArmAngle * facing
  );
  addLegPath(
    centerX,
    hipY,
    pose.leftLegAngle * facing,
    pose.leftKneeBend * facing
  );
  addLegPath(
    centerX,
    hipY,
    pose.rightLegAngle * facing,
    pose.rightKneeBend * facing
  );
  ctx.stroke();
}

function drawExitDoor(cameraX = 0) {
  const door = getCurrentLevel().door;
  const screenX = door.x - cameraX;

  ctx.fillStyle = "#2e9b55";
  ctx.fillRect(screenX, door.y, door.width, door.height);

  ctx.strokeStyle = "#176b37";
  ctx.lineWidth = 3;
  ctx.strokeRect(screenX, door.y, door.width, door.height);

  ctx.fillStyle = "#f4d35e";
  ctx.beginPath();
  ctx.arc(
    screenX + door.width - 7,
    door.y + door.height / 2,
    2.5,
    0,
    Math.PI * 2
  );
  ctx.fill();
}

function drawWinMessage() {
  ctx.fillStyle = "#222222";
  ctx.font = 'bold 48px Arial, "Microsoft YaHei", sans-serif';
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("过关成功！", CONFIG.canvasWidth / 2, CONFIG.canvasHeight / 2);

  if (LEVELS[currentLevel + 1]) {
    ctx.font = '22px Arial, "Microsoft YaHei", sans-serif';
    ctx.fillText(
      `按 Enter 进入第${currentLevel + 1}关`,
      CONFIG.canvasWidth / 2,
      CONFIG.canvasHeight / 2 + 54
    );
  }
}

function drawPlatformCompressionWarning() {
  if (
    currentLevel !== 4 ||
    getCurrentLevel().compression.state !== PLATFORM_COMPRESSION_STATE.WARNING
  ) {
    return;
  }

  ctx.fillStyle = "rgba(35, 25, 18, 0.88)";
  ctx.fillRect(248, 24, 528, 48);
  ctx.strokeStyle = "#e2b44b";
  ctx.lineWidth = 2;
  ctx.strokeRect(248, 24, 528, 48);
  ctx.fillStyle = "#ffe08a";
  ctx.font = 'bold 22px Arial, "Microsoft YaHei", sans-serif';
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("危险！平台正在收缩！", CONFIG.canvasWidth / 2, 48);
}

function render() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#ececec";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  if (gameState === GAME_STATE.MAIN_MENU) {
    drawMainMenu();
    return;
  }

  if (gameState === GAME_STATE.SAVE_SLOTS) {
    drawSaveSlotsPage();
    return;
  }

  drawDungeonBackground();
  const cameraX = getCameraX();
  drawGround(cameraX);
  drawLevelSixSpikes(cameraX);
  drawLevelFivePlatforms(cameraX);
  drawLevelSevenPlatforms(cameraX);
  drawLevelSevenDecorations(cameraX);
  drawMovingPlatform();
  drawMovingPillar();
  drawSpikes();
  drawExitDoor(cameraX);
  drawGiantSaw(cameraX);
  drawLevelSixSaw(cameraX);
  drawLevelSevenProjectile(cameraX);
  drawLevelSevenWalls(cameraX);
  drawLevelSevenPillar(cameraX);

  if (gameState !== GAME_STATE.WON) {
    drawStickman(cameraX);
  } else {
    drawWinMessage();
  }

  if (gameState === GAME_STATE.PLAYING || gameState === GAME_STATE.PAUSED) {
    drawPlatformCompressionWarning();
  }

  if (gameState === GAME_STATE.PAUSED) {
    drawPauseMenu();
  }
}

function drawMenuButton(action, label, x, y, width, height, options = {}) {
  const button = {
    action,
    x,
    y,
    width,
    height,
    enabled: options.enabled !== false,
    slotNumber: options.slotNumber
  };
  menuButtons.push(button);

  ctx.fillStyle = button.enabled ? "#ffffff" : "#dddddd";
  ctx.fillRect(button.x, button.y, button.width, button.height);
  ctx.strokeStyle = button.enabled ? "#333333" : "#999999";
  ctx.lineWidth = 2;
  ctx.strokeRect(button.x, button.y, button.width, button.height);
  ctx.fillStyle = button.enabled ? "#222222" : "#777777";
  ctx.font = '20px Arial, "Microsoft YaHei", sans-serif';
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(label, button.x + button.width / 2, button.y + button.height / 2);
}

function drawMenuGroundTile(x, y) {
  ctx.fillStyle = "#777777";
  ctx.fillRect(x, y, CONFIG.tileSize, CONFIG.tileSize);
  ctx.strokeStyle = "#5d5d5d";
  ctx.lineWidth = 2;
  ctx.strokeRect(x, y, CONFIG.tileSize, CONFIG.tileSize);
}

function drawMenuStar(star) {
  const innerRadius = star.radius * 0.36;
  ctx.beginPath();
  for (let point = 0; point < 10; point += 1) {
    const angle = -Math.PI / 2 + point * Math.PI / 5;
    const radius = point % 2 === 0 ? star.radius : innerRadius;
    const x = star.x + Math.cos(angle) * radius;
    const y = star.y + Math.sin(angle) * radius;

    if (point === 0) {
      ctx.moveTo(x, y);
    } else {
      ctx.lineTo(x, y);
    }
  }
  ctx.closePath();
  ctx.fillStyle = ["#f5d77d", "#dcb64f", "#f0ca68", "#b98d2d"][star.shade];
  ctx.fill();
}

function drawMainMenuBackground() {
  const nightSky = ctx.createLinearGradient(0, 0, 0, canvas.height);
  nightSky.addColorStop(0, "#70540a");
  nightSky.addColorStop(1, "#3e2f08");
  ctx.fillStyle = nightSky;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  for (const star of MENU_STARS) {
    drawMenuStar(star);
  }

  for (let x = 312; x < 472; x += CONFIG.tileSize) {
    drawMenuGroundTile(x, 270);
    drawMenuGroundTile(x, 310);
  }
  for (let x = 552; x < 712; x += CONFIG.tileSize) {
    drawMenuGroundTile(x, 270);
    drawMenuGroundTile(x, 310);
  }

  const jumpPose = {
    leftArmAngle: -ANIMATION_CONFIG.jumpArmAngle,
    rightArmAngle: ANIMATION_CONFIG.jumpArmAngle,
    leftLegAngle: -ANIMATION_CONFIG.jumpLegAngle,
    rightLegAngle: ANIMATION_CONFIG.jumpLegAngle,
    leftKneeBend: -ANIMATION_CONFIG.jumpKneeBend,
    rightKneeBend: ANIMATION_CONFIG.jumpKneeBend
  };
  drawStickmanAt(503, 198, jumpPose, 1);
}

function drawMainMenu() {
  menuButtons = [];
  drawMainMenuBackground();
  ctx.fillStyle = "#222222";
  ctx.font = 'bold 42px Arial, "Microsoft YaHei", sans-serif';
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.lineWidth = 4;
  ctx.strokeStyle = "#3e2f08";
  ctx.strokeText("LEVEL DEVIL MINI", CONFIG.canvasWidth / 2, 56);
  ctx.fillStyle = "#ffe8a3";
  ctx.fillText("LEVEL DEVIL MINI", CONFIG.canvasWidth / 2, 56);

  drawMenuButton("start", "开始游戏", 362, 370, 300, 48);
  drawMenuButton("continue", "继续游戏", 362, 428, 300, 48, {
    enabled: Boolean(getMostRecentSave())
  });
  drawMenuButton("slots", "存档", 362, 486, 300, 48);

  if (mainMenuMessage) {
    ctx.fillStyle = "#a12622";
    ctx.font = '16px Arial, "Microsoft YaHei", sans-serif';
    ctx.fillText(mainMenuMessage, CONFIG.canvasWidth / 2, 554);
  }
}

function drawDungeonBackground() {
  const stoneWall = ctx.createLinearGradient(0, 0, 0, canvas.height);
  stoneWall.addColorStop(0, "#50565a");
  stoneWall.addColorStop(1, "#34393d");
  ctx.fillStyle = stoneWall;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.strokeStyle = "rgba(170, 177, 180, 0.12)";
  ctx.lineWidth = 2;
  for (let y = 0; y <= canvas.height; y += CONFIG.tileSize) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(canvas.width, y);
    ctx.stroke();

    const rowOffset = (y / CONFIG.tileSize) % 2 === 0 ? 0 : CONFIG.tileSize;
    for (let x = rowOffset; x <= canvas.width; x += CONFIG.tileSize * 2) {
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x, Math.min(y + CONFIG.tileSize, canvas.height));
      ctx.stroke();
    }
  }

  drawDungeonTorches();
}

function drawDungeonTorches() {
  const torchY = 116;

  for (let x = CONFIG.tileSize; x < canvas.width; x += CONFIG.tileSize * 2) {
    const glow = ctx.createRadialGradient(x, torchY, 1, x, torchY, 30);
    glow.addColorStop(0, "rgba(194, 133, 49, 0.16)");
    glow.addColorStop(1, "rgba(194, 133, 49, 0)");
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(x, torchY, 30, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#44372a";
    ctx.fillRect(x - 4, torchY, 8, 22);
    ctx.fillRect(x - 8, torchY + 16, 16, 4);

    ctx.fillStyle = "#a66d31";
    ctx.beginPath();
    ctx.moveTo(x, torchY - 15);
    ctx.lineTo(x + 6, torchY - 5);
    ctx.lineTo(x + 4, torchY + 1);
    ctx.lineTo(x - 4, torchY + 1);
    ctx.lineTo(x - 6, torchY - 5);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = "#d0a04e";
    ctx.beginPath();
    ctx.moveTo(x, torchY - 10);
    ctx.lineTo(x + 2, torchY - 3);
    ctx.lineTo(x - 2, torchY - 3);
    ctx.closePath();
    ctx.fill();
  }
}

function drawSaveSlotsPage() {
  menuButtons = [];
  ctx.fillStyle = "#222222";
  ctx.font = 'bold 38px Arial, "Microsoft YaHei", sans-serif';
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("我的存档", CONFIG.canvasWidth / 2, 48);

  for (let index = 0; index < SAVE_SLOT_COUNT; index += 1) {
    const slotNumber = index + 1;
    const save = saveSlots[index];
    const rowY = 94 + index * 116;

    ctx.fillStyle = "#ffffff";
    ctx.fillRect(90, rowY, 844, 102);
    ctx.strokeStyle = slotNumber === selectedSaveSlot ? "#222222" : "#999999";
    ctx.lineWidth = slotNumber === selectedSaveSlot ? 3 : 1;
    ctx.strokeRect(90, rowY, 844, 102);

    ctx.textAlign = "left";
    ctx.fillStyle = "#222222";
    ctx.font = 'bold 22px Arial, "Microsoft YaHei", sans-serif';
    ctx.fillText(`存档${slotNumber}`, 112, rowY + 25);
    ctx.font = '17px Arial, "Microsoft YaHei", sans-serif';
    ctx.fillText(
      save
        ? `第 ${save.level} 关　${new Date(save.savedAt).toLocaleString()}`
        : "空存档",
      112,
      rowY + 67
    );

    drawMenuButton(
      "selectSlot",
      slotNumber === selectedSaveSlot ? "当前保存槽" : "选为保存槽",
      535,
      rowY + 14,
      165,
      34,
      { slotNumber }
    );
    drawMenuButton(
      "readSlot",
      "读取",
      710,
      rowY + 14,
      92,
      34,
      { slotNumber, enabled: Boolean(save) }
    );
    drawMenuButton(
      "deleteSlot",
      "删除",
      814,
      rowY + 14,
      92,
      34,
      { slotNumber, enabled: Boolean(save) }
    );
  }

  drawMenuButton("back", "返回主页面", 362, 454, 300, 48);
  if (savePageMessage) {
    ctx.fillStyle = "#a12622";
    ctx.font = '15px Arial, "Microsoft YaHei", sans-serif';
    ctx.textAlign = "center";
    ctx.fillText(savePageMessage, CONFIG.canvasWidth / 2, 535);
  }

  if (deleteConfirmOpen) {
    drawDeleteConfirmation();
  }
}

function drawDialogButton(action, label, x, y, color) {
  const button = { action, x, y, width: 130, height: 50, enabled: true };
  menuButtons.push(button);
  ctx.fillStyle = color;
  ctx.fillRect(button.x, button.y, button.width, button.height);
  ctx.strokeStyle = "#333333";
  ctx.lineWidth = 2;
  ctx.strokeRect(button.x, button.y, button.width, button.height);
  ctx.fillStyle = "#ffffff";
  ctx.font = 'bold 22px Arial, "Microsoft YaHei", sans-serif';
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(label, button.x + button.width / 2, button.y + button.height / 2);
}

function drawDeleteConfirmation() {
  menuButtons = [];
  ctx.fillStyle = "rgba(0, 0, 0, 0.62)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(312, 138, 400, 300);
  ctx.strokeStyle = "#222222";
  ctx.lineWidth = 3;
  ctx.strokeRect(312, 138, 400, 300);

  ctx.fillStyle = "#222222";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = 'bold 27px Arial, "Microsoft YaHei", sans-serif';
  ctx.fillText("是否删除该存档？", CONFIG.canvasWidth / 2, 186);
  ctx.font = '22px Arial, "Microsoft YaHei", sans-serif';
  ctx.fillText(`存档 ${deleteTargetSlot}`, CONFIG.canvasWidth / 2, 236);
  ctx.font = '18px Arial, "Microsoft YaHei", sans-serif';
  ctx.fillText("删除后无法恢复。", CONFIG.canvasWidth / 2, 276);

  drawDialogButton("confirmDelete", "是", 382, 324, "#b33832");
  drawDialogButton("cancelDelete", "否", 512, 324, "#607d8b");

  if (savePageMessage.startsWith("删除失败")) {
    ctx.fillStyle = "#a12622";
    ctx.font = '16px Arial, "Microsoft YaHei", sans-serif';
    ctx.fillText(savePageMessage, CONFIG.canvasWidth / 2, 404);
  }
}

function drawPauseMenu() {
  menuButtons = [];
  ctx.fillStyle = "rgba(0, 0, 0, 0.58)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(282, 74, 460, 430);
  ctx.strokeStyle = "#333333";
  ctx.lineWidth = 2;
  ctx.strokeRect(282, 74, 460, 430);

  ctx.fillStyle = "#222222";
  ctx.font = 'bold 36px Arial, "Microsoft YaHei", sans-serif';
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("游戏已暂停", CONFIG.canvasWidth / 2, 132);

  drawMenuButton("save", "保存游戏（快捷键 1）", 342, 178, 340, 58);
  drawMenuButton("home", "退出游戏 — 返回主页面", 342, 252, 340, 58);
  drawMenuButton("resume", "继续游戏", 342, 326, 340, 58);

  if (saveMessageTimer > 0) {
    ctx.fillStyle = saveMessage.startsWith("保存成功") ? "#247a3b" : "#a12622";
    ctx.font = '20px Arial, "Microsoft YaHei", sans-serif';
    ctx.fillText(saveMessage, CONFIG.canvasWidth / 2, 426);
  }
}

let lastTime = null;

function gameLoop(currentTime) {
  if (lastTime === null) {
    lastTime = currentTime;
  }

  const elapsedSeconds = (currentTime - lastTime) / 1000;
  const deltaTime = Math.min(elapsedSeconds, CONFIG.maxDeltaTime);
  lastTime = currentTime;

  update(deltaTime);
  updateAnimation(deltaTime);
  if (saveMessageTimer > 0) {
    saveMessageTimer = Math.max(0, saveMessageTimer - deltaTime);
    if (saveMessageTimer === 0) {
      saveMessage = "";
    }
  }
  render();
  requestAnimationFrame(gameLoop);
}

refreshSaveStore();

requestAnimationFrame(gameLoop);
