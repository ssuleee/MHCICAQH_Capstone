import { renderTable, renderFilterOptions, updateSidebarBadges, approveUpdate, updateApproveAllBtn } from './js/table.js';
import { showModal, hideModal } from './js/modal.js';
// Data for updates table
window.updates = [
  {
    category: 'Practice Location',
    newValue: 'Harmony Health Clinic<br>999 Mission Bay Blvd North<br>Pittsburgh, PA 15213',
    oldValue: 'Harmony Health Clinic<br>789 Mission Bay Blvd North<br>Pittsburgh, PA 15213',
    date: '2025-07-20T09:15',
    source: 'Pennsylvania DHS',
    updateHistory: [
      {
        date: '6/20/2025',
        time: '9:15am',
        text: 'You updated this address in Pennsylvania DHS while completing provider enrollment for the Children\'s Health Insurance Program (CHIP).'
      },
      {
        date: '4/12/2024',
        time: '2:20pm',
        text: 'Your address was updated during an online revalidation with Keystone First, a Pennsylvania Medicaid MCO.'
      },
      {
        date: '2/15/2022',
        time: '1:00pm',
        text: 'This practice location was originally created and attested directly in CAQH Provider Data Portal.'
      }
    ]
  },
  {
    category: 'Professional ID',
    newValue: 'State: PA<br>Num: 123-456<br>Exp: 6/17/2027',
    oldValue: 'State: PA<br>Num: 123-456<br>Exp: 6/17/2025',
    date: '2025-06-17T14:34',
    source: 'PA State Board',
    updateHistory: [
      {
        date: '6/17/2025',
        time: '2:34pm',
        text: 'Renewed Professional ID with PA State Board.'
      },
      {
        date: '6/17/2023',
        time: '2:30pm',
        text: 'Previous Professional ID expired.'
      },
      {
        date: '6/17/2022',
        time: '2:00pm',
        text: 'Professional ID renewed with PA State Board.'
      },
      {
        date: '6/17/2021',
        time: '1:00pm',
        text: 'Professional ID created in CAQH.'
      }
    ]
  },
  {
    category: 'Professional Liability Insurance',
    newValue: 'Num: 02398473<br>Exp: 6/1/26',
    oldValue: 'Num: 20324812<br>Exp: 6/1/25',
    date: '2025-06-01T12:00',
    source: 'PA State Board',
    updateHistory: [
      {
        date: '6/1/2025',
        time: '12:00pm',
        text: 'License renewal information received from the PA Medical Board.'
      },
      {
        date: '5/30/2024',
        time: '10:00am',
        text: 'Previous license record marked as expired in state records.'
      },
      {
        date: '6/1/2023',
        time: '12:00pm',
        text: 'Policy information manually entered and attested in CAQH Provider Data Portal.'
      },
      {
        date: '6/1/2022',
        time: '9:00am',
        text: 'Initial license verification completed via automated check with the PA Medical Board.'
      }
    ]
  },
  {
    category: 'Professional ID',
    newValue: 'Num: 345432321<br>Exp: 4/13/28',
    oldValue: 'Num: 345432321<br>Exp: 4/13/25',
    date: '2025-04-13T09:25',
    source: 'Diversion Control Division',
    updateHistory: [
      {
        date: '4/13/2025',
        time: '9:25am',
        text: 'DEA registration successfully renewed with the U.S. Drug Enforcement Administration (DEA) – Diversion Control Division.'
      },
      {
        date: '4/10/2024',
        time: '3:00pm',
        text: 'DEA renewal application submitted via the DEA Diversion Control Division portal.'
      },
      {
        date: '4/13/2023',
        time: '8:00am',
        text: 'DEA registration information added and attested in CAQH Provider Data Portal.'
      }
    ]
  }
];

// Add oldValue to each update (if not present)
window.updates.forEach(u => {
  if (!u.oldValue) {
    if (u.category === 'Practice Location') {
      u.oldValue = u.newValue.replace('999', '789');
    } else {
      u.oldValue = u.newValue.replace(/\d/g, d => (parseInt(d) - 1).toString());
    }
  }
});

const sortIcons = {
  default: 'files/sort-icon.png',
  up: 'files/up-arrow-icon.png',
  down: 'files/down-arrow-icon.png',
};

window.sortColumn = null;
window.sortAsc = true;
window.filterText = '';
window.filterCategory = [];
window.filterSource = [];
window.filterDate = null;
window.filterDateRange = null;

let modalState = {
  index: null,
  originalNewValue: '',
  oldValue: '',
  field: '',
  source: '',
  date: '',
  link: '#',
};

function formatDate(dateStr) {
  const d = new Date(dateStr);
  const options = { year: 'numeric', month: 'short', day: 'numeric' };
  const date = d.toLocaleDateString(undefined, options);
  let hours = d.getHours();
  let minutes = d.getMinutes();
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12;
  minutes = minutes < 10 ? '0' + minutes : minutes;
  return `${date} ${hours}:${minutes} ${ampm}`;
}

window.formatDateShort = function(dateStr) {
  const d = new Date(dateStr);
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  const yy = String(d.getFullYear()).slice(-2);
  return `${mm}/${dd}/${yy}`;
};

// Helper to get only the label text from a sidebar tab (ignoring icons and badges)
function getTabLabel(tab) {
  for (const node of tab.childNodes) {
    if (node.nodeType === Node.TEXT_NODE) {
      return node.textContent.trim();
    }
  }
  return tab.textContent.trim();
}

function updateFilterButtonText() {
  const filterBtn = document.getElementById('filter-btn');
  let active = [];
  if (window.filterCategory.length > 0) active.push('Category');
  if (window.filterSource.length > 0) active.push('Source');
  if (window.filterDate) {
    if (window.filterDate === '24h') active.push('Date: 24h');
    else if (window.filterDate === 'week') active.push('Date: Week');
    else if (window.filterDate === 'month') active.push('Date: Month');
    else if (window.filterDate === 'custom' && window.filterDateRange && (window.filterDateRange.from || window.filterDateRange.to)) {
      active.push('Date: Custom');
    }
  }
  if (active.length > 0) {
    filterBtn.textContent = `Filters: ${active.join(', ')}`;
  } else {
    filterBtn.textContent = 'Filter';
  }
}

window.approvedRows = {};
window.rejectedRows = {};

// 1. Sidebar/nav/header popups
function addNotPrototypedHandlers() {
  // Sidebar tabs except the first (Review Updates)
  document.querySelectorAll('.sidebar-tab').forEach((tab, i) => {
    if (i === 0) return; // Skip Review Updates
    tab.addEventListener('click', function(e) {
      e.preventDefault();
      alert('This page has not been prototyped, but would mirror the existing Provider Data Portal site.');
    });
  });
  // Nav bar tabs except Home/Profile Data
  document.querySelectorAll('.main-nav .nav-tab').forEach((tab, i) => {
    if (i === 0 || tab.classList.contains('active')) return; // Skip Home/Profile Data
    tab.addEventListener('click', function(e) {
      e.preventDefault();
      alert('This page has not been prototyped, but would mirror the existing Provider Data Portal site.');
    });
  });
  // Header icons (profile/settings/help)
  document.querySelectorAll('.header-icons .icon').forEach(icon => {
    icon.addEventListener('click', function(e) {
      e.preventDefault();
      alert('This page has not been prototyped, but would mirror the existing Provider Data Portal site.');
    });
  });
}
// 2. Modal close on outside click or Esc
function addModalAccessibility() {
  const modal = document.getElementById('review-modal');
  if (!modal) return;
  let lastFocusedElement = null;
  function trapFocus(e) {
    if (modal.style.display === 'none') return;
    const focusable = modal.querySelectorAll('button, [href], input, textarea, select, [tabindex]:not([tabindex="-1"])');
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (e.key === 'Tab') {
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
  }
  function handleKeydown(e) {
    if (modal.style.display !== 'none') {
      if (e.key === 'Escape' || e.key === 'Esc') {
        document.getElementById('modal-cancel-btn').click();
      } else if (e.key === 'Tab') {
        trapFocus(e);
      }
    }
  }
  function handleMousedown(e) {
    if (e.target === modal) {
      document.getElementById('modal-cancel-btn').click();
    }
  }
  function setInitialFocus() {
    const focusable = modal.querySelectorAll('button, [href], input, textarea, select, [tabindex]:not([tabindex="-1"])');
    if (focusable.length) focusable[0].focus();
  }
  // Always add keydown listener once
  document.addEventListener('keydown', handleKeydown);
  // Patch showModal/hideModal to add/remove mousedown and manage focus
  const origShowModal = window.showModal;
  window.showModal = function(...args) {
    lastFocusedElement = document.activeElement;
    origShowModal.apply(this, args);
    setTimeout(setInitialFocus, 0);
    modal.addEventListener('mousedown', handleMousedown);
  };
  const origHideModal = window.hideModal;
  window.hideModal = function(...args) {
    if (typeof origHideModal === 'function') {
      origHideModal.apply(this, args);
    } else {
      // fallback: just hide the modal
      modal.style.display = 'none';
    }
    modal.removeEventListener('mousedown', handleMousedown);
    if (lastFocusedElement) lastFocusedElement.focus();
  };
  // If modal is already open on load, add listeners
  if (modal.style.display !== 'none') {
    modal.addEventListener('mousedown', handleMousedown);
    setTimeout(setInitialFocus, 0);
  }
}
// 3. Approve/revert: show status instead of buttons
function getStatusCell(status) {
  const now = new Date();
  const dateStr = now.toLocaleDateString();
  return `<span class="green-check">&#10003;</span> <em>${status} on ${dateStr}</em>`;
}

// 4. Attestation banner: add Provider status
function addProviderStatus() {
  const lastAttested = document.getElementById('attestation-last-date');
  if (lastAttested && !document.getElementById('provider-status-line')) {
    const statusLine = document.createElement('div');
    statusLine.id = 'provider-status-line';
    statusLine.innerHTML = '<span class="provider-status-label">Provider status:</span> <span class="status-active">Active</span>';
    lastAttested.parentNode.appendChild(statusLine);
  }
}
// 5. Update history modal: add EDT to times
function addEDTtoUpdateHistory() {
  const modal = document.getElementById('review-modal');
  if (!modal) return;
  const historyDiv = document.getElementById('modal-update-history');
  if (!historyDiv) return;
  historyDiv.querySelectorAll('div').forEach(div => {
    div.innerHTML = div.innerHTML.replace(/(\d{1,2}:\d{2}(am|pm|AM|PM))/g, '$1 EDT');
  });
}

document.addEventListener('DOMContentLoaded', () => {
  renderTable();
  renderFilterOptions();
  updateSortIcons();
  updateSidebarBadges(); // Only call once on page load
  updateFilterButtonText(); // Initial call

  // Sorting
  document.querySelectorAll('.updates-table th.sortable').forEach(th => {
    th.addEventListener('click', () => {
      const col = th.getAttribute('data-sort');
      if (window.sortColumn === col) {
        window.sortAsc = !window.sortAsc;
      } else {
        window.sortColumn = col;
        window.sortAsc = false;
      }
      renderTable();
      updateSortIcons();
    });
  });

  // Search
  document.querySelector('.search-input').addEventListener('input', e => {
    window.filterText = e.target.value;
    renderTable();
  });

  // Select all
  document.getElementById('select-all').addEventListener('change', function() {
    const checked = this.checked;
    document.querySelectorAll('.row-checkbox').forEach(cb => {
      cb.checked = checked;
    });
    updateApproveAllBtn();
  });

  // Sidebar tab active state
  document.querySelectorAll('.sidebar-tab').forEach(tab => {
    tab.addEventListener('click', function() {
      document.querySelectorAll('.sidebar-tab').forEach(t => t.classList.remove('active'));
      this.classList.add('active');
    });
  });

  // Filter popup logic
  const filterBtn = document.getElementById('filter-btn');
  const filterPopup = document.getElementById('filter-popup');
  filterBtn.addEventListener('click', (e) => {
    filterPopup.classList.toggle('active');
    renderFilterOptions();
  });
  document.addEventListener('mousedown', (e) => {
    if (!filterPopup.contains(e.target) && e.target !== filterBtn) {
      filterPopup.classList.remove('active');
    }
  });
  // Category filter
  filterPopup.addEventListener('change', (e) => {
    if (e.target.classList.contains('filter-category-cb')) {
      const val = e.target.value;
      if (e.target.checked) {
        window.filterCategory.push(val);
      } else {
        window.filterCategory = window.filterCategory.filter(c => c !== val);
      }
    }
    if (e.target.classList.contains('filter-source-cb')) {
      const val = e.target.value;
      if (e.target.checked) {
        window.filterSource.push(val);
      } else {
        window.filterSource = window.filterSource.filter(s => s !== val);
      }
    }
    renderTable();
    updateFilterButtonText();
  });
  // Date filter
  document.querySelectorAll('.filter-date-btn').forEach(btn => {
    btn.addEventListener('click', function() {
      const wasSelected = this.classList.contains('selected');
      document.querySelectorAll('.filter-date-btn').forEach(b => b.classList.remove('selected'));
      if (wasSelected) {
        // Unselecting: reset all filters
        window.filterCategory = [];
        window.filterSource = [];
        window.filterDate = null;
        window.filterDateRange = null;
        document.getElementById('filter-date-custom').style.display = 'none';
        renderTable();
        renderFilterOptions();
        updateFilterButtonText();
        return;
      }
      this.classList.add('selected');
      window.filterDate = this.getAttribute('data-range');
      if (window.filterDate === 'custom') {
        document.getElementById('filter-date-custom').style.display = '';
      } else {
        document.getElementById('filter-date-custom').style.display = 'none';
        window.filterDateRange = null;
      }
      renderTable();
      updateFilterButtonText();
    });
  });
  document.getElementById('filter-date-from').addEventListener('change', function() {
    if (!window.filterDateRange) window.filterDateRange = {};
    window.filterDateRange.from = this.value;
    renderTable();
    updateFilterButtonText();
  });
  document.getElementById('filter-date-to').addEventListener('change', function() {
    if (!window.filterDateRange) window.filterDateRange = {};
    window.filterDateRange.to = this.value;
    renderTable();
    updateFilterButtonText();
  });
  // Apply/Clear filter
  document.getElementById('apply-filter-btn').addEventListener('click', () => {
    filterPopup.classList.remove('active');
    renderTable();
    updateFilterButtonText();
    updateSidebarBadges(); // Defensive: ensure badges update after filter apply
  });
  document.getElementById('clear-filter-btn').addEventListener('click', () => {
    window.filterCategory = [];
    window.filterSource = [];
    window.filterDate = null;
    window.filterDateRange = null;
    document.querySelectorAll('.filter-date-btn').forEach(b => b.classList.remove('selected'));
    document.getElementById('filter-date-custom').style.display = 'none';
    renderTable();
    renderFilterOptions();
    updateFilterButtonText();
  });

  // Approve all click (main list)
  document.addEventListener('click', function(e) {
    if (e.target.classList.contains('action-btn') && e.target.textContent.trim() === 'Approve' && !e.target.closest('.modal')) {
      // Approve from main list
      const row = e.target.closest('tr');
      const idx = Array.from(document.querySelectorAll('#updates-tbody tr')).indexOf(row);
      if (idx !== -1) {
        approveUpdate(idx, null);
      }
    }
    if (e.target.classList.contains('action-btn') && e.target.textContent.trim() === 'Review') {
      // Review button
      const row = e.target.closest('tr');
      const idx = Array.from(document.querySelectorAll('#updates-tbody tr')).indexOf(row);
      if (idx !== -1) {
        showModal(idx, modalState, approveUpdate, addEDTtoUpdateHistory);
      }
    }
  });

  // Modal close (X)
  const modalCloseBtn = document.getElementById('modal-close-btn');
  if (modalCloseBtn) modalCloseBtn.addEventListener('click', hideModal);
  // Modal cancel
  const modalCancelBtn = document.getElementById('modal-cancel-btn');
  if (modalCancelBtn) modalCancelBtn.addEventListener('click', function() {
    document.getElementById('modal-new-value').value = modalState.originalNewValue;
    hideModal();
  });
  // Modal revert
  const modalRevertBtn = document.getElementById('modal-revert-btn');
  if (modalRevertBtn) modalRevertBtn.addEventListener('click', function() {
    document.getElementById('modal-new-value').value = modalState.oldValue;
  });
  // Modal save
  const modalSaveBtn = document.getElementById('modal-save-btn');
  if (modalSaveBtn) modalSaveBtn.addEventListener('click', function() {
    const newValue = document.getElementById('modal-new-value').value.replace(/\n/g, '<br>');
    window.updates[modalState.index].newValue = newValue;
    renderTable();
    hideModal();
  });
  // Add event listener to modal backdrop to close modal on click (same as Cancel)
  const modalBackdrop = document.querySelector('.modal-backdrop');
  if (modalBackdrop) modalBackdrop.addEventListener('click', function() {
    document.getElementById('modal-new-value').value = modalState.originalNewValue;
    hideModal();
  });

  // Make banner Attest Now button link to attest.html
  const bannerBtn = document.getElementById('attestation-banner-btn');
  if (bannerBtn) {
    bannerBtn.onclick = () => { window.location.href = 'attest.html'; };
  }
  addNotPrototypedHandlers();
  addModalAccessibility();
  addProviderStatus();
  addEDTtoUpdateHistory();
});

function updateSortIcons() {
  // Reset all
  document.querySelectorAll('.updates-table th.sortable').forEach(th => {
    th.classList.remove('sorted');
    const col = th.getAttribute('data-sort');
    const icon = th.querySelector('.sort-icon');
    if (!icon) return;
    if (window.sortColumn === col) {
      th.classList.add('sorted');
      icon.src = window.sortAsc ? sortIcons.up : sortIcons.down;
      icon.style.opacity = 1;
    } else {
      icon.src = sortIcons.default;
      icon.style.opacity = 0.5;
    }
  });
} 