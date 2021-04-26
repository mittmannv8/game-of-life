const CELL_SIZE = 10;
const W_WORLD_SIZE = Math.floor(window.innerWidth / CELL_SIZE) * CELL_SIZE;
const H_WORLD_SIZE = Math.floor(window.innerHeight / CELL_SIZE) * CELL_SIZE;

const canvas = document.querySelector("canvas[id='world'");
const ctx = canvas.getContext("2d");
canvas.width = W_WORLD_SIZE;
canvas.height = H_WORLD_SIZE;
const cgrid = document.querySelector("canvas[id='grid'");
const gctx = cgrid.getContext("2d");
cgrid.width = W_WORLD_SIZE;
cgrid.height = H_WORLD_SIZE;

const hud = document.querySelector("canvas[id='hud'");
const hctx = hud.getContext("2d");
hud.width = W_WORLD_SIZE;
hud.height = 50;

colors = {
  alive: "#FFB100",
  dead: "#16262E"
};

function change_state(positions, editorMode = false) {
  positions.forEach(([x, y]) => {
    world[x][y].state = "alive";
    world[x][y].force_state_next = editorMode;
  });
}

function drawCell({ x, y, state }) {
  const [fx, fy] = fixCellPosition(x, y);
  ctx.beginPath();

  ctx.fillStyle = colors[state];
  ctx.fillRect(fx, fy, CELL_SIZE, CELL_SIZE);
}

columns = [...range(0, W_WORLD_SIZE, CELL_SIZE)];
lines = [...range(0, H_WORLD_SIZE, CELL_SIZE)];

function worldGenerator() {
  const world = [];
  columns.map(x => {
    world.push(lines.map(y => ({ x, y, state: "dead" })));
  });
  return world;
}
let world = worldGenerator();

// seed
function seed() {
  for (let i = 0; i < randInt(10, 50); i++) {
    x = randInt(1, lines.length - 1);
    y = randInt(1, columns.length - 1);

    for (let j = 0; j < randInt(13, 17); j++) {
      try {
        world[x + randInt(-5, 5)][y + randInt(-5, 5)].state = "alive";
      } catch (e) {}
    }
  }
}

function check_population(iworld) {
  const newWorld = worldGenerator();

  for (let x = 0; x < columns.length; x++) {
    for (let y = 0; y < lines.length; y++) {
      aliveNeighbors = 0;
      const spot = iworld[x][y];
      const nSpot = (newWorld[x][y] = { ...spot, state: "dead" });
      alive = spot.state == "alive";

      aliveNeighbors += iworld[x - 1]?.[y - 1]?.state === "alive" ? 1 : 0;
      aliveNeighbors += iworld[x]?.[y - 1]?.state === "alive" ? 1 : 0;
      aliveNeighbors += iworld[x + 1]?.[y - 1]?.state === "alive" ? 1 : 0;

      aliveNeighbors += iworld[x - 1]?.[y]?.state === "alive" ? 1 : 0;
      aliveNeighbors += iworld[x + 1]?.[y]?.state === "alive" ? 1 : 0;

      aliveNeighbors += iworld[x - 1]?.[y + 1]?.state === "alive" ? 1 : 0;
      aliveNeighbors += iworld[x]?.[y + 1]?.state === "alive" ? 1 : 0;
      aliveNeighbors += iworld[x + 1]?.[y + 1]?.state === "alive" ? 1 : 0;

      if (alive && [2, 3].includes(aliveNeighbors)) {
        nSpot.state = "alive";
      }
      if (!alive && aliveNeighbors == 3) {
        nSpot.state = "alive";
      }
    }
  }
  return newWorld;
}

let lastTimestamp = performance.now();
let generation = 1;
let next = true;
let first = true;
let editorMode = false;

function byTimestamp(interval, draw) {
  let now = performance.now();
  if (now - lastTimestamp > interval) {
    lastTimestamp = now;
    draw();
  }
}

cgrid.onmousedown = event => {
  console.log("down");
  editorMode = true;
  cgrid.style.cursor = "cell";
};
cgrid.onmouseup = event => {
  editorMode = false;
  console.log("up");
  cgrid.style.cursor = "pointer";
};
cgrid.onmousemove = event => {
  if (editorMode) {
    console.log("move");
    const [x, y] = fixCellPosition(event.offsetX, event.offsetY);
    change_state([[x / CELL_SIZE, y / CELL_SIZE]], (editorMode = true));
  }
};

let auto = false;
let speed = 10;
let gridVisibility = true;

document.querySelector("#play").onclick = event => {
  auto = !auto;
  event.target.innerHTML = auto ? "Pause" : "Play";
};
document.querySelector("#next").onclick = event => {
  if (!auto) {
    next = true;
  }
};
speedInput = document.querySelector("#speed");
speedInput.value = 10;
speedInput.oninput = event => {
  speed = Number(event.target.value);
};
document.querySelector("#reset").onclick = event => {
  world = worldGenerator();
  next = true;
};
document.querySelector("#show-grid").onclick = event => {
  gridVisibility = !gridVisibility;
  changeGridVisibility();
};

function update() {
  window.requestAnimationFrame(update);

  auto &&
    byTimestamp(1000 / speed, () => {
      next = true;
    });

  if (!editorMode && !next) {
    return;
  }
  next = false;

  if (!editorMode) {
    world = check_population(world);
    generation++;
  }
  first = false;

  ctx.clearRect(0, 0, W_WORLD_SIZE, H_WORLD_SIZE);

  population = 0;
  world.forEach(line => {
    line
      .filter(s => s.state == "alive")
      .forEach(spot => {
        drawCell(spot);
        population += spot.state == "alive" ? 1 : 0;
      });
  });

  hctx.clearRect(0, 0, hud.width, hud.height);
  hctx.font = "15px Roboto";

  hctx.fillStyle = "#17dfe3";

  hctx.fillText(`Generation: ${generation}`, 5, 15);
  hctx.fillText(`Population: ${population}`, 5, 35);
}
window.requestAnimationFrame(update);

function changeGridVisibility() {
  gctx.clearRect(0, 0, cgrid.width, cgrid.height);
  if (gridVisibility) {
    world.forEach(line => {
      line.forEach(({ x, y }) => {
        const [fx, fy] = fixCellPosition(x, y);
        gctx.strokeStyle = "#3B341F";
        gctx.strokeRect(fx, fy, CELL_SIZE, CELL_SIZE);
      });
    });
  }
}

function fixCellPosition(x, y) {
  return [
    Math.floor(x / CELL_SIZE) * CELL_SIZE,
    Math.floor(y / CELL_SIZE) * CELL_SIZE
  ];
}

function randomPlace() {
  return [Math.random() * W_WORLD_SIZE, Math.random() * H_WORLD_SIZE];
}

function randInt(s, e) {
  return choice([...range(s, e)]);
}

function choice(list) {
  return list[Math.floor(Math.random() * list.length)];
}

function* range(start = 0, end = 0, step = 1) {
  let count = start;
  while (count < end) {
    yield count;
    count += step;
  }
}

function change(spot) {
  spot.state = spot.state == "dead" ? "alive" : "dead";
}

// shapes
function blinker() {
  change_state([
    [5, 5],
    [6, 5],
    [7, 5]
  ]);
}

function toad() {
  change_state([
    [5, 4],
    [6, 4],
    [7, 4],

    [4, 5],
    [5, 5],
    [6, 5]
  ]);
}

function beacon() {
  change_state([
    [5, 5],
    [6, 5],
    [5, 6],
    [6, 6],

    [7, 7],
    [8, 7],
    [7, 8],
    [8, 8]
  ]);
}

function glider() {
  change_state([
    [5, 5],
    [6, 6],
    [7, 6],
    [7, 5],
    [7, 4]
  ]);
}

function lightWeightSpaceship() {
  change_state([
    [5, 5],
    [6, 5],

    [4, 6],
    [5, 6],
    [6, 6],
    [7, 6],

    [4, 7],
    [5, 7],
    [7, 7],
    [8, 7],

    [6, 8],
    [7, 8]
  ]);
}

function T() {
  const xmid = Math.floor(columns.length / 2);
  const ymid = Math.floor(lines.length / 2);

  change_state([
    [xmid, ymid],
    [xmid + 1, ymid],
    [xmid + 2, ymid],

    [xmid + 1, ymid + 1],
    [xmid + 1, ymid + 2],
    [xmid + 1, ymid + 3]
  ]);
}

T();
