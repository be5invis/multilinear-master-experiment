export type Axis = string;
export type Instance = ReadonlyMap<Axis, number>;

export type OtMasterDim = { axis: Axis; min: number; peak: number; max: number };
export type OtMaster = OtMasterDim[];

export type MultiLinearMasterDim = { axis: Axis; points: [number, number][] };
export type MultiLinearMaster = MultiLinearMasterDim[];

export type DimConversionResult = { offset: number; dims: [number, OtMasterDim][] };
export type MasterConversionResult = { offset: number; masters: [number, OtMaster][] };
