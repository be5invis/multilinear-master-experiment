import {
	OtMasterDim,
	Instance,
	OtMaster,
	MultiLinearMasterDim,
	MultiLinearMaster,
} from "./interface";

export function evalOtMaster(mx: OtMaster, instance: Instance) {
	let scalar = 1;
	for (const md of mx) {
		const x = instance.get(md.axis) || 0;
		scalar *= evalOtMasterDim(md, x);
	}
	return scalar;
}

export function evalOtMasterDim(md: OtMasterDim, x: number) {
	if (isInvalidDim(md)) return 1;
	else if (md.peak === 0) return 1;
	else if (x < md.min || x > md.max) return 0;
	else if (x === md.peak) return 1;
	else if (x < md.peak) {
		return (x - md.min) / (md.peak - md.min);
	} else {
		return (md.max - x) / (md.max - md.peak);
	}
}

function isInvalidDim(ar: OtMasterDim) {
	return ar.min > ar.peak || ar.peak > ar.max || (ar.min < 0 && ar.max > 0 && ar.peak !== 0);
}

export function evalMultiLinearMasterDim(md: MultiLinearMasterDim, x: number): number {
	if (!md.points.length) return 1;
	if (x <= md.points[0][0]) return md.points[0][1].left;
	if (x >= md.points[md.points.length - 1][0]) return md.points[md.points.length - 1][1].right;
	for (let k = 1; k < md.points.length; k++) {
		const xs = md.points[k - 1][0],
			ys = md.points[k - 1][1];
		const xf = md.points[k][0],
			yf = md.points[k][1];
		if (x === xs) return ys.at;
		if (x === xf) return yf.at;
		if (x > xs && x < xf) return ys.right + ((yf.left - ys.right) * (x - xs)) / (xf - xs);
	}
	return 1;
}

export function evalMultiLinearMaster(mx: MultiLinearMaster, instance: Instance) {
	let scalar = 1;
	for (const md of mx) {
		const x = instance.get(md.axis) || 0;
		scalar *= evalMultiLinearMasterDim(md, x);
	}
	return scalar;
}
