// Close button logic
const closeBtn = document.getElementById('close-btn');
const autofillCloseBtn = document.getElementById('autofill-close-btn');
const autofillAgainBtn = document.getElementById('autofill-again-btn');

function closeExtension() {
    if (window.parent !== window) {
        window.parent.postMessage({ type: 'close-extension-popup' }, '*');
    }
}

closeBtn.addEventListener('click', closeExtension);
autofillCloseBtn.addEventListener('click', closeExtension);
autofillAgainBtn.addEventListener('click', function() {
    window.location.href = 'practice-locations.html';
});

// Optionally, update provider/practice name dynamically
window.addEventListener('message', function(event) {
    if (event.data && event.data.type === 'autofill-complete-names') {
        const el = document.getElementById('autofill-complete-names');
        if (el) {
            if (event.data.practiceName && event.data.practiceName.includes(',')) {
                el.innerHTML = `${event.data.providerName}<br>at<br>${event.data.practiceName.split(',').map(n => n.trim()).map(n => `<div>${n}</div>`).join('')}`;
            } else {
                el.innerHTML = `${event.data.providerName}<br>at ${event.data.practiceName || '[Practice Name]'}`;
            }
        }
    }
});

// On load, set provider/practice name from sessionStorage if available
window.addEventListener('DOMContentLoaded', function() {
    const el = document.getElementById('autofill-complete-names');
    if (el && window.sessionStorage) {
        const providerName = sessionStorage.getItem('autofillProviderName');
        const practiceName = sessionStorage.getItem('autofillPracticeName');
        if (providerName || practiceName) {
            if (practiceName && practiceName.includes(',')) {
                // Multiple practices: show as a list
                el.innerHTML = `${providerName || '[Provider Name]'}<br>at<br>${practiceName.split(',').map(n => n.trim()).map(n => `<div>${n}</div>`).join('')}`;
            } else {
                el.innerHTML = `${providerName || '[Provider Name]'}<br>at ${practiceName || '[Practice Name]'}`;
            }
        }
    }
}); 