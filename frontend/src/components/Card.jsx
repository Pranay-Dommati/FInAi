// src/components/Card.jsx
import React from 'react';

const Card = ({ children, className = '', ...props }) => {
  return (
    <div 
      className={`bg-white/80 backdrop-blur-sm p-6 rounded-xl shadow-lg border border-white/20 hover:shadow-xl transition-all duration-300 ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

export default Card;
