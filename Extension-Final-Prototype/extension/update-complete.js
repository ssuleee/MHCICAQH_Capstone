// update-complete.js

document.addEventListener('DOMContentLoaded', function() {
    // Replace [Date] with a fake date
    var sub = document.querySelector('.update-sub');
    if (sub) {
        sub.innerHTML = sub.innerHTML.replace('[Date]', 'July 15, 2024');
    }
});

document.getElementById('close-btn').addEventListener('click', function() {
    if (window.parent !== window) {
        window.parent.postMessage({ type: 'close-extension-popup' }, '*');
    }
});

document.getElementById('update-close-btn').addEventListener('click', function() {
    if (window.parent !== window) {
        window.parent.postMessage({ type: 'close-extension-popup' }, '*');
    }
});

document.getElementById('update-attest-btn').addEventListener('click', function() {
    window.open('https://proview.caqh.org/', '_blank'); // Placeholder CAQH attestation URL
}); 