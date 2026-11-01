/**
 * Finly System Color Catalog
 * Catálogo centralizado com todas as cores individuais extraídas das paletas designer.
 */

export interface SystemColor {
  hex: string;
  name: string;
  group: 'Teal & Terracota' | 'Forest & Ocre' | 'Nordic Spruce' | 'Mocha & Caramelo' | 'Midnight & Solar' | 'Amethyst & Coral' | 'Nightshade & Saffron' | 'Cyber Slate & Pink' | 'Clássicos Finly';
}

export const SYSTEM_COLORS: SystemColor[] = [
  // 1. Paleta Teal & Terracota
  { hex: '#C6601F', name: 'Âmbar Terracota', group: 'Teal & Terracota' },
  { hex: '#7FB3B8', name: 'Aqua Oceano', group: 'Teal & Terracota' },
  { hex: '#2E6F73', name: 'Oceano Profundo', group: 'Teal & Terracota' },
  { hex: '#0F3D3E', name: 'Teal Noturno', group: 'Teal & Terracota' },
  { hex: '#0A0F14', name: 'Preto Abissal', group: 'Teal & Terracota' },
  { hex: '#EADCC8', name: 'Areia Dourada', group: 'Teal & Terracota' },

  // 2. Paleta Forest & Ocre
  { hex: '#B08D57', name: 'Ocre Dourado', group: 'Forest & Ocre' },
  { hex: '#8CA98C', name: 'Sálvia Suave', group: 'Forest & Ocre' },
  { hex: '#3E5A3F', name: 'Verde Floresta', group: 'Forest & Ocre' },
  { hex: '#1F2A1F', name: 'Pinho Escuro', group: 'Forest & Ocre' },
  { hex: '#0B0F0D', name: 'Preto Musgo', group: 'Forest & Ocre' },
  { hex: '#D9C7A3', name: 'Trigo Suave', group: 'Forest & Ocre' },

  // 3. Paleta Nordic Spruce & Olive
  { hex: '#6B7F67', name: 'Oliva Caqui', group: 'Nordic Spruce' },
  { hex: '#1E3A2E', name: 'Pinho Nórdico', group: 'Nordic Spruce' },
  { hex: '#0F1F17', name: 'Preto Esmeralda', group: 'Nordic Spruce' },
  { hex: '#C7CBB8', name: 'Creme Acinzentado', group: 'Nordic Spruce' },
  { hex: '#3D4337', name: 'Oliva Carvão', group: 'Nordic Spruce' },

  // 4. Paleta Mocha & Caramelo
  { hex: '#A88462', name: 'Caramelo Avelã', group: 'Mocha & Caramelo' },
  { hex: '#6B4A2E', name: 'Castanho Quente', group: 'Mocha & Caramelo' },
  { hex: '#3A2418', name: 'Mocha Expresso', group: 'Mocha & Caramelo' },
  { hex: '#1A120E', name: 'Café Profundo', group: 'Mocha & Caramelo' },
  { hex: '#D5C4AE', name: 'Amêndoa Suave', group: 'Mocha & Caramelo' },
  { hex: '#4A4A46', name: 'Ardósia Quente', group: 'Mocha & Caramelo' },

  // 5. Paleta Midnight & Solar
  { hex: '#D97706', name: 'Âmbar Solar', group: 'Midnight & Solar' },
  { hex: '#5BC0DE', name: 'Azul Celeste', group: 'Midnight & Solar' },
  { hex: '#3A506B', name: 'Índigo Aço', group: 'Midnight & Solar' },
  { hex: '#1C2541', name: 'Azul Meia-Noite', group: 'Midnight & Solar' },
  { hex: '#0B132B', name: 'Marinho Abissal', group: 'Midnight & Solar' },
  { hex: '#F4D6B0', name: 'Pêssego Suave', group: 'Midnight & Solar' },

  // 6. Paleta Amethyst & Coral
  { hex: '#FF6B6B', name: 'Coral Neon', group: 'Amethyst & Coral' },
  { hex: '#D6598F', name: 'Rosa Orquídea', group: 'Amethyst & Coral' },
  { hex: '#7A2E6F', name: 'Magenta Ametista', group: 'Amethyst & Coral' },
  { hex: '#3B1B4F', name: 'Violeta Imperial', group: 'Amethyst & Coral' },
  { hex: '#1A0F2E', name: 'Púrpura Profundo', group: 'Amethyst & Coral' },
  { hex: '#F4D7D4', name: 'Rosa Pálido', group: 'Amethyst & Coral' },

  // 7. Paleta Nightshade & Saffron
  { hex: '#F4A62A', name: 'Ouro Açafrão', group: 'Nightshade & Saffron' },
  { hex: '#A678B9', name: 'Lavanda Pastel', group: 'Nightshade & Saffron' },
  { hex: '#6A5ACD', name: 'Ardósia Lavanda', group: 'Nightshade & Saffron' },
  { hex: '#2D2B55', name: 'Violeta Meia-Noite', group: 'Nightshade & Saffron' },
  { hex: '#1A1A1F', name: 'Grafite Noturno', group: 'Nightshade & Saffron' },
  { hex: '#F0D9B5', name: 'Baunilha Suave', group: 'Nightshade & Saffron' },

  // 8. Paleta Cyber Slate & Pink
  { hex: '#EC4899', name: 'Rosa Elétrico', group: 'Cyber Slate & Pink' },
  { hex: '#64748B', name: 'Cinza Azulado', group: 'Cyber Slate & Pink' },
  { hex: '#334155', name: 'Azul Petróleo', group: 'Cyber Slate & Pink' },
  { hex: '#1F2937', name: 'Cinza Carvão', group: 'Cyber Slate & Pink' },
  { hex: '#121212', name: 'Preto Grafite', group: 'Cyber Slate & Pink' },
  { hex: '#F1F5F9', name: 'Branco Gelo', group: 'Cyber Slate & Pink' },

  // 9. Clássicos Finly
  { hex: '#7C4DFF', name: 'Púrpura Finly', group: 'Clássicos Finly' },
  { hex: '#06B6D4', name: 'Ciano Neon', group: 'Clássicos Finly' },
  { hex: '#00FF88', name: 'Verde Tech', group: 'Clássicos Finly' },
  { hex: '#00A884', name: 'Verde Esmeralda', group: 'Clássicos Finly' },
  { hex: '#0091FF', name: 'Azul Elétrico', group: 'Clássicos Finly' },
  { hex: '#D4AF37', name: 'Ouro Champanhe', group: 'Clássicos Finly' },
  { hex: '#FF8A00', name: 'Âmbar Sleek', group: 'Clássicos Finly' },
  { hex: '#EA1D25', name: 'Vermelho Carmim', group: 'Clássicos Finly' },
];

/**
 * Retorna o contraste ideal de texto (#FFFFFF ou #000000)
 */
export const getContrastColor = (hex: string): '#FFFFFF' | '#000000' => {
  if (!hex) return '#FFFFFF';
  const clean = hex.replace('#', '');
  const r = parseInt(clean.substring(0, 2) || '0', 16);
  const g = parseInt(clean.substring(2, 4) || '0', 16);
  const b = parseInt(clean.substring(4, 6) || '0', 16);
  const yiq = (r * 299 + g * 587 + b * 114) / 1000;
  return yiq >= 170 ? '#000000' : '#FFFFFF';
};

/**
 * Retorna se a cor é muito clara (necessita de borda protetora em fundos claros)
 */
export const isLightColor = (hex: string): boolean => {
  if (!hex) return false;
  const clean = hex.replace('#', '');
  const r = parseInt(clean.substring(0, 2) || '0', 16);
  const g = parseInt(clean.substring(2, 4) || '0', 16);
  const b = parseInt(clean.substring(4, 6) || '0', 16);
  const yiq = (r * 299 + g * 587 + b * 114) / 1000;
  return yiq >= 170;
};

/**
 * Retorna se a cor é muito escura (necessita de anel de contraste em fundos escuros)
 */
export const isDarkColor = (hex: string): boolean => {
  if (!hex) return false;
  const clean = hex.replace('#', '');
  const r = parseInt(clean.substring(0, 2) || '0', 16);
  const g = parseInt(clean.substring(2, 4) || '0', 16);
  const b = parseInt(clean.substring(4, 6) || '0', 16);
  const yiq = (r * 299 + g * 587 + b * 114) / 1000;
  return yiq < 45;
};
