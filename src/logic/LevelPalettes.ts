// Bright accents inspired by https://coolors.co/palettes/trending/bright.
// Each palette keeps the original color roles and index count, so puzzle logic stays intact.
const palettes: string[][] = [
  [],
  ['#ff17a2', '#00d4ff', '#ffdd00'],
  ['#fff0b8', '#c66b16', '#ff006e', '#ff78ba', '#552052'],
  ['#71355e', '#ff17a2', '#ff9900', '#ff1313', '#ffffff'],
  ['#244ab8', '#00d4ff', '#66edff', '#ffffff', '#ff477e'],
  ['#087d48', '#46f71f', '#ff7b00', '#ff006e', '#a9ff49', '#ffea00'],
  ['#593659', '#ff9500', '#ffe5b5', '#ff17a2', '#fb5607'],
  ['#353e88', '#ffffff', '#2a5efc', '#00d4ff', '#ffbe0b'],
  ['#087d48', '#46f71f', '#00bb4b', '#ceff65', '#ffffff', '#ff477e'],
  ['#2647a2', '#00fac8', '#1462cf', '#839eff', '#83ffe2', '#ff1313', '#ffea00'],
  ['#8900f2', '#ff17a2', '#ffffff', '#00d4ff', '#c66b16', '#ff7eba'],
  ['#f45608', '#ff9500', '#ffdd00', '#fff6c2', '#b95b0b', '#ffd277'],
  ['#142052', '#ff2900', '#fff9e7', '#00d4ff', '#ffdd00', '#ff7b00'],
  ['#142052', '#ff17a2', '#8900f2', '#00f7ff', '#ffea00'],
  ['#b70d35', '#ff1313', '#ff7b43', '#078346', '#46f71f', '#fff6c2'],
  ['#61280b', '#bb5410', '#ff9500', '#ffdd00', '#00d4ff', '#a100f2'],
  ['#ff2900', '#ff9500', '#fff6c2', '#46f71f', '#078346'],
  ['#8900f2', '#00d4ff', '#9fffff', '#ffdd00', '#321153', '#ff17a2'],
  ['#ff7b00', '#ffbe0b', '#fff6c2', '#65250e'],
  ['#76330b', '#c96b13', '#ffb02e', '#ffdf7a', '#fff9eb', '#352018'],
  ['#ff78ba', '#c66b16', '#ffdd00', '#ff174f', '#fff6c2', '#8900f2', '#46d624', '#552052'],
  ['#00d8cb', '#ff7b00', '#4d221b'],
  ['#00d4ff', '#0756a9', '#ffdd00', '#fff6c2', '#46d624'],
  ['#ffdf85', '#bb5410', '#ffdd00', '#46d624', '#ff2900', '#fff6c2'],
  ['#00d4ff', '#652b0b', '#ffdd00', '#ff7b00', '#46d624', '#fff6c2'],
  ['#0596f7', '#076b38', '#46f71f', '#ff174f', '#382030', '#fff6c2'],
  ['#ffdd00', '#172052', '#789de9', '#f3fbff', '#6a00f4', '#00fac8', '#ff17a2'],
  ['#00d4ff', '#ff3131', '#172052', '#0596f7', '#fff6c2', '#839eff'],
  ['#00fac8', '#ff9900', '#b95b0b', '#fff6c2', '#242048', '#ff477e', '#46d624'],
  ['#482283', '#ff7b00', '#db410e', '#ffb700', '#fff58a', '#ffdd00', '#14163b', '#46d624'],
  ['#ffbe0b', '#00d4ff', '#fff6c2', '#172052', '#ff2900', '#ff9661', '#bf6518'],
  ['#00d4ff', '#172052', '#2a5efc', '#fff6c2', '#ff9500', '#ff006e'],
  ['#ffdd00', '#172052', '#00fac8', '#c5ffff', '#ff006e', '#ff9900', '#8900f2'],
  ['#00d4ff', '#172052', '#46d624', '#c7ff34', '#fff6c2', '#c66b16'],
  ['#0596f7', '#172052', '#bd5c16', '#fff6c2', '#20ce69', '#ffbe0b', '#ff477e'],
  ['#8900f2', '#172052', '#46d624', '#ff006e', '#ffbe0b', '#fff6c2', '#e67914'],
  ['#00d4ff', '#172052', '#6a00f4', '#00fac8', '#fff6c2', '#ff7b00'],
];

export function levelPalette(id: number, fallback: string[]): string[] {
  const palette = palettes[id];
  if (palette && palette.length !== fallback.length) throw new Error(`Level ${id} color count changed`);
  return [...(palette ?? fallback)];
}
