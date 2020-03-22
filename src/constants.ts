export const SCALAR = 0x1000000;
export function noticeable(x: number) {
	const scaled = x * SCALAR;
	return scaled >= 1 || scaled <= -1;
}
export function normalize(x: number) {
	return Math.round(x * SCALAR) / SCALAR;
}
