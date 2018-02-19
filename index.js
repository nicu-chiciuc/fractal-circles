const STROKE = 0;
const FILL = STROKE === 0;

const SCALE = 1.01;
const PER_FRAME = 10;

const USE_SVG = false;

const WIDTH = 600;
const HEIGHT = 600;

const mouse = { x: 0, y: 0 };

let baseColor = "white";

let StopDrawing = false;
// const color01 = "rgb(247, 74, 0)";
// const color02 = "rgb(102, 7, 166)";
// const color03 = "rgb(247, 211, 0)";

// const color01 = "black";
// const color02 = "white";
// const color03 = "red";

const color01 = randColor();
const color02 = randColor();
const color03 = randColor();

class CirclePool {
  static getCircle(diameter, cx, cy, color) {
    let acDiameter = diameter - STROKE;
    let useStroke = true;
    if (acDiameter <= 0) {
      acDiameter += STROKE;
      useStroke = false;
    }

    color = color || randColor();

    const node = USE_SVG
      ? this.draw.circle(acDiameter).attr({
          fill: useStroke ? (FILL ? color : "none") : color,
          stroke: useStroke ? color : "none",
          "stroke-width": STROKE,
          cx,
          cy,
        })
      : null;

    const obj = {
      kids: [],
      color,
      cx,
      cy,
      kidColor: randColor(),
      diameter: acDiameter,
      node,
    };

    if (!USE_SVG) {
      simpleDrawCircle(this.ctx, obj);
    }

    return obj;
  }
}

function clearScreen(ctx) {
  // clear
  ctx.beginPath();
  ctx.rect(0, 0, WIDTH, HEIGHT);
  ctx.closePath();
  ctx.fillStyle = baseColor;
  ctx.fill();
}

function simpleDrawCircle(ctx, circle) {
  const useStroke = false;

  ctx.beginPath();
  ctx.arc(circle.cx, circle.cy, circle.diameter / 2, 0, 2 * Math.PI, false);
  let fillStyle = useStroke ? (FILL ? circle.color : "none") : circle.color;
  ctx.fillStyle = fillStyle;
  if (fillStyle !== "none") ctx.fill();
  ctx.lineWidth = STROKE;
  ctx.strokeStyle = useStroke ? circle.color : "none";
  // ctx.stroke();
}

function randColor() {
  return `rgb(${randUntil(256)},${randUntil(256)},${randUntil(256)})`;
}

function randUntil(max) {
  return Math.floor(Math.random() * max);
}

function randBetween(min, max) {
  return randUntil(max - min) + min;
}

function distanceSquare(x1, y1, x2, y2) {
  const x = x1 - x2;
  const y = y1 - y2;
  return x * x + y * y;
}

function getRadius(oldCircle, { x, y }) {
  const dsquare = distanceSquare(oldCircle.cx, oldCircle.cy, x, y);
  const radSquare = Math.pow(oldCircle.diameter / 2, 2);
  const distance = Math.sqrt(dsquare);
  const bigRadius = oldCircle.diameter / 2;

  let diff;

  if (dsquare < radSquare) {
    diff = bigRadius - distance;
  } else {
    diff = distance - bigRadius;
  }

  diff -= STROKE / 2;
  return diff;
}

function isInside(oldCircle, { x, y }) {
  const dsquare = distanceSquare(oldCircle.cx, oldCircle.cy, x, y);
  const innerRad = (oldCircle.diameter - STROKE) / 2;
  const radSquare = innerRad * innerRad;

  return dsquare < radSquare;
}

function isOutside(oldCircle, { x, y }) {
  const dsquare = distanceSquare(oldCircle.cx, oldCircle.cy, x, y);
  const radSquare = oldCircle.diameter * oldCircle.diameter;

  return dsquare > radSquare;
}

window.onload = function() {
  console.log("test");

  if (USE_SVG) {
    const draw = SVG("drawing").size(WIDTH, HEIGHT);
    CirclePool.draw = draw;
    draw.click(onClick);
  } else {
    const canvas = document.getElementById("canvas");
    canvas.width = WIDTH;
    canvas.height = HEIGHT;

    CirclePool.ctx = canvas.getContext("2d");

    canvas.addEventListener("click", onClick);
  }

  function getMousePos(canvas, evt) {
    const rect = canvas.getBoundingClientRect();
    return {
      x: evt.clientX - rect.left,
      y: evt.clientY - rect.top,
    };
  }

  canvas.addEventListener(
    "mousemove",
    evt => {
      const mousePos = getMousePos(canvas, evt);

      mouse.x = mousePos.x;
      mouse.y = mousePos.y;
    },
    false
  );

  var root = CirclePool.getCircle(WIDTH, WIDTH / 2, HEIGHT / 2, color01);

  function updatePoint(scaleFactor, point) {
    let newPoint = [point.cx, point.cy, 1];

    // prettier-ignore
    newPoint = matXvect3(
      translateMat(-mouse.x, -mouse.y),
      newPoint
    );

    // prettier-ignore
    newPoint = matXvect3(
      scaleMat(scaleFactor),
      newPoint
    );

    newPoint = matXvect3(rotateMat(0.004), newPoint);

    // prettier-ignore
    newPoint = matXvect3(
      translateMat(mouse.x, mouse.y),
      newPoint
    );

    point.cx = newPoint[0];
    point.cy = newPoint[1];
    point.diameter *= scaleFactor;
  }

  let eachTime = 0;

  function step() {
    if (StopDrawing) return;

    eachTime = (eachTime + 1) % 1;

    if (eachTime === 0)
      for (let i = 0; i < PER_FRAME; i++) {
        drawInLocalRoot(root, { x: randUntil(WIDTH), y: randUntil(HEIGHT) });
      }

    // console.log(mouse);

    clearScreen(CirclePool.ctx);

    const nrCircles = recursiveUpdate(root);

    function recursiveUpdate(circle) {
      updatePoint(SCALE, circle);

      simpleDrawCircle(CirclePool.ctx, circle);

      const sums = circle.kids.map(recursiveUpdate);

      return sums.reduce((a, b) => a + b, 1);
    }

    console.log(nrCircles);

    root.kids.some(kid => {
      if (
        isInside(kid, { x: 0, y: 0 }) &&
        isInside(kid, { x: WIDTH, y: 0 }) &&
        isInside(kid, { x: 0, y: HEIGHT }) &&
        isInside(kid, { x: WIDTH, y: HEIGHT })
      ) {
        root = kid;
        baseColor = root.color;
        return true;
      }
    });

    window.requestAnimationFrame(step);
  }

  window.requestAnimationFrame(step);

  function onClick(evt) {
    const point = { x: evt.clientX, y: evt.clientY };

    if (isInside(root, point)) drawInLocalRoot(root, point);

    StopDrawing = true;

    // if (rad > 0) {
    //   let c = CirclePool.getCircle(rad * 2, evt.clientX, evt.clientY);
    // }
  }

  function drawInLocalRoot(localRoot, point) {
    // TODO: put to upper function
    if (!isInside(root, point)) return;

    // Is inside one of the kids
    const inside = localRoot.kids.find(kid => {
      return isInside(kid, point);
    });

    if (inside) {
      drawInLocalRoot(inside, point);
    } else {
      // const smallestDistances = [getRadius(localRoot, point)];

      const smallestDistances = localRoot.kids.map(kid =>
        getRadius(kid, point)
      );
      smallestDistances.push(getRadius(localRoot, point));

      // console.log(smallestDistances);

      let bestDiameter = Math.min(...smallestDistances) * 2;

      // console.log(bestDiameter);

      // prettier-ignore
      if (
        bestDiameter > 0
        // && bestDiameter * 17 > localRoot.diameter
        // && bestDiameter > 5
      ) {
        if (bestDiameter > localRoot.diameter / 3) bestDiameter /= 3;

        let old = localRoot.color;
        let newColor ;

        // newColor=old == color01 ? color02 : old == color02 ? color03 : color01;

        // newColor = old == color01 ? color02 : color01;

        // newColor = randColor();

        newColor = localRoot.kidColor;

        localRoot.kids.push(
          CirclePool.getCircle(bestDiameter, point.x, point.y, newColor)
        );
      }
    }
  }
};

function translateMat(tx, ty) {
  // prettier-ignore
  return [
    [1, 0, tx],
    [0, 1, ty],
    [0, 0,  1]
  ];
}

function rotateMat(radians) {
  const sin = Math.sin(radians);
  const cos = Math.cos(radians);
  // prettier-ignore
  return [
    [cos, -sin, 0],
    [sin,  cos, 0],
    [0  ,    0, 1]
  ]
}

function scaleMat(s) {
  // prettier-ignore
  return [
    [s, 0, 0],
    [0, s, 0],
    [0, 0, 1]
  ];
}

function vector3Mult(v, w) {
  if (v.length !== w.length) throw "fuck";

  return v.reduce((acc, val, i) => acc + val * w[i], 0);
}

function matXvect3(m, v) {
  if (m.length !== v.length) throw "no";

  return m.map(w => vector3Mult(w, v));
}
