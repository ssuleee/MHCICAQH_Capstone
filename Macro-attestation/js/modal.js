// modal.js
/**
 * Modal logic for Provider Data Portal
 * Handles modal open/close, focus trap, accessibility, and event listeners.
 * Direct refactor from index.js, no UI or functional changes.
 */

import { getSourceLink } from './utils.js';

/**
 * Show the review modal for a given update index.
 * @param {number} index
 * @param {object} modalState
 * @param {function} approveUpdate
 * @param {function} addEDTtoUpdateHistory
 */
export function showModal(index, modalState, approveUpdate, addEDTtoUpdateHistory) {
  const update = window.updates[index];
  modalState.index = index;
  modalState.originalNewValue = update.newValue.replace(/<br>/g, '\n');
  modalState.oldValue = update.oldValue.replace(/<br>/g, '\n');
  modalState.field = update.category;
  modalState.date = update.date;
  modalState.link = getSourceLink(update.source);
  document.getElementById('modal-field').textContent = modalState.field;
  document.getElementById('modal-new-value').value = modalState.originalNewValue;
  document.getElementById('modal-old-value').textContent = modalState.oldValue;
  document.getElementById('modal-link').href = modalState.link;
  // Render update history with hyperlinks and external link icons
  const historyDiv = document.getElementById('modal-update-history');
  historyDiv.innerHTML = '';
  const sourceLinks = {
    'Pennsylvania DHS': 'https://provider.enrollment.dhs.pa.gov/RequestInfo',
    'PA State Board': 'https://www.pa.gov/agencies/dos/department-and-offices/bpoa/boards-commissions/medicine.html',
    'PA Medical Board': 'https://www.pa.gov/agencies/dos/department-and-offices/bpoa/boards-commissions/medicine.html',
    'Diversion Control Division': 'https://www.deadiversion.usdoj.gov/',
    'Rx Minuteman Press': 'https://www.rxminutemanpress.com/'
  };
  function addExternalLinks(text) {
    Object.entries(sourceLinks).forEach(([name, url]) => {
      const icon = `<img src="files/external-link-icon.png" alt="external link" style="width:14px;height:14px;margin-left:4px;vertical-align:middle;opacity:0.7;display:inline;">`;
      text = text.replace(
        new RegExp(`(?<![\">])(${name})`, 'g'),
        `<a href="${url}" target="_blank" rel="noopener noreferrer" style="color:#205CB6;text-decoration:underline;">$1</a>${icon}`
      );
    });
    return text;
  }
  function formatShortYear(dateStr) {
    const parts = dateStr.split('/');
    if (parts.length === 3) {
      return `${parts[0]}/${parts[1]}/${parts[2].slice(-2)}`;
    }
    return dateStr;
  }
  if (update.updateHistory && Array.isArray(update.updateHistory) && update.updateHistory.length > 0) {
    update.updateHistory.forEach(item => {
      const entry = document.createElement('div');
      entry.style.border = '1.5px solid #e3e7ef';
      entry.style.borderRadius = '10px';
      entry.style.padding = '12px 16px';
      entry.style.marginBottom = '10px';
      entry.style.background = '#fff';
      entry.style.display = 'flex';
      entry.style.alignItems = 'center';
      entry.innerHTML = `
        <div style="min-width:56px;text-align:center;font-weight:700;font-size:16px;color:#205CB6;line-height:1.1;margin-right:16px;">
          <div>${formatShortYear(item.date)}</div>
          <div style="font-size:12px;font-weight:400;color:#8a97b1;">${item.time}</div>
        </div>
        <div style="flex:1;font-size:13px;">${addExternalLinks(item.text)}</div>
      `;
      historyDiv.appendChild(entry);
    });
  } else {
    historyDiv.innerHTML = '<div style="color:#8a97b1;font-size:13px;">No update history available.</div>';
  }
  document.getElementById('review-modal').style.display = 'flex';
  trapModalFocus();
  setTimeout(() => {
    const modal = document.getElementById('review-modal');
    const focusable = modal.querySelectorAll('button, [href], input, textarea, select, [tabindex]:not([tabindex="-1"])');
    if (focusable.length) focusable[0].focus();
  }, 0);
  const approveBtn = document.getElementById('modal-approve-btn');
  const revertBtn = document.getElementById('modal-revert-btn-bottom');
  const cancelBtn = document.getElementById('modal-cancel-btn');
  approveBtn.replaceWith(approveBtn.cloneNode(true));
  revertBtn.replaceWith(revertBtn.cloneNode(true));
  cancelBtn.replaceWith(cancelBtn.cloneNode(true));
  const approveBtnNew = document.getElementById('modal-approve-btn');
  const revertBtnNew = document.getElementById('modal-revert-btn-bottom');
  const cancelBtnNew = document.getElementById('modal-cancel-btn');
  approveBtnNew.addEventListener('click', function() {
    approveUpdate(index, null);
  });
  revertBtnNew.addEventListener('click', function() {
    approveUpdate(index, update.oldValue);
  });
  cancelBtnNew.addEventListener('click', function() {
    document.getElementById('modal-new-value').value = modalState.originalNewValue;
    hideModal();
  });
  if (typeof addEDTtoUpdateHistory === 'function') addEDTtoUpdateHistory();
}

/**
 * Hide the review modal.
 */
export function hideModal() {
  document.getElementById('review-modal').style.display = 'none';
  const modal = document.getElementById('review-modal');
  if (modal && modal._removeTrap) modal._removeTrap();
}

/**
 * Trap focus within the modal for accessibility.
 */
export function trapModalFocus() {
  const modal = document.getElementById('review-modal');
  if (!modal) return;
  const focusable = modal.querySelectorAll('button, [href], input, textarea, select, [tabindex]:not([tabindex="-1"])');
  const first = focusable[0];
  const last = focusable[focusable.length - 1];
  function handleTab(e) {
    if (e.key !== 'Tab') return;
    if (e.shiftKey) {
      if (document.activeElement === first) {
        e.preventDefault();
        last.focus();
      }
    } else {
      if (document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  }
  modal.addEventListener('keydown', handleTab);
  modal._removeTrap = () => modal.removeEventListener('keydown', handleTab);
}

/**
 * Add modal accessibility: close on outside click and Esc.
 */
export function addModalAccessibility() {
  const modal = document.getElementById('review-modal');
  if (!modal) return;
  modal.addEventListener('mousedown', function(e) {
    if (e.target === modal) {
      document.getElementById('modal-cancel-btn').click();
    }
  });
  document.addEventListener('keydown', function(e) {
    if (modal.style.display !== 'none' && (e.key === 'Escape' || e.key === 'Esc')) {
      document.getElementById('modal-cancel-btn').click();
    }
  });
} 