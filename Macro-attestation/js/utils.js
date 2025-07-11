// js/utils.js
// Shared utility functions for Provider Data Portal

export function getSourceLink(source) {
  if (source === 'Pennsylvania DHS') return 'https://provider.enrollment.dhs.pa.gov/RequestInfo';
  if (source === 'PA State Board' || source === 'PA Medical Board') return 'https://www.pa.gov/agencies/dos/department-and-offices/bpoa/boards-commissions/medicine.html';
  if (source === 'Diversion Control Division') return 'https://www.deadiversion.usdoj.gov/';
  return '#';
} 