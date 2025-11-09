// Função principal para avaliar expressões matemáticas
export const evaluateExpression = (expression, allExpressions = []) => {
  // Garantir que expression seja sempre uma string
  const expressionStr = typeof expression === 'string' ? expression : String(expression || '');
  
  if (!expressionStr || expressionStr.trim() === '') {
    return null;
  }

  try {
    // Remover espaços extras e normalizar
    let cleanExpression = expressionStr.trim();
    
    // Só avaliar se a expressão contém '='
    if (!cleanExpression.includes('=')) {
      return null;
    }
    
    // Extrair a parte antes do '=' para avaliação
    cleanExpression = cleanExpression.split('=')[0].trim();
    
    // Converter pontos de separadores de milhares para formato JavaScript
    // Identificar números com pontos como separadores de milhares (ex: 250.000)
    cleanExpression = cleanExpression.replace(/(\d{1,3}(?:\.\d{3})+)(?!\d)/g, (match) => {
      // Remover pontos dos separadores de milhares
      return match.replace(/\./g, '');
    });
    
    // Substituir valores de expressões dependentes baseado nas dependências
    if (allExpressions && allExpressions.length > 0) {
      // Encontrar a expressão atual
      const currentExpr = allExpressions.find(expr => expr.text === expressionStr);
      if (currentExpr && currentExpr.dependencies && currentExpr.dependencies.length > 0) {
        currentExpr.dependencies.forEach(depId => {
          const depExpr = allExpressions.find(expr => expr.id === depId);
          if (depExpr && depExpr.result !== null && depExpr.result !== undefined && depExpr.result !== 'Erro') {
            // Substituir o resultado anterior da expressão dependente pelo resultado atual
            const depResult = depExpr.result.toString();
            // Procurar por padrões como "número" no início da expressão que correspondem ao resultado da dependência
            const resultPattern = new RegExp(`^${depResult.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?=\\+|\\-|\\*|\\/|$)`);
            if (resultPattern.test(cleanExpression)) {
              cleanExpression = cleanExpression.replace(resultPattern, depResult);
            } else {
              // Se não encontrar o padrão exato, tentar substituir qualquer número no início
              const numberAtStart = cleanExpression.match(/^\d+(\.\d+)?/);
              if (numberAtStart) {
                cleanExpression = cleanExpression.replace(/^\d+(\.\d+)?/, depResult);
              }
            }
          }
        });
      }
    }
    
    // Verificar se é apenas um número simples (sem operadores)
    // Se for apenas um número, não avaliar
    if (/^-?\d+(\.\d+)?$/.test(cleanExpression)) {
      return null;
    }
    
    // Verificar se contém operadores matemáticos que requerem avaliação
    const hasOperators = /[+\-−×÷*/()√²!%]/.test(cleanExpression);
    if (!hasOperators) {
      return null;
    }
    
    // Substituir operadores visuais por operadores JavaScript
    cleanExpression = cleanExpression
      .replace(/×/g, '*')
      .replace(/÷/g, '/')
      .replace(/−/g, '-')
      .replace(/\+/g, '+')
      .replace(/²/g, '**2')
      .replace(/√/g, 'Math.sqrt')
      .replace(/%/g, '/100');
    
    // Tratar fatorial
    cleanExpression = cleanExpression.replace(/(\d+)!/g, (match, num) => {
      return `factorial(${num})`;
    });
    
    // Avaliar a expressão
    const result = evaluateWithFunctions(cleanExpression);
    
    // Verificar se o resultado é válido
    if (isNaN(result) || !isFinite(result)) {
      return 'Erro';
    }
    
    // Arredondar para evitar problemas de ponto flutuante
    return Math.round(result * 1000000) / 1000000;
    
  } catch (error) {
    return 'Erro';
  }
};

// Função para avaliar expressões com funções matemáticas
const evaluateWithFunctions = (expression) => {
  // Criar contexto seguro para avaliação
  const context = {
    Math,
    factorial: (n) => {
      if (n < 0) return NaN;
      if (n === 0 || n === 1) return 1;
      let result = 1;
      for (let i = 2; i <= n; i++) {
        result *= i;
      }
      return result;
    },
    sqrt: Math.sqrt,
    pow: Math.pow,
    abs: Math.abs,
    sin: Math.sin,
    cos: Math.cos,
    tan: Math.tan,
    log: Math.log,
    exp: Math.exp
  };
  
  // Função segura para avaliar expressões
  const safeEval = (expr) => {
    // Verificar se a expressão contém apenas caracteres seguros
    const safePattern = /^[0-9+\-*/.()\s\w]+$/;
    if (!safePattern.test(expr)) {
      throw new Error('Expressão inválida');
    }
    
    // Usar Function constructor para avaliação segura
    // eslint-disable-next-line no-new-func
    const func = new Function(
      'Math', 'factorial', 'sqrt', 'pow', 'abs', 'sin', 'cos', 'tan', 'log', 'exp',
      `return ${expr}`
    );
    
    return func(
      context.Math,
      context.factorial,
      context.sqrt,
      context.pow,
      context.abs,
      context.sin,
      context.cos,
      context.tan,
      context.log,
      context.exp
    );
  };
  
  return safeEval(expression);
};

// Função para formatar números
export const formatNumber = (num) => {
  if (typeof num !== 'number') return num;
  
  // Função auxiliar para adicionar pontos como separadores de milhares
  const addThousandsSeparator = (numStr) => {
    const parts = numStr.split('.');
    // Usar ponto como separador de milhares e vírgula para decimais
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    // Se há parte decimal, usar vírgula como separador decimal
    if (parts.length > 1) {
      return parts[0] + ',' + parts[1];
    }
    return parts[0];
  };

  // Número máximo de casas decimais exibidas
  const MAX_DECIMALS = 3;
  
  // Arredondar para evitar problemas de precisão de ponto flutuante
  const roundedNum = Math.round(num * Math.pow(10, MAX_DECIMALS)) / Math.pow(10, MAX_DECIMALS);
  
  // Se for um número inteiro após arredondamento
  if (Number.isInteger(roundedNum)) {
    return addThousandsSeparator(roundedNum.toString());
  }
  
  // Se for um decimal, mostrar até MAX_DECIMALS casas decimais, removendo zeros finais
  if (roundedNum % 1 !== 0) {
    const formatted = parseFloat(roundedNum.toFixed(MAX_DECIMALS)).toString();
    return addThousandsSeparator(formatted);
  }
  
  return addThousandsSeparator(roundedNum.toString());
};

// Função para verificar se uma string é um número
export const isNumber = (str) => {
  return !isNaN(parseFloat(str)) && isFinite(str);
};

// Função para extrair números de uma expressão
export const extractNumbers = (expression) => {
  const numberPattern = /\d+(?:\.\d+)?/g;
  const matches = expression.match(numberPattern);
  return matches ? matches.map(num => parseFloat(num)) : [];
};

// Função para validar expressão
export const validateExpression = (expression) => {
  if (!expression || expression.trim() === '') {
    return { valid: false, error: 'Expressão vazia' };
  }
  
  // Verificar parênteses balanceados
  let parenthesesCount = 0;
  for (let char of expression) {
    if (char === '(') parenthesesCount++;
    if (char === ')') parenthesesCount--;
    if (parenthesesCount < 0) {
      return { valid: false, error: 'Parênteses não balanceados' };
    }
  }
  
  if (parenthesesCount !== 0) {
    return { valid: false, error: 'Parênteses não balanceados' };
  }
  
  return { valid: true };
};