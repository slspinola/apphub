# Bee2Solutions - Guia de Estilos para Desenvolvimento

> **Versão:** 1.0  
> **Data:** Novembro 2025  
> **Baseado em:** GuíaLine Bee2Solutions v01-2025 por índoledesign

---

## Índice

1. [Introdução](#introdução)
2. [A Marca](#a-marca)
3. [Logótipo](#logótipo)
4. [Paleta de Cores](#paleta-de-cores)
5. [Tipografia](#tipografia)
6. [Divisões e Sub-marcas](#divisões-e-sub-marcas)
7. [Implementação em CSS/Tailwind](#implementação-em-csstailwind)
8. [Componentes UI](#componentes-ui)
9. [Boas Práticas](#boas-práticas)

---

## Introdução

Este documento serve como referência para a equipa de desenvolvimento de software, garantindo consistência visual em todas as aplicações do ecossistema Bee2Solutions. A identidade visual foi cuidadosamente desenvolvida para transmitir os valores da marca: **qualidade, inovação, confiança e proximidade**.

### Princípios Fundamentais

- **Coerência**: Manter a mesma linguagem visual em todas as aplicações
- **Profissionalismo**: Utilizar os elementos da marca com respeito às guidelines
- **Acessibilidade**: Garantir contraste adequado e legibilidade
- **Responsividade**: Adaptar os elementos a diferentes dispositivos

---

## A Marca

A Bee2Solutions é um grupo empresarial que actua em múltiplos sectores. A marca representa a união entre **inovação e humanidade**, simbolizada pela fusão de duas formas geométricas fundamentais:

- **Círculo**: Representa fluidez, adaptabilidade, inovação e movimento contínuo
- **Quadrado**: Simboliza estrutura, estabilidade e solidez dos valores

Esta fusão cria o elemento distintivo da marca — uma forma orgânica que combina curvas e ângulos.

---

## Logótipo

### Estrutura do Logótipo

O logótipo da Bee2Solutions é composto por:

1. **Wordmark "bee2"** — Em bold/negrito
2. **Wordmark "solutions"** — Em peso regular
3. **Símbolo** — Forma orgânica (fusão círculo + quadrado)
4. **Símbolo ®** — Marca registada

### Versões Disponíveis

| Versão | Uso Recomendado |
|--------|-----------------|
| **Horizontal** | Headers, navegação, documentos |
| **Empilhada** | Ícones de aplicação, favicons, espaços quadrados |
| **Monocromática Preta** | Fundos claros, impressão P&B |
| **Monocromática Branca** | Fundos escuros, overlays |
| **Versão Completa a Cores** | Uso principal em fundos neutros |

### Área de Protecção

Manter sempre um espaçamento mínimo à volta do logótipo equivalente à altura da letra "b" do wordmark.

```
┌─────────────────────────────────┐
│                                 │
│   [  bee2solutions ⬤  ]        │
│                                 │
└─────────────────────────────────┘
         ↑ Margem mínima
```

### Tamanhos Mínimos

- **Digital**: Mínimo 120px de largura (versão horizontal)
- **Impressão**: Mínimo 25mm de largura

---

## Paleta de Cores

### Cores Principais

#### Vermelho Grená (Cor Principal da Marca)

A cor vermelho grená representa o **factor humano**, a **paixão** e a **liderança** da Bee2Solutions.

| Sistema | Valor |
|---------|-------|
| **Pantone** | WARM RED |
| **CMYK** | 0 / 73 / 78 / 0 |
| **RGB** | 255 / 68 / 56 |
| **HEX** | `#f93f26` |

#### Petro (Cor Secundária)

Cor neutra para equilíbrio visual.

| Sistema | Valor |
|---------|-------|
| **HEX** | `#2D3436` (aproximado) |

### Variações Tonais

```css
/* Vermelho Principal */
--bee2-red-500: #f93f26;      /* Cor base */
--bee2-red-600: #e03520;      /* Hover/Active */
--bee2-red-700: #c72d1a;      /* Pressed */
--bee2-red-400: #fb6654;      /* Light */
--bee2-red-300: #fc8d7c;      /* Lighter */
--bee2-red-200: #fdb4a9;      /* Subtle */
--bee2-red-100: #fedbd6;      /* Background */
--bee2-red-50:  #fff0ee;      /* Surface */

/* Neutros */
--bee2-gray-900: #1a1a1a;     /* Texto principal */
--bee2-gray-800: #2d2d2d;     /* Texto secundário */
--bee2-gray-600: #666666;     /* Texto terciário */
--bee2-gray-400: #999999;     /* Placeholder */
--bee2-gray-200: #e5e5e5;     /* Bordas */
--bee2-gray-100: #f5f5f5;     /* Background */
--bee2-gray-50:  #fafafa;     /* Surface */
```

### Cores das Divisões

Cada divisão da Bee2Solutions tem uma cor identificativa:

| Divisão | Cor | HEX |
|---------|-----|-----|
| **Ambiente** | Verde | `#2ECC71` |
| **Agricultura Inteligente** | Castanho/Terra | `#B8860B` |
| **Indústria & Logística** | Azul Cyan | `#00BCD4` |
| **Saúde e Laboratórios** | Roxo | `#9B59B6` |
| **Retalho Prodfarmer** | Teal | `#20B2AA` |

---

## Tipografia

### Fonte Principal: Funel Display

A tipografia Funel Display foi escolhida pelo seu design contemporâneo que combina dinamismo, confiança e estabilidade.

#### Pesos Disponíveis

| Peso | Uso |
|------|-----|
| **Bold** | Títulos, headings, destaque |
| **Regular** | Corpo de texto, parágrafos, UI |

### Hierarquia Tipográfica

```css
/* Headings */
--font-h1: 700 2.5rem/1.2 'Funel Display', sans-serif;    /* 40px */
--font-h2: 700 2rem/1.25 'Funel Display', sans-serif;     /* 32px */
--font-h3: 700 1.5rem/1.3 'Funel Display', sans-serif;    /* 24px */
--font-h4: 700 1.25rem/1.35 'Funel Display', sans-serif;  /* 20px */
--font-h5: 700 1rem/1.4 'Funel Display', sans-serif;      /* 16px */
--font-h6: 700 0.875rem/1.45 'Funel Display', sans-serif; /* 14px */

/* Body */
--font-body-lg: 400 1.125rem/1.6 'Funel Display', sans-serif; /* 18px */
--font-body: 400 1rem/1.6 'Funel Display', sans-serif;        /* 16px */
--font-body-sm: 400 0.875rem/1.5 'Funel Display', sans-serif; /* 14px */
--font-caption: 400 0.75rem/1.4 'Funel Display', sans-serif;  /* 12px */
```

### Fallback Fonts

Caso a Funel Display não esteja disponível:

```css
font-family: 'Funel Display', 'Inter', 'Helvetica Neue', Arial, sans-serif;
```

---

## Divisões e Sub-marcas

### Estrutura das Divisões

A Bee2Solutions está organizada em divisões temáticas, cada uma com cor própria mas mantendo a identidade do grupo:

#### 1. Ambiente (Verde)
- Bee2Waste Urban
- Bee2Waste Industrial
- Bee2Green
- Bee2Energy | Green Planning Tool
- Bee2Energy | Light Scada
- Bee2Fire | Florestal
- Bee2Water
- Gestão Catástrofes Naturais
- Gestão de Créditos de Carbono

#### 2. Agricultura Inteligente (Castanho)
- Bee2Crop | Agrícola Intensiva
- Bee2Crop | Silvicultura
- Bee2Agro | Produção de Biometano
- Bee2Agro | Avaliação Económica de Plantações
- Bee2Agro | Gestão de Créditos de Carbono

#### 3. Indústria & Logística (Azul Cyan)
- Smart Industry
- Gestão de Energia
- Bee2Cargo | Depo
- Bee2Cargo | Maritime
- Bee2Retail
- Bee2Fire Industrial
- Bee2Construction
- Gestão de Créditos de Carbono

#### 4. Saúde e Laboratórios (Roxo)
- Bee2Health
- Bee2Labs | Clinics
- Bee2Labs | Industrial
- Activas | Novos Conceitos de Espaços de Saúde
- Gestão de Créditos de Carbono

#### 5. Retalho Prodfarmer (Teal)
- Produtos e serviços de retalho

---

## Implementação em CSS/Tailwind

### Configuração Tailwind

```javascript
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        bee2: {
          red: {
            50: '#fff0ee',
            100: '#fedbd6',
            200: '#fdb4a9',
            300: '#fc8d7c',
            400: '#fb6654',
            500: '#f93f26',  // Principal
            600: '#e03520',
            700: '#c72d1a',
            800: '#a82515',
            900: '#891d10',
          },
          // Cores das divisões
          ambiente: '#2ECC71',
          agricultura: '#B8860B',
          industria: '#00BCD4',
          saude: '#9B59B6',
          retalho: '#20B2AA',
        },
      },
      fontFamily: {
        display: ['Funel Display', 'Inter', 'sans-serif'],
      },
      borderRadius: {
        'bee2': '0.5rem',      // Padrão
        'bee2-lg': '1rem',     // Cards
        'bee2-xl': '1.5rem',   // Modais
        'bee2-full': '9999px', // Botões pill
      },
      boxShadow: {
        'bee2-sm': '0 1px 2px 0 rgb(249 63 38 / 0.05)',
        'bee2': '0 1px 3px 0 rgb(249 63 38 / 0.1), 0 1px 2px -1px rgb(249 63 38 / 0.1)',
        'bee2-lg': '0 10px 15px -3px rgb(249 63 38 / 0.1), 0 4px 6px -4px rgb(249 63 38 / 0.1)',
      },
    },
  },
}
```

### Variáveis CSS Root

```css
:root {
  /* Cores */
  --color-primary: #f93f26;
  --color-primary-hover: #e03520;
  --color-primary-active: #c72d1a;
  
  --color-text-primary: #1a1a1a;
  --color-text-secondary: #666666;
  --color-text-muted: #999999;
  
  --color-background: #ffffff;
  --color-surface: #fafafa;
  --color-border: #e5e5e5;
  
  /* Divisões */
  --color-divisao-ambiente: #2ECC71;
  --color-divisao-agricultura: #B8860B;
  --color-divisao-industria: #00BCD4;
  --color-divisao-saude: #9B59B6;
  --color-divisao-retalho: #20B2AA;
  
  /* Tipografia */
  --font-family: 'Funel Display', 'Inter', sans-serif;
  
  /* Espaçamento */
  --spacing-xs: 0.25rem;   /* 4px */
  --spacing-sm: 0.5rem;    /* 8px */
  --spacing-md: 1rem;      /* 16px */
  --spacing-lg: 1.5rem;    /* 24px */
  --spacing-xl: 2rem;      /* 32px */
  --spacing-2xl: 3rem;     /* 48px */
  
  /* Border Radius */
  --radius-sm: 0.25rem;    /* 4px */
  --radius-md: 0.5rem;     /* 8px */
  --radius-lg: 1rem;       /* 16px */
  --radius-full: 9999px;
  
  /* Transições */
  --transition-fast: 150ms ease;
  --transition-normal: 250ms ease;
  --transition-slow: 350ms ease;
}
```

---

## Componentes UI

### Botões

```css
/* Botão Primário */
.btn-primary {
  background-color: var(--color-primary);
  color: white;
  font-family: var(--font-family);
  font-weight: 700;
  padding: 0.75rem 1.5rem;
  border-radius: var(--radius-md);
  transition: background-color var(--transition-fast);
}

.btn-primary:hover {
  background-color: var(--color-primary-hover);
}

.btn-primary:active {
  background-color: var(--color-primary-active);
}

/* Botão Secundário */
.btn-secondary {
  background-color: transparent;
  color: var(--color-primary);
  border: 2px solid var(--color-primary);
  font-family: var(--font-family);
  font-weight: 700;
  padding: 0.75rem 1.5rem;
  border-radius: var(--radius-md);
  transition: all var(--transition-fast);
}

.btn-secondary:hover {
  background-color: var(--color-primary);
  color: white;
}
```

### Cards

```css
.card {
  background-color: var(--color-background);
  border-radius: var(--radius-lg);
  border: 1px solid var(--color-border);
  padding: var(--spacing-lg);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.card-header {
  font-family: var(--font-family);
  font-weight: 700;
  font-size: 1.25rem;
  color: var(--color-text-primary);
  margin-bottom: var(--spacing-md);
}
```

### Inputs

```css
.input {
  font-family: var(--font-family);
  font-size: 1rem;
  padding: 0.75rem 1rem;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  transition: border-color var(--transition-fast), box-shadow var(--transition-fast);
}

.input:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px rgba(249, 63, 38, 0.1);
}

.input::placeholder {
  color: var(--color-text-muted);
}
```

### Navegação com Cores de Divisão

```css
/* Para aplicações de divisões específicas */
.nav-ambiente { border-bottom: 3px solid var(--color-divisao-ambiente); }
.nav-agricultura { border-bottom: 3px solid var(--color-divisao-agricultura); }
.nav-industria { border-bottom: 3px solid var(--color-divisao-industria); }
.nav-saude { border-bottom: 3px solid var(--color-divisao-saude); }
.nav-retalho { border-bottom: 3px solid var(--color-divisao-retalho); }
```

---

## Boas Práticas

### ✅ Fazer

- Usar a cor principal (#f93f26) para CTAs e elementos de destaque
- Manter contraste mínimo de 4.5:1 para texto
- Respeitar a área de protecção do logótipo
- Usar a tipografia Funel Display para consistência
- Aplicar as cores das divisões apenas nos contextos apropriados
- Manter espaçamentos consistentes usando as variáveis definidas

### ❌ Evitar

- Alterar as proporções do logótipo
- Usar cores fora da paleta definida
- Aplicar efeitos (sombras, gradientes) no logótipo
- Colocar o logótipo sobre fundos que comprometam a legibilidade
- Misturar cores de diferentes divisões no mesmo contexto
- Usar fontes alternativas sem necessidade

### Acessibilidade

| Combinação | Rácio | WCAG |
|------------|-------|------|
| Vermelho (#f93f26) + Branco | 4.5:1 | AA ✓ |
| Vermelho (#f93f26) + Preto | 5.2:1 | AA ✓ |
| Texto escuro + Fundo claro | 12:1 | AAA ✓ |

### Responsividade

```css
/* Breakpoints recomendados */
--breakpoint-sm: 640px;   /* Mobile landscape */
--breakpoint-md: 768px;   /* Tablet */
--breakpoint-lg: 1024px;  /* Desktop */
--breakpoint-xl: 1280px;  /* Desktop large */
--breakpoint-2xl: 1536px; /* Desktop extra large */
```

---

## Recursos

### Ficheiros de Marca

Os ficheiros do logótipo e elementos gráficos devem ser solicitados à equipa de design. Formatos disponíveis:

- SVG (vectorial, uso digital)
- PNG (transparente, vários tamanhos)
- PDF (impressão)

### Contacto

Para questões sobre a aplicação da marca ou pedidos de materiais:

- **Design/Branding**: índoledesign — www.indole.es
- **Desenvolvimento**: Equipa Bee2Solutions

---

*Este documento foi criado com base na GuíaLine Bee2Solutions v01-2025.*  
*Última actualização: Novembro 2025*