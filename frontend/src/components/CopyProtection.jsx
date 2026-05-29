import React, { useEffect, useState } from 'react';
import axios from 'axios';

export default function CopyProtection({ apiClient }) {
  const [toasts, setToasts] = useState([]);

  const triggerToast = (message) => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message }]);
    
    // Auto remove toast after 4 seconds
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  const logAttempt = async (actionName) => {
    if (!apiClient) return;
    try {
      await apiClient.post('/log-restricted-action', { action: actionName });
    } catch (err) {
      console.error('Failed to log restricted action:', err);
    }
  };

  useEffect(() => {
    // 1. Right Click blocking
    const handleContextMenu = (e) => {
      e.preventDefault();
      triggerToast('Right-click context menu is disabled on this portal.');
      logAttempt('right_click');
    };

    // 2. Select start blocking (fallback for CSS select-none)
    const handleSelectStart = (e) => {
      e.preventDefault();
    };

    // 3. Drag start blocking (dragging images/text)
    const handleDragStart = (e) => {
      e.preventDefault();
    };

    // 4. Copy/Cut/Paste blocking
    const handleCopy = (e) => {
      e.preventDefault();
      triggerToast('Copying content is strictly prohibited.');
      logAttempt('copy_event');
    };
    
    const handleCut = (e) => {
      e.preventDefault();
      triggerToast('Cutting content is strictly prohibited.');
      logAttempt('cut_event');
    };

    const handlePaste = (e) => {
      e.preventDefault();
      triggerToast('Pasting content is disabled.');
      logAttempt('paste_event');
    };

    // 5. Key shortcuts blocking
    const handleKeyDown = (e) => {
      const isCtrl = e.ctrlKey || e.metaKey; // supports Mac command key
      const key = e.key.toLowerCase();

      // Block PrintScreen key
      if (e.key === 'PrintScreen' || e.key === 'Snapshot') {
        e.preventDefault();
        (async () => {
          await logAttempt('screenshot');
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          window.location.href = '/login?reason=screenshot_violation';
        })();
        return;
      }

      // Block Windows Snipping Tool (Meta+Shift+S)
      if (e.metaKey && e.shiftKey && key === 's') {
        e.preventDefault();
        (async () => {
          await logAttempt('screenshot');
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          window.location.href = '/login?reason=screenshot_violation';
        })();
        return;
      }

      // Block macOS Screenshot (Cmd+Shift+4 / Cmd+Shift+3)
      if (e.metaKey && e.shiftKey && (key === '4' || key === '3')) {
        e.preventDefault();
        (async () => {
          await logAttempt('screenshot');
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          window.location.href = '/login?reason=screenshot_violation';
        })();
        return;
      }

      // Block Ctrl+C (copy)
      if (isCtrl && key === 'c') {
        e.preventDefault();
        triggerToast('Shortcut copy (Ctrl+C) is disabled.');
        logAttempt('shortcut_ctrl_c');
      }
      
      // Block Ctrl+X (cut)
      if (isCtrl && key === 'x') {
        e.preventDefault();
        triggerToast('Shortcut cut (Ctrl+X) is disabled.');
        logAttempt('shortcut_ctrl_x');
      }

      // Block Ctrl+V (paste)
      if (isCtrl && key === 'v') {
        e.preventDefault();
        triggerToast('Shortcut paste (Ctrl+V) is disabled.');
        logAttempt('shortcut_ctrl_v');
      }

      // Block Ctrl+A (select all)
      if (isCtrl && key === 'a') {
        e.preventDefault();
        triggerToast('Select all (Ctrl+A) is disabled.');
        logAttempt('shortcut_ctrl_a');
      }

      // Block Ctrl+P (print)
      if (isCtrl && key === 'p') {
        e.preventDefault();
        triggerToast('Printing is prohibited. Unauthorized print attempts are logged.');
        logAttempt('shortcut_ctrl_p');
      }

      // Block Ctrl+S (save page)
      if (isCtrl && key === 's') {
        e.preventDefault();
        triggerToast('Saving this webpage is disabled.');
        logAttempt('shortcut_ctrl_s');
      }

      // Block F12 (DevTools)
      if (e.key === 'F12') {
        e.preventDefault();
        triggerToast('Developer Tools access shortcut is disabled.');
        logAttempt('shortcut_f12');
      }

      // Block Ctrl+Shift+I / Ctrl+Shift+J (DevTools)
      if (isCtrl && e.shiftKey && (key === 'i' || key === 'j')) {
        e.preventDefault();
        triggerToast('Developer Tools access shortcut is disabled.');
        logAttempt('shortcut_ctrl_shift_i_j');
      }

      // Block Ctrl+Shift+C (Inspect Element)
      if (isCtrl && e.shiftKey && key === 'c') {
        e.preventDefault();
        triggerToast('Inspect Element shortcut is disabled.');
        logAttempt('shortcut_ctrl_shift_c');
      }

      // Block Ctrl+U (view source)
      if (isCtrl && key === 'u') {
        e.preventDefault();
        triggerToast('Viewing source code is disabled.');
        logAttempt('shortcut_ctrl_u');
      }
    };

    const handleKeyUp = (e) => {
      if (e.key === 'PrintScreen' || e.key === 'Snapshot') {
        (async () => {
          await logAttempt('screenshot');
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          window.location.href = '/login?reason=screenshot_violation';
        })();
      }
    };

    // Attach event listeners
    window.addEventListener('contextmenu', handleContextMenu);
    window.addEventListener('selectstart', handleSelectStart);
    window.addEventListener('dragstart', handleDragStart);
    window.addEventListener('copy', handleCopy);
    window.addEventListener('cut', handleCut);
    window.addEventListener('paste', handlePaste);
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    // Inject global CSS rules
    const styleEl = document.createElement('style');
    styleEl.innerHTML = `
      body, html, #root {
        -webkit-user-select: none !important;
        -moz-user-select: none !important;
        -ms-user-select: none !important;
        user-select: none !important;
      }
      img {
        -webkit-user-drag: none !important;
        user-drag: none !important;
      }
    `;
    document.head.appendChild(styleEl);

    // Cleanup
    return () => {
      window.removeEventListener('contextmenu', handleContextMenu);
      window.removeEventListener('selectstart', handleSelectStart);
      window.removeEventListener('dragstart', handleDragStart);
      window.removeEventListener('copy', handleCopy);
      window.removeEventListener('cut', handleCut);
      window.removeEventListener('paste', handlePaste);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      document.head.removeChild(styleEl);
    };
  }, [apiClient]);

  return (
    <div className="fixed top-5 right-5 z-[100000] flex flex-col gap-2 max-w-sm pointer-events-none">
      {toasts.map((t) => (
        <div 
          key={t.id} 
          className="flex items-center gap-3 p-4 bg-slate-900/90 text-white rounded-lg shadow-2xl border border-red-500/30 backdrop-blur-md animate-slide-in pointer-events-auto"
        >
          <div className="bg-red-500/20 text-red-400 p-1.5 rounded-md">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <div className="flex-1 text-sm font-semibold leading-snug">
            {t.message}
          </div>
        </div>
      ))}
    </div>
  );
}
