import React, { useState, useRef, useEffect } from 'react';
import './Expression.css';
import { formatNumber } from '../utils/calculator';

const Expression = ({
  expression,
  isSelected,
  onSelect,
  onUpdate,
  onShowFloatingButtons,
  onLabelNumber,
  onRemoveLabels,
  onDeleteNumbers,
  onEditNumber
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(expression.text);
  const [selectedNumbers, setSelectedNumbers] = useState(new Set());
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState(null);
  const [numberLabels, setNumberLabels] = useState(expression.labels || {});
  const inputRef = useRef(null);

  // Sincronizar texto quando a expressão muda
  useEffect(() => {
    setEditText(expression.text);
  }, [expression.text]);

  // Sincronizar legendas quando a expressão muda
  useEffect(() => {
    if (expression.labels) {
      setNumberLabels(expression.labels);
    }
  }, [expression.labels, expression.id, expression._lastUpdated]);

  // Focar no input quando selecionado
  useEffect(() => {
    if (isSelected && isEditing && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isSelected, isEditing]);

  // Entrar automaticamente em modo de edição quando selecionado e vazio
  useEffect(() => {
    if (isSelected && !expression.text) {
      setIsEditing(true);
    }
  }, [isSelected, expression.text]);

  // Lidar com teclas para números selecionados
  useEffect(() => {
    const handleKeyDown = (e) => {
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
      
      if (selectedNumbers.size > 0 && !isEditing) {
        if (e.key === 'Delete' || e.key === 'Backspace') {
          e.preventDefault();
          // Verificar se há legendas para remover primeiro
          const hasLabels = Array.from(selectedNumbers).some(numberKey => numberLabels[numberKey]);
          if (hasLabels) {
            removeLabelFromSelectedNumbers();
          } else {
            deleteSelectedNumbers();
          }
        } else if (e.key === 'Enter') {
          e.preventDefault();
          editSelectedNumbers();
        }
      }
    };

    if (isSelected) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [selectedNumbers, isSelected, isEditing, numberLabels]);

  // Efeito para lidar com mouse up global durante drag
  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mouseup', handleMouseUp);
      return () => document.removeEventListener('mouseup', handleMouseUp);
    }
  }, [isDragging]);

  // Lidar com clique na expressão
  const handleClick = (e) => {
    e.stopPropagation();
    onSelect();
    setIsEditing(true);
  };

  // Estilo para posicionamento
  const expressionStyle = expression.position ? {
    position: 'absolute',
    left: `${expression.position.x}px`,
    top: `${expression.position.y}px`,
    zIndex: 10
  } : {};

  // Função para formatar números enquanto digita
  const formatInputText = (text) => {
    // Dividir o texto em partes (números e não-números)
    return text.replace(/(\d{1,3}(?=\d))(\d{3})*(?=\d)/g, (match) => {
      // Aplicar formatação com pontos apenas em números com 4+ dígitos
      if (match.length >= 4) {
        return match.replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1.');
      }
      return match;
    });
  };

  // Lidar com mudanças no input
  const handleInputChange = (e) => {
    const rawValue = e.target.value;
    
    // Aplicar formatação automática em números inteiros com 4+ dígitos
    let formattedValue = rawValue;
    
    // Primeiro, limpar todos os pontos existentes dos números
    formattedValue = formattedValue.replace(/(\d+(?:\.\d*)*)/g, (match) => {
      return match.replace(/\./g, '');
    });
    
    // Depois aplicar formatação correta apenas em números com 4+ dígitos
    formattedValue = formattedValue.replace(/(\d{4,})/g, (match) => {
      return match.replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1.');
    });
    
    setEditText(formattedValue);
  };

  // Lidar com teclas no input
  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleBlur();
    } else if (e.key === 'Escape') {
      setEditText(expression.text);
      setIsEditing(false);
    }
  };

  // Lidar com perda de foco
  const handleBlur = () => {
    onUpdate(editText);
    setIsEditing(false);
  };

  // Lidar com clique no resultado
  const handleResultClick = (e) => {
    e.stopPropagation();
    if (expression.result !== null && expression.result !== undefined) {
      // Selecionar a expressão e marcar que o resultado foi clicado
      onSelect(expression.id, 'result');
      
      // Também mostrar os botões flutuantes como antes
      const rect = e.target.getBoundingClientRect();
      const position = {
        x: rect.left + rect.width / 2,
        y: rect.top - 10
      };
      onShowFloatingButtons(position, expression.result, 'result', {
        onLabelResult: (labelData) => {
          const resultKey = `result-${expression.result}`;
          const newLabels = { ...numberLabels, [resultKey]: labelData.label };
          setNumberLabels(newLabels);
          if (onLabelNumber) {
            onLabelNumber(expression.id, newLabels);
          }
        }
      });
    }
  };

  // Deletar números selecionados
  const deleteSelectedNumbers = () => {
    let newText = expression.text;
    const parts = newText.split(/(\d+(?:\.\d+)?)/g);
    
    // Marcar partes para remoção
    const partsToRemove = new Set();
    selectedNumbers.forEach(numberKey => {
      const [index] = numberKey.split('-');
      partsToRemove.add(parseInt(index));
    });
    
    // Criar novo texto sem os números selecionados
    const filteredParts = parts.filter((part, index) => {
      if (/^\d+(?:\.\d+)?$/.test(part) && partsToRemove.has(index)) {
        return false;
      }
      return true;
    });
    
    newText = filteredParts.join('');
    onUpdate(expression.id, newText);
    setSelectedNumbers(new Set());
  };

  // Função para remover legendas dos números selecionados
  const removeLabelFromSelectedNumbers = () => {
    if (selectedNumbers.size === 0) return;
    
    const numbersToRemoveLabels = Array.from(selectedNumbers);
    onRemoveLabels(expression.id, numbersToRemoveLabels);
  };

  // Editar números selecionados
  const editSelectedNumbers = () => {
    if (selectedNumbers.size === 1) {
      setIsEditing(true);
      // Focar no primeiro número selecionado
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
        }
      }, 0);
    }
  };

  // Lidar com clique em legenda para editá-la
  const handleLabelClick = (e, numberKey, currentLabel) => {
    e.stopPropagation();
    e.preventDefault();
    
    const newLabel = prompt('Editar legenda:', currentLabel);
    if (newLabel !== null) {
      if (newLabel.trim() === '') {
        // Se a legenda estiver vazia, removê-la
        onRemoveLabels(expression.id, [numberKey]);
      } else {
        // Atualizar a legenda
        onLabelNumber(expression.id, numberKey, newLabel.trim());
      }
    }
  };

  // Lidar com mouse down em número
  const handleNumberMouseDown = (e, number, index) => {
    e.stopPropagation();
    e.preventDefault();
    
    const numberKey = `${index}-${number}`;
    
    // Se não está arrastando, selecionar apenas este número
    if (!e.shiftKey && !e.ctrlKey && !e.metaKey) {
      setSelectedNumbers(new Set([numberKey]));
    }
    
    setIsDragging(true);
    setDragStart({ index, number, numberKey });
    
    // Manter funcionalidade original dos botões flutuantes
    const rect = e.target.getBoundingClientRect();
    const position = {
      x: rect.left + rect.width / 2,
      y: rect.top - 10
    };
    onShowFloatingButtons(position, number, 'number', {
      onLabelNumber: (labelData) => {
        const numberKey = `${index}-${number}`;
        const newLabels = { ...numberLabels, [numberKey]: labelData.label };
        setNumberLabels(newLabels);
        if (onLabelNumber) {
          onLabelNumber(expression.id, newLabels);
        }
      }
    });
  };

  // Lidar com mouse over durante drag
  const handleNumberMouseOver = (e, number, index) => {
    if (isDragging && dragStart) {
      e.preventDefault();
      const numberKey = `${index}-${number}`;
      const startIndex = dragStart.index;
      const endIndex = index;
      
      // Selecionar todos os números no intervalo
      const newSelectedNumbers = new Set();
      const minIndex = Math.min(startIndex, endIndex);
      const maxIndex = Math.max(startIndex, endIndex);
      
      const parts = expression.text.split(/(\d+(?:\.\d+)?)/g);
      parts.forEach((part, partIndex) => {
        if (/^\d+(?:\.\d+)?$/.test(part) && partIndex >= minIndex && partIndex <= maxIndex) {
          newSelectedNumbers.add(`${partIndex}-${parseFloat(part)}`);
        }
      });
      
      setSelectedNumbers(newSelectedNumbers);
    }
  };

  // Lidar com mouse up
  const handleMouseUp = () => {
    setIsDragging(false);
    setDragStart(null);
  };

  // Renderizar texto com números clicáveis
  const renderClickableText = (text) => {
    if (!text) return null;
    
    const parts = text.split(/(\d+(?:\.\d+)?)/g);
    return parts.map((part, index) => {
      if (/^\d+(?:\.\d+)?$/.test(part)) {
        const numberKey = `${index}-${parseFloat(part)}`;
        const isNumberSelected = selectedNumbers.has(numberKey);
        
        // Formatar o número com pontos se for um número inteiro >= 1000
        const formattedPart = /^\d+$/.test(part) && parseFloat(part) >= 1000 ? 
          formatNumber(parseFloat(part)) : part;
        
        const label = numberLabels[numberKey];
        return (
          <span
              key={`${expression.id}-number-${index}-${part}`}
              className={`number-with-label ${isNumberSelected ? 'selected-number' : ''}`}
              onMouseDown={(e) => handleNumberMouseDown(e, parseFloat(part), index)}
              onMouseOver={(e) => handleNumberMouseOver(e, parseFloat(part), index)}
            >
              <span className={`clickable-number ${isNumberSelected ? 'selected-number' : ''}`}>
                {formattedPart}
              </span>
              {label && (
                <span 
                  className="number-label"
                  onClick={(e) => handleLabelClick(e, numberKey, label)}
                >
                  {label}
                </span>
              )}
            </span>
        );
      }
      return <span key={`${expression.id}-text-${index}`}>{part}</span>;
    });
  };

  return (
    <div 
      className={`expression ${isSelected ? 'selected' : ''}`} 
      data-expression-id={expression.id}
      style={expressionStyle}
    >
      <div className="expression-content" onClick={handleClick}>
        {isEditing ? (
          <input
            ref={inputRef}
            type="text"
            value={editText}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            onBlur={handleBlur}
            className="expression-input"
          />
        ) : (
          <div className="expression-text">
            {expression.text ? renderClickableText(expression.text) : (
              <span className="empty-expression"></span>
            )}
          </div>
        )}
        
        {expression.result !== null && expression.result !== undefined && (
          <div className="result-container">
            {!expression.text.includes('=') && <span className="equals">=</span>}
            <span 
              className="result-value number-with-label"
              onClick={handleResultClick}
            >
              {typeof expression.result === 'number' ? 
                formatNumber(expression.result) : 
                expression.result
              }
              {(() => {
                const labelKey = `result-${expression.result}`;
                const label = numberLabels[labelKey];
                return label && (
                  <span 
                    className="number-label"
                    onClick={(e) => handleLabelClick(e, labelKey, label)}
                  >
                    {label}
                  </span>
                );
              })()}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default Expression;