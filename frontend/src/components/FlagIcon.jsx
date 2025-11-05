import React from 'react';

// Componentes SVG de banderas con colores oficiales y proporciones correctas

const SpainFlag = ({ className = "w-6 h-4" }) => (
  <svg className={className} viewBox="0 0 3 2" xmlns="http://www.w3.org/2000/svg">
    <rect width="3" height="2" fill="#c60b1e"/>
    <rect width="3" height="1" y="0.5" fill="#ffc400"/>
  </svg>
);

const UKFlag = ({ className = "w-6 h-4" }) => (
  <svg className={className} viewBox="0 0 60 30" xmlns="http://www.w3.org/2000/svg">
    <rect width="60" height="30" fill="#012169"/>
    {/* Diagonales blancas */}
    <g stroke="#fff" strokeWidth="6">
      <path d="m0,0 60,30 m0,-30 -60,30"/>
    </g>
    {/* Diagonales rojas */}
    <g stroke="#c8102e" strokeWidth="4">
      <path d="m0,0 60,30 m0,-30 -60,30"/>
    </g>
    {/* Cruz blanca */}
    <g stroke="#fff" strokeWidth="10">
      <path d="m30,0 0,30 m-30,-15 60,0"/>
    </g>
    {/* Cruz roja */}
    <g stroke="#c8102e" strokeWidth="6">
      <path d="m30,0 0,30 m-30,-15 60,0"/>
    </g>
  </svg>
);

const GermanyFlag = ({ className = "w-6 h-4" }) => (
  <svg className={className} viewBox="0 0 5 3" xmlns="http://www.w3.org/2000/svg">
    <rect width="5" height="1" fill="#000"/>
    <rect width="5" height="1" y="1" fill="#dd0000"/>
    <rect width="5" height="1" y="2" fill="#ffce00"/>
  </svg>
);

const ItalyFlag = ({ className = "w-6 h-4" }) => (
  <svg className={className} viewBox="0 0 3 2" xmlns="http://www.w3.org/2000/svg">
    <rect width="1" height="2" fill="#009246"/>
    <rect width="1" height="2" x="1" fill="#fff"/>
    <rect width="1" height="2" x="2" fill="#ce2b37"/>
  </svg>
);

const FranceFlag = ({ className = "w-6 h-4" }) => (
  <svg className={className} viewBox="0 0 3 2" xmlns="http://www.w3.org/2000/svg">
    <rect width="1" height="2" fill="#002395"/>
    <rect width="1" height="2" x="1" fill="#fff"/>
    <rect width="1" height="2" x="2" fill="#ed2939"/>
  </svg>
);

const PolandFlag = ({ className = "w-6 h-4" }) => (
  <svg className={className} viewBox="0 0 8 5" xmlns="http://www.w3.org/2000/svg">
    <rect width="8" height="2.5" fill="#fff"/>
    <rect width="8" height="2.5" y="2.5" fill="#dc143c"/>
  </svg>
);

const ChinaFlag = ({ className = "w-6 h-4" }) => (
  <svg className={className} viewBox="0 0 30 20" xmlns="http://www.w3.org/2000/svg">
    <rect width="30" height="20" fill="#de2910"/>
    {/* Estrella grande */}
    <polygon points="5,4 6.18,7.36 10,7.36 7.09,9.64 8.27,13 5,10.72 1.73,13 2.91,9.64 0,7.36 3.82,7.36" fill="#ffde00"/>
    {/* Estrellas pequeñas */}
    <polygon points="12,2 12.59,3.18 14,3.18 12.91,4.09 13.5,5.27 12,4.36 10.5,5.27 11.09,4.09 10,3.18 11.41,3.18" fill="#ffde00"/>
    <polygon points="14,4 14.59,5.18 16,5.18 14.91,6.09 15.5,7.27 14,6.36 12.5,7.27 13.09,6.09 12,5.18 13.41,5.18" fill="#ffde00"/>
    <polygon points="14,8 14.59,9.18 16,9.18 14.91,10.09 15.5,11.27 14,10.36 12.5,11.27 13.09,10.09 12,9.18 13.41,9.18" fill="#ffde00"/>
    <polygon points="12,10 12.59,11.18 14,11.18 12.91,12.09 13.5,13.27 12,12.36 10.5,13.27 11.09,12.09 10,11.18 11.41,11.18" fill="#ffde00"/>
  </svg>
);

const JapanFlag = ({ className = "w-6 h-4" }) => (
  <svg className={className} viewBox="0 0 3 2" xmlns="http://www.w3.org/2000/svg">
    <rect width="3" height="2" fill="#fff"/>
    <circle cx="1.5" cy="1" r="0.6" fill="#bc002d"/>
  </svg>
);

// Componente principal que selecciona la bandera correcta
const FlagIcon = ({ countryCode, className = "w-6 h-4" }) => {
  const flags = {
    'es': SpainFlag,
    'en': UKFlag,
    'de': GermanyFlag,
    'it': ItalyFlag,
    'fr': FranceFlag,
    'pl': PolandFlag,
    'zh': ChinaFlag,
    'ja': JapanFlag,
  };

  const FlagComponent = flags[countryCode];
  
  if (!FlagComponent) {
    // Fallback para códigos de país no soportados
    return (
      <div className={`${className} bg-gray-300 rounded flex items-center justify-center text-xs font-bold text-gray-600`}>
        {countryCode?.toUpperCase()}
      </div>
    );
  }

  return <FlagComponent className={className} />;
};

export default FlagIcon;