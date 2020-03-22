import test from "ava";
import { MultiLinearMasterDim } from "./interface";
import { regularizeMultiLinearMasterDim } from "./regularize";

test("Regularize -- smoke test", t => {
	const a: MultiLinearMasterDim = {
		axis: "weight",
		points: [
			[-1, 0],
			[0, 0],
			[+1, 0]
		]
	};
	t.deepEqual(regularizeMultiLinearMasterDim(a), a);
});

test("Regularize -- range test", t => {
	const a: MultiLinearMasterDim = {
		axis: "weight",
		points: [
			[-0.5, 1],
			[0.5, -1]
		]
	};
	const a2: MultiLinearMasterDim = {
		axis: "weight",
		points: [
			[-1, 1],
			[-0.5, 1],
			[0, 0],
			[+0.5, -1],
			[+1, -1]
		]
	};
	t.deepEqual(regularizeMultiLinearMasterDim(a), a2);
});

test("Regularize -- empty test", t => {
	const a: MultiLinearMasterDim = {
		axis: "weight",
		points: []
	};
	const a2: MultiLinearMasterDim = {
		axis: "weight",
		points: [
			[-1, 1],
			[0, 1],
			[+1, 1]
		]
	};
	t.deepEqual(regularizeMultiLinearMasterDim(a), a2);
});

test("Regularize -- single point test", t => {
	const a: MultiLinearMasterDim = {
		axis: "weight",
		points: [[-1, 0.25]]
	};
	const a2: MultiLinearMasterDim = {
		axis: "weight",
		points: [
			[-1, 0.25],
			[0, 0.25],
			[+1, 0.25]
		]
	};
	t.deepEqual(regularizeMultiLinearMasterDim(a), a2);
});
