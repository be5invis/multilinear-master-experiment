import { normalize, noticeable } from "./constants";
import { evalMultiLinearMasterDim, evalOtMaster, evalOtMasterDim } from "./eval";
import {
	DimConversionResult,
	Instance,
	MasterConversionResult,
	MultiLinearMaster,
	MultiLinearMasterDim,
	OtMasterDim,
} from "./interface";
import { regularizeMultiLinearMasterDim } from "./regularize";

export function convertDim(mdRaw: MultiLinearMasterDim): DimConversionResult {
	const md = regularizeMultiLinearMasterDim(mdRaw);
	// We assume it is continuous at -1, 0 and +1
	const offset = normalize(evalMultiLinearMasterDim(md, 0));
	const yNegative = normalize(md.points[0][1].right - offset);
	const yPositive = normalize(md.points[md.points.length - 1][1].left - offset);

	let dims: [number, OtMasterDim][] = [];
	if (yNegative) dims.push([yNegative, { axis: md.axis, min: -1, peak: -1, max: 0 }]);
	if (yPositive) dims.push([yPositive, { axis: md.axis, min: 0, peak: +1, max: +1 }]);

	for (let t = 1; t + 1 < md.points.length; t++) {
		const x = md.points[t][0],
			xPrev = md.points[t - 1][0],
			xNext = md.points[t + 1][0];
		if (x <= -1 || x === 0 || x >= 1) continue;
		if (xPrev < 0 && xNext > 0) throw new Error("Unreachable: span goes across 0");

		const stop = md.points[t][1],
			yLeft = stop.left - offset,
			yRight = stop.right - offset;
		const yBase = x < 0 ? -yNegative * x : yPositive * x,
			yNonInclusive = stop.inclusive ? yLeft : yRight;

		const overflowNonInclusive = yNonInclusive - yBase;
		if (overflowNonInclusive) {
			dims.push([overflowNonInclusive, { axis: md.axis, min: xPrev, peak: x, max: xNext }]);
		}
		if (stop.inclusive === 1) {
			const overflow = yRight - yNonInclusive;
			if (overflow) dims.push([overflow, { axis: md.axis, min: x, peak: x, max: xNext }]);
		} else {
			const overflow = yLeft - yNonInclusive;
			if (overflow) dims.push([overflow, { axis: md.axis, min: xPrev, peak: x, max: x }]);
		}
	}

	return { offset, dims };
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
