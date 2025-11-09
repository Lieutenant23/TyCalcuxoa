import React from 'react';
import './Keyboard.css';

const Keyboard = ({ onInput, onUndo }) => {
  const keyboardRows = [
    [
      { label: 'C', value: 'clear_all', type: 'function' },
      { label: '⌫', value: 'backspace', type: 'function' },
      { label: '↶', value: 'undo', type: 'function' },
      { label: '÷', value: ' ÷ ', type: 'operator' }
    ],
    [
      { label: '7', value: '7' },
      { label: '8', value: '8' },
      { label: '9', value: '9' },
      { label: '×', value: ' × ', type: 'operator' }
    ],
    [
      { label: '4', value: '4' },
      { label: '5', value: '5' },
      { label: '6', value: '6' },
      { label: '−', value: ' − ', type: 'operator' }
    ],
    [
      { label: '1', value: '1' },
      { label: '2', value: '2' },
      { label: '3', value: '3' },
      { label: '+', value: ' + ', type: 'operator' }
    ],
    [
      { label: '(', rightLabel: ')', value: '(', rightValue: ')', type: 'parentheses' },
      { label: '0', value: '0' },
      { label: ',', rightLabel: '%', value: '.', rightValue: ' % ', type: 'percent-comma' },
      { label: '=', value: '=', type: 'equals' }
    ]
  ];

  const handleButtonClick = (button, event) => {
    if (button.value === 'undo') {
      onUndo && onUndo();
    } else if (button.type === 'parentheses') {
      // Detectar qual lado do botão foi clicado
      const rect = event.target.getBoundingClientRect();
      const clickX = event.clientX - rect.left;
      const buttonWidth = rect.width;
      
      if (clickX < buttonWidth / 2) {
        onInput('('); // Lado esquerdo - parêntese aberto
      } else {
        onInput(')'); // Lado direito - parêntese fechado
      }
    } else if (button.type === 'percent-comma') {
      // Detectar qual lado do botão foi clicado
      const rect = event.target.getBoundingClientRect();
      const clickX = event.clientX - rect.left;
      const buttonWidth = rect.width;
      
      if (clickX < buttonWidth / 2) {
        onInput('.'); // Lado esquerdo - vírgula (ponto decimal)
      } else {
        onInput(' % '); // Lado direito - porcentagem
      }
    } else {
      onInput(button.value);
    }
  };

  const getButtonClass = (button) => {
    let className = 'keyboard-button';
    if (button.type === 'operator') className += ' operator';
    if (button.type === 'function') className += ' function';
    if (button.type === 'equals') className += ' equals';
    if (button.type === 'empty') className += ' empty';
    return className;
  };

  return (
    <div className="keyboard">
      {keyboardRows.map((row, rowIndex) => (
        <div key={`row-${rowIndex}`} className="keyboard-row">
          {row.map((button, buttonIndex) => (
            <button
                key={`${rowIndex}-${buttonIndex}-${button.label}`}
                className={getButtonClass(button)}
                onClick={(event) => handleButtonClick(button, event)}
              >
                {button.type === 'parentheses' || button.type === 'percent-comma' ? (
                  <>
                    <div className="left-symbol">{button.label}</div>
                    <div className="right-symbol">{button.rightLabel}</div>
                  </>
                ) : (
                  button.label
                )}
              </button>
          ))}
        </div>
      ))}
    </div>
  );
};

export default Keyboard;