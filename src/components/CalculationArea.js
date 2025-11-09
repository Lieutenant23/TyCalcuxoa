import React, { useRef, useEffect } from 'react';
import './CalculationArea.css';
import Expression from './Expression';
import FloatingButtons from './FloatingButtons';
import ConnectionLines from './ConnectionLines';

const CalculationArea = ({
  expressions,
  selectedExpression,
  onSelectExpression,
  onUpdateExpression,
  onAddExpression,
  floatingButtons,
  onSetFloatingButtons,
  onUseResult,
  onOperationClick,
  onLabelNumber,
  onRemoveLabels,
  onDeleteNumbers,
  onEditNumber
}) => {
  const areaRef = useRef(null);

  // Função para lidar com clique na área vazia
  const handleAreaClick = (e) => {
    // Verificar se o clique não foi em uma expressão ou botão
    if (!e.target.closest('.expression') && !e.target.closest('.floating-buttons')) {
      // Obter posição do clique relativa ao container
      const rect = areaRef.current.getBoundingClientRect();
      
      // Obter o padding do container através do computed style
      const computedStyle = window.getComputedStyle(areaRef.current);
      const paddingLeft = parseFloat(computedStyle.paddingLeft) || 0;
      const paddingTop = parseFloat(computedStyle.paddingTop) || 0;
      
      // Calcular posição considerando o padding
      const x = e.clientX - rect.left - paddingLeft;
      const y = e.clientY - rect.top - paddingTop;
      
      // Clique na área vazia - criar nova expressão na posição do clique
      const newId = onAddExpression(x, y);
      onSelectExpression(newId);
      onSetFloatingButtons(null);
    }
  };

  // Fechar botões flutuantes ao clicar fora
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!e.target.closest('.floating-buttons') && !e.target.closest('.result-value')) {
        onSetFloatingButtons(null);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [onSetFloatingButtons]);

  return (
    <div className="calculation-area" ref={areaRef} onClick={handleAreaClick}>
      <ConnectionLines expressions={expressions} />
      
      <div className="expressions-container">
        {expressions.map((expression, index) => (
          <Expression
            key={expression.id}
            expression={expression}
            isSelected={selectedExpression === expression.id}
            onSelect={(id, type) => onSelectExpression(id || expression.id, type)}
            onUpdate={(text) => onUpdateExpression(expression.id, text)}
            onShowFloatingButtons={(position, value, type, callbacks) => 
              onSetFloatingButtons({ position, value, type, expressionId: expression.id, callbacks })
            }
            onLabelNumber={onLabelNumber}
            onRemoveLabels={onRemoveLabels}
            onDeleteNumbers={onDeleteNumbers}
            onEditNumber={onEditNumber}
          />
        ))}
      </div>

      {floatingButtons && (
        <FloatingButtons
          position={floatingButtons.position}
          value={floatingButtons.value}
          type={floatingButtons.type}
          onUseResult={() => onUseResult(floatingButtons.expressionId, floatingButtons.value)}
          onOperationClick={(operation) => onOperationClick(floatingButtons.expressionId, floatingButtons.value, operation)}
          onClose={() => onSetFloatingButtons(null)}
          callbacks={floatingButtons.callbacks}
        />
      )}
    </div>
  );
};

export default CalculationArea;