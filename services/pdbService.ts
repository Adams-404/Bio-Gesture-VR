import { Atom, MoleculeData } from '../types';

export const fetchPDB = async (pdbId: string): Promise<MoleculeData> => {
  const response = await fetch(`https://files.rcsb.org/download/${pdbId.toUpperCase()}.pdb`);
  if (!response.ok) {
    throw new Error(`Failed to fetch PDB: ${pdbId}`);
  }
  const text = await response.text();
  return parsePDB(text);
};

const parsePDB = (text: string): MoleculeData => {
  const lines = text.split('\n');
  const atoms: Atom[] = [];
  let xSum = 0, ySum = 0, zSum = 0;

  for (const line of lines) {
    if (line.startsWith('ATOM') || line.startsWith('HETATM')) {
      // PDB Fixed Width Format
      // 31-38 X, 39-46 Y, 47-54 Z, 77-78 Element
      const x = parseFloat(line.substring(30, 38));
      const y = parseFloat(line.substring(38, 46));
      const z = parseFloat(line.substring(46, 54));
      
      let element = line.substring(76, 78).trim();
      const atomName = line.substring(12, 16).trim();
      
      // Fallback if element is missing (infer from name)
      if (!element) {
        element = atomName.charAt(0);
      }

      const atom: Atom = {
        id: parseInt(line.substring(6, 11).trim()),
        name: atomName,
        residue: line.substring(17, 20).trim(),
        resSeq: parseInt(line.substring(22, 26).trim()),
        element: element.toUpperCase(),
        x,
        y,
        z,
      };

      atoms.push(atom);
      xSum += x;
      ySum += y;
      zSum += z;
    }
  }

  const center = {
    x: atoms.length > 0 ? xSum / atoms.length : 0,
    y: atoms.length > 0 ? ySum / atoms.length : 0,
    z: atoms.length > 0 ? zSum / atoms.length : 0,
  };

  return { atoms, center };
};
