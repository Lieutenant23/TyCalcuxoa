import React, { useEffect, useRef, useState } from 'react';
import './FloatingButtons.css';

const FloatingButtons = ({
  position,
  value,
  type,
  onUseResult,
  onClose,
  onOperationClick,
  callbacks
}) => {
  const buttonsRef = useRef(null);
  const [showLabelInput, setShowLabelInput] = useState(false);
  const [labelText, setLabelText] = useState('');

  // Posicionar os botões
  useEffect(() => {
    if (buttonsRef.current && position) {
      const buttons = buttonsRef.current;
      const rect = buttons.getBoundingClientRect();
      
      // Calcular posição ajustada para não sair da tela
      let left = position.x - rect.width / 2;
      let top = position.y - rect.height - 10;
      
      // Ajustar se sair da tela horizontalmente
      if (left < 10) left = 10;
      if (left + rect.width > window.innerWidth - 10) {
        left = window.innerWidth - rect.width - 10;
      }
      
      // Ajustar se sair da tela verticalmente
      if (top < 10) {
        top = position.y + 30; // Mostrar abaixo do elemento
      }
      
      buttons.style.left = `${left}px`;
      buttons.style.top = `${top}px`;
    }
  }, [position]);

  const handleUseResult = () => {
    onUseResult();
    onClose();
  };



  const handleLabel = () => {
    setShowLabelInput(true);
  };

  const handleLabelSubmit = () => {
    if (labelText.trim()) {
      if (callbacks && callbacks.onLabelNumber && type === 'number') {
        callbacks.onLabelNumber({ value, label: labelText.trim() });
      } else if (callbacks && callbacks.onLabelResult && type === 'result') {
        callbacks.onLabelResult({ value, label: labelText.trim() });
      } else if (onOperationClick) {
        onOperationClick({ label: labelText.trim() });
      }
    }
    setShowLabelInput(false);
    setLabelText('');
    onClose();
  };

  const handleLabelCancel = () => {
    setShowLabelInput(false);
    setLabelText('');
  };

  const handleOperationClick = (operation) => {
    if (onOperationClick) {
      onOperationClick(operation);
    }
    onClose();
  };

  return (
    <>
      <div className="floating-buttons" ref={buttonsRef}>
        <div className="floating-buttons-container">
          <div className="main-buttons">
            <button 
              className="floating-button"
              onClick={handleLabel}
              title="Adicionar legenda"
            >
              <span className="button-icon">🏷️</span>
              <span className="button-text">Legendar</span>
            </button>
            
            {type === 'result' && (
              <button 
                className="floating-button primary"
                onClick={handleUseResult}
                title="Usar em nova expressão"
              >
                <span className="button-icon">⬇️</span>
              </button>
            )}
            
            {type === 'number' && (
              <button 
                className="floating-button primary"
                onClick={handleUseResult}
                title="Usar em nova expressão"
              >
                <span className="button-icon">⬇️</span>
              </button>
            )}
          </div>
          
          {(type === 'result' || type === 'number') && (
            <div className="operation-buttons">
              <button 
                className="floating-button operation"
                onClick={() => handleOperationClick(' + ')}
                title="Adicionar"
              >
                <span className="button-icon">+</span>
              </button>
              <button 
                className="floating-button operation"
                onClick={() => handleOperationClick(' − ')}
                title="Subtrair"
              >
                <span className="button-icon">−</span>
              </button>
              <button 
                className="floating-button operation"
                onClick={() => handleOperationClick(' × ')}
                title="Multiplicar"
              >
                <span className="button-icon">×</span>
              </button>
              <button 
                className="floating-button operation"
                onClick={() => handleOperationClick(' ÷ ')}
                title="Dividir"
              >
                <span className="button-icon">÷</span>
              </button>
            </div>
          )}

        </div>
        
        <div className="floating-buttons-arrow"></div>
      </div>
      
      {showLabelInput && (
        <div className="label-modal-overlay">
          <div className="label-modal">
            <h3>Digite a legenda</h3>
            <input
              type="text"
              className="label-input"
              value={labelText}
              onChange={(e) => setLabelText(e.target.value)}
              placeholder="Digite a legenda..."
              autoFocus
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  handleLabelSubmit();
                } else if (e.key === 'Escape') {
                  handleLabelCancel();
                }
              }}
            />
            <div className="label-modal-buttons">
              <button onClick={handleLabelCancel}>Cancelar</button>
              <button onClick={handleLabelSubmit}>OK</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default FloatingButtons;