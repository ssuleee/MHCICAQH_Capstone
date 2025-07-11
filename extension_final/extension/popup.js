document.getElementById('close-btn').addEventListener('click', function() {
    if (window.parent !== window) {
        window.parent.postMessage({ type: 'close-extension-popup' }, '*');
    }
});

document.querySelector('.popup-form').addEventListener('submit', function(e) {
    e.preventDefault();
    window.location.href = 'practice-locations.html';
}); 