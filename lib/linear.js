function linear({ x0, y0 }, { x1, y1 }) {
    return x => (x - x0) * (y1 - y0) / (x1 - x0) + y0;
}

module.exports = linear;
