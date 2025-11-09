# Tydlig Calculator

Aplicação web em React para cálculos visuais com legendas e múltiplas expressões.

## Como rodar

- Requisitos: `Node.js >= 16` (recomendado `18 LTS`), `npm`
- Instalar dependências:

```
npm install
```

- Rodar em desenvolvimento:

```
npm start
```

Se precisar acessar via celular na mesma rede:

```
HOST=0.0.0.0 npm start
```

Depois, abra `http://SEU_IP_LOCAL:3000` no celular.

## Build de produção

```
npm run build
```

Para servir o build localmente:

```
npx serve -s build --listen 3001
```

## Scripts

- `npm start`: inicia o servidor de desenvolvimento (Create React App)
- `npm run build`: gera o build otimizado em `build/`

## Estrutura

- `src/`: código-fonte (componentes React, utilitários)
- `public/`: HTML base
- `build/`: artefatos de produção (após `npm run build`)

## Formatação de números

- Resultados exibem no máximo 3 casas decimais (arquivo `src/utils/calculator.js`, função `formatNumber`).

## Deploy (opcional)

- Netlify: arraste e solte a pasta `build/`
- Vercel: conecte o repositório no GitHub ou use `vercel`

## Observações

- Se houver erro com portas ocupadas, libere com:

```
npx kill-port 3000 3001 3002
```