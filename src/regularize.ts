import { SCALAR } from "./constants";
import { evalMultiLinearMasterDim } from "./eval";
import { MultiLinearMasterDim, MultiLinearStop } from "./interface";

export function regularizeMultiLinearMasterDim(md: MultiLinearMasterDim): MultiLinearMasterDim {
	let stops: Map<number, MultiLinearStop> = new Map();
	let minX = scaleUp(1),
		minY: MultiLinearStop = { left: 1, right: 1, at: 1 },
		maxX = scaleUp(-1),
		maxY: MultiLinearStop = { left: 1, right: 1, at: 1 };
	for (const [x, y] of md.points) {
		if (x > 1 || x < -1) continue;
		const scaledX = scaleUp(x);
		stops.set(scaledX, y);
		if (scaledX <= minX) {
			minX = scaledX;
			minY = y;
		}
		if (scaledX >= maxX) {
			maxX = scaledX;
			maxY = y;
		}
	}
	if (minX > scaleUp(-1)) {
		stops.set(scaleUp(-1), { left: minY.left, right: minY.left, at: minY.left });
	}
	if (maxX < scaleUp(+1)) {
		stops.set(scaleUp(+1), {
			left: maxY.right,
			right: maxY.right,
			at: maxY.right,
		});
	}

	const axisWithoutZero = {
		axis: md.axis,
		points: Array.from(stops).sort(byX).map(scaleDown),
	};
	if (!stops.has(0)) {
		const y0 = evalMultiLinearMasterDim(axisWithoutZero, 0);
		stops.set(0, { left: y0, right: y0, at: y0 });
	}
	return {
		axis: md.axis,
		points: Array.from(stops).sort(byX).map(scaleDown),
	};
}

function scaleUp(x: number) {
	return Math.round(x * SCALAR);
}
function scaleDown(x: [number, MultiLinearStop]): [number, MultiLinearStop] {
	return [x[0] / SCALAR, x[1]];
}
function byX(a: [number, MultiLinearStop], b: [number, MultiLinearStop]) {
	return a[0] - b[0];
}
