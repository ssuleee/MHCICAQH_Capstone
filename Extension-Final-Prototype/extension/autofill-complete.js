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
            const providerName = event.data.providerName || '[Provider Name]';
            const practiceName = event.data.practiceName && event.data.practiceName.trim();
            if (practiceName && practiceName.includes(',')) {
                el.innerHTML = `${providerName}<br>at<br>${practiceName.split(',').map(n => n.trim()).map(n => `<div>${n}</div>`).join('')}`;
            } else if (practiceName) {
                el.innerHTML = `${providerName}<br>at ${practiceName}`;
            } else {
                el.innerHTML = `${providerName}`;
            }
        }
    }
});

// On load, set provider/practice name from sessionStorage if available
window.addEventListener('DOMContentLoaded', function() {
    const el = document.getElementById('autofill-complete-names');
    if (el && window.sessionStorage) {
        const providerName = sessionStorage.getItem('autofillProviderName') || '[Provider Name]';
        const practiceName = sessionStorage.getItem('autofillPracticeName') && sessionStorage.getItem('autofillPracticeName').trim();
        if (practiceName && practiceName.includes(',')) {
            // Multiple practices: show as a list
            el.innerHTML = `${providerName}<br>at<br>${practiceName.split(',').map(n => n.trim()).map(n => `<div>${n}</div>`).join('')}`;
        } else if (practiceName) {
            el.innerHTML = `${providerName}<br>at ${practiceName}`;
        } else {
            el.innerHTML = `${providerName}`;
        }
    }
}); 