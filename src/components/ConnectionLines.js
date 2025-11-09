import React, { useEffect, useRef } from 'react';
import './ConnectionLines.css';

const ConnectionLines = ({ expressions }) => {
  const svgRef = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
    if (!svgRef.current || !containerRef.current) return;

    const svg = svgRef.current;
    const container = containerRef.current;
    
    // Limpar linhas existentes
    svg.innerHTML = '';
    
    // Redimensionar SVG para cobrir toda a área
    const rect = container.getBoundingClientRect();
    svg.setAttribute('width', rect.width);
    svg.setAttribute('height', rect.height);
    
    // Desenhar linhas de conexão
    expressions.forEach(expr => {
      if (expr.dependencies && expr.dependencies.length > 0) {
        expr.dependencies.forEach(depId => {
          drawConnectionLine(svg, depId, expr.id);
        });
      }
    });
  }, [expressions]);

  const drawConnectionLine = (svg, sourceId, targetId) => {
    // Encontrar elementos DOM das expressões
    const sourceElement = document.querySelector(`[data-expression-id="${sourceId}"] .result-value`);
    const targetElement = document.querySelector(`[data-expression-id="${targetId}"] .expression-text`);
    
    if (!sourceElement || !targetElement) return;
    
    const containerRect = containerRef.current.getBoundingClientRect();
    const sourceRect = sourceElement.getBoundingClientRect();
    const targetRect = targetElement.getBoundingClientRect();
    
    // Calcular posições relativas ao container
    const startX = sourceRect.left + sourceRect.width / 2 - containerRect.left;
    const startY = sourceRect.bottom - containerRect.top;
    const endX = targetRect.left + 20 - containerRect.left;
    const endY = targetRect.top + targetRect.height / 2 - containerRect.top;
    
    // Criar linha SVG
    const line = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    
    // Criar curva suave
    const controlY = startY + (endY - startY) * 0.3;
    const pathData = `M ${startX} ${startY} Q ${startX} ${controlY} ${endX} ${endY}`;
    
    line.setAttribute('d', pathData);
    line.setAttribute('stroke', '#87ceeb');
    line.setAttribute('stroke-width', '2');
    line.setAttribute('fill', 'none');
    line.setAttribute('opacity', '0.6');
    line.setAttribute('stroke-dasharray', '5,5');
    
    // Adicionar animação
    const animate = document.createElementNS('http://www.w3.org/2000/svg', 'animate');
    animate.setAttribute('attributeName', 'stroke-dashoffset');
    animate.setAttribute('values', '10;0');
    animate.setAttribute('dur', '2s');
    animate.setAttribute('repeatCount', 'indefinite');
    line.appendChild(animate);
    
    svg.appendChild(line);
    
    // Adicionar seta no final
    const arrow = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
    const arrowSize = 6;
    const angle = Math.atan2(endY - controlY, endX - startX);
    
    const arrowPoints = [
      [endX, endY],
      [endX - arrowSize * Math.cos(angle - Math.PI / 6), endY - arrowSize * Math.sin(angle - Math.PI / 6)],
      [endX - arrowSize * Math.cos(angle + Math.PI / 6), endY - arrowSize * Math.sin(angle + Math.PI / 6)]
    ];
    
    arrow.setAttribute('points', arrowPoints.map(p => p.join(',')).join(' '));
    arrow.setAttribute('fill', '#87ceeb');
    arrow.setAttribute('opacity', '0.6');
    
    svg.appendChild(arrow);
  };

  return (
    <div className="connection-lines" ref={containerRef}>
      <svg ref={svgRef} className="connection-svg">
        {/* Definir marcadores para setas */}
        <defs>
          <marker
            id="arrowhead"
            markerWidth="10"
            markerHeight="7"
            refX="9"
            refY="3.5"
            orient="auto"
          >
            <polygon
              points="0 0, 10 3.5, 0 7"
              fill="#87ceeb"
              opacity="0.6"
            />
          </marker>
        </defs>
      </svg>
    </div>
  );
};

export default ConnectionLines;