const STROKE = 0
const FILL = STROKE === 0

const SCALE = 1.013
const PER_FRAME = 20

const WIDTH = 800
const HEIGHT = 600

const mouse = { x: 0, y: 0 }

let baseColor = "white"

let StopDrawing = false

const STEPS_TILL_FULL = 10

var Context = null
// const color01 = "rgb(247, 74, 0)";
// const color02 = "rgb(102, 7, 166)";
// const color03 = "rgb(247, 211, 0)";

// const color01 = "black";
// const color02 = "white";
// const color03 = "red";

const color01 = Utils.randColor()
const color02 = Utils.randColor()
const color03 = Utils.randColor()

function getCircle(diameter, cx, cy, color) {
  let acDiameter = diameter - STROKE
  let useStroke = true
  if (acDiameter <= 0) {
    acDiameter += STROKE
    useStroke = false
  }

  color = color || Utils.randColor()

  const obj = {
    kids: [],
    color,
    cx,
    cy,
    kidColor: Utils.randColor(),
    diameter: acDiameter,
    drawnDiameter: acDiameter,
    step: 0,
  }

  simpleDrawCircle(Context, obj)

  return obj
}

function clearScreen(ctx) {
  ctx.beginPath()
  ctx.rect(0, 0, WIDTH, HEIGHT)
  ctx.closePath()

  ctx.fillStyle = baseColor
  ctx.fill()
}

function simpleDrawCircle(ctx, circle) {
  const useStroke = false

  ctx.beginPath()
  ctx.arc(circle.cx, circle.cy, circle.drawnDiameter / 2, 0, 2 * Math.PI, false)
  let fillStyle = useStroke ? (FILL ? circle.color : "none") : circle.color
  ctx.fillStyle = fillStyle
  if (fillStyle !== "none") ctx.fill()
  ctx.lineWidth = STROKE
  ctx.strokeStyle = useStroke ? circle.color : "none"
  // ctx.stroke()
}

window.onload = function() {
  console.log("test")

  const canvas = document.getElementById("canvas")
  canvas.width = WIDTH
  canvas.height = HEIGHT

  Context = canvas.getContext("2d")

  canvas.addEventListener("click", onClick)

  function getMousePos(canvas, evt) {
    const rect = canvas.getBoundingClientRect()
    return {
      x: evt.clientX - rect.left,
      y: evt.clientY - rect.top,
    }
  }

  canvas.addEventListener(
    "mousemove",
    evt => {
      const mousePos = getMousePos(canvas, evt)

      mouse.x = mousePos.x
      mouse.y = mousePos.y
    },
    false
  )

  var root = getCircle(WIDTH, WIDTH / 2, HEIGHT / 2, color01)

  function updatePoint(scaleFactor, point) {
    let newPoint = [point.cx, point.cy, 1]

    // prettier-ignore
    newPoint = Utils.matXvect3(
      Utils.translateMat(-mouse.x, -mouse.y),
      newPoint
    )

    // prettier-ignore
    newPoint = Utils.matXvect3(
      Utils.scaleMat(scaleFactor),
      newPoint
    )

    // prettier-ignore
    newPoint = Utils.matXvect3(
      Utils.rotateMat(0.004),
      newPoint
    )

    // prettier-ignore
    newPoint = Utils.matXvect3(
      Utils.translateMat(mouse.x, mouse.y),
      newPoint
    )

    point.cx = newPoint[0]
    point.cy = newPoint[1]
    point.diameter *= scaleFactor
    point.drawnDiameter =
      point.step > STEPS_TILL_FULL
        ? point.diameter
        : (point.diameter / STEPS_TILL_FULL) * point.step
  }

  let eachTime = 0

  function step() {
    if (StopDrawing) return

    eachTime = (eachTime + 1) % 10

    if (eachTime === 0)
      // Create new random circles
      for (let i = 0; i < PER_FRAME; i++) {
        drawInLocalRoot(root, {
          x: Utils.randUntil(WIDTH),
          y: Utils.randUntil(HEIGHT),
        })
      }

    // console.log(mouse)

    clearScreen(Context)

    const nrCircles = recursiveUpdate(root)

    function recursiveUpdate(circle) {
      circle.step++

      updatePoint(SCALE, circle)

      simpleDrawCircle(Context, circle)

      const sums = circle.kids.map(recursiveUpdate)

      return sums.reduce((a, b) => a + b, 1)
    }

    console.log(nrCircles)

    root.kids.some(kid => {
      if (
        Utils.isInside(kid, { x: 0, y: 0 }) &&
        Utils.isInside(kid, { x: WIDTH, y: 0 }) &&
        Utils.isInside(kid, { x: 0, y: HEIGHT }) &&
        Utils.isInside(kid, { x: WIDTH, y: HEIGHT })
      ) {
        root = kid
        baseColor = root.color
        return true
      }
    })

    window.requestAnimationFrame(step)
  }

  window.requestAnimationFrame(step)

  function onClick(evt) {
    const point = { x: evt.clientX, y: evt.clientY }

    if (Utils.isInside(root, point)) drawInLocalRoot(root, point)

    StopDrawing = true

    // if (rad > 0) {
    //   let c = getCircle(rad * 2, evt.clientX, evt.clientY)
    // }
  }

  function drawInLocalRoot(localRoot, point) {
    // TODO: put to upper function
    if (!Utils.isInside(root, point)) return

    // Is inside one of the kids
    const inside = localRoot.kids.find(kid => {
      return Utils.isInside(kid, point)
    })

    if (inside) {
      drawInLocalRoot(inside, point)
    } else {
      // const smallestDistances = [Utils.getRadius(localRoot, point)];

      const smallestDistances = localRoot.kids.map(kid =>
        Utils.getRadius(kid, point)
      )
      smallestDistances.push(Utils.getRadius(localRoot, point))

      // console.log(smallestDistances)

      let bestDiameter = Math.min(...smallestDistances) * 2

      // console.log(bestDiameter)

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

        // newColor = Utils.randColor()

        newColor = localRoot.kidColor;

        localRoot.kids.push(
          getCircle(bestDiameter, point.x, point.y, newColor)
        )
      }
    }
  }
}
