// ========== TABLE LOGIC FOR PROVIDER DATA PORTAL ========== //
// Handles rendering, filtering, sorting, approve/revert, and sidebar badge updates.
// Direct refactor from index.js, no UI or functional changes.

import { getSourceLink } from './utils.js';

// ========== RENDER THE MAIN UPDATES TABLE ========== //
export function renderTable() {
  const attestNowRow = document.getElementById('attest-now-row');
  const tbody = document.querySelector('table tbody'); // <-- Add this line
  tbody.innerHTML = ''; // <-- Clear tbody before rendering new rows
  const approveAllBtnContainer = document.getElementById('approve-all-btn-container');
  const bannerBtn = document.getElementById('attestation-banner-btn');
  const bannerDesc = document.getElementById('attestation-banner-desc'); // <-- Add this line
  let filtered = window.updates.filter(row => {
    const search = window.filterText.toLowerCase();
    let matches = (
      row.category.toLowerCase().includes(search) ||
      row.newValue.toLowerCase().includes(search) ||
      row.source.toLowerCase().includes(search) ||
      window.formatDateShort(row.date).toLowerCase().includes(search)
    );
    if (window.filterCategory.length > 0 && !window.filterCategory.includes(row.category)) matches = false;
    if (window.filterSource.length > 0 && !window.filterSource.includes(row.source)) matches = false;
    if (window.filterDate) {
      const now = new Date();
      const rowDate = new Date(row.date);
      if (window.filterDate === '24h') {
        if (now - rowDate > 24 * 60 * 60 * 1000) matches = false;
      } else if (window.filterDate === 'week') {
        if (now - rowDate > 7 * 24 * 60 * 60 * 1000) matches = false;
      } else if (window.filterDate === 'month') {
        if (now - rowDate > 31 * 24 * 60 * 60 * 1000) matches = false;
      } else if (window.filterDate === 'custom' && window.filterDateRange) {
        const from = new Date(window.filterDateRange.from);
        const to = new Date(window.filterDateRange.to);
        if (rowDate < from || rowDate > to) matches = false;
      }
    }
    return matches;
  });
  if (window.sortColumn) {
    filtered.sort((a, b) => {
      let valA = a[window.sortColumn];
      let valB = b[window.sortColumn];
      if (window.sortColumn === 'date') {
        valA = new Date(valA);
        valB = new Date(valB);
      } else {
        valA = valA.toLowerCase();
        valB = valB.toLowerCase();
      }
      if (valA < valB) return window.sortAsc ? -1 : 1;
      if (valA > valB) return window.sortAsc ? 1 : -1;
      return 0;
    });
  }
  // Attest Now button logic
  const allActedUpon = window.updates.length > 0 && window.updates.every((row, i) => window.approvedRows[i] || window.rejectedRows[i]);
  // Top banner button
  // Table controls button
  let attestNowBtnTop = document.getElementById('attest-now-btn-top');

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
    // Do not hide the bannerBtn here, let the allActedUpon logic below handle it
    return;
  } else {
    if (attestNowRow && tbody.contains(attestNowRow)) {
      attestNowRow.remove();
    }
    if (bannerDesc) bannerDesc.style.display = '';
  }

  // Always update the banner and top button after rendering
  if (bannerBtn) {
    if (allActedUpon) {
      bannerBtn.classList.add('active');
      bannerBtn.style.display = '';
    } else {
      bannerBtn.classList.remove('active');
      bannerBtn.style.display = 'none';
    }
  }
  const bannerTitle = document.querySelector('.attestation-banner-title');
  if (bannerTitle) {
    const daysSpan = document.getElementById('attestation-days');
    const daysText = daysSpan ? daysSpan.textContent : '';
    if (allActedUpon) {
      bannerTitle.innerHTML = `<b>Attestation due in <span id='attestation-days'>${daysText}</span>.</b>`;
    } else {
      bannerTitle.innerHTML = `<b>Attestation due in <span id='attestation-days'>${daysText}</span>.</b> Review recent updates to complete your attestation.`;
    }
  }
  if (bannerDesc) {
    if (allActedUpon) {
      bannerDesc.style.display = 'none';
    } else {
      bannerDesc.style.display = '';
    }
  }
  if (allActedUpon) {
    if (!attestNowBtnTop) {
      attestNowBtnTop = document.createElement('button');
      attestNowBtnTop.id = 'attest-now-btn-top';
      attestNowBtnTop.className = 'attest-now-btn-top';
      attestNowBtnTop.textContent = 'Attest Now';
      attestNowBtnTop.onclick = () => { window.location.href = 'attest.html'; };
      approveAllBtnContainer.appendChild(attestNowBtnTop);
    } else if (!approveAllBtnContainer.contains(attestNowBtnTop)) {
      approveAllBtnContainer.appendChild(attestNowBtnTop);
    }
  } else {
    if (attestNowBtnTop) attestNowBtnTop.remove();
  }
  filtered.forEach((row, i) => {
    const sourceLink = getSourceLink(row.source);
    const tr = document.createElement('tr');
    let statusHtml = '';
    if (window.approvedRows[i]) {
      statusHtml = getStatusCell('Approved');
    } else if (window.rejectedRows[i]) {
      statusHtml = getStatusCell('Reverted');
    }
    tr.innerHTML = `
      <td>
        <input type="checkbox" class="row-checkbox" id="row-checkbox-${i}" aria-label="Select update for ${row.category}, ${window.formatDateShort(row.date)} from ${row.source}">
      </td>
      <td class="category-col">${row.category}</td>
      <td>${row.newValue}</td>
      <td>${window.formatDateShort(row.date)}</td>
      <td><a href="${sourceLink}" target="_blank" rel="noopener noreferrer" style="color:inherit;text-decoration:none;">${row.source} <img src="files/external-link-icon.png" alt="external link" style="width:14px;height:14px;margin-left:4px;vertical-align:middle;opacity:0.7;"></a></td>
      <td>
        ${statusHtml || `<button class="action-btn">Approve</button> <button class="action-btn">Review</button>`}
      </td>
    `;
    tbody.appendChild(tr);
  });
  attachCheckboxListeners();
  updateApproveAllBtn();
}

// ========== CHECKBOX LISTENERS FOR SELECT ALL/ROW ========== //
export function attachCheckboxListeners() {
  const allCheckbox = document.getElementById('select-all');
  const rowCheckboxes = document.querySelectorAll('.row-checkbox');
  allCheckbox.checked = Array.from(rowCheckboxes).every(cb => cb.checked);
  allCheckbox.indeterminate = !allCheckbox.checked && Array.from(rowCheckboxes).some(cb => cb.checked);
  rowCheckboxes.forEach(cb => {
    cb.addEventListener('change', updateApproveAllBtn);
  });
}

// ========== APPROVE ALL BUTTON LOGIC ========== //
export function updateApproveAllBtn() {
  const rowCheckboxes = document.querySelectorAll('.row-checkbox');
  const approveAllBtnContainer = document.getElementById('approve-all-btn-container');
  const anyChecked = Array.from(rowCheckboxes).some(cb => cb.checked);
  approveAllBtnContainer.innerHTML = anyChecked ? '<button class="approve-all-btn" id="approve-all-btn">Approve selected</button>' : '';
  const allCheckbox = document.getElementById('select-all');
  allCheckbox.checked = Array.from(rowCheckboxes).every(cb => cb.checked);
  allCheckbox.indeterminate = !allCheckbox.checked && anyChecked;
  const approveAllBtn = document.getElementById('approve-all-btn');
  if (approveAllBtn) {
    approveAllBtn.addEventListener('click', () => {
      const checkboxes = Array.from(document.querySelectorAll('.row-checkbox'));
      checkboxes.forEach((cb, idx) => {
        if (cb.checked) {
          window.approvedRows[idx] = true;
          delete window.rejectedRows[idx];
        }
      });
      renderTable();
      updateSidebarBadges();
    });
  }
}

// ========== APPROVE/REVERT LOGIC FOR INDIVIDUAL UPDATES ========== //
export function approveUpdate(index, newValue) {
  if (newValue) {
    window.rejectedRows[index] = true;
    delete window.approvedRows[index];
  } else {
    window.approvedRows[index] = true;
    delete window.rejectedRows[index];
  }
  renderTable();
  window.hideModal();
  updateSidebarBadges();
}

// ========== STATUS CELL RENDERING FOR APPROVED/REVERTED ========== //
export function getStatusCell(status) {
  const now = new Date();
  const dateStr = now.toLocaleDateString();
  if (status === 'Approved') {
    return `<img src="files/approved-icon.png" alt="approved" style="width:18px;height:18px;vertical-align:middle;margin-right:4px;"> <span class="approved-status" style="color:#529244;font-weight:bold;">Approved on ${dateStr}</span>`;
  }
  if (status === 'Reverted') {
    return `<img src="files/reverted-icon.png" alt="reverted" style="width:18px;height:18px;vertical-align:middle;margin-right:4px;"> <span class="reverted-status" style="color:#C0392B;font-weight:bold;">Reverted on ${dateStr}</span>`;
  }
  return '';
}

// ========== RENDER FILTER OPTIONS FOR CATEGORY/SOURCE ========== //
export function renderFilterOptions() {
  const catSet = new Set(window.updates.map(u => u.category));
  const catOptions = Array.from(catSet);
  const catDiv = document.getElementById('filter-category-options');
  catDiv.innerHTML = catOptions.map(cat => `<label><input type="checkbox" value="${cat}" class="filter-category-cb" ${window.filterCategory.includes(cat) ? 'checked' : ''}>${cat}</label>`).join('');
  const srcSet = new Set(window.updates.map(u => u.source));
  const srcOptions = Array.from(srcSet);
  const srcDiv = document.getElementById('filter-source-options');
  srcDiv.innerHTML = srcOptions.map(src => `<label><input type="checkbox" value="${src}" class="filter-source-cb" ${window.filterSource.includes(src) ? 'checked' : ''}>${src}</label>`).join('');
}

// ========== UPDATE SIDEBAR BADGES BASED ON COUNTS ========== //
export function updateSidebarBadges() {
  // Only count updates that are not approved or reverted
  const counts = {};
  window.updates.forEach((u, i) => {
    if (!window.approvedRows[i] && !window.rejectedRows[i]) {
      counts[u.category] = (counts[u.category] || 0) + 1;
    }
  });
  const total = Object.values(counts).reduce((a, b) => a + b, 0);
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
    } else {
      badge.textContent = '0';
      badge.style.display = 'none';
    }
  });
} 