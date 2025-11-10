import React, { useState, useEffect, useCallback } from 'react';
import './App.css';
import CalculationArea from './components/CalculationArea';
import Keyboard from './components/Keyboard';
import TabBar from './components/TabBar';
import { evaluateExpression } from './utils/calculator';
import { saveToStorage, loadFromStorage } from './utils/storage';

function App() {
  // Estado das abas
  const [tabs, setTabs] = useState([]);
  const [activeTabId, setActiveTabId] = useState(null);
  
  // Estados da sessão atual (aba ativa)
  const [expressions, setExpressions] = useState([]);
  const [selectedExpression, setSelectedExpression] = useState(null);
  const [selectedResultMode, setSelectedResultMode] = useState(false);
  const [floatingButtons, setFloatingButtons] = useState(null);
  const [history, setHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  // Funções para gerenciar abas
  const createNewTab = useCallback(() => {
    const newTabId = Date.now().toString();
    const newTab = {
      id: newTabId,
      title: `Página ${tabs.length + 1}`,
      expressions: [],
      selectedExpression: null,
      history: [],
      historyIndex: -1
    };
    
    setTabs(prev => [...prev, newTab]);
    setActiveTabId(newTabId);
    setExpressions([]);
    setSelectedExpression(null);
    setHistory([]);
    setHistoryIndex(-1);
    
    return newTabId;
  }, [tabs.length]);

  const closeTab = useCallback((tabId) => {
    setTabs(prev => {
      const newTabs = prev.filter(tab => tab.id !== tabId);
      
      if (newTabs.length === 0) {
        // Se não há mais abas, criar uma nova
        const newTabId = createNewTab();
        return [{
          id: newTabId,
          title: 'Página 1',
          expressions: [],
          selectedExpression: null,
          history: [],
          historyIndex: -1
        }];
      }
      
      // Se a aba fechada era a ativa, selecionar outra
      if (tabId === activeTabId) {
        const activeIndex = prev.findIndex(tab => tab.id === tabId);
        const newActiveIndex = activeIndex > 0 ? activeIndex - 1 : 0;
        const newActiveTab = newTabs[newActiveIndex];
        
        setActiveTabId(newActiveTab.id);
        setExpressions(newActiveTab.expressions);
        setSelectedExpression(newActiveTab.selectedExpression);
        setHistory(newActiveTab.history);
        setHistoryIndex(newActiveTab.historyIndex);
      }
      
      return newTabs;
    });
  }, [activeTabId, createNewTab]);

  const selectTab = useCallback((tabId) => {
    // Salvar estado da aba atual
    if (activeTabId) {
      setTabs(prev => prev.map(tab => 
        tab.id === activeTabId 
          ? { 
              ...tab, 
              expressions, 
              selectedExpression, 
              history, 
              historyIndex 
            }
          : tab
      ));
    }
    
    // Carregar estado da nova aba
    const selectedTab = tabs.find(tab => tab.id === tabId);
    if (selectedTab) {
      setActiveTabId(tabId);
      setExpressions(selectedTab.expressions);
      setSelectedExpression(selectedTab.selectedExpression);
      setHistory(selectedTab.history);
      setHistoryIndex(selectedTab.historyIndex);
    }
  }, [activeTabId, expressions, selectedExpression, history, historyIndex, tabs]);

  const renameTab = useCallback((tabId, newTitle) => {
    setTabs(prev => prev.map(tab => 
      tab.id === tabId 
        ? { ...tab, title: newTitle }
        : tab
    ));
  }, []);

  // Função para adicionar legenda a um número
  const handleLabelNumber = useCallback((expressionId, labels) => {
    setExpressions(prev => prev.map(expr => 
      expr.id === expressionId ? { ...expr, labels } : expr
    ));
  }, []);

  // Função para deletar números
  const handleDeleteNumbers = useCallback((expressionId, numberKeys) => {
    setExpressions(prev => prev.map(expr => {
      if (expr.id === expressionId) {
        const newLabels = { ...expr.labels };
        numberKeys.forEach(key => {
          delete newLabels[key];
        });
        return { ...expr, labels: newLabels };
      }
      return expr;
    }));
  }, []);

  // Função para remover apenas as legendas dos números
  const handleRemoveLabels = useCallback((expressionId, numberKeys) => {
    setExpressions(prev => prev.map(expr => {
      if (expr.id === expressionId) {
        const newLabels = { ...expr.labels };
        numberKeys.forEach(key => {
          delete newLabels[key];
        });
        return { ...expr, labels: newLabels };
      }
      return expr;
    }));
  }, []);

  // Função para editar números
  const handleEditNumber = useCallback((expressionId, oldValue, newValue) => {
    setExpressions(prev => prev.map(expr => {
      if (expr.id === expressionId) {
        const newText = expr.text.replace(oldValue.toString(), newValue.toString());
        return { 
          ...expr, 
          text: newText,
          result: evaluateExpression(newText, prev)
        };
      }
      return expr;
    }));
  }, []);

  // Carregar dados do localStorage na inicialização
  useEffect(() => {
    const savedTabs = localStorage.getItem('calculator-tabs');
    const savedActiveTab = localStorage.getItem('calculator-active-tab');
    
    if (savedTabs) {
      const parsedTabs = JSON.parse(savedTabs);
      setTabs(parsedTabs);
      
      if (savedActiveTab && parsedTabs.find(tab => tab.id === savedActiveTab)) {
        setActiveTabId(savedActiveTab);
        const activeTab = parsedTabs.find(tab => tab.id === savedActiveTab);
        if (activeTab && activeTab.expressions) {
          // Garantir que todas as expressões tenham a propriedade labels
          const migratedExpressions = activeTab.expressions.map(expr => ({
            ...expr,
            labels: expr.labels || {}
          }));
          setExpressions(migratedExpressions);
        }
      } else if (parsedTabs.length > 0) {
        setActiveTabId(parsedTabs[0].id);
        const expressions = parsedTabs[0].expressions || [];
        // Garantir que todas as expressões tenham a propriedade labels
        const migratedExpressions = expressions.map(expr => ({
          ...expr,
          labels: expr.labels || {}
        }));
        setExpressions(migratedExpressions);
      }
    } else {
      // Criar primeira aba se não houver dados salvos
      const newTabId = createNewTab();
      // Criar primeira expressão automaticamente
      setTimeout(() => {
        const newId = 1;
        const newExpression = {
          id: newId,
          text: '',
          result: null,
          dependencies: [],
          dependents: [],
          position: { x: 20, y: 20 },
          labels: {}
        };
        setExpressions([newExpression]);
        setSelectedExpression(newId);
      }, 100);
    }
  }, []);



  // Salvar abas no localStorage sempre que mudarem
  useEffect(() => {
    if (tabs.length > 0) {
      localStorage.setItem('calculator-tabs', JSON.stringify(tabs));
      localStorage.setItem('calculator-active-tab', activeTabId);
    }
  }, [tabs, activeTabId]);

  // Salvar no localStorage sempre que as expressões mudarem
  useEffect(() => {
    if (activeTabId && expressions.length > 0) {
      // Atualizar a aba atual com as expressões
      setTabs(prev => prev.map(tab => 
        tab.id === activeTabId 
          ? { ...tab, expressions }
          : tab
      ));
      
      // Salvar apenas as expressões da aba ativa no localStorage
      saveToStorage(expressions);
    }
  }, [expressions, activeTabId]);

  // Função para salvar estado no histórico
  const saveToHistory = useCallback((newExpressions) => {
    setHistory(prev => {
      const newHistory = prev.slice(0, historyIndex + 1);
      newHistory.push(JSON.parse(JSON.stringify(expressions)));
      return newHistory.slice(-50); // Manter apenas os últimos 50 estados
    });
    setHistoryIndex(prev => Math.min(prev + 1, 49));
    setExpressions(newExpressions);
  }, [expressions, historyIndex]);

  // Função para desfazer
  const handleUndo = useCallback(() => {
    if (historyIndex > 0) {
      const previousState = history[historyIndex - 1];
      setExpressions(previousState);
      setHistoryIndex(prev => prev - 1);
    }
  }, [history, historyIndex]);

  // Função para adicionar nova expressão
  const addExpression = useCallback((x = null, y = null) => {
    const newId = Math.max(...expressions.map(e => e.id), 0) + 1;
    const newExpression = {
      id: newId,
      text: '',
      result: null,
      dependencies: [],
      dependents: [],
      position: x !== null && y !== null ? { x, y } : null,
      labels: {}
    };
    const newExpressions = [...expressions, newExpression];
    saveToHistory(newExpressions);
    return newId;
  }, [expressions, saveToHistory]);

  // Função para atualizar expressão
  const updateExpression = useCallback((id, text) => {
    // Garantir que text seja sempre uma string
    const textStr = typeof text === 'string' ? text : String(text || '');
    
    // Aplicar formatação automática em números inteiros com 4+ dígitos
    let formattedText = textStr;
    
    // Primeiro, limpar todos os pontos existentes dos números
    formattedText = formattedText.replace(/(\d+(?:\.\d*)*)/g, (match) => {
      return match.replace(/\./g, '');
    });
    
    // Depois aplicar formatação correta apenas em números com 4+ dígitos
    formattedText = formattedText.replace(/(\d{4,})/g, (match) => {
      return match.replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1.');
    });
    
    const updated = expressions.map(expr => {
      if (expr.id === id) {
        let result = evaluateExpression(formattedText, expressions);
        
        // Se evaluateExpression retorna null, verificar se é um número simples
        if (result === null && formattedText.includes('=')) {
          const beforeEquals = formattedText.split('=')[0].trim();
          // Remover pontos de formatação e converter vírgula para ponto
          const cleanNumber = beforeEquals.replace(/\./g, '').replace(',', '.');
          const parsedNumber = parseFloat(cleanNumber);
          if (!isNaN(parsedNumber) && isFinite(parsedNumber)) {
            result = parsedNumber;
          }
        }
        
        // Se o texto está vazio, limpar dependências
        const dependencies = formattedText.trim() === '' ? [] : expr.dependencies;
        return { ...expr, text: formattedText, result, dependencies };
      }
      return expr;
    });
    
    // Propagar mudanças para expressões dependentes
    const finalUpdated = propagateChanges(updated, id);
    saveToHistory(finalUpdated);
  }, [expressions, saveToHistory]);

  // Função para propagar mudanças
  const propagateChanges = (expressions, changedId) => {
    const changedExpr = expressions.find(e => e.id === changedId);
    if (!changedExpr) return expressions;

    let updated = [...expressions];
    const toUpdate = [];
    
    // Encontrar todas as expressões que dependem da expressão alterada
    updated.forEach(expr => {
      if (expr.dependencies.includes(changedId)) {
        toUpdate.push(expr.id);
      }
    });
    
    // Atualizar expressões dependentes
    toUpdate.forEach(id => {
      updated = updated.map(expr => {
        if (expr.id === id) {
          // Reconstruir o texto da expressão com os novos valores das dependências
          let newText = expr.text;
          
          // Para cada dependência, substituir o valor antigo pelo novo
          expr.dependencies.forEach(depId => {
            const depExpr = updated.find(e => e.id === depId);
            if (depExpr && depExpr.result !== null && depExpr.result !== undefined && depExpr.result !== 'Erro') {
              // Substituir o primeiro número da expressão pelo resultado da dependência
              const numberAtStart = newText.match(/^\d+(\.\d+)?/);
              if (numberAtStart) {
                newText = newText.replace(/^\d+(\.\d+)?/, depExpr.result.toString());
              }
            }
          });
          
          const result = evaluateExpression(newText, updated);
          return { ...expr, text: newText, result };
        }
        return expr;
      });
      
      // Propagar recursivamente para dependentes dos dependentes
      updated = propagateChanges(updated, id);
    });
    
    return updated;
  };

  // Função para usar resultado em nova expressão
  const useResultInNewExpression = useCallback((sourceId, value) => {
    // Encontrar a expressão de origem para obter sua posição
    const sourceExpr = expressions.find(expr => expr.id === sourceId);
    let newX = null, newY = null;
    
    if (sourceExpr && sourceExpr.position) {
      // Posicionar a nova expressão 60px abaixo da expressão de origem
      newX = sourceExpr.position.x;
      newY = sourceExpr.position.y + 60;
    }
    
    const newId = addExpression(newX, newY);
    setExpressions(prev => {
      const updated = prev.map(expr => {
        if (expr.id === newId) {
          const newText = value.toString();
          return {
            ...expr,
            text: newText,
            result: evaluateExpression(newText, prev),
            dependencies: [sourceId]
          };
        }
        if (expr.id === sourceId) {
          return {
            ...expr,
            dependents: [...expr.dependents, newId]
          };
        }
        return expr;
      });
      return updated;
    });
    setFloatingButtons(null);
  }, [addExpression, expressions]);



  // Função para usar resultado com operação
  const handleOperationClick = useCallback((sourceId, value, operation) => {
    // Se a operação é 'label', tratar como legenda para resultado
    if (operation === 'label' || (typeof operation === 'object' && operation.label)) {
      const labelData = typeof operation === 'object' ? operation : { label: operation };
      
      setExpressions(prev => {
        const updated = prev.map(expr => {
          if (expr.id === sourceId) {
            const newLabels = { ...(expr.labels || {}), [`result-${value}`]: labelData.label };
            const updatedExpr = { 
              ...expr, 
              labels: newLabels,
              // Force a new reference by adding a timestamp
              _lastUpdated: Date.now()
            };
            return updatedExpr;
          }
          return expr;
        });
        return updated;
      });
      setFloatingButtons(null);
      return;
    }
    
    // Encontrar a expressão de origem para obter sua posição
    const sourceExpr = expressions.find(expr => expr.id === sourceId);
    let newX = null, newY = null;
    
    if (sourceExpr && sourceExpr.position) {
      // Posicionar a nova expressão 60px abaixo da expressão de origem
      newX = sourceExpr.position.x;
      newY = sourceExpr.position.y + 60;
    }
    
    const newId = addExpression(newX, newY);
    setExpressions(prev => {
      const updated = prev.map(expr => {
        if (expr.id === newId) {
          const newText = value.toString() + operation;
          return {
            ...expr,
            text: newText,
            dependencies: [sourceId],
            result: evaluateExpression(newText, prev)
          };
        }
        if (expr.id === sourceId) {
          return {
            ...expr,
            dependents: [...expr.dependents, newId]
          };
        }
        return expr;
      });
      return updated;
    });
    setSelectedExpression(newId);
    setFloatingButtons(null);
  }, [addExpression, expressions]);

  // Função para inserir texto no teclado
  const handleKeyboardInput = useCallback((value) => {
    // Verificar se é uma operação e se deve usar resultado automaticamente
    const isOperation = [' + ', ' − ', ' × ', ' ÷ '].includes(value);
    
    // Se o resultado está selecionado e uma operação foi pressionada, continuar na mesma expressão
    if (isOperation && selectedExpression && selectedResultMode) {
      const selectedExpr = expressions.find(e => e.id === selectedExpression);
      if (selectedExpr && selectedExpr.result !== null && selectedExpr.result !== undefined && selectedExpr.text.includes('=')) {
        // Continuar a expressão na mesma linha, removendo o '=' e adicionando o operador
        const textWithoutEquals = selectedExpr.text.replace('=', '');
        const newText = textWithoutEquals + value;
        updateExpression(selectedExpression, newText);
        setSelectedResultMode(false); // Sair do modo de resultado selecionado
        return;
      }
    }
    
    // Se há uma expressão selecionada e ela tem resultado, e uma operação foi pressionada (comportamento original)
    if (isOperation && selectedExpression && !selectedResultMode) {
      const selectedExpr = expressions.find(e => e.id === selectedExpression);
      if (selectedExpr && selectedExpr.result !== null && selectedExpr.result !== undefined && selectedExpr.text.includes('=')) {
        // Calcular posição para a nova expressão
        let newX = null, newY = null;
        if (selectedExpr.position) {
          newX = selectedExpr.position.x;
          newY = selectedExpr.position.y + 60;
        }
        
        // Usar o resultado em nova expressão com a operação
        const newId = addExpression(newX, newY);
        setExpressions(prev => {
          return prev.map(expr => {
            if (expr.id === newId) {
              return {
                ...expr,
                text: selectedExpr.result.toString() + value,
                dependencies: [selectedExpression]
              };
            }
            if (expr.id === selectedExpression) {
              return {
                ...expr,
                dependents: [...expr.dependents, newId]
              };
            }
            return expr;
          });
        });
        setSelectedExpression(newId);
        return;
      }
    }
    
    // Caso não haja expressão selecionada, usar a última com resultado
    if (isOperation && !selectedExpression) {
      // Encontrar a última expressão com resultado
      const lastExprWithResult = expressions.slice().reverse().find(expr => 
        expr.result !== null && expr.result !== undefined
      );
      
      if (lastExprWithResult) {
        // Calcular posição para a nova expressão
        let newX = null, newY = null;
        if (lastExprWithResult.position) {
          newX = lastExprWithResult.position.x;
          newY = lastExprWithResult.position.y + 60;
        }
        
        // Usar o resultado em nova expressão com a operação
        const newId = addExpression(newX, newY);
        setExpressions(prev => {
          return prev.map(expr => {
            if (expr.id === newId) {
              return {
                ...expr,
                text: lastExprWithResult.result.toString() + value,
                dependencies: [lastExprWithResult.id]
              };
            }
            if (expr.id === lastExprWithResult.id) {
              return {
                ...expr,
                dependents: [...expr.dependents, newId]
              };
            }
            return expr;
          });
        });
        setSelectedExpression(newId);
        return;
      }
    }
    
    if (selectedExpression) {
      const expr = expressions.find(e => e.id === selectedExpression);
      if (expr) {
        let newText = expr.text;
        
        // Se estamos no modo de resultado selecionado, tratar entrada especialmente
        if (selectedResultMode && expr.text.includes('=')) {
          if (value === 'backspace') {
            // Backspace no resultado selecionado remove o '=' e volta para edição
            newText = expr.text.replace('=', '');
            setSelectedResultMode(false);
          } else if (value === 'clear') {
            newText = '';
            setSelectedResultMode(false);
          } else if (value === 'clear_all') {
             // Manter comportamento original do clear_all
             // Limpar toda a tela e criar nova expressão na posição superior esquerda
             const newExpression = {
               id: 1,
               text: '',
               result: '',
               dependencies: [],
               dependents: [],
               position: { x: 20, y: 20 },
               labels: {}
             };
             
             // Atualizar estado de forma síncrona
             const newExpressions = [newExpression];
             setExpressions(newExpressions);
             setSelectedExpression(1);
             setSelectedResultMode(false);
             saveToHistory(newExpressions);
             
             // Garantir que o foco seja mantido
             setTimeout(() => {
               const appElement = document.querySelector('.app');
               if (appElement) {
                 appElement.setAttribute('tabindex', '-1');
                 appElement.style.outline = 'none';
                 appElement.focus();
               }
             }, 50);
             
             return;
           } else if (value !== '=') {
             // Qualquer outra entrada continua a expressão
             newText = expr.text.replace('=', '') + value;
             setSelectedResultMode(false);
           }
         } else {
           // Lógica normal quando não estamos no modo de resultado selecionado
           if (value === '=') {
             // Não adicionar = se já existe
             if (!newText.includes('=')) {
               newText += '=';
             }
           } else if (value === 'backspace') {
             newText = newText.slice(0, -1);
           } else if (value === 'clear') {
             newText = '';
           } else if (value === 'clear_all') {
              // Limpar toda a tela e criar nova expressão na posição superior esquerda
              const newExpression = {
                id: 1,
                text: '',
                result: '',
                dependencies: [],
                dependents: [],
                position: { x: 20, y: 20 },
                labels: {}
              };
              
              // Atualizar estado de forma síncrona
              const newExpressions = [newExpression];
              setExpressions(newExpressions);
              setSelectedExpression(1);
              setSelectedResultMode(false);
              saveToHistory(newExpressions);
              
              // Garantir que o foco seja mantido
              setTimeout(() => {
                const appElement = document.querySelector('.app');
                if (appElement) {
                  appElement.setAttribute('tabindex', '-1');
                  appElement.style.outline = 'none';
                  appElement.focus();
                }
              }, 50);
              
              return;
            } else {
              newText += value;
            }
          }
        updateExpression(selectedExpression, newText);
      }
    } else {
      // Se nenhuma expressão selecionada, usar a última ou criar nova
      const lastExpr = expressions[expressions.length - 1];
      if (lastExpr && lastExpr.text === '') {
        setSelectedExpression(lastExpr.id);
        // Aplicar o input diretamente na última expressão vazia
        let newText = lastExpr.text;
        if (value === '=') {
          if (!newText.includes('=')) {
            newText += '=';
          }
        } else if (value === 'backspace') {
          newText = newText.slice(0, -1);
        } else if (value === 'clear') {
          newText = '';
        } else if (value === 'clear_all') {
          // Limpar toda a tela
          setExpressions([]);
          setSelectedExpression(null);
          return;
        } else {
          newText += value;
        }
        updateExpression(lastExpr.id, newText);
      } else {
        const newId = addExpression();
        setSelectedExpression(newId);
        // Aplicar o input diretamente na nova expressão
        let newText = '';
        if (value === '=') {
          if (!newText.includes('=')) {
            newText += '=';
          }
        } else if (value === 'backspace') {
          newText = newText.slice(0, -1);
        } else if (value === 'clear') {
          newText = '';
        } else if (value === 'clear_all') {
          // Limpar toda a tela
          setExpressions([]);
          setSelectedExpression(null);
          return;
        } else {
          newText += value;
        }
        updateExpression(newId, newText);
      }
    }
  }, [selectedExpression, selectedResultMode, expressions, updateExpression, addExpression, saveToHistory]);

  // Listener global para capturar digitação - funciona sem cursor
  useEffect(() => {
    const handleGlobalKeyDown = (e) => {
      // Verificar se o evento não vem de um input, textarea ou elemento editável
      if (e.target.tagName === 'INPUT' || 
          e.target.tagName === 'TEXTAREA' || 
          e.target.contentEditable === 'true' ||
          e.target.closest('.floating-buttons') || // Ignorar se estiver nos botões flutuantes
          e.target.closest('.label-input') || // Ignorar se estiver editando legenda
          e.target.classList.contains('expression-input') || // Ignorar se estiver editando expressão
          e.target.classList.contains('label-input')) { // Ignorar se estiver editando legenda
        return;
      }
      
      // Capturar teclas de números, operadores e funções
      if (/[0-9+\-×÷().%=]/.test(e.key) || e.key === 'Enter') {
        e.preventDefault();
        
        // Se não há expressão selecionada, criar nova
        if (!selectedExpression) {
          const newId = expressions.length > 0 ? Math.max(...expressions.map(e => e.id)) + 1 : 1;
          
          const newExpression = {
            id: newId,
            text: e.key === 'Enter' || e.key === '=' ? '' : e.key,
            result: e.key === 'Enter' || e.key === '=' ? '' : evaluateExpression(e.key, expressions),
            dependencies: [],
            dependents: [],
            position: { x: 20 + (expressions.length * 10), y: 20 + (expressions.length * 10) }
          };
          
          const newExpressions = [...expressions, newExpression];
          saveToHistory(newExpressions);
          setSelectedExpression(newId);
        } else {
          // Se há expressão selecionada, adicionar à expressão atual
          const currentExpression = expressions.find(exp => exp.id === selectedExpression);
          if (currentExpression) {
            let newText = currentExpression.text;
            
            if (e.key === 'Enter' || e.key === '=') {
              // Finalizar expressão atual e criar nova
              setSelectedExpression(null);
              return;
            } else {
              newText += e.key;
            }
            
            updateExpression(selectedExpression, newText);
          }
        }
      }
      
      // Teclas especiais
       if (e.key === 'Escape') {
         e.preventDefault();
         setSelectedExpression(null);
       }
       
       if (e.key === 'Backspace') {
         e.preventDefault();
         if (selectedExpression) {
           const currentExpression = expressions.find(exp => exp.id === selectedExpression);
           if (currentExpression && currentExpression.text.length > 0) {
             const newText = currentExpression.text.slice(0, -1);
             updateExpression(selectedExpression, newText);
           }
         }
       }
       
       if (e.key === 'Delete') {
         e.preventDefault();
         if (selectedExpression) {
           // Deletar expressão atual
           const newExpressions = expressions.filter(exp => exp.id !== selectedExpression);
           saveToHistory(newExpressions);
           setSelectedExpression(null);
         }
       }
       
       if (e.key === 'Tab') {
         e.preventDefault();
         // Navegar entre expressões
         if (expressions.length > 0) {
           if (!selectedExpression) {
             setSelectedExpression(expressions[0].id);
           } else {
             const currentIndex = expressions.findIndex(exp => exp.id === selectedExpression);
             const nextIndex = (currentIndex + 1) % expressions.length;
             setSelectedExpression(expressions[nextIndex].id);
           }
         }
       }
    };

    document.addEventListener('keydown', handleGlobalKeyDown, { capture: true });
    return () => document.removeEventListener('keydown', handleGlobalKeyDown, { capture: true });
  }, [selectedExpression, expressions, saveToHistory, evaluateExpression]);

  // Aplicar foco automático ao carregar a aplicação
  useEffect(() => {
    const appElement = document.querySelector('.app');
    if (appElement) {
      appElement.focus();
    }
  }, []);

  return (
    <div className="app" tabIndex="-1">
      <TabBar
        tabs={tabs}
        activeTabId={activeTabId}
        onTabSelect={selectTab}
        onTabClose={closeTab}
        onNewTab={createNewTab}
        onTabRename={renameTab}
      />
      <CalculationArea
        expressions={expressions}
        selectedExpression={selectedExpression}
        onSelectExpression={(id, type) => {
          setSelectedExpression(id);
          setSelectedResultMode(type === 'result');
        }}
        onUpdateExpression={updateExpression}
        onAddExpression={addExpression}
        floatingButtons={floatingButtons}
        onSetFloatingButtons={setFloatingButtons}
        onUseResult={useResultInNewExpression}
        onOperationClick={handleOperationClick}
        onLabelNumber={handleLabelNumber}
        onRemoveLabels={handleRemoveLabels}
        onDeleteNumbers={handleDeleteNumbers}
        onEditNumber={handleEditNumber}
      />
      <Keyboard onInput={handleKeyboardInput} onUndo={handleUndo} />
    </div>
  );
}

export default App;