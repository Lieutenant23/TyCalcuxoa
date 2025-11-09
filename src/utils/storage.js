// Chave para armazenar dados no localStorage
const STORAGE_KEY = 'tydlig_calculator_expressions';

// Função para salvar expressões no localStorage
export const saveToStorage = (expressions) => {
  try {
    const dataToSave = {
      expressions,
      timestamp: new Date().toISOString(),
      version: '1.0'
    };
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToSave));
    return true;
  } catch (error) {
    console.error('Erro ao salvar no localStorage:', error);
    return false;
  }
};

// Função para carregar expressões do localStorage
export const loadFromStorage = () => {
  try {
    const savedData = localStorage.getItem(STORAGE_KEY);
    
    if (!savedData) {
      return [];
    }
    
    const parsedData = JSON.parse(savedData);
    
    // Verificar se os dados têm a estrutura esperada
    if (parsedData && Array.isArray(parsedData.expressions)) {
      return parsedData.expressions;
    }
    
    // Se for um array antigo (compatibilidade)
    if (Array.isArray(parsedData)) {
      return parsedData;
    }
    
    return [];
  } catch (error) {
    console.error('Erro ao carregar do localStorage:', error);
    return [];
  }
};

// Função para limpar dados do localStorage
export const clearStorage = () => {
  try {
    localStorage.removeItem(STORAGE_KEY);
    return true;
  } catch (error) {
    console.error('Erro ao limpar localStorage:', error);
    return false;
  }
};

// Função para exportar dados
export const exportData = () => {
  try {
    const expressions = loadFromStorage();
    const exportData = {
      expressions,
      exportDate: new Date().toISOString(),
      appVersion: '1.0',
      appName: 'Tydlig Calculator'
    };
    
    return JSON.stringify(exportData, null, 2);
  } catch (error) {
    console.error('Erro ao exportar dados:', error);
    return null;
  }
};

// Função para importar dados
export const importData = (jsonString) => {
  try {
    const importedData = JSON.parse(jsonString);
    
    // Verificar se os dados têm a estrutura esperada
    if (importedData && Array.isArray(importedData.expressions)) {
      saveToStorage(importedData.expressions);
      return { success: true, expressions: importedData.expressions };
    }
    
    return { success: false, error: 'Formato de dados inválido' };
  } catch (error) {
    console.error('Erro ao importar dados:', error);
    return { success: false, error: 'Erro ao processar arquivo' };
  }
};

// Função para verificar se o localStorage está disponível
export const isStorageAvailable = () => {
  try {
    const test = '__storage_test__';
    localStorage.setItem(test, test);
    localStorage.removeItem(test);
    return true;
  } catch (error) {
    return false;
  }
};

// Função para obter informações sobre o armazenamento
export const getStorageInfo = () => {
  try {
    const savedData = localStorage.getItem(STORAGE_KEY);
    
    if (!savedData) {
      return {
        hasData: false,
        size: 0,
        expressionsCount: 0
      };
    }
    
    const parsedData = JSON.parse(savedData);
    const expressions = Array.isArray(parsedData.expressions) ? parsedData.expressions : [];
    
    return {
      hasData: true,
      size: new Blob([savedData]).size,
      expressionsCount: expressions.length,
      lastSaved: parsedData.timestamp || 'Desconhecido'
    };
  } catch (error) {
    console.error('Erro ao obter informações do storage:', error);
    return {
      hasData: false,
      size: 0,
      expressionsCount: 0,
      error: error.message
    };
  }
};