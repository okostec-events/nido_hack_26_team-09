import { memo, useEffect, useState } from 'react';

const InfrastructureIcon = memo(function InfrastructureIcon({ type, cell, animateIn = false }) {
  const [visible, setVisible] = useState(!animateIn);
  const [scale, setScale] = useState(animateIn ? 0 : 1);

  useEffect(() => {
    if (animateIn) {
      setVisible(true);
      requestAnimationFrame(() => {
        setScale(1.15);
        setTimeout(() => setScale(1), 200);
      });
    }
  }, [animateIn]);

  if (!visible) return null;

  const style = {
    transform: `scale(${scale})`,
    transition: 'transform 350ms cubic-bezier(0.34, 1.56, 0.64, 1)',
  };

  switch (type) {
    case 'solar': return <SolarIcon style={style} />;
    case 'wind': return <WindIcon windIndex={cell?.windIndex || 50} style={style} />;
    case 'substation': return <SubstationIcon style={style} />;
    case 'transmission': return <TransmissionIcon style={style} />;
    case 'floodBarrier': return <FloodBarrierIcon style={style} />;
    case 'weatherStation': return <WeatherStationIcon style={style} />;
    case 'battery': return <BatteryIcon style={style} />;
    default: return null;
  }
});

function SolarIcon({ style }) {
  return (
    <g style={style}>
      <g transform="translate(-10, -14)">
        {/* Solar panels 2x3 grid */}
        {[0, 1].map(row =>
          [0, 1, 2].map(col => (
            <rect
              key={`${row}-${col}`}
              x={col * 7}
              y={row * 5}
              width={6}
              height={4}
              fill="#FFD54F"
              stroke="#CC9A00"
              strokeWidth={0.5}
              rx={0.5}
            />
          ))
        )}
        {/* Sun reflection */}
        <polygon points="1,1 4,1 2.5,2.5" fill="white" opacity={0.2} />
      </g>
      {/* Shadow */}
      <ellipse cx={0} cy={2} rx={10} ry={3} fill="rgba(0,0,0,0.15)" />
    </g>
  );
}

function WindIcon({ windIndex, style }) {
  const speed = windIndex > 70 ? 2.5 : windIndex < 30 ? 7 : 4;

  return (
    <g style={style}>
      {/* Shadow */}
      <ellipse cx={0} cy={2} rx={4} ry={2} fill="rgba(0,0,0,0.15)" />
      {/* Tower */}
      <rect x={-1} y={-18} width={2} height={18} fill="#B0BEC5" />
      {/* Nacelle */}
      <rect x={-2} y={-20} width={4} height={2} fill="#90A4AE" rx={0.5} />
      {/* Blades - rotate around nacelle center */}
      <g>
        <animateTransform
          attributeName="transform"
          type="rotate"
          from="0 0 -19"
          to="360 0 -19"
          dur={`${speed}s`}
          repeatCount="indefinite"
        />
        <line x1={0} y1={-19} x2={0} y2={-29} stroke="#E8EAED" strokeWidth={1.5} strokeLinecap="round" />
        <line x1={0} y1={-19} x2={8.66} y2={-14} stroke="#E8EAED" strokeWidth={1.5} strokeLinecap="round" />
        <line x1={0} y1={-19} x2={-8.66} y2={-14} stroke="#E8EAED" strokeWidth={1.5} strokeLinecap="round" />
      </g>
    </g>
  );
}

function SubstationIcon({ style }) {
  return (
    <g style={style}>
      {/* Pulsing glow */}
      <circle cx={0} cy={0} r={6} fill="none" stroke="#00E676" strokeWidth={1} opacity={0.3}>
        <animate attributeName="r" values="6;18;6" dur="2s" repeatCount="indefinite" />
        <animate attributeName="opacity" values="0.3;0;0.3" dur="2s" repeatCount="indefinite" />
      </circle>
      {/* Building */}
      <rect x={-5} y={-8} width={10} height={8} fill="#1A3A2A" rx={1} />
      <rect x={-5} y={-9} width={10} height={2} fill="#00E676" rx={0.5} />
      {/* Lightning bolt */}
      <polygon points="-1,-6 1,-6 0,-3 2,-3 -1,1 0,-2 -2,-2" fill="#00E676" opacity={0.9} />
    </g>
  );
}

function TransmissionIcon({ style }) {
  return (
    <g style={style}>
      {/* Poles */}
      <rect x={-12} y={-8} width={1.5} height={8} fill="#78909C" />
      <rect x={10.5} y={-8} width={1.5} height={8} fill="#78909C" />
      {/* Catenary cable */}
      <path
        d="M-11,-6 Q0,-2 11,-6"
        fill="none"
        stroke="#00E676"
        strokeWidth={1}
        opacity={0.7}
        id="catenaryPath"
      />
      {/* Energy dot */}
      <circle r={1.5} fill="#00E676">
        <animateMotion dur="2s" repeatCount="indefinite" path="M-11,-6 Q0,-2 11,-6" />
      </circle>
      <circle r={1.5} fill="#00E676">
        <animateMotion dur="2s" repeatCount="indefinite" path="M11,-6 Q0,-2 -11,-6" />
      </circle>
    </g>
  );
}

function FloodBarrierIcon({ style }) {
  return (
    <g style={style}>
      {/* Wall */}
      <rect x={-12} y={-3} width={24} height={3} fill="#78909C" rx={0.5} />
      <rect x={-12} y={-4} width={24} height={1} fill="#4FC3F7" opacity={0.7} />
      {/* Base */}
      <rect x={-12} y={0} width={24} height={1.5} fill="#546E7A" />
    </g>
  );
}

function WeatherStationIcon({ style }) {
  return (
    <g style={style}>
      {/* Base platform */}
      <rect x={-3} y={-2} width={6} height={2} fill="#37474F" rx={0.5} />
      {/* Mast */}
      <rect x={-0.75} y={-16} width={1.5} height={14} fill="#E8EAED" />
      {/* Dish */}
      <path d="M-3,-16 Q0,-14 3,-16" fill="none" stroke="#448AFF" strokeWidth={1.5} strokeLinecap="round" />
      {/* Signal pulses */}
      <circle cx={0} cy={-16} r={4} fill="none" stroke="#448AFF" strokeWidth={0.8} opacity={0.3}>
        <animate attributeName="r" values="4;14;4" dur="2.5s" repeatCount="indefinite" />
        <animate attributeName="opacity" values="0.3;0;0.3" dur="2.5s" repeatCount="indefinite" />
      </circle>
      <circle cx={0} cy={-16} r={4} fill="none" stroke="#448AFF" strokeWidth={0.8} opacity={0.3}>
        <animate attributeName="r" values="4;14;4" dur="2.5s" repeatCount="indefinite" begin="1.25s" />
        <animate attributeName="opacity" values="0.3;0;0.3" dur="2.5s" repeatCount="indefinite" begin="1.25s" />
      </circle>
    </g>
  );
}

function BatteryIcon({ style }) {
  return (
    <g style={style}>
      {/* Container body */}
      <rect x={-6} y={-7} width={12} height={7} fill="#7B1FA2" rx={1} />
      <rect x={-6} y={-8} width={12} height={2} fill="#AB47BC" rx={0.5} />
      {/* Charge bars */}
      <rect x={-4} y={-5.5} width={8} height={1} fill="#CE93D8" opacity={0.6} rx={0.5} />
      <rect x={-4} y={-3.5} width={8} height={1} fill="#CE93D8" opacity={0.6} rx={0.5} />
      <rect x={-4} y={-1.5} width={6} height={1} fill="#CE93D8" opacity={0.4} rx={0.5} />
      {/* Glow */}
      <ellipse cx={0} cy={1} rx={8} ry={3} fill="rgba(171,71,188,0.15)" />
    </g>
  );
}

export default InfrastructureIcon;
