const Utils = {
  matXvect3: (m, v) => {
    if (m.length !== v.length) throw "no"

    return m.map(w => Utils.vector3Mult(w, v))
  },
  vector3Mult: (v, w) => {
    if (v.length !== w.length) throw "fuck"

    return v.reduce((acc, val, i) => acc + val * w[i], 0)
  },

  scaleMat: s => {
    // prettier-ignore
    return [
      [s, 0, 0],
      [0, s, 0],
      [0, 0, 1]
    ];
  },
  rotateMat: radians => {
    const sin = Math.sin(radians)
    const cos = Math.cos(radians)
    // prettier-ignore
    return [
      [cos, -sin, 0],
      [sin,  cos, 0],
      [0  ,    0, 1]
    ]
  },
  translateMat(tx, ty) {
    // prettier-ignore
    return [
      [1, 0, tx],
      [0, 1, ty],
      [0, 0,  1]
    ];
  },

  randColor: () => {
    return `rgb(${Utils.randUntil(256)},${Utils.randUntil(
      256
    )},${Utils.randUntil(256)})`
  },

  toHex: d => {
    return ("0" + Number(d).toString(16)).slice(-2).toUpperCase()
  },

  randUntil: max => {
    return Math.floor(Math.random() * max)
  },

  randBetween: (min, max) => {
    return Utils.randUntil(max - min) + min
  },

  distanceSquare: (x1, y1, x2, y2) => {
    const x = x1 - x2
    const y = y1 - y2
    return x * x + y * y
  },

  getRadius: (stroke, oldCircle, { x, y }) => {
    const dsquare = Utils.distanceSquare(oldCircle.cx, oldCircle.cy, x, y)
    const radSquare = Math.pow(oldCircle.diameter / 2, 2)
    const distance = Math.sqrt(dsquare)
    const bigRadius = oldCircle.diameter / 2

    let diff = dsquare < radSquare ? bigRadius - distance : distance - bigRadius

    diff -= stroke / 2
    return diff
  },

  isInside: (stroke, oldCircle, { x, y }, useDrawnDiameter = false) => {
    const dsquare = Utils.distanceSquare(oldCircle.cx, oldCircle.cy, x, y)
    const diameter = useDrawnDiameter
      ? oldCircle.drawnDiameter
      : oldCircle.diameter

    const innerRad = (diameter - stroke) / 2
    const radSquare = innerRad * innerRad

    return dsquare < radSquare
  },

  isOutside: (oldCircle, { x, y }) => {
    const dsquare = Utils.distanceSquare(oldCircle.cx, oldCircle.cy, x, y)
    const radSquare = oldCircle.diameter * oldCircle.diameter

    return dsquare > radSquare
  },
}
