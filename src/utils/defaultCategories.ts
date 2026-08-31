import { Category } from '../types';

export interface EmojiGroup {
  name: string;
  icon: string;
  emojis: string[];
}

export const EMOJI_GROUPS: EmojiGroup[] = [
  {
    name: 'Essenciais',
    icon: '⭐',
    emojis: ['🍽️', '🛒', '🏠', '🏢', '🚗', '🩺', '💊', '⚡', '🚰', '🌐', '📱', '🎓', '💼', '💰', '💵', '💳', '🔄', '📈', '🤝']
  },
  {
    name: 'Alimentação',
    icon: '🍽️',
    emojis: ['🍽️', '🛒', '🥦', '🥖', '🍕', '☕', '🍔', '🍟', '🍣', '🥩', '🍎', '🍇', '🍺', '🍷', '🍦', '🍰']
  },
  {
    name: 'Casa & Contas',
    icon: '🏠',
    emojis: ['🏠', '🏢', '🏗️', '🔑', '🚪', '⚡', '🚰', '🌐', '📱', '🧹', '🔧', '🛋️', '🧊', '📺', '🛏️', '🚿', '🪴']
  },
  {
    name: 'Transporte',
    icon: '🚗',
    emojis: ['🚗', '⛽', '🚕', '🚌', '🅿️', '🛣️', '🔧', '🛡️', '✈️', '🚲', '🛴', '🛵', '🚆', '🚢', '🚀']
  },
  {
    name: 'Saúde & Esporte',
    icon: '🩺',
    emojis: ['🩺', '💊', '🏥', '🧪', '🦷', '🧴', '🏋️', '⚽', '🥤', '🚴', '🏊', '🧘', '🩹', '💉', '🩻']
  },
  {
    name: 'Lazer & Família',
    icon: '🎮',
    emojis: ['🎮', '👶', '🍼', '🧸', '🎡', '📺', '🎬', '🎉', '✈️', '🏨', '🐶', '🐱', '🙏', '🎁', '🛍️', '💈', '🏖️']
  },
  {
    name: 'Financeiro & Renda',
    icon: '💰',
    emojis: ['💰', '💵', '💳', '📈', '📊', '🏦', '🤝', '🏛️', '🧾', '📄', '🚨', '💸', '💎', '🪙', '💶', '💷']
  }
];

export const DEFAULT_CATEGORIES: Category[] = [
  {
    "id": "cat-desp-alimentacao",
    "name": "Alimentação",
    "icon": "🍽️",
    "color": "#f97316",
    "type": "expense",
    "subcategories": [
      {
        "id": "sub-alim-mercado",
        "name": "Mercado / Supermercado",
        "icon": "🛒",
        "categoryId": "cat-desp-alimentacao"
      },
      {
        "id": "sub-alim-hortifruti",
        "name": "Hortifruti / Feira",
        "icon": "🥦",
        "categoryId": "cat-desp-alimentacao"
      },
      {
        "id": "sub-alim-padaria",
        "name": "Padaria",
        "icon": "🥖",
        "categoryId": "cat-desp-alimentacao"
      },
      {
        "id": "sub-alim-restaurante",
        "name": "Restaurante",
        "icon": "🍽️",
        "categoryId": "cat-desp-alimentacao"
      },
      {
        "id": "sub-alim-delivery",
        "name": "Delivery",
        "icon": "🍕",
        "categoryId": "cat-desp-alimentacao"
      },
      {
        "id": "sub-alim-cafe",
        "name": "Café / Lanches",
        "icon": "☕",
        "categoryId": "cat-desp-alimentacao"
      }
    ]
  },
  {
    "id": "cat-desp-moradia",
    "name": "Moradia",
    "icon": "🏠",
    "color": "#3b82f6",
    "type": "expense",
    "subcategories": [
      {
        "id": "sub-mor-itbi-registro",
        "name": "ITBI & Escritura / Registro",
        "icon": "🏛️",
        "categoryId": "cat-desp-moradia"
      },
      {
        "id": "sub-mor-taxa-obra",
        "name": "Taxa de Evolução de Obra",
        "icon": "📄",
        "categoryId": "cat-desp-moradia"
      },
      {
        "id": "sub-mor-seguro-habitacional",
        "name": "Seguro Habitacional (MIP/DFI)",
        "icon": "🛡️",
        "categoryId": "cat-desp-moradia"
      },
      {
        "id": "sub-mor-parcela-construtora",
        "name": "Parcela da Construtora / Entrada / Balão",
        "icon": "🏗️",
        "categoryId": "cat-desp-moradia"
      },
      {
        "id": "sub-mor-amortizacao-imovel",
        "name": "Amortização do Financiamento",
        "icon": "💸",
        "categoryId": "cat-desp-moradia"
      },
      {
        "id": "sub-mor-financiamento-apto",
        "name": "Financiamento do Apartamento / Imóvel",
        "icon": "🏢",
        "categoryId": "cat-desp-moradia"
      },
      {
        "id": "sub-mor-aluguel",
        "name": "Aluguel",
        "icon": "🏠",
        "categoryId": "cat-desp-moradia"
      },
      {
        "id": "sub-mor-condominio",
        "name": "Condomínio",
        "icon": "🏢",
        "categoryId": "cat-desp-moradia"
      },
      {
        "id": "sub-mor-energia",
        "name": "Energia Elétrica",
        "icon": "⚡",
        "categoryId": "cat-desp-moradia"
      },
      {
        "id": "sub-mor-agua",
        "name": "Água / Esgoto",
        "icon": "🚰",
        "categoryId": "cat-desp-moradia"
      },
      {
        "id": "sub-mor-internet",
        "name": "Internet",
        "icon": "🌐",
        "categoryId": "cat-desp-moradia"
      },
      {
        "id": "sub-mor-telefone",
        "name": "Telefone",
        "icon": "📱",
        "categoryId": "cat-desp-moradia"
      },
      {
        "id": "sub-mor-diarista",
        "name": "Diarista",
        "icon": "🧹",
        "categoryId": "cat-desp-moradia"
      },
      {
        "id": "sub-mor-manutencao",
        "name": "Manutenção da Casa",
        "icon": "🔧",
        "categoryId": "cat-desp-moradia"
      },
      {
        "id": "sub-mor-moveis",
        "name": "Móveis",
        "icon": "🛋️",
        "categoryId": "cat-desp-moradia"
      },
      {
        "id": "sub-mor-eletro",
        "name": "Eletrodomésticos",
        "icon": "🧊",
        "categoryId": "cat-desp-moradia"
      }
    ]
  },
  {
    "id": "cat-desp-transporte",
    "name": "Transporte",
    "icon": "🚗",
    "color": "#8b5cf6",
    "type": "expense",
    "subcategories": [
      {
        "id": "sub-trans-combustivel",
        "name": "Combustível",
        "icon": "⛽",
        "categoryId": "cat-desp-transporte"
      },
      {
        "id": "sub-trans-uber",
        "name": "Uber / 99 / Táxi",
        "icon": "🚕",
        "categoryId": "cat-desp-transporte"
      },
      {
        "id": "sub-trans-publico",
        "name": "Transporte Público",
        "icon": "🚌",
        "categoryId": "cat-desp-transporte"
      },
      {
        "id": "sub-trans-estacionamento",
        "name": "Estacionamento",
        "icon": "🅿️",
        "categoryId": "cat-desp-transporte"
      },
      {
        "id": "sub-trans-pedagio",
        "name": "Pedágio",
        "icon": "🛣️",
        "categoryId": "cat-desp-transporte"
      },
      {
        "id": "sub-trans-manutencao",
        "name": "Manutenção do Veículo",
        "icon": "🔧",
        "categoryId": "cat-desp-transporte"
      },
      {
        "id": "sub-trans-seguro",
        "name": "Seguro",
        "icon": "🛡️",
        "categoryId": "cat-desp-transporte"
      },
      {
        "id": "sub-trans-financiamento",
        "name": "Financiamento do Veículo",
        "icon": "🚗",
        "categoryId": "cat-desp-transporte"
      }
    ]
  },
  {
    "id": "cat-desp-saude",
    "name": "Saúde",
    "icon": "🩺",
    "color": "#ef4444",
    "type": "expense",
    "subcategories": [
      {
        "id": "sub-saude-farmacia",
        "name": "Farmácia / Medicamentos",
        "icon": "💊",
        "categoryId": "cat-desp-saude"
      },
      {
        "id": "sub-saude-plano",
        "name": "Plano de Saúde",
        "icon": "🏥",
        "categoryId": "cat-desp-saude"
      },
      {
        "id": "sub-saude-consultas",
        "name": "Consultas",
        "icon": "🩺",
        "categoryId": "cat-desp-saude"
      },
      {
        "id": "sub-saude-exames",
        "name": "Exames",
        "icon": "🧪",
        "categoryId": "cat-desp-saude"
      },
      {
        "id": "sub-saude-odonto",
        "name": "Odontologia",
        "icon": "🦷",
        "categoryId": "cat-desp-saude"
      },
      {
        "id": "sub-saude-higiene",
        "name": "Higiene / Cuidados Pessoais",
        "icon": "🧴",
        "categoryId": "cat-desp-saude"
      }
    ]
  },
  {
    "id": "cat-desp-academia-esportes",
    "name": "Academia & Esportes",
    "icon": "🏋️",
    "color": "#10b981",
    "type": "expense",
    "subcategories": [
      {
        "id": "sub-acad-academia",
        "name": "Academia",
        "icon": "🏋️",
        "categoryId": "cat-desp-academia-esportes"
      },
      {
        "id": "sub-acad-esportes",
        "name": "Esportes",
        "icon": "⚽",
        "categoryId": "cat-desp-academia-esportes"
      },
      {
        "id": "sub-acad-suplementos",
        "name": "Suplementos",
        "icon": "🥤",
        "categoryId": "cat-desp-academia-esportes"
      }
    ]
  },
  {
    "id": "cat-desp-filhos",
    "name": "Filhos & Família",
    "icon": "👶",
    "color": "#ec4899",
    "type": "expense",
    "subcategories": [
      {
        "id": "sub-filhos-alimentacao",
        "name": "Alimentação / Fórmulas",
        "icon": "🍼",
        "categoryId": "cat-desp-filhos"
      },
      {
        "id": "sub-filhos-fraldas",
        "name": "Fraldas / Higiene",
        "icon": "🧼",
        "categoryId": "cat-desp-filhos"
      },
      {
        "id": "sub-filhos-saude",
        "name": "Saúde / Pediatra",
        "icon": "🩺",
        "categoryId": "cat-desp-filhos"
      },
      {
        "id": "sub-filhos-roupas",
        "name": "Roupas / Calçados",
        "icon": "👕",
        "categoryId": "cat-desp-filhos"
      },
      {
        "id": "sub-filhos-escola",
        "name": "Educação / Escola",
        "icon": "🎓",
        "categoryId": "cat-desp-filhos"
      },
      {
        "id": "sub-filhos-brinquedos",
        "name": "Brinquedos",
        "icon": "🧸",
        "categoryId": "cat-desp-filhos"
      },
      {
        "id": "sub-filhos-passeios",
        "name": "Passeios / Atividades",
        "icon": "🎡",
        "categoryId": "cat-desp-filhos"
      }
    ]
  },
  {
    "id": "cat-desp-compras-pessoal",
    "name": "Compras & Pessoal",
    "icon": "🛍️",
    "color": "#f43f5e",
    "type": "expense",
    "subcategories": [
      {
        "id": "sub-comp-roupas",
        "name": "Roupas / Calçados",
        "icon": "👕",
        "categoryId": "cat-desp-compras-pessoal"
      },
      {
        "id": "sub-comp-presentes",
        "name": "Presentes",
        "icon": "🎁",
        "categoryId": "cat-desp-compras-pessoal"
      },
      {
        "id": "sub-comp-eletronicos",
        "name": "Eletrônicos",
        "icon": "📺",
        "categoryId": "cat-desp-compras-pessoal"
      },
      {
        "id": "sub-comp-informatica",
        "name": "Informática / Hardware",
        "icon": "💻",
        "categoryId": "cat-desp-compras-pessoal"
      },
      {
        "id": "sub-comp-perifericos",
        "name": "Periféricos",
        "icon": "🔌",
        "categoryId": "cat-desp-compras-pessoal"
      },
      {
        "id": "sub-comp-celular",
        "name": "Celular / Smartphones",
        "icon": "📱",
        "categoryId": "cat-desp-compras-pessoal"
      },
      {
        "id": "sub-comp-plano-cel",
        "name": "Plano de Celular",
        "icon": "📶",
        "categoryId": "cat-desp-compras-pessoal"
      },
      {
        "id": "sub-comp-recarga",
        "name": "Recarga",
        "icon": "🔋",
        "categoryId": "cat-desp-compras-pessoal"
      },
      {
        "id": "sub-comp-higiene",
        "name": "Higiene / Cosméticos",
        "icon": "🧴",
        "categoryId": "cat-desp-compras-pessoal"
      },
      {
        "id": "sub-comp-salao",
        "name": "Salão / Barbearia",
        "icon": "💈",
        "categoryId": "cat-desp-compras-pessoal"
      }
    ]
  },
  {
    "id": "cat-desp-educacao",
    "name": "Educação",
    "icon": "🎓",
    "color": "#06b6d4",
    "type": "expense",
    "subcategories": [
      {
        "id": "sub-educ-escola",
        "name": "Escola / Faculdade",
        "icon": "🏫",
        "categoryId": "cat-desp-educacao"
      },
      {
        "id": "sub-educ-cursos",
        "name": "Cursos / Treinamentos",
        "icon": "💻",
        "categoryId": "cat-desp-educacao"
      },
      {
        "id": "sub-educ-livros",
        "name": "Livros",
        "icon": "📚",
        "categoryId": "cat-desp-educacao"
      },
      {
        "id": "sub-educ-livros-tecnicos",
        "name": "Livros Técnicos / Teologia",
        "icon": "📖",
        "categoryId": "cat-desp-educacao"
      },
      {
        "id": "sub-educ-material",
        "name": "Material Escolar / Papelaria",
        "icon": "✏️",
        "categoryId": "cat-desp-educacao"
      }
    ]
  },
  {
    "id": "cat-desp-lazer",
    "name": "Lazer & Entretenimento",
    "icon": "🎮",
    "color": "#a855f7",
    "type": "expense",
    "subcategories": [
      {
        "id": "sub-lazer-streaming",
        "name": "Streaming / Assinaturas",
        "icon": "📺",
        "categoryId": "cat-desp-lazer"
      },
      {
        "id": "sub-lazer-cinema",
        "name": "Cinema / Shows",
        "icon": "🎬",
        "categoryId": "cat-desp-lazer"
      },
      {
        "id": "sub-lazer-festas",
        "name": "Festas / Eventos",
        "icon": "🎉",
        "categoryId": "cat-desp-lazer"
      },
      {
        "id": "sub-lazer-jogos",
        "name": "Jogos / Hobbies",
        "icon": "🎮",
        "categoryId": "cat-desp-lazer"
      },
      {
        "id": "sub-lazer-viagens",
        "name": "Viagens",
        "icon": "✈️",
        "categoryId": "cat-desp-lazer"
      },
      {
        "id": "sub-lazer-hospedagem",
        "name": "Hospedagem",
        "icon": "🏨",
        "categoryId": "cat-desp-lazer"
      }
    ]
  },
  {
    "id": "cat-desp-pets",
    "name": "Pets",
    "icon": "🐶",
    "color": "#eab308",
    "type": "expense",
    "subcategories": [
      {
        "id": "sub-pets-racao",
        "name": "Ração / Petiscos",
        "icon": "🥩",
        "categoryId": "cat-desp-pets"
      },
      {
        "id": "sub-pets-vet",
        "name": "Veterinário / Vacinas",
        "icon": "🩺",
        "categoryId": "cat-desp-pets"
      },
      {
        "id": "sub-pets-banho",
        "name": "Banho / Tosa",
        "icon": "✂️",
        "categoryId": "cat-desp-pets"
      },
      {
        "id": "sub-pets-acessorios",
        "name": "Acessórios / Brinquedos",
        "icon": "🧸",
        "categoryId": "cat-desp-pets"
      }
    ]
  },
  {
    "id": "cat-desp-igreja-doacoes",
    "name": "Igreja & Doações",
    "icon": "🙏",
    "color": "#eab308",
    "type": "expense",
    "subcategories": [
      {
        "id": "sub-igreja-dizimos",
        "name": "Dízimos",
        "icon": "🙏",
        "categoryId": "cat-desp-igreja-doacoes"
      },
      {
        "id": "sub-igreja-ofertas",
        "name": "Ofertas",
        "icon": "🎁",
        "categoryId": "cat-desp-igreja-doacoes"
      },
      {
        "id": "sub-igreja-missoes",
        "name": "Missões",
        "icon": "🌎",
        "categoryId": "cat-desp-igreja-doacoes"
      },
      {
        "id": "sub-igreja-doacoes",
        "name": "Doações",
        "icon": "❤️",
        "categoryId": "cat-desp-igreja-doacoes"
      }
    ]
  },
  {
    "id": "cat-desp-financeiro",
    "name": "Financeiro",
    "icon": "💳",
    "color": "#64748b",
    "type": "expense",
    "subcategories": [
      {
        "id": "sub-fin-amortizacao-extra",
        "name": "Amortização Extraordinária",
        "icon": "💸",
        "categoryId": "cat-desp-financeiro"
      },
      {
        "id": "sub-fin-financiamento-imob",
        "name": "Financiamento Imobiliário",
        "icon": "🏢",
        "categoryId": "cat-desp-financeiro"
      },
      {
        "id": "sub-fin-juros",
        "name": "Juros",
        "icon": "📈",
        "categoryId": "cat-desp-financeiro"
      },
      {
        "id": "sub-fin-multas",
        "name": "Multas",
        "icon": "⚠️",
        "categoryId": "cat-desp-financeiro"
      },
      {
        "id": "sub-fin-tarifas",
        "name": "Tarifas Bancárias",
        "icon": "🏦",
        "categoryId": "cat-desp-financeiro"
      },
      {
        "id": "sub-fin-juros-cartao",
        "name": "Juros do Cartão",
        "icon": "💳",
        "categoryId": "cat-desp-financeiro"
      },
      {
        "id": "sub-fin-pagamento-dividas",
        "name": "Pagamento de Dívidas",
        "icon": "🤝",
        "categoryId": "cat-desp-financeiro"
      },
      {
        "id": "sub-fin-acordos",
        "name": "Acordos / Renegociações",
        "icon": "🤝",
        "categoryId": "cat-desp-financeiro"
      },
      {
        "id": "sub-fin-encargos",
        "name": "Outros Encargos Financeiros",
        "icon": "📄",
        "categoryId": "cat-desp-financeiro"
      }
    ]
  },
  {
    "id": "cat-desp-impostos",
    "name": "Impostos & Obrigações",
    "icon": "🏛️",
    "color": "#ef4444",
    "type": "expense",
    "subcategories": [
      {
        "id": "sub-imp-iptu",
        "name": "IPTU",
        "icon": "🏠",
        "categoryId": "cat-desp-impostos"
      },
      {
        "id": "sub-imp-ipva",
        "name": "IPVA",
        "icon": "🚗",
        "categoryId": "cat-desp-impostos"
      },
      {
        "id": "sub-imp-ir",
        "name": "Imposto de Renda",
        "icon": "📄",
        "categoryId": "cat-desp-impostos"
      },
      {
        "id": "sub-imp-multas-transito",
        "name": "Multas de Trânsito",
        "icon": "🚨",
        "categoryId": "cat-desp-impostos"
      },
      {
        "id": "sub-imp-taxas",
        "name": "Outros Impostos / Taxas",
        "icon": "🧾",
        "categoryId": "cat-desp-impostos"
      }
    ]
  },
  {
    "id": "cat-rec-trabalho",
    "name": "Trabalho & Renda",
    "icon": "💼",
    "color": "#10b981",
    "type": "income",
    "subcategories": [
      {
        "id": "sub-rec-salario",
        "name": "Salário",
        "icon": "💰",
        "categoryId": "cat-rec-trabalho"
      },
      {
        "id": "sub-rec-adiantamento",
        "name": "Adiantamento",
        "icon": "💵",
        "categoryId": "cat-rec-trabalho"
      },
      {
        "id": "sub-rec-13",
        "name": "13º Salário",
        "icon": "🎄",
        "categoryId": "cat-rec-trabalho"
      },
      {
        "id": "sub-rec-ferias",
        "name": "Férias",
        "icon": "🏖️",
        "categoryId": "cat-rec-trabalho"
      },
      {
        "id": "sub-rec-bonus",
        "name": "Bônus",
        "icon": "🎁",
        "categoryId": "cat-rec-trabalho"
      },
      {
        "id": "sub-rec-freelance",
        "name": "Freelance",
        "icon": "💻",
        "categoryId": "cat-rec-trabalho"
      },
      {
        "id": "sub-rec-servicos",
        "name": "Prestação de Serviços",
        "icon": "🛠️",
        "categoryId": "cat-rec-trabalho"
      },
      {
        "id": "sub-rec-venda-produtos",
        "name": "Venda de Produtos",
        "icon": "📦",
        "categoryId": "cat-rec-trabalho"
      },
      {
        "id": "sub-rec-venda-usados",
        "name": "Venda de Usados",
        "icon": "💵",
        "categoryId": "cat-rec-trabalho"
      }
    ]
  },
  {
    "id": "cat-rec-investimentos",
    "name": "Investimentos & Rendas Passivas",
    "icon": "📈",
    "color": "#06b6d4",
    "type": "income",
    "subcategories": [
      {
        "id": "sub-rec-renda-fixa",
        "name": "Rendimento de Renda Fixa",
        "icon": "💰",
        "categoryId": "cat-rec-investimentos"
      },
      {
        "id": "sub-rec-dividendos",
        "name": "Dividendos / JCP",
        "icon": "📊",
        "categoryId": "cat-rec-investimentos"
      },
      {
        "id": "sub-rec-outros-rendimentos",
        "name": "Outros Rendimentos de Investimentos",
        "icon": "📈",
        "categoryId": "cat-rec-investimentos"
      },
      {
        "id": "sub-rec-aluguel-imoveis",
        "name": "Aluguel de Imóveis",
        "icon": "🏠",
        "categoryId": "cat-rec-investimentos"
      }
    ]
  },
  {
    "id": "cat-rec-beneficios-outras",
    "name": "Benefícios & Outras Receitas",
    "icon": "🎁",
    "color": "#a855f7",
    "type": "income",
    "subcategories": [
      {
        "id": "sub-rec-va-vr",
        "name": "Vale Alimentação / Refeição",
        "icon": "🍽️",
        "categoryId": "cat-rec-beneficios-outras"
      },
      {
        "id": "sub-rec-auxilios",
        "name": "Auxílios / Subsídios",
        "icon": "💶",
        "categoryId": "cat-rec-beneficios-outras"
      },
      {
        "id": "sub-rec-cashback",
        "name": "Cashback",
        "icon": "💸",
        "categoryId": "cat-rec-beneficios-outras"
      },
      {
        "id": "sub-rec-presentes",
        "name": "Presentes",
        "icon": "🎁",
        "categoryId": "cat-rec-beneficios-outras"
      },
      {
        "id": "sub-rec-premios",
        "name": "Prêmios",
        "icon": "🏆",
        "categoryId": "cat-rec-beneficios-outras"
      },
      {
        "id": "sub-rec-reembolsos",
        "name": "Reembolsos",
        "icon": "↩️",
        "categoryId": "cat-rec-beneficios-outras"
      },
      {
        "id": "sub-rec-outras-receitas",
        "name": "Outras Receitas",
        "icon": "💰",
        "categoryId": "cat-rec-beneficios-outras"
      }
    ]
  },
  {
    "id": "cat-mov-transferencias",
    "name": "Transferências",
    "icon": "🔄",
    "color": "#3b82f6",
    "type": "transfer",
    "subcategories": [
      {
        "id": "sub-mov-transf-contas",
        "name": "Transferência entre Contas",
        "icon": "🏦",
        "categoryId": "cat-mov-transferencias"
      },
      {
        "id": "sub-mov-pagamento-cartao",
        "name": "Pagamento de Cartão",
        "icon": "💳",
        "categoryId": "cat-mov-transferencias"
      },
      {
        "id": "sub-mov-transf-poupanca",
        "name": "Transferência para Poupança",
        "icon": "🏦",
        "categoryId": "cat-mov-transferencias"
      }
    ]
  },
  {
    "id": "cat-mov-investimentos",
    "name": "Investimentos / Patrimônio",
    "icon": "📈",
    "color": "#10b981",
    "type": "transfer",
    "subcategories": [
      {
        "id": "sub-mov-aporte-renda-fixa",
        "name": "Aporte em Renda Fixa",
        "icon": "💰",
        "categoryId": "cat-mov-investimentos"
      },
      {
        "id": "sub-mov-aporte-acoes",
        "name": "Aporte em Ações / FIIs",
        "icon": "📊",
        "categoryId": "cat-mov-investimentos"
      },
      {
        "id": "sub-mov-resgate-invest",
        "name": "Resgate de Investimento",
        "icon": "💵",
        "categoryId": "cat-mov-investimentos"
      }
    ]
  },
  {
    "id": "cat-mov-emprestimos",
    "name": "Empréstimos",
    "icon": "🤝",
    "color": "#f59e0b",
    "type": "transfer",
    "subcategories": [
      {
        "id": "sub-mov-emprestimo-recebido",
        "name": "Empréstimo Recebido",
        "icon": "💵",
        "categoryId": "cat-mov-emprestimos"
      },
      {
        "id": "sub-mov-emprestimo-concedido",
        "name": "Empréstimo Concedido",
        "icon": "💸",
        "categoryId": "cat-mov-emprestimos"
      },
      {
        "id": "sub-mov-recebimento-emp",
        "name": "Recebimento de Empréstimo",
        "icon": "↩️",
        "categoryId": "cat-mov-emprestimos"
      },
      {
        "id": "sub-mov-pagamento-emp",
        "name": "Pagamento de Empréstimo",
        "icon": "💳",
        "categoryId": "cat-mov-emprestimos"
      }
    ]
  }
];
