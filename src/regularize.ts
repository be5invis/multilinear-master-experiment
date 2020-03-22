import { MultiLinearMasterDim } from "./interface";
import { evalMultiLinearMasterDim } from "./eval";
import { SCALAR } from "./constants";

export function regularizeMultiLinearMasterDim(md: MultiLinearMasterDim): MultiLinearMasterDim {
	let stops: Map<number, number> = new Map();
	let minX = scaleUp(1),
		minY = 1,
		maxX = scaleUp(-1),
		maxY = 1;
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
	if (minX > scaleUp(-1)) stops.set(scaleUp(-1), minY);
	if (maxX < scaleUp(+1)) stops.set(scaleUp(+1), maxY);

	const axisWithoutZero = {
		axis: md.axis,
		points: Array.from(stops)
			.sort(byX)
			.map(scaleDown)
	};

	stops.set(0, evalMultiLinearMasterDim(axisWithoutZero, 0));
	return {
		axis: md.axis,
		points: Array.from(stops)
			.sort(byX)
			.map(scaleDown)
	};
}

function scaleUp(x: number) {
	return Math.round(x * SCALAR);
}
function scaleDown(x: [number, number]): [number, number] {
	return [x[0] / SCALAR, x[1]];
}
function byX(a: [number, number], b: [number, number]) {
	return a[0] - b[0];
}
