import { normalize, noticeable } from "./constants";
import { evalMultiLinearMasterDim, evalOtMaster, evalOtMasterDim } from "./eval";
import {
	DimConversionResult,
	Instance,
	MasterConversionResult,
	MultiLinearMaster,
	MultiLinearMasterDim,
	OtMasterDim,
	MultiLinearStop,
	Axis,
} from "./interface";
import { regularizeMultiLinearMasterDim } from "./regularize";

const F2D14Step = 1 / 0x4000;

export function convertDim(mdRaw: MultiLinearMasterDim): DimConversionResult {
	const md = regularizeMultiLinearMasterDim(mdRaw);
	let dims: [number, OtMasterDim][] = [];
	const offset = normalize(evalMultiLinearMasterDim(md, 0));

	// Handle start boundary
	const syNegative = md.points[0][1];
	const yNegative = normalize(syNegative.right - offset);
	const yNegativeAt = normalize(syNegative.right - offset);

	if (yNegative) dims.push([yNegative, { axis: md.axis, min: -1, peak: -1, max: 0 }]);
	if (yNegativeAt !== yNegative) {
		dims.push([yNegativeAt - yNegative, { axis: md.axis, min: -1, peak: -1, max: -1 }]);
	}

	// Handle end boundary
	const syPositive = md.points[md.points.length - 1][1];
	const yPositive = normalize(syPositive.left - offset);
	const yPositiveAt = normalize(syPositive.at - offset);

	if (yPositive) dims.push([yPositive, { axis: md.axis, min: 0, peak: +1, max: +1 }]);
	if (yPositiveAt !== yPositive) {
		dims.push([yPositiveAt - yPositive, { axis: md.axis, min: 1, peak: 1, max: 1 }]);
	}

	for (let t = 1; t + 1 < md.points.length; t++) {
		const x = md.points[t][0],
			xPrev = md.points[t - 1][0],
			xNext = md.points[t + 1][0],
			stop = md.points[t][1];
		if (x <= -1 || x >= 1) continue;
		if (x !== 0 && xPrev < 0 && xNext > 0) throw new Error("Unreachable: span goes across 0");

		if (x) {
			convertNonZeroStop(md.axis, offset, yNegative, yPositive, x, xPrev, xNext, stop, dims);
		} else {
			convertZeroStop(md.axis, offset, yNegative, yPositive, x, xPrev, xNext, stop, dims);
		}
	}

	return { offset, dims };
}

function convertNonZeroStop(
	axis: Axis,
	offset: number,
	yNegative: number,
	yPositive: number,
	x: number,
	xPrev: number,
	xNext: number,
	stop: MultiLinearStop,
	dims: [number, OtMasterDim][]
) {
	const yLeft = normalize(stop.left - offset),
		yAt = normalize(stop.at - offset),
		yRight = normalize(stop.right - offset);
	const yBase = x < 0 ? -yNegative * x : yPositive * x,
		yNonInclusive = yLeft === yAt ? yRight : yLeft;
	let yInclusive = yNonInclusive;

	const overflowNonInclusive = yNonInclusive - yBase;
	if (overflowNonInclusive) {
		dims.push([overflowNonInclusive, { axis, min: xPrev, peak: x, max: xNext }]);
	}
	if (yRight !== yNonInclusive) {
		yInclusive = yRight;
		const overflow = yRight - yNonInclusive;
		if (overflow) dims.push([overflow, { axis, min: x, peak: x, max: xNext }]);
	}
	if (yLeft !== yNonInclusive) {
		yInclusive = yLeft;
		const overflow = yLeft - yNonInclusive;
		if (overflow) dims.push([overflow, { axis, min: xPrev, peak: x, max: x }]);
	}
	if (yAt !== yLeft && yAt !== yRight) {
		const overflow = yAt - yInclusive;
		if (overflow) dims.push([overflow, { axis, min: x, peak: x, max: x }]);
	}
}

function convertZeroStop(
	axis: Axis,
	offset: number,
	yNegative: number,
	yPositive: number,
	x: number,
	xPrev: number,
	xNext: number,
	stop: MultiLinearStop,
	dims: [number, OtMasterDim][]
) {
	const yLeft = normalize(stop.left - offset),
		yAt = normalize(stop.at - offset),
		yRight = normalize(stop.right - offset);

	if (yRight !== yAt) {
		const overflow = ((yRight - yAt) * (xNext - x - F2D14Step)) / (xNext - x);
		if (overflow) {
			dims.push([overflow, { axis, min: F2D14Step, peak: F2D14Step, max: xNext }]);
		}
	}
	if (yLeft !== yAt) {
		const overflow = ((yLeft - yAt) * (x - xPrev - F2D14Step)) / (x - xPrev);
		if (overflow) {
			dims.push([overflow, { axis, min: xPrev, peak: -F2D14Step, max: -F2D14Step }]);
		}
	}
}

export function evalDimConversionResult(dr: DimConversionResult, x: number) {
	let s = dr.offset;
	for (const [scalar, md] of dr.dims) {
		// console.log(scalar, x, md, evalOtMasterDim(md, x));
		s += scalar * evalOtMasterDim(md, x);
	}
	return s;
}

export function convertMaster(m: MultiLinearMaster) {
	const sink: MasterConversionResult = { offset: 0, masters: [] };
	convertMasterImpl(sink, m.map(convertDim), 0, 1, []);
	return sink;
}

function convertMasterImpl(
	sink: MasterConversionResult,
	dims: DimConversionResult[],
	n: number,
	scalar: number,
	carry: (OtMasterDim | null)[]
) {
	if (!noticeable(scalar)) return;
	if (n >= dims.length) {
		const otDims: OtMasterDim[] = [];
		for (const x of carry) if (x) otDims.push(x);
		if (otDims.length) {
			sink.masters.push([scalar, otDims]);
		} else {
			sink.offset += scalar;
		}
	} else {
		const d = dims[n];
		carry[n] = null;
		convertMasterImpl(sink, dims, n + 1, scalar * d.offset, carry);
		for (const [s, md] of d.dims) {
			carry[n] = md;
			convertMasterImpl(sink, dims, n + 1, scalar * s, carry);
		}
	}
}

export function evalMasterConversionResult(dr: MasterConversionResult, instance: Instance) {
	let s = dr.offset;
	for (const [scalar, md] of dr.masters) {
		s += scalar * evalOtMaster(md, instance);
	}
	return s;
}
