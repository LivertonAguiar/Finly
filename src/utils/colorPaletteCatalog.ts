/**
 * Finly System Color Catalog
 * Catálogo centralizado com todas as cores individuais organizadas por famílias cromáticas profissionais.
 * Cores 100% autônomas, eliminando qualquer amarração a pacotes ou fotos conjuntas.
 */

export type ColorFamily =
  | 'Verdes & Menta'
  | 'Azuis & Celestes'
  | 'Roxos & Lavanda'
  | 'Dourados & Âmbar'
  | 'Corais & Rosas'
  | 'Neutros & Grafites';

export interface SystemColor {
  hex: string;
  name: string;
  group: ColorFamily;
}

export const SYSTEM_COLORS: SystemColor[] = [
  // 1. Verdes & Menta (10)
  { hex: '#00FF88', name: 'Verde Tech Neon', group: 'Verdes & Menta' },
  { hex: '#10B981', name: 'Menta Esmeralda', group: 'Verdes & Menta' },
  { hex: '#00A884', name: 'Verde Esmeralda', group: 'Verdes & Menta' },
  { hex: '#8CA98C', name: 'Sálvia Suave', group: 'Verdes & Menta' },
  { hex: '#3E5A3F', name: 'Verde Floresta', group: 'Verdes & Menta' },
  { hex: '#6B7F67', name: 'Oliva Caqui', group: 'Verdes & Menta' },
  { hex: '#1E3A2E', name: 'Pinho Nórdico', group: 'Verdes & Menta' },
  { hex: '#1F2A1F', name: 'Pinho Escuro', group: 'Verdes & Menta' },
  { hex: '#0F1F17', name: 'Preto Esmeralda', group: 'Verdes & Menta' },
  { hex: '#0B0F0D', name: 'Preto Musgo', group: 'Verdes & Menta' },

  // 2. Azuis & Celestes (11)
  { hex: '#06B6D4', name: 'Ciano Neon', group: 'Azuis & Celestes' },
  { hex: '#0091FF', name: 'Azul Elétrico', group: 'Azuis & Celestes' },
  { hex: '#4F55F1', name: 'Azul Revolut', group: 'Azuis & Celestes' },
  { hex: '#5E6AD2', name: 'Índigo Linear', group: 'Azuis & Celestes' },
  { hex: '#5BC0DE', name: 'Azul Celeste', group: 'Azuis & Celestes' },
  { hex: '#7FB3B8', name: 'Aqua Oceano', group: 'Azuis & Celestes' },
  { hex: '#2E6F73', name: 'Oceano Profundo', group: 'Azuis & Celestes' },
  { hex: '#3A506B', name: 'Índigo Aço', group: 'Azuis & Celestes' },
  { hex: '#1C2541', name: 'Azul Meia-Noite', group: 'Azuis & Celestes' },
  { hex: '#0F3D3E', name: 'Teal Noturno', group: 'Azuis & Celestes' },
  { hex: '#0B132B', name: 'Marinho Abissal', group: 'Azuis & Celestes' },

  // 3. Roxos & Lavanda (9)
  { hex: '#7C4DFF', name: 'Púrpura Finly', group: 'Roxos & Lavanda' },
  { hex: '#820AD1', name: 'Ultravioleta VIP', group: 'Roxos & Lavanda' },
  { hex: '#A855F7', name: 'Púrpura Neon', group: 'Roxos & Lavanda' },
  { hex: '#A678B9', name: 'Lavanda Pastel', group: 'Roxos & Lavanda' },
  { hex: '#6A5ACD', name: 'Ardósia Lavanda', group: 'Roxos & Lavanda' },
  { hex: '#7A2E6F', name: 'Magenta Ametista', group: 'Roxos & Lavanda' },
  { hex: '#3B1B4F', name: 'Violeta Imperial', group: 'Roxos & Lavanda' },
  { hex: '#2D2B55', name: 'Violeta Meia-Noite', group: 'Roxos & Lavanda' },
  { hex: '#1A0F2E', name: 'Púrpura Profundo', group: 'Roxos & Lavanda' },

  // 4. Dourados & Âmbar (9)
  { hex: '#D4AF37', name: 'Ouro Champanhe', group: 'Dourados & Âmbar' },
  { hex: '#F4A62A', name: 'Ouro Açafrão', group: 'Dourados & Âmbar' },
  { hex: '#FF8A00', name: 'Âmbar Sleek', group: 'Dourados & Âmbar' },
  { hex: '#D97706', name: 'Âmbar Solar', group: 'Dourados & Âmbar' },
  { hex: '#C6601F', name: 'Âmbar Terracota', group: 'Dourados & Âmbar' },
  { hex: '#B08D57', name: 'Ocre Dourado', group: 'Dourados & Âmbar' },
  { hex: '#A88462', name: 'Caramelo Avelã', group: 'Dourados & Âmbar' },
  { hex: '#6B4A2E', name: 'Castanho Quente', group: 'Dourados & Âmbar' },
  { hex: '#3A2418', name: 'Mocha Expresso', group: 'Dourados & Âmbar' },

  // 5. Corais & Rosas (8)
  { hex: '#FF6B6B', name: 'Coral Neon', group: 'Corais & Rosas' },
  { hex: '#FF6363', name: 'Coral Raycast', group: 'Corais & Rosas' },
  { hex: '#EA1D25', name: 'Vermelho Carmim', group: 'Corais & Rosas' },
  { hex: '#EC4899', name: 'Rosa Elétrico', group: 'Corais & Rosas' },
  { hex: '#D6598F', name: 'Rosa Orquídea', group: 'Corais & Rosas' },
  { hex: '#F4D7D4', name: 'Rosa Pálido', group: 'Corais & Rosas' },
  { hex: '#F4D6B0', name: 'Pêssego Suave', group: 'Corais & Rosas' },
  { hex: '#F0D9B5', name: 'Baunilha Suave', group: 'Corais & Rosas' },

  // 6. Neutros & Grafites (12)
  { hex: '#F8FAFC', name: 'Branco Neve', group: 'Neutros & Grafites' },
  { hex: '#F1F5F9', name: 'Branco Gelo', group: 'Neutros & Grafites' },
  { hex: '#EADCC8', name: 'Areia Dourada', group: 'Neutros & Grafites' },
  { hex: '#D9C7A3', name: 'Trigo Suave', group: 'Neutros & Grafites' },
  { hex: '#D5C4AE', name: 'Amêndoa Suave', group: 'Neutros & Grafites' },
  { hex: '#C7CBB8', name: 'Creme Acinzentado', group: 'Neutros & Grafites' },
  { hex: '#64748B', name: 'Cinza Azulado', group: 'Neutros & Grafites' },
  { hex: '#4A4A46', name: 'Ardósia Quente', group: 'Neutros & Grafites' },
  { hex: '#334155', name: 'Azul Petróleo', group: 'Neutros & Grafites' },
  { hex: '#1F2937', name: 'Cinza Carvão', group: 'Neutros & Grafites' },
  { hex: '#1A1A1F', name: 'Grafite Noturno', group: 'Neutros & Grafites' },
  { hex: '#121212', name: 'Preto Grafite', group: 'Neutros & Grafites' },
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
 * Determina se a cor é clara
 */
export const isLightColor = (hex: string): boolean => {
  return getContrastColor(hex) === '#000000';
};

/**
 * Determina se a cor é muito escura
 */
export const isDarkColor = (hex: string): boolean => {
  if (!hex) return true;
  const clean = hex.replace('#', '');
  const r = parseInt(clean.substring(0, 2) || '0', 16);
  const g = parseInt(clean.substring(2, 4) || '0', 16);
  const b = parseInt(clean.substring(4, 6) || '0', 16);
  const yiq = (r * 299 + g * 587 + b * 114) / 1000;
  return yiq < 40;
};
