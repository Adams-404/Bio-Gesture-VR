// CPK Coloring for common elements
export const ATOM_COLORS: Record<string, string> = {
  H: '#FFFFFF',
  C: '#909090',
  N: '#3050F8',
  O: '#FF0D0D',
  S: '#FFFF30',
  P: '#FFA500',
  F: '#90E050',
  CL: '#1FF01F',
  BR: '#A62929',
  I: '#940094',
  FE: '#E06633',
  CA: '#3DFF00',
  DEFAULT: '#FF69B4',
};

export const ATOM_RADII: Record<string, number> = {
  H: 1.2,
  C: 1.7,
  N: 1.55,
  O: 1.52,
  S: 1.8,
  P: 1.8,
  DEFAULT: 1.5,
};

export const DEFAULT_PDB_ID = '7DHL'; // Spike protein or insulin

export const SCALE_SENSITIVITY = 0.05;
export const ROTATION_SENSITIVITY = 0.02;
