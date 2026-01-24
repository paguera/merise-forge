// Génération de codes de projet avec préfixe Ressou.Merize
const ADJECTIVES = [
  'Alpha', 'Beta', 'Delta', 'Gamma', 'Omega', 'Sigma', 'Zeta', 'Nova',
  'Stellar', 'Cosmic', 'Quantum', 'Prism', 'Nexus', 'Apex', 'Prime', 'Core',
  'Echo', 'Pulse', 'Wave', 'Flux', 'Spark', 'Swift', 'Bright', 'Zen'
];

const NOUNS = [
  'Model', 'Schema', 'Design', 'Plan', 'Data', 'Base', 'Flow', 'Link',
  'Node', 'Graph', 'Tree', 'Map', 'Path', 'Grid', 'Core', 'Hub'
];

function generateRandomSuffix(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 4; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export function generateProjectCode(): string {
  const adjective = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
  const noun = NOUNS[Math.floor(Math.random() * NOUNS.length)];
  const suffix = generateRandomSuffix();
  
  return `Ressou.Merize-${adjective}${noun}-${suffix}`;
}

export function isRessouMerizeCode(code: string): boolean {
  return code.startsWith('Ressou.Merize-');
}
