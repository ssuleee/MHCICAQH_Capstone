// Listen for autofill progress updates from the parent window
window.addEventListener('message', function(event) {
    if (!event.data) return;
    if (event.data.type === 'autofill-progress') {
        var sub = document.querySelector('.autofill-sub');
        if (sub) {
            sub.textContent = 'Filling ' + event.data.fieldName;
        }
    } else if (event.data.type === 'show-autofill-complete') {
        window.location.href = 'autofill-complete.html';
    }
});

document.querySelector('.pause-btn').addEventListener('click', function() {
    if (window.parent !== window) {
        window.parent.postMessage({ type: 'autofill-pause' }, '*');
    }
    window.location.href = 'practice-locations.html';
}); 