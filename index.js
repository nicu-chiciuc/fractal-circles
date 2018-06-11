let WIDTH = window.innerWidth
let HEIGHT = window.innerHeight

const mouse = { x: WIDTH / 2, y: HEIGHT / 2 }

let baseColor = "white"

let StopDrawing = false

const Data = {
  STROKE: 0,
  FILL: () => Data.STROKE === 0,
  SCALE: 1.013,
  PER_FRAME: 10,
  STEPS_TILL_FULL: 10,
  ROTATE: 0.004,
  EVERY_FRAMES: 10,
  ColorSchema: "sameKids",
  DivBy: 3,
  color01: Utils.randColor(),
  color02: Utils.randColor(),
  color03: Utils.randColor(),
  alpha: 1,
}

const gui = new dat.GUI()
gui.add(Data, "SCALE", 1.0, 1.15, 0.001)
gui.add(Data, "PER_FRAME", 1, 100, 1)
gui.add(Data, "DivBy", 1, 10, 1)
gui.add(Data, "STEPS_TILL_FULL", 1, 100, 1)
gui.add(Data, "ROTATE", 0, 0.15, 0.001)
gui.add(Data, "EVERY_FRAMES", 1, 100, 1)
gui.add(Data, "ColorSchema", ["sameKids", "2Colors", "3Colors", "random"])
gui.addColor(Data, "color01")
gui.addColor(Data, "color02")
gui.addColor(Data, "color03")
// gui.add(Data, "alpha", 0, 1, 0.01).onChange(val => {
//   Context.globalAlpha = val
// })

var Context = null

var gn = new GyroNorm()

var Elems = {
  alpha: document.getElementById("alpha"),
  beta: document.getElementById("beta"),
  gamma: document.getElementById("gamma"),
  mouseX: document.getElementById("mouseX"),
  mouseY: document.getElementById("mouseY"),
}

const maxGamma = 30
const maxBeta = 30

gn
  .init()
  .then(() => {
    gn.start(data => {
      const beta = data.do.beta
      const gamma = data.do.gamma
      Elems.alpha.innerHTML = "alpha: " + data.do.alpha
      Elems.beta.innerHTML = "beta: " + beta
      Elems.gamma.innerHTML = "gamma: " + gamma

      Elems.mouseX.innerHTML = "mouseX: " + mouse.x
      Elems.mouseY.innerHTML = "mouseY: " + mouse.y

      let goodGamma = gamma
      goodGamma = Math.min(goodGamma, maxGamma)
      goodGamma = Math.max(goodGamma, -maxGamma)

      let goodBeta = beta
      goodBeta = Math.min(goodBeta, maxBeta)
      goodBeta = Math.max(goodBeta, -maxBeta)

      Elems.mouseX.innerHTML = goodGamma + ", " + goodBeta

      mouse.x = (goodGamma + maxGamma) / (maxGamma * 2) * WIDTH
      mouse.y = (goodBeta + maxBeta) / (maxBeta * 2) * HEIGHT

      Elems.mouseX.innerHTML = "mouseX: " + mouse.x
      Elems.mouseY.innerHTML = "mouseY: " + mouse.y
      // Process:
      // data.do.alpha  ( deviceorientation event alpha value )
      // data.do.beta   ( deviceorientation event beta value )
      // data.do.gamma  ( deviceorientation event gamma value )
      // data.do.absolute ( deviceorientation event absolute value )
    })
  })
  .catch(e => {
    console.warn("Not supported orientation")
    // Catch if the DeviceOrientation or DeviceMotion is not supported by the browser or device
  })

function getCircle(diameter, cx, cy, color) {
  let acDiameter = diameter - Data.STROKE
  let useStroke = true
  if (acDiameter <= 0) {
    acDiameter += Data.STROKE
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
    drawnDiameter: 0,
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
  ctx.globalAlpha = 1
  ctx.fill()
  ctx.globalAlpha = Data.alpha
}

function simpleDrawCircle(ctx, circle) {
  const useStroke = true

  ctx.beginPath()
  ctx.arc(
    circle.cx,
    circle.cy,
    circle.drawnDiameter / 2 + Data.STROKE / 2,
    0,
    2 * Math.PI,
    false
  )
  ctx.closePath()

  let fillStyle = useStroke
    ? Data.FILL() ? circle.color : "none"
    : circle.color

  ctx.fillStyle = fillStyle
  if (fillStyle !== "none") ctx.fill()
  ctx.lineWidth = Data.STROKE
  ctx.strokeStyle = useStroke ? circle.color : "none"
  ctx.stroke()
}

window.onresize = function(event) {
  WIDTH = window.innerWidth
  HEIGHT = window.innerHeight
  canvas.width = WIDTH
  canvas.height = HEIGHT

  console.log({ WIDTH, HEIGHT })
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

  var root = getCircle(WIDTH, WIDTH / 2, HEIGHT / 2, Data.color01)
  // So it's not popping hard
  root.step = Data.STEPS_TILL_FULL

  function updatePoint(point) {
    let newPoint = [point.cx, point.cy, 1]

    // prettier-ignore
    newPoint = Utils.matXvect3(
      Utils.translateMat(-mouse.x, -mouse.y),
      newPoint
    )

    // prettier-ignore
    newPoint = Utils.matXvect3(
      Utils.scaleMat(Data.SCALE),
      newPoint
    )

    // prettier-ignore
    newPoint = Utils.matXvect3(
      Utils.rotateMat(Data.ROTATE),
      newPoint
    )

    // prettier-ignore
    newPoint = Utils.matXvect3(
      Utils.translateMat(mouse.x, mouse.y),
      newPoint
    )

    point.cx = newPoint[0]
    point.cy = newPoint[1]
    point.diameter *= Data.SCALE
    point.drawnDiameter =
      point.step > Data.STEPS_TILL_FULL
        ? point.diameter
        : point.diameter / Data.STEPS_TILL_FULL * point.step
  }

  let eachTime = 0

  function step() {
    if (StopDrawing) return

    eachTime = (eachTime + 1) % Data.EVERY_FRAMES

    if (eachTime === 0)
      // Create new random circles
      for (let i = 0; i < Data.PER_FRAME; i++)
        drawInLocalRoot(root, {
          x: Utils.randUntil(WIDTH),
          y: Utils.randUntil(HEIGHT),
        })

    clearScreen(Context)

    const nrCircles = recursiveUpdate(root)

    function recursiveUpdate(circle) {
      circle.step++

      updatePoint(circle)

      simpleDrawCircle(Context, circle)

      const sums = circle.kids.map(recursiveUpdate)

      return sums.reduce((a, b) => a + b, 1)
    }

    console.log(nrCircles)

    root.kids.some(kid => {
      if (
        Utils.isInside(Data.STROKE, kid, { x: 0, y: 0 }) &&
        Utils.isInside(Data.STROKE, kid, { x: WIDTH, y: 0 }) &&
        Utils.isInside(Data.STROKE, kid, { x: 0, y: HEIGHT }) &&
        Utils.isInside(Data.STROKE, kid, { x: WIDTH, y: HEIGHT })
      ) {
        root = kid
        baseColor = root.color
        return true
      }
    })

    simpleDrawCircle(Context, {
      cx: mouse.x,
      cy: mouse.y,
      drawnDiameter: 10,
      color: "black",
    })

    window.requestAnimationFrame(step)
  }

  window.requestAnimationFrame(step)

  function onClick(evt) {
    const point = { x: evt.clientX, y: evt.clientY }

    if (Utils.isInside(Data.STROKE, root, point)) drawInLocalRoot(root, point)

    StopDrawing = true

    // if (rad > 0) {
    //   let c = getCircle(rad * 2, evt.clientX, evt.clientY)
    // }
  }

  function drawInLocalRoot(localRoot, point) {
    // TODO: put to upper function
    if (!Utils.isInside(Data.STROKE, root, point, true)) return

    // Is inside one of the kids
    const inside = localRoot.kids.find(kid =>
      Utils.isInside(Data.STROKE, kid, point)
    )

    if (inside) drawInLocalRoot(inside, point)
    else {
      // const smallestDistances = [Utils.getRadius(Data.STROKE, localRoot, point)];

      const smallestDistances = localRoot.kids.map(kid =>
        Utils.getRadius(Data.STROKE, kid, point)
      )
      smallestDistances.push(Utils.getRadius(Data.STROKE, localRoot, point))

      let bestDiameter = Math.min(...smallestDistances) * 2

      if (bestDiameter > 0) {
        if (bestDiameter > localRoot.diameter / Data.DivBy)
          bestDiameter /= Data.DivBy

        let newColor = getNewColor(localRoot)
        localRoot.kids.push(getCircle(bestDiameter, point.x, point.y, newColor))
      }
    }
  }
}

function getNewColor(parent) {
  switch (Data.ColorSchema) {
    case "sameKids":
      return parent.kidColor

    case "2Colors":
      return parent.color == Data.color01 ? Data.color02 : Data.color01

    case "3Colors":
      return parent.color == Data.color01
        ? Data.color02
        : parent.color == Data.color02 ? Data.color03 : Data.color01

    case "random":
    default:
      return Utils.randColor()
  }
}
