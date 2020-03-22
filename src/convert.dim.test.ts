import test, { ExecutionContext } from "ava";
import {
	convertDim,
	convertMaster,
	evalDimConversionResult,
	evalMasterConversionResult
} from "./convert";
import { evalMultiLinearMaster, evalMultiLinearMasterDim } from "./eval";
import { regularizeMultiLinearMasterDim } from "./regularize";
import { SCALAR } from "./constants";

test("Dim conversion test 1", validateDim([-0.5, 1], [0.5, -1]));
test("Dim conversion test 2", validateDim([-1, 0], [0, 0], [+1, 0]));
test("Dim conversion test 3", validateDim([-2 / 3, 0], [-1 / 3, 1], [1 / 3, -1], [2 / 3, 0]));
test("Dim conversion test 4", validateDim([-2 / 3, -1], [-1 / 3, 1], [1 / 3, -1], [2 / 3, 1]));
test("Dim conversion test 5", validateDim());
test("Dim conversion test 6", validateDim([-1, 0.25]));
test("Dim conversion test 7", validateDim([-1, -1], [0, 0.25], [+1, 0.25]));

function validateDim(...pts: [number, number][]) {
	const mdRaw = { axis: "axis", points: pts };
	const md = regularizeMultiLinearMasterDim(mdRaw);
	const converted = convertDim(mdRaw);
	return (t: ExecutionContext<unknown>) => {
		for (let x = -0x100; x <= 0x100; x++) {
			const yConverted = evalDimConversionResult(converted, x / 0x100);
			const yOriginal = evalMultiLinearMasterDim(md, x / 0x100);
			t.true(Math.abs(yConverted - yOriginal) * SCALAR < 1);
		}
	};
}

test(
	"Master conversion test 1",
	validateMaster(
		[
			[-0.5, 1],
			[0.5, -1]
		],
		[
			[-2 / 3, 0],
			[-1 / 3, 1],
			[1 / 3, -1],
			[2 / 3, 0]
		]
	)
);
test("Master conversion test 2", validateMaster());
test(
	"Master conversion test 3",
	validateMaster(
		[
			[-2 / 3, -1],
			[-1 / 3, 1],
			[1 / 3, -1],
			[2 / 3, 1]
		],
		[
			[-2 / 3, 0],
			[-1 / 3, 1],
			[1 / 3, 0],
			[2 / 3, 1]
		],
		[
			[-1, -1],
			[0, 0.25],
			[+1, 0.25]
		]
	)
);

function validateMaster(...pts: [number, number][][]) {
	const mdRaw = pts.map((x, i) => ({ axis: "axis" + i, points: x }));
	const md = mdRaw.map(regularizeMultiLinearMasterDim);
	const converted = convertMaster(mdRaw);

	return (t: ExecutionContext<unknown>) => {
		for (let m = 0; m < 1000; m++) {
			let instance = new Map<string, number>();
			for (let d = 0; d < mdRaw.length; d++) instance.set("axis" + d, 2 * Math.random() - 1);
			const yConverted = evalMasterConversionResult(converted, instance);
			const yOriginal = evalMultiLinearMaster(md, instance);
			t.true(Math.abs(yConverted - yOriginal) < 1 / 0x10000);
		}
	};
}
