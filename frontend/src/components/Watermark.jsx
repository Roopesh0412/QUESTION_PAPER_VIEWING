import React, { useMemo } from 'react';

export default function Watermark({ email = '', loginTime = '', sessionId = '' }) {
  const watermarkBgStyle = useMemo(() => {
    // Escape email and format time
    const safeEmail = email || 'no-email';
    const safeTime = loginTime || new Date().toLocaleString();
    const safeSession = sessionId || 'no-session';

    // SVG repeating pattern containing both permanent and dynamic traceable watermark
    const svgString = `
      <svg xmlns="http://www.w3.org/2000/svg" width="400" height="300">
        <style>
          .primary-wm {
            font-family: 'Outfit', 'Inter', sans-serif;
            font-size: 16px;
            font-weight: 800;
            fill: rgba(148, 163, 184, 0.08);
            letter-spacing: 2px;
          }
          .secondary-wm {
            font-family: 'Inter', sans-serif;
            font-size: 11px;
            font-weight: 500;
            fill: rgba(148, 163, 184, 0.07);
          }
        </style>
        <g transform="rotate(-25 200 150)">
          <text x="50%" y="35%" text-anchor="middle" class="primary-wm">MANCHESTER TECHNOLOGIES</text>
          <text x="50%" y="50%" text-anchor="middle" class="secondary-wm">${safeEmail}</text>
          <text x="50%" y="60%" text-anchor="middle" class="secondary-wm">${safeTime}</text>
          <text x="50%" y="70%" text-anchor="middle" class="secondary-wm">Session: ${safeSession}</text>
        </g>
      </svg>
    `;

    // Base64 encode to safely set as background image
    const base64Svg = btoa(unescape(encodeURIComponent(svgString)));
    return {
      backgroundImage: `url("data:image/svg+xml;base64,${base64Svg}")`,
    };
  }, [email, loginTime, sessionId]);

  return (
    <>
      {/* Dynamic and Permanent Watermark Overlay (Click-Through) */}
      <div 
        className="fixed inset-0 pointer-events-none select-none z-[9999] bg-repeat opacity-100"
        style={watermarkBgStyle}
        aria-hidden="true"
        id="app-watermark-overlay"
      />

      {/* Print-specific Watermark & Alert stylesheet */}
      <style>{`
        @media print {
          /* Hide the main application root */
          #root {
            display: none !important;
          }
          /* Show print warning block with full repeating watermark */
          #print-prevent-overlay {
            display: block !important;
            position: fixed !important;
            inset: 0 !important;
            width: 100vw !important;
            height: 100vh !important;
            background-color: white !important;
            z-index: 9999999 !important;
          }
          .print-watermark-grid {
            position: absolute;
            inset: 0;
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 100px;
            padding: 50px;
            opacity: 0.15;
            transform: rotate(-15deg);
          }
          .print-wm-item {
            text-align: center;
            font-family: sans-serif;
            font-weight: bold;
            border: 2px dashed #94a3b8;
            padding: 20px;
            page-break-inside: avoid;
          }
        }
      `}</style>

      {/* Container displayed ONLY when printing is triggered (managed via CSS media print) */}
      <div id="print-prevent-overlay" className="hidden" style={{ pageBreakBefore: 'always' }}>
        <div className="flex flex-col items-center justify-center h-full min-h-screen text-center px-8 relative bg-white">
          <div className="max-w-md border-4 border-red-500 rounded-xl p-8 bg-red-50 shadow-2xl relative z-10">
            <span className="text-6xl">⚠️</span>
            <h1 className="text-3xl font-extrabold text-red-600 mt-4 tracking-wider">UNAUTHORIZED ACTION</h1>
            <p className="text-slate-700 font-semibold mt-4">
              Printing of these questions is strictly prohibited by Manchester Technologies.
            </p>
            <p className="text-slate-500 text-sm mt-6">
              This action, including user details, IP address, and timestamp, has been logged to the security audit server.
            </p>
            <div className="mt-8 border-t border-red-200 pt-4 text-xs font-mono text-slate-400">
              User: {email || 'unknown'} <br />
              Session ID: {sessionId || 'unknown'}
            </div>
          </div>
          
          {/* Repeating watermark grid visible on the printed sheets */}
          <div className="print-watermark-grid">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="print-wm-item">
                <h3 className="text-xl">MANCHESTER TECHNOLOGIES</h3>
                <p className="text-sm font-mono mt-1">{email}</p>
                <p className="text-xs font-mono mt-0.5">Session: {sessionId}</p>
                <p className="text-xs font-mono mt-0.5">{loginTime}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
