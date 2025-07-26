document.querySelectorAll('.show-more').forEach(function(btn) {
    btn.addEventListener('click', function() {
        const card = btn.closest('.location-card');
        const shortAddr = card.querySelector('.address-short');
        const fullAddr = card.querySelector('.address-full');
        const isExpanding = (fullAddr.style.display === 'none' || !fullAddr.style.display);

        // Collapse all cards first
        document.querySelectorAll('.location-card').forEach(function(otherCard) {
            const otherShort = otherCard.querySelector('.address-short');
            const otherFull = otherCard.querySelector('.address-full');
            otherFull.style.display = 'none';
            otherShort.style.display = 'block';
            otherCard.style.transition = 'height 0.3s';
            otherCard.style.height = '';
        });

        // If expanding, show this one
        if (isExpanding) {
            fullAddr.style.display = 'block';
            shortAddr.style.display = 'none';
            card.style.transition = 'height 0.3s';
            card.style.height = card.scrollHeight + 'px';
        }
    });
});

// Select All functionality
const selectAll = document.getElementById('select-all');
const locationCheckboxes = document.querySelectorAll('.location-checkbox');
const autofillBtn = document.getElementById('autofill-btn');
const locationCards = document.querySelectorAll('.location-card');
const searchBar = document.getElementById('search-bar');

function updateAutofillBtn() {
    const anyChecked = Array.from(locationCheckboxes).some(cb => cb.checked);
    autofillBtn.disabled = !anyChecked;
    autofillBtn.style.opacity = anyChecked ? '1' : '0.5';
}

function updateSelectAll() {
    const allChecked = Array.from(locationCheckboxes).every(cb => cb.checked);
    selectAll.checked = allChecked;
}

selectAll.addEventListener('change', function() {
    locationCheckboxes.forEach(cb => {
        cb.checked = selectAll.checked;
    });
    updateAutofillBtn();
});

locationCheckboxes.forEach(cb => {
    cb.addEventListener('change', function() {
        updateSelectAll();
        updateAutofillBtn();
        // Toggle selected style on location cards
        const card = cb.closest('.location-card');
        if (cb.checked) {
            card.classList.add('selected');
        } else {
            card.classList.remove('selected');
        }
    });
    // Initialize on load
    if (cb.checked) {
        cb.closest('.location-card').classList.add('selected');
    }
});

updateAutofillBtn();

// Search functionality
searchBar.addEventListener('input', function() {
    const query = searchBar.value.toLowerCase();
    locationCards.forEach(card => {
        const name = card.querySelector('div > div').textContent.toLowerCase();
        const shortAddr = card.querySelector('.address-short').textContent.toLowerCase();
        const fullAddr = card.querySelector('.address-full').textContent.toLowerCase();
        if (name.includes(query) || shortAddr.includes(query) || fullAddr.includes(query)) {
            card.style.display = '';
        } else {
            card.style.display = 'none';
        }
    });
});

// Add close button logic (same as popup.js)
document.getElementById('close-btn').addEventListener('click', function() {
    if (window.parent !== window) {
        window.parent.postMessage({ type: 'close-extension-popup' }, '*');
    }
});

// Autofill and Skip button logic
if (autofillBtn) {
    autofillBtn.addEventListener('click', function() {
        // Collect selected locations
        const selected = [];
        document.querySelectorAll('.location-card').forEach(function(card, idx) {
            const checkbox = card.querySelector('.location-checkbox');
            if (checkbox.checked) {
                // For demo, use hardcoded info for each location
                if (idx === 0) {
                    selected.push({
                        name: 'Harmony Health Clinic',
                        street: '824 Ostrum St',
                        room: 'Ste. 5A',
                        city: 'Uniontown',
                        state: 'PA',
                        zip: '18015',
                        phone: '412-239-9837',
                        email: 'sgarcia@harmonyhealth.com'
                    });
                } else if (idx === 1) {
                    selected.push({
                        name: 'Greenwood Clinic',
                        street: '999 Mission Ave',
                        room: '',
                        city: 'Pittsburgh',
                        state: 'PA',
                        zip: '15213',
                        phone: '412-555-5678',
                        email: 'sgarcia@greenwood.com'
                    });
                }
            }
        });
        // Send to parent
        if (window.parent !== window) {
            window.parent.postMessage({ type: 'autofill-locations', locations: selected }, '*');
        }
        // Redirect to autofilling.html
        window.location.href = 'autofilling.html';
    });
}
// Handle Skip button
const skipBtn = document.getElementById('skip-btn');
if (skipBtn) {
    skipBtn.addEventListener('click', function() {
        if (window.parent !== window) {
            window.parent.postMessage({ type: 'autofill-locations', locations: [] }, '*');
        }
        window.location.href = 'autofilling.html';
    });
} 