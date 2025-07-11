// Data for updates table
const updates = [
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
updates.forEach(u => {
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

let sortColumn = null;
let sortAsc = true;
let filterText = '';
let filterCategory = [];
let filterSource = [];
let filterDate = null;
let filterDateRange = null;

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

function formatDateShort(dateStr) {
  const d = new Date(dateStr);
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  const yy = String(d.getFullYear()).slice(-2);
  return `${mm}/${dd}/${yy}`;
}

// Helper to get only the label text from a sidebar tab (ignoring icons and badges)
function getTabLabel(tab) {
  for (const node of tab.childNodes) {
    if (node.nodeType === Node.TEXT_NODE) {
      return node.textContent.trim();
    }
  }
  return tab.textContent.trim();
}

function updateSidebarBadges() {
  // Count updates by category
  const counts = {};
  updates.forEach(u => {
    counts[u.category] = (counts[u.category] || 0) + 1;
  });
  // Total updates
  const total = updates.length;
  document.querySelectorAll('.sidebar-tab').forEach(tab => {
    const badge = tab.querySelector('.badge');
    if (!badge) return;
    const cat = tab.getAttribute('data-category');
    if (cat === 'ALL') {
      badge.textContent = total > 0 ? total : '0';
      badge.style.display = total > 0 ? '' : 'none';
    } else if (cat && cat in counts) {
      badge.textContent = counts[cat] > 0 ? counts[cat] : '0';
      badge.style.display = counts[cat] > 0 ? '' : 'none';
    } else if (cat === 'Disclosure') {
      badge.textContent = total > 0 ? total : '0'; // Or customize if Disclosure should count something else
      badge.style.display = total > 0 ? '' : 'none';
    } else {
      badge.textContent = '0';
      badge.style.display = 'none';
    }
  });
}

function getSourceLink(source) {
  if (source === 'Pennsylvania DHS') return 'https://provider.enrollment.dhs.pa.gov/RequestInfo';
  if (source === 'PA State Board' || source === 'PA Medical Board') return 'https://www.pa.gov/agencies/dos/department-and-offices/bpoa/boards-commissions/medicine.html';
  if (source === 'Diversion Control Division') return 'https://www.deadiversion.usdoj.gov/';
  return '#';
}

function renderTable() {
  let filtered = updates.filter(row => {
    // Search
    const search = filterText.toLowerCase();
    let matches = (
      row.category.toLowerCase().includes(search) ||
      row.newValue.toLowerCase().includes(search) ||
      row.source.toLowerCase().includes(search) ||
      formatDateShort(row.date).toLowerCase().includes(search)
    );
    // Category filter
    if (filterCategory.length > 0 && !filterCategory.includes(row.category)) matches = false;
    // Source filter
    if (filterSource.length > 0 && !filterSource.includes(row.source)) matches = false;
    // Date filter
    if (filterDate) {
      const now = new Date();
      const rowDate = new Date(row.date);
      if (filterDate === '24h') {
        if (now - rowDate > 24 * 60 * 60 * 1000) matches = false;
      } else if (filterDate === 'week') {
        if (now - rowDate > 7 * 24 * 60 * 60 * 1000) matches = false;
      } else if (filterDate === 'month') {
        if (now - rowDate > 31 * 24 * 60 * 60 * 1000) matches = false;
      } else if (filterDate === 'custom' && filterDateRange) {
        const from = new Date(filterDateRange.from);
        const to = new Date(filterDateRange.to);
        if (rowDate < from || rowDate > to) matches = false;
      }
    }
    return matches;
  });
  if (sortColumn) {
    filtered.sort((a, b) => {
      let valA = a[sortColumn];
      let valB = b[sortColumn];
      if (sortColumn === 'date') {
        valA = new Date(valA);
        valB = new Date(valB);
      } else {
        valA = valA.toLowerCase();
        valB = valB.toLowerCase();
      }
      if (valA < valB) return sortAsc ? -1 : 1;
      if (valA > valB) return sortAsc ? 1 : -1;
      return 0;
    });
  }
  const approveAllBtnContainer = document.getElementById('approve-all-btn-container');
  approveAllBtnContainer.innerHTML = '';
  const tbody = document.getElementById('updates-tbody');
  tbody.innerHTML = '';
  const attestNowRow = document.getElementById('attest-now-row');
  const bannerBtn = document.getElementById('attestation-banner-btn');
  const bannerDesc = document.getElementById('attestation-banner-desc');
  if (filtered.length === 0) {
    const tr = document.createElement('tr');
    const td = document.createElement('td');
    td.colSpan = 6;
    td.style.textAlign = 'center';
    td.style.verticalAlign = 'middle';
    td.innerHTML = `
      <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 10px; padding: 18px 0;">
        <span id="no-more-updates-msg" style="color:#8a97b1;font-size:16px;">No more updates to review.</span>
        <button id="attest-now-btn" class="attest-now-btn">Attest Now</button>
      </div>
    `;
    tr.appendChild(td);
    tbody.appendChild(tr);
    if (attestNowRow && tbody.contains(attestNowRow)) {
      attestNowRow.remove();
    }
    if (bannerBtn) bannerBtn.style.display = '';
    if (bannerDesc) bannerDesc.style.display = 'none';
    // Add event listener for the new button
    setTimeout(() => {
      const attestBtn = document.getElementById('attest-now-btn');
      if (attestBtn) {
        attestBtn.onclick = () => { window.location.href = 'attest.html'; };
      }
    }, 0);
    return;
  } else {
    if (attestNowRow && tbody.contains(attestNowRow)) {
      attestNowRow.remove();
    }
    if (bannerBtn) bannerBtn.style.display = 'none';
    if (bannerDesc) bannerDesc.style.display = '';
  }
  filtered.forEach((row, i) => {
    const sourceLink = getSourceLink(row.source);
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><input type="checkbox" class="row-checkbox"></td>
      <td class="category-col">${row.category}</td>
      <td>${row.newValue}</td>
      <td>${formatDateShort(row.date)}</td>
      <td><a href="${sourceLink}" target="_blank" rel="noopener noreferrer" style="color:inherit;text-decoration:none;">${row.source} <img src="files/external-link-icon.png" alt="external link" style="width:14px;height:14px;margin-left:4px;vertical-align:middle;opacity:0.7;"></a></td>
      <td>
        <button class="action-btn">Approve</button>
        <button class="action-btn">Review</button>
      </td>
    `;
    tbody.appendChild(tr);
  });
  attachCheckboxListeners();
  updateApproveAllBtn();
}

function attachCheckboxListeners() {
  const allCheckbox = document.getElementById('select-all');
  const rowCheckboxes = document.querySelectorAll('.row-checkbox');
  allCheckbox.checked = Array.from(rowCheckboxes).every(cb => cb.checked);
  allCheckbox.indeterminate = !allCheckbox.checked && Array.from(rowCheckboxes).some(cb => cb.checked);
  rowCheckboxes.forEach(cb => {
    cb.addEventListener('change', updateApproveAllBtn);
  });
}

function updateApproveAllBtn() {
  const rowCheckboxes = document.querySelectorAll('.row-checkbox');
  const approveAllBtnContainer = document.getElementById('approve-all-btn-container');
  const anyChecked = Array.from(rowCheckboxes).some(cb => cb.checked);
  approveAllBtnContainer.innerHTML = anyChecked ? '<button class="approve-all-btn" id="approve-all-btn">Approve selected</button>' : '';
  // Update select-all state
  const allCheckbox = document.getElementById('select-all');
  allCheckbox.checked = Array.from(rowCheckboxes).every(cb => cb.checked);
  allCheckbox.indeterminate = !allCheckbox.checked && anyChecked;
  // Approve selected click
  const approveAllBtn = document.getElementById('approve-all-btn');
  if (approveAllBtn) {
    approveAllBtn.addEventListener('click', () => {
      // Approve (remove) all selected updates
      const checkboxes = Array.from(document.querySelectorAll('.row-checkbox'));
      const toRemove = [];
      checkboxes.forEach((cb, idx) => {
        if (cb.checked) toRemove.push(idx);
      });
      // Remove from highest index to lowest to avoid reindexing issues
      toRemove.sort((a, b) => b - a).forEach(idx => {
        updates.splice(idx, 1);
      });
      renderTable();
      updateSidebarBadges();
    });
  }
}

function renderFilterOptions() {
  // Category
  const catSet = new Set(updates.map(u => u.category));
  const catOptions = Array.from(catSet);
  const catDiv = document.getElementById('filter-category-options');
  catDiv.innerHTML = catOptions.map(cat => `<label><input type="checkbox" value="${cat}" class="filter-category-cb" ${filterCategory.includes(cat) ? 'checked' : ''}>${cat}</label>`).join('');
  // Source
  const srcSet = new Set(updates.map(u => u.source));
  const srcOptions = Array.from(srcSet);
  const srcDiv = document.getElementById('filter-source-options');
  srcDiv.innerHTML = srcOptions.map(src => `<label><input type="checkbox" value="${src}" class="filter-source-cb" ${filterSource.includes(src) ? 'checked' : ''}>${src}</label>`).join('');
}

function showModal(index) {
  const update = updates[index];
  modalState = {
    index,
    originalNewValue: update.newValue.replace(/<br>/g, '\n'),
    oldValue: update.oldValue.replace(/<br>/g, '\n'),
    field: update.category,
    date: update.date,
    link: getSourceLink(update.source),
  };
  document.getElementById('modal-field').textContent = modalState.field;
  document.getElementById('modal-new-value').value = modalState.originalNewValue;
  document.getElementById('modal-old-value').textContent = modalState.oldValue;
  document.getElementById('modal-link').href = modalState.link;
  // Render update history with hyperlinks and external link icons
  const historyDiv = document.getElementById('modal-update-history');
  historyDiv.innerHTML = '';
  // To add more hyperlinks, add to this object:
  // 'Display Name': 'https://link.url'
  const sourceLinks = {
    'Pennsylvania DHS': 'https://provider.enrollment.dhs.pa.gov/RequestInfo',
    'PA State Board': 'https://www.pa.gov/agencies/dos/department-and-offices/bpoa/boards-commissions/medicine.html',
    'PA Medical Board': 'https://www.pa.gov/agencies/dos/department-and-offices/bpoa/boards-commissions/medicine.html',
    'Diversion Control Division': 'https://www.deadiversion.usdoj.gov/'
    // Add more sources here as needed
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
    // Expects MM/DD/YYYY, returns MM/DD/YY
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
      entry.style.alignItems = 'center'; // Center vertically
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
  // Remove old modal button listeners if any
  const approveBtn = document.getElementById('modal-approve-btn');
  const revertBtn = document.getElementById('modal-revert-btn-bottom');
  const cancelBtn = document.getElementById('modal-cancel-btn');
  // Remove previous listeners by cloning
  approveBtn.replaceWith(approveBtn.cloneNode(true));
  revertBtn.replaceWith(revertBtn.cloneNode(true));
  cancelBtn.replaceWith(cancelBtn.cloneNode(true));
  // Re-select after cloning
  const approveBtnNew = document.getElementById('modal-approve-btn');
  const revertBtnNew = document.getElementById('modal-revert-btn-bottom');
  const cancelBtnNew = document.getElementById('modal-cancel-btn');
  approveBtnNew.addEventListener('click', function() {
    approveUpdate(index, null);
  });
  revertBtnNew.addEventListener('click', function() {
    // Remove the update from the table (simulate revert)
    approveUpdate(index, update.oldValue);
  });
  cancelBtnNew.addEventListener('click', function() {
    document.getElementById('modal-new-value').value = modalState.originalNewValue;
    hideModal();
  });
}

function hideModal() {
  document.getElementById('review-modal').style.display = 'none';
}

function formatDateModal(dateStr) {
  const d = new Date(dateStr);
  const options = { year: 'numeric', month: 'short', day: 'numeric' };
  const date = d.toLocaleDateString(undefined, options);
  let hours = d.getHours();
  let minutes = d.getMinutes();
  const ampm = hours >= 12 ? 'AM' : 'PM';
  hours = hours % 12;
  hours = hours ? hours : 12;
  minutes = minutes < 10 ? '0' + minutes : minutes;
  return `${date} ${hours}:${minutes} ${ampm}`;
}

function approveUpdate(index, newValue) {
  updates.splice(index, 1);
  renderTable();
  hideModal();
  updateSidebarBadges();
}

// Add this function to update the filter button text based on active filters
function updateFilterButtonText() {
  const filterBtn = document.getElementById('filter-btn');
  let active = [];
  if (filterCategory.length > 0) active.push('Category');
  if (filterSource.length > 0) active.push('Source');
  if (filterDate) {
    if (filterDate === '24h') active.push('Date: 24h');
    else if (filterDate === 'week') active.push('Date: Week');
    else if (filterDate === 'month') active.push('Date: Month');
    else if (filterDate === 'custom' && filterDateRange && (filterDateRange.from || filterDateRange.to)) {
      active.push('Date: Custom');
    }
  }
  if (active.length > 0) {
    filterBtn.textContent = `Filters: ${active.join(', ')}`;
  } else {
    filterBtn.textContent = 'Filter';
  }
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
      if (sortColumn === col) {
        sortAsc = !sortAsc;
      } else {
        sortColumn = col;
        sortAsc = false;
      }
      renderTable();
      updateSortIcons();
    });
  });

  // Search
  document.querySelector('.search-input').addEventListener('input', e => {
    filterText = e.target.value;
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
        filterCategory.push(val);
      } else {
        filterCategory = filterCategory.filter(c => c !== val);
      }
    }
    if (e.target.classList.contains('filter-source-cb')) {
      const val = e.target.value;
      if (e.target.checked) {
        filterSource.push(val);
      } else {
        filterSource = filterSource.filter(s => s !== val);
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
        filterCategory = [];
        filterSource = [];
        filterDate = null;
        filterDateRange = null;
        document.getElementById('filter-date-custom').style.display = 'none';
        renderTable();
        renderFilterOptions();
        updateFilterButtonText();
        return;
      }
      this.classList.add('selected');
      filterDate = this.getAttribute('data-range');
      if (filterDate === 'custom') {
        document.getElementById('filter-date-custom').style.display = '';
      } else {
        document.getElementById('filter-date-custom').style.display = 'none';
        filterDateRange = null;
      }
      renderTable();
      updateFilterButtonText();
    });
  });
  document.getElementById('filter-date-from').addEventListener('change', function() {
    if (!filterDateRange) filterDateRange = {};
    filterDateRange.from = this.value;
    renderTable();
    updateFilterButtonText();
  });
  document.getElementById('filter-date-to').addEventListener('change', function() {
    if (!filterDateRange) filterDateRange = {};
    filterDateRange.to = this.value;
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
    filterCategory = [];
    filterSource = [];
    filterDate = null;
    filterDateRange = null;
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
        showModal(idx);
      }
    }
  });

  // Modal close (X)
  document.getElementById('modal-close-btn').addEventListener('click', hideModal);
  // Modal cancel
  document.getElementById('modal-cancel-btn').addEventListener('click', function() {
    document.getElementById('modal-new-value').value = modalState.originalNewValue;
    hideModal();
  });
  // Modal revert
  document.getElementById('modal-revert-btn').addEventListener('click', function() {
    document.getElementById('modal-new-value').value = modalState.oldValue;
  });
  // Modal save
  document.getElementById('modal-save-btn').addEventListener('click', function() {
    const newValue = document.getElementById('modal-new-value').value.replace(/\n/g, '<br>');
    updates[modalState.index].newValue = newValue;
    renderTable();
    hideModal();
  });
  // Add event listener to modal backdrop to close modal on click (same as Cancel)
  document.querySelector('.modal-backdrop').addEventListener('click', function() {
    document.getElementById('modal-new-value').value = modalState.originalNewValue;
    hideModal();
  });

  // Make banner Attest Now button link to attest.html
  const bannerBtn = document.getElementById('attestation-banner-btn');
  if (bannerBtn) {
    bannerBtn.onclick = () => { window.location.href = 'attest.html'; };
  }
});

function updateSortIcons() {
  // Reset all
  document.querySelectorAll('.updates-table th.sortable').forEach(th => {
    th.classList.remove('sorted');
    const col = th.getAttribute('data-sort');
    const icon = th.querySelector('.sort-icon');
    if (!icon) return;
    if (sortColumn === col) {
      th.classList.add('sorted');
      icon.src = sortAsc ? sortIcons.up : sortIcons.down;
      icon.style.opacity = 1;
    } else {
      icon.src = sortIcons.default;
      icon.style.opacity = 0.5;
    }
  });
} 