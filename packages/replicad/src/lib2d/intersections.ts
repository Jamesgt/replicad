import { Geom2dAPI_InterCurveCurve } from "replicad-opencascadejs";
import { getOC } from "../oclib";
import { Curve2D } from "./Curve2D";
import { Point2D } from "./definitions";

function* pointsIteration(
  intersector: Geom2dAPI_InterCurveCurve
): Generator<Point2D> {
  const nPoints = intersector.NbPoints();
  if (!nPoints) return;

  for (let i = 1; i <= nPoints; i++) {
    const point = intersector.Point(i);
    yield [point.X(), point.Y()];
  }
}

function* commonSegmentsIteration(
  intersector: Geom2dAPI_InterCurveCurve
): Generator<Curve2D> {
  const nSegments = intersector.NbSegments();
  if (!nSegments) return;

  const oc = getOC();

  for (let i = 1; i <= nSegments; i++) {
    const h1 = new oc.Handle_Geom2d_Curve_1();
    const h2 = new oc.Handle_Geom2d_Curve_1();
    intersector.Segment(i, h1, h2);
    yield new Curve2D(h1);
    h2.delete();
  }
}

export const intersectCurves = (
  first: Curve2D,
  second: Curve2D,
  precision = 1e-9
) => {
  if (first.boundingBox.isOut(second.boundingBox))
    return { intersections: [], commonSegments: [], commonSegmentsPoints: [] };

  const oc = getOC();
  const intersector = new oc.Geom2dAPI_InterCurveCurve_1();

  let intersections;
  let commonSegments;

  try {
    intersector.Init_1(first.wrapped, second.wrapped, precision);

    intersections = Array.from(pointsIteration(intersector));
    commonSegments = Array.from(commonSegmentsIteration(intersector));
  } catch (e) {
    throw new Error("Intersections failed between curves");
  } finally {
    intersector.delete();
  }

  const commonSegmentsPoints = commonSegments.flatMap((c) => [
    c.firstPoint,
    c.lastPoint,
  ]);

  return { intersections, commonSegments, commonSegmentsPoints };
};
