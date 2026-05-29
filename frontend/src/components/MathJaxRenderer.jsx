import React, { useEffect, useRef } from 'react';

export default function MathJaxRenderer({ content, className = '' }) {
  const containerRef = useRef(null);

  useEffect(() => {
    if (containerRef.current && window.MathJax && window.MathJax.typesetPromise) {
      // Direct MathJax to typeset only this specific container for maximum performance
      window.MathJax.typesetPromise([containerRef.current])
        .catch((err) => console.error('MathJax typeset error:', err));
    }
  }, [content]);

  // Set the class "tex2jax_process" so that MathJax knows to scan and process this container
  return (
    <div 
      ref={containerRef} 
      className={`tex2jax_process ${className}`}
      dangerouslySetInnerHTML={{ __html: content }}
    />
  );
}
