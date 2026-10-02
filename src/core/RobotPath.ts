interface Point { x: number; y: number }

export function robotRouteDuration(route: Point[], speed: number) {
  const points = route.filter((point, index) => {
    if (index === 0 || index === route.length - 1) return true;
    const previous = route[index - 1];
    const next = route[index + 1];
    return !((previous.x === point.x && point.x === next.x) || (previous.y === point.y && point.y === next.y));
  });
  let legs = 0;
  let distance = 0;
  for (let i = 1; i < points.length; i++) {
    const length = Math.abs(points[i].x - points[i - 1].x) + Math.abs(points[i].y - points[i - 1].y);
    if (length > 0) { legs++; distance += length; }
  }
  const travelFraction = 1 - legs * Math.min(0.12, 0.36 / legs);
  return distance > 0 ? distance / speed * 1000 / travelFraction : 1;
}

const turn = (from: number, to: number, t: number) => {
  const difference = Math.atan2(Math.sin(to - from), Math.cos(to - from));
  const rotationProgress = t * t * (3 - 2 * t);
  return from + difference * rotationProgress;
};

export function robotMotion(from: Point, to: Point, progress: number, horizontalFirst: boolean, initialHeading: number, exitDistance = 0) {
  const corner = horizontalFirst ? { x: to.x, y: from.y } : { x: from.x, y: to.y };
  const exit = { x: from.x, y: from.y - exitDistance };
  const points = exitDistance > 0
    ? [from, exit, { x: to.x, y: exit.y }, to]
    : [from, corner, to];
  return robotRouteMotion(points, progress, initialHeading);
}

export function robotRouteMotion(route: Point[], progress: number, initialHeading: number) {
  const points = route.filter((point, index) => {
    if (index === 0 || index === route.length - 1) return true;
    const previous = route[index - 1];
    const next = route[index + 1];
    return !((previous.x === point.x && point.x === next.x) || (previous.y === point.y && point.y === next.y));
  });
  const from = points[0];
  const to = points[points.length - 1];
  const legs = points.slice(1).map((point, index) => ({ from: points[index], to: point }))
    .filter(leg => leg.from.x !== leg.to.x || leg.from.y !== leg.to.y);
  if (!legs.length) return { ...from, heading: initialHeading };
  if (progress >= 1) {
    const last = legs[legs.length - 1];
    return { ...to, heading: Math.atan2(last.to.y - last.from.y, last.to.x - last.from.x) + Math.PI / 2 };
  }
  const lengths = legs.map(leg => Math.abs(leg.to.x - leg.from.x) + Math.abs(leg.to.y - leg.from.y));
  const total = lengths.reduce((sum, length) => sum + length, 0);
  const turnTime = Math.min(0.12, 0.36 / legs.length);
  const travelTime = 1 - legs.length * turnTime;
  let time = Math.max(0, Math.min(1, progress));
  let heading = initialHeading;
  for (const [index, leg] of legs.entries()) {
    const nextHeading = Math.atan2(leg.to.y - leg.from.y, leg.to.x - leg.from.x) + Math.PI / 2;
    if (time < turnTime) return { ...leg.from, heading: turn(heading, nextHeading, time / turnTime) };
    time -= turnTime;
    const duration = travelTime * lengths[index] / total;
    if (time < duration) {
      const t = time / duration;
      return { x: leg.from.x + (leg.to.x - leg.from.x) * t, y: leg.from.y + (leg.to.y - leg.from.y) * t, heading: nextHeading };
    }
    time -= duration;
    heading = nextHeading;
  }
  return { ...to, heading };
}

// Travel each leg in sequence, with time proportional to its length.
export function robotPathPosition(from: Point, to: Point, progress: number, horizontalFirst: boolean): Point {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const horizontal = Math.abs(dx);
  const vertical = Math.abs(dy);
  const distance = (horizontal + vertical) * Math.max(0, Math.min(1, progress));
  if (horizontalFirst) {
    return {
      x: from.x + Math.sign(dx) * Math.min(distance, horizontal),
      y: from.y + Math.sign(dy) * Math.max(0, distance - horizontal),
    };
  }
  return {
    x: from.x + Math.sign(dx) * Math.max(0, distance - vertical),
    y: from.y + Math.sign(dy) * Math.min(distance, vertical),
  };
}
