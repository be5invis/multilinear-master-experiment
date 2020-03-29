import test, { ExecutionContext } from "ava";
import { noticeable } from "./constants";
import {
	convertDim,
	convertMaster,
	evalDimConversionResult,
	evalMasterConversionResult,
} from "./convert";
import { evalMultiLinearMaster, evalMultiLinearMasterDim } from "./eval";
import { MultiLinearStop } from "./interface";
import { regularizeMultiLinearMasterDim } from "./regularize";

const C = (x: number): MultiLinearStop => ({ left: x, right: x, at: x });
const L = (x: number, y: number): MultiLinearStop => ({ left: x, right: y, at: x });
const R = (x: number, y: number): MultiLinearStop => ({ left: x, right: y, at: y });
const D = (x: number, y: number, z: number): MultiLinearStop => ({ left: x, at: y, right: z });

test("Dim conversion test 1", validateDim([-0.5, C(1)], [0.5, C(-1)]));
test("Dim conversion test 2", validateDim([-1, C(0)], [0, C(0)], [+1, C(0)]));
test(
	"Dim conversion test 3",
	validateDim([-2 / 4, C(-1)], [-1 / 4, D(1, 0, -1)], [1 / 8, D(-1, 0.25, 1)], [5 / 8, C(1)])
);
test(
	"Dim conversion test 4",
	validateDim([-2 / 4, C(0)], [-1 / 4, R(0, -1)], [1 / 8, L(-1, 0)], [5 / 8, C(1)])
);
test("Dim conversion test 5", validateDim());
test("Dim conversion test 6", validateDim([-1, C(0.25)]));
test(
	"Dim conversion test 7",
	validateDim([-1, C(-1)], [-0.5, R(-0.25, 1)], [+0.5, L(-0.25, 1)], [+1, C(0.25)])
);
test(
	"Dim conversion test 8",
	validateDim([-1, C(-1)], [0, D(-0.25, 0, 0.25)], [+0.5, L(-0.25, 1)], [+1, C(0.25)])
);

function validateDim(...pts: [number, MultiLinearStop][]) {
	const mdRaw = { axis: "axis", points: pts };
	const md = regularizeMultiLinearMasterDim(mdRaw);
	const converted = convertDim(mdRaw);
	return (t: ExecutionContext<unknown>) => {
		for (let x = -6 * 64; x <= 6 * 64; x++) {
			const xt = x / (6 * 64);
			const yConverted = evalDimConversionResult(converted, xt);
			const yOriginal = evalMultiLinearMasterDim(md, xt);
			t.false(
				noticeable(yConverted - yOriginal),
				`Noticeable difference at ${xt}: Original ${yOriginal} Converted ${yConverted}`
			);
		}
	};
}

test(
	"Master conversion test 1",
	validateMaster(
		[
			[-0.5, C(1)],
			[0.5, C(-1)],
		],
		[
			[-2 / 3, C(0)],
			[-1 / 3, C(1)],
			[1 / 3, C(-1)],
			[2 / 3, C(0)],
		]
	)
);
test("Master conversion test 2", validateMaster());
test(
	"Master conversion test 3",
	validateMaster(
		[
			[-2 / 3, C(-1)],
			[-1 / 3, L(1, -1)],
			[1 / 3, R(-1, 1)],
			[2 / 3, C(1)],
		],
		[
			[-2 / 3, C(0)],
			[-1 / 3, D(0, 1, -1)],
			[1 / 3, D(-1, 1, 0)],
			[2 / 3, C(1)],
		],
		[
			[-1, C(-1)],
			[0, D(-1, 0, 1)],
			[+1, C(0.25)],
		]
	)
);

function validateMaster(...pts: [number, MultiLinearStop][][]) {
	const mdRaw = pts.map((x, i) => ({ axis: "axis" + i, points: x }));
	const md = mdRaw.map(regularizeMultiLinearMasterDim);
	const converted = convertMaster(mdRaw);

	return (t: ExecutionContext<unknown>) => {
		for (let m = 0; m < 1000; m++) {
			let instance = new Map<string, number>();
			for (let d = 0; d < mdRaw.length; d++)
				instance.set("axis" + d, Math.round(0x4000 * (2 * Math.random() - 1)) / 0x4000);
			const yConverted = evalMasterConversionResult(converted, instance);
			const yOriginal = evalMultiLinearMaster(md, instance);
			t.false(noticeable(Math.abs(yConverted - yOriginal)));
		}
	};
}
