import { Category } from '../types';

export const DEFAULT_CATEGORIES: Category[] = [
  {
    "id": "cat-academia",
    "name": "Academia",
    "icon": "🏋🏻",
    "color": "#10b981",
    "type": "expense",
    "subcategories": [
      {
        "id": "sub-mensalidade-acad",
        "name": "Mensalidade",
        "icon": "🏋🏻",
        "categoryId": "cat-academia"
      },
      {
        "id": "sub-suplementos",
        "name": "Suplementos",
        "icon": "🥛",
        "categoryId": "cat-academia"
      }
    ]
  },
  {
    "id": "cat-agua",
    "name": "Água",
    "icon": "🚰",
    "color": "#06b6d4",
    "type": "expense",
    "subcategories": []
  },
  {
    "id": "cat-alimentacao",
    "name": "Alimentação",
    "icon": "🍽️",
    "color": "#f97316",
    "type": "expense",
    "subcategories": [
      {
        "id": "sub-mercado-alim",
        "name": "Supermercado",
        "icon": "🛒",
        "categoryId": "cat-alimentacao"
      },
      {
        "id": "sub-restaurante",
        "name": "Restaurante / Almoço",
        "icon": "🍽️",
        "categoryId": "cat-alimentacao"
      },
      {
        "id": "sub-lanches",
        "name": "Café / Lanches",
        "icon": "☕",
        "categoryId": "cat-alimentacao"
      }
    ]
  },
  {
    "id": "cat-aluguel-d",
    "name": "Aluguel (D)",
    "icon": "🏠",
    "color": "#3b82f6",
    "type": "expense",
    "subcategories": []
  },
  {
    "id": "cat-assinaturas",
    "name": "Assinaturas",
    "icon": "📝",
    "color": "#8b5cf6",
    "type": "expense",
    "subcategories": [
      {
        "id": "sub-streaming",
        "name": "Netflix / Spotify / Prime",
        "icon": "📺",
        "categoryId": "cat-assinaturas"
      },
      {
        "id": "sub-softwares",
        "name": "Softwares & Apps",
        "icon": "💻",
        "categoryId": "cat-assinaturas"
      }
    ]
  },
  {
    "id": "cat-carro-fin",
    "name": "Carro Fin.",
    "icon": "🚗",
    "color": "#64748b",
    "type": "expense",
    "subcategories": [
      {
        "id": "sub-parcela-carro",
        "name": "Parcela Financiamento",
        "icon": "🚗",
        "categoryId": "cat-carro-fin"
      }
    ]
  },
  {
    "id": "cat-celular",
    "name": "Celular",
    "icon": "📱",
    "color": "#ec4899",
    "type": "expense",
    "subcategories": [
      {
        "id": "sub-plano-controle",
        "name": "Plano Controle / Pós",
        "icon": "📱",
        "categoryId": "cat-celular"
      },
      {
        "id": "sub-recarga",
        "name": "Recarga Pré-pago",
        "icon": "🔋",
        "categoryId": "cat-celular"
      }
    ]
  },
  {
    "id": "cat-compras",
    "name": "Compras",
    "icon": "🛍️",
    "color": "#f43f5e",
    "type": "expense",
    "subcategories": []
  },
  {
    "id": "cat-condominio",
    "name": "Condomínio",
    "icon": "🏙️",
    "color": "#3b82f6",
    "type": "expense",
    "subcategories": []
  },
  {
    "id": "cat-delivery",
    "name": "Delivery",
    "icon": "🍟",
    "color": "#f59e0b",
    "type": "expense",
    "subcategories": [
      {
        "id": "sub-ifood",
        "name": "iFood / Zé Delivery",
        "icon": "🍟",
        "categoryId": "cat-delivery"
      }
    ]
  },
  {
    "id": "cat-diarista",
    "name": "Diarista",
    "icon": "🧹",
    "color": "#14b8a6",
    "type": "expense",
    "subcategories": []
  },
  {
    "id": "cat-divida",
    "name": "Dívida",
    "icon": "🤝🏻",
    "color": "#e11d48",
    "type": "expense",
    "subcategories": [
      {
        "id": "sub-acordo",
        "name": "Acordo / Renegociação",
        "icon": "🤝🏻",
        "categoryId": "cat-divida"
      }
    ]
  },
  {
    "id": "cat-dizimos-ofertas",
    "name": "Dízimos & Ofertas",
    "icon": "⭐",
    "color": "#eab308",
    "type": "expense",
    "subcategories": []
  },
  {
    "id": "cat-educacao",
    "name": "Educação",
    "icon": "📚",
    "color": "#8b5cf6",
    "type": "expense",
    "subcategories": [
      {
        "id": "sub-faculdade",
        "name": "Faculdade / Escola",
        "icon": "🎓",
        "categoryId": "cat-educacao"
      },
      {
        "id": "sub-cursos",
        "name": "Cursos & Treinamentos",
        "icon": "💻",
        "categoryId": "cat-educacao"
      }
    ]
  },
  {
    "id": "cat-eletronicos",
    "name": "Eletrônicos",
    "icon": "🖥️",
    "color": "#6366f1",
    "type": "expense",
    "subcategories": []
  },
  {
    "id": "cat-energia",
    "name": "Energia",
    "icon": "💡",
    "color": "#eab308",
    "type": "expense",
    "subcategories": []
  },
  {
    "id": "cat-farmacia",
    "name": "Farmácia",
    "icon": "💊",
    "color": "#ef4444",
    "type": "expense",
    "subcategories": [
      {
        "id": "sub-remedios",
        "name": "Medicamentos",
        "icon": "💊",
        "categoryId": "cat-farmacia"
      }
    ]
  },
  {
    "id": "cat-fatura-cartao",
    "name": "Fatura do Cartão",
    "icon": "💳",
    "color": "#820ad1",
    "type": "expense",
    "subcategories": []
  },
  {
    "id": "cat-filhos",
    "name": "Filhos",
    "icon": "👶",
    "color": "#ec4899",
    "type": "expense",
    "subcategories": []
  },
  {
    "id": "cat-financiamento",
    "name": "Financiamento",
    "icon": "🪙",
    "color": "#64748b",
    "type": "expense",
    "subcategories": []
  },
  {
    "id": "cat-imposto",
    "name": "Imposto",
    "icon": "🪙",
    "color": "#ef4444",
    "type": "expense",
    "subcategories": [
      {
        "id": "sub-iptu-ipva",
        "name": "IPTU / IPVA / IR",
        "icon": "🪙",
        "categoryId": "cat-imposto"
      }
    ]
  },
  {
    "id": "cat-internet",
    "name": "Internet",
    "icon": "🛜",
    "color": "#0ea5e9",
    "type": "expense",
    "subcategories": []
  },
  {
    "id": "cat-investimento-aporte",
    "name": "Investimento",
    "icon": "📈",
    "color": "#10b981",
    "type": "expense",
    "subcategories": [
      {
        "id": "sub-aporte-cdb",
        "name": "Aporte Renda Fixa",
        "icon": "📈",
        "categoryId": "cat-investimento-aporte"
      },
      {
        "id": "sub-aporte-acoes",
        "name": "Aporte Ações / FIIs",
        "icon": "📈",
        "categoryId": "cat-investimento-aporte"
      }
    ]
  },
  {
    "id": "cat-juros-multas",
    "name": "Juros / Multas / Atrasos",
    "icon": "📈",
    "color": "#f43f5e",
    "type": "expense",
    "subcategories": []
  },
  {
    "id": "cat-lazer",
    "name": "Lazer",
    "icon": "🏖️",
    "color": "#ec4899",
    "type": "expense",
    "subcategories": [
      {
        "id": "sub-viagem",
        "name": "Viagens & Passeios",
        "icon": "✈️",
        "categoryId": "cat-lazer"
      },
      {
        "id": "sub-cinema",
        "name": "Cinema & Shows",
        "icon": "🎟️",
        "categoryId": "cat-lazer"
      }
    ]
  },
  {
    "id": "cat-livros-papelaria",
    "name": "Livros / Papelaria",
    "icon": "📚",
    "color": "#8b5cf6",
    "type": "expense",
    "subcategories": []
  },
  {
    "id": "cat-mercado",
    "name": "Mercado",
    "icon": "🛒",
    "color": "#f97316",
    "type": "expense",
    "subcategories": [
      {
        "id": "sub-compras-mes",
        "name": "Compras do Mês",
        "icon": "🛒",
        "categoryId": "cat-mercado"
      },
      {
        "id": "sub-hortifruti",
        "name": "Hortifruti & Feira",
        "icon": "🥦",
        "categoryId": "cat-mercado"
      }
    ]
  },
  {
    "id": "cat-moveis-eletro",
    "name": "Móveis / Eletrodomésticos",
    "icon": "🛏️",
    "color": "#d97706",
    "type": "expense",
    "subcategories": []
  },
  {
    "id": "cat-necessidades",
    "name": "Necessidades",
    "icon": "📝",
    "color": "#64748b",
    "type": "expense",
    "subcategories": []
  },
  {
    "id": "cat-roupas",
    "name": "Roupas",
    "icon": "👔",
    "color": "#a855f7",
    "type": "expense",
    "subcategories": [
      {
        "id": "sub-vestuario",
        "name": "Vestuário & Calçados",
        "icon": "👔",
        "categoryId": "cat-roupas"
      }
    ]
  },
  {
    "id": "cat-salao-barbearia",
    "name": "Salão / Barbearia",
    "icon": "✨",
    "color": "#ec4899",
    "type": "expense",
    "subcategories": [
      {
        "id": "sub-corte-cabelo",
        "name": "Corte / Estética",
        "icon": "✂️",
        "categoryId": "cat-salao-barbearia"
      }
    ]
  },
  {
    "id": "cat-saude",
    "name": "Saúde",
    "icon": "🏥",
    "color": "#ef4444",
    "type": "expense",
    "subcategories": [
      {
        "id": "sub-consultas",
        "name": "Consultas & Exames",
        "icon": "🩺",
        "categoryId": "cat-saude"
      },
      {
        "id": "sub-plano-saude",
        "name": "Plano de Saúde",
        "icon": "🏥",
        "categoryId": "cat-saude"
      }
    ]
  },
  {
    "id": "cat-transporte",
    "name": "Transporte",
    "icon": "🚌",
    "color": "#3b82f6",
    "type": "expense",
    "subcategories": [
      {
        "id": "sub-combustivel",
        "name": "Combustível",
        "icon": "⛽",
        "categoryId": "cat-transporte"
      },
      {
        "id": "sub-uber",
        "name": "Uber / 99 / Táxi",
        "icon": "🚕",
        "categoryId": "cat-transporte"
      },
      {
        "id": "sub-onibus-metro",
        "name": "Ônibus / Metrô",
        "icon": "🚌",
        "categoryId": "cat-transporte"
      }
    ]
  },
  {
    "id": "cat-aluguel-r",
    "name": "Aluguel (R)",
    "icon": "🏠",
    "color": "#10b981",
    "type": "income",
    "subcategories": []
  },
  {
    "id": "cat-beneficios-ajuda",
    "name": "Benefícios / Ajuda",
    "icon": "💶",
    "color": "#10b981",
    "type": "income",
    "subcategories": [
      {
        "id": "sub-va-vr",
        "name": "Vale Alimentação / Refeição",
        "icon": "🍽️",
        "categoryId": "cat-beneficios-ajuda"
      },
      {
        "id": "sub-auxilio",
        "name": "Auxílios / Subsídios",
        "icon": "💶",
        "categoryId": "cat-beneficios-ajuda"
      }
    ]
  },
  {
    "id": "cat-emprestimo-r",
    "name": "Empréstimo",
    "icon": "📝",
    "color": "#3b82f6",
    "type": "income",
    "subcategories": []
  },
  {
    "id": "cat-investimentos-rend",
    "name": "Investimentos",
    "icon": "📈",
    "color": "#10b981",
    "type": "income",
    "subcategories": [
      {
        "id": "sub-dividendos",
        "name": "Dividendos / JCP",
        "icon": "📈",
        "categoryId": "cat-investimentos-rend"
      },
      {
        "id": "sub-rendimentos-cdb",
        "name": "Rendimento CDB / Tesouro",
        "icon": "📈",
        "categoryId": "cat-investimentos-rend"
      }
    ]
  },
  {
    "id": "cat-recompensas",
    "name": "Recompensas",
    "icon": "💷",
    "color": "#f59e0b",
    "type": "income",
    "subcategories": [
      {
        "id": "sub-cashback",
        "name": "Cashback & Pontos",
        "icon": "💷",
        "categoryId": "cat-recompensas"
      }
    ]
  },
  {
    "id": "cat-renda-extra",
    "name": "Renda Extra",
    "icon": "💰",
    "color": "#10b981",
    "type": "income",
    "subcategories": [
      {
        "id": "sub-freelance",
        "name": "Freelance / Bicos",
        "icon": "💰",
        "categoryId": "cat-renda-extra"
      },
      {
        "id": "sub-consultoria",
        "name": "Consultoria / Serviços",
        "icon": "💼",
        "categoryId": "cat-renda-extra"
      }
    ]
  },
  {
    "id": "cat-salario",
    "name": "Salário",
    "icon": "💸",
    "color": "#10b981",
    "type": "income",
    "subcategories": [
      {
        "id": "sub-salario-mensal",
        "name": "Salário Mensal",
        "icon": "💸",
        "categoryId": "cat-salario"
      },
      {
        "id": "sub-adiantamento",
        "name": "Adiantamento / 13º",
        "icon": "💸",
        "categoryId": "cat-salario"
      },
      {
        "id": "sub-bonus",
        "name": "Bônus / PLR",
        "icon": "🎁",
        "categoryId": "cat-salario"
      }
    ]
  },
  {
    "id": "cat-vendas",
    "name": "Vendas",
    "icon": "💵",
    "color": "#10b981",
    "type": "income",
    "subcategories": [
      {
        "id": "sub-produtos-venda",
        "name": "Venda de Produtos / Usados",
        "icon": "💵",
        "categoryId": "cat-vendas"
      }
    ]
  }
];


export interface EmojiGroup {
  name: string;
  icon: string;
  emojis: string[];
}

export const EMOJI_GROUPS: EmojiGroup[] = [
  {
    name: 'Essenciais',
    icon: '⭐',
    emojis: ['🏋🏻', '🚰', '🍽️', '🏠', '📝', '💶', '🚗', '📱', '🛍️', '🏙️', '🍟', '🧹', '🤝🏻', '⭐', '📚', '🖥️', '💡', '💊', '💳', '👶', '🪙', '🛜', '📈', '🏖️', '🛒', '🛏️', '💷', '💰', '👔', '✨', '💸', '🏥', '🚌', '💵']
  },
  {
    name: 'Finanças & Dinheiro',
    icon: '💰',
    emojis: ['💰', '💸', '💵', '💳', '🪙', '💶', '💷', '📈', '📉', '🏦', '💎', '🧾', '🏷️', '🏧', '🤝🏻']
  },
  {
    name: 'Alimentação & Bebidas',
    icon: '🍽️',
    emojis: ['🍽️', '🛒', '🍟', '🍕', '🍔', '☕', '🥖', '🥦', '🍎', '🥩', '🍣', '🍫', '🍺', '🍷', '🧃']
  },
  {
    name: 'Casa & Moradia',
    icon: '🏠',
    emojis: ['🏠', '🏙️', '🏢', '🛏️', '🚰', '💡', '🧹', '🛠️', '🛋️', '🚪', '🪴', '🧺', '🚿']
  },
  {
    name: 'Transporte & Veículos',
    icon: '🚗',
    emojis: ['🚗', '🚌', '🚕', '⛽', '🅿️', '🔧', '🚲', '🛵', '✈️', '🚆', '🚢', '🚀']
  },
  {
    name: 'Tecnologia & Comunicação',
    icon: '📱',
    emojis: ['📱', '🖥️', '🛜', '💻', '📺', '🎧', '📷', '⌚', '🎮', '🔋', '📡']
  },
  {
    name: 'Saúde & Bem-Estar',
    icon: '🏥',
    emojis: ['🏥', '💊', '🏋🏻', '🩺', '💉', '🦷', '🧘', '🧴', '🩹', '🌡️', '✨']
  },
  {
    name: 'Educação & Trabalho',
    icon: '📚',
    emojis: ['📚', '🎓', '📝', '💼', '🏫', '🔬', '🎨', '📐', '📎', '📊']
  },
  {
    name: 'Lazer & Família',
    icon: '🏖️',
    emojis: ['🏖️', '👶', '🐶', '🐱', '🎟️', '✈️', '🎪', '⚽', '🎸', '🎁', '🛍️', '👔']
  }
];
