import React, { useState } from 'react';
import './TabBar.css';

const TabBar = ({ tabs, activeTabId, onTabSelect, onTabClose, onNewTab, onTabRename }) => {
  const [editingTabId, setEditingTabId] = useState(null);
  const [editingTitle, setEditingTitle] = useState('');

  const startEditing = (tab) => {
    setEditingTabId(tab.id);
    setEditingTitle(tab.title);
  };

  const finishEditing = () => {
    if (editingTabId && editingTitle.trim()) {
      onTabRename(editingTabId, editingTitle.trim());
    }
    setEditingTabId(null);
    setEditingTitle('');
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      finishEditing();
    } else if (e.key === 'Escape') {
      setEditingTabId(null);
      setEditingTitle('');
    }
  };
  return (
    <div className="tab-bar">
      <div className="tabs-container">
        {tabs.map(tab => (
          <div
            key={tab.id}
            className={`tab ${tab.id === activeTabId ? 'active' : ''}`}
          >
            {editingTabId === tab.id ? (
              <input
                type="text"
                className="tab-title-input"
                value={editingTitle}
                onChange={(e) => setEditingTitle(e.target.value)}
                onBlur={finishEditing}
                onKeyDown={handleKeyPress}
                autoFocus
              />
            ) : (
              <span
                className="tab-title"
                onClick={() => onTabSelect(tab.id)}
                onDoubleClick={() => startEditing(tab)}
                title="Duplo clique para renomear"
              >
                {tab.title}
              </span>
            )}
            {tabs.length > 1 && (
              <button
                className="tab-close"
                onClick={(e) => {
                  e.stopPropagation();
                  onTabClose(tab.id);
                }}
              >
                ×
              </button>
            )}
          </div>
        ))}
        <button className="new-tab-button" onClick={onNewTab}>
          +
        </button>
      </div>
    </div>
  );
};

export default TabBar;