// confirmation.js

document.getElementById('close-btn').addEventListener('click', function() {
    if (window.parent !== window) {
        window.parent.postMessage({ type: 'close-extension-popup' }, '*');
    }
});

document.getElementById('skip-btn').addEventListener('click', function() {
    if (window.parent !== window) {
        window.parent.postMessage({ type: 'close-extension-popup', action: 'skip' }, '*');
    }
});

document.getElementById('update-btn').addEventListener('click', function() {
    // Gather edited values
    const editedFields = [];
    document.querySelectorAll('.confirmation-textarea').forEach(textarea => {
        editedFields.push({
            label: textarea.dataset.label,
            value: textarea.value
        });
    });
    // Show update complete screen
    window.location.href = 'update-complete.html';
    // Optionally, send to parent if needed:
    // if (window.parent !== window) {
    //     window.parent.postMessage({ type: 'confirmation-update', editedFields }, '*');
    // }
});

// Helper to format address block
function formatAddressBlock(loc) {
    const lines = [];
    if (loc['practice-name']) lines.push(loc['practice-name']);
    let streetLine = loc['street'] || '';
    if (loc['room']) streetLine += (streetLine ? ', ' : '') + loc['room'];
    if (streetLine) lines.push(streetLine);
    let cityStateZip = '';
    if (loc['city']) cityStateZip += loc['city'];
    if (loc['state']) cityStateZip += (cityStateZip ? ', ' : '') + loc['state'];
    if (loc['zip']) cityStateZip += (cityStateZip ? ' ' : '') + loc['zip'];
    if (cityStateZip) lines.push(cityStateZip);
    return lines.join('\n');
}

// Helper to render changed fields and locations
function renderConfirmationFields(changedFields, currentLocations) {
    const container = document.getElementById('confirmation-fields');
    container.innerHTML = '';
    if (changedFields && changedFields.length) {
        changedFields.forEach(field => {
            const card = document.createElement('div');
            card.className = 'confirmation-card';
            card.innerHTML = `
                <div class="confirmation-card-title">${field.label.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</div>
                <textarea class="confirmation-textarea" data-label="${field.label}">${field.new}</textarea>
            `;
            container.appendChild(card);
        });
    }
    if (currentLocations && currentLocations.length) {
        // Only show locations that are changed
        const autofilled = window.autofilledLocations || [];
        currentLocations.forEach((loc, idx) => {
            const formatted = formatAddressBlock(loc);
            const autofilledFormatted = autofilled[idx] ? formatAddressBlock(autofilled[idx]) : '';
            if (formatted !== autofilledFormatted) {
                // Add the title outside the card
                const title = document.createElement('div');
                title.className = 'confirmation-card-title';
                title.style.margin = '18px 0 4px 0';
                title.textContent = `Practice Location ${idx+1}`;
                container.appendChild(title);

                const card = document.createElement('div');
                card.className = 'confirmation-card confirmation-card-wide';
                const textarea = document.createElement('textarea');
                textarea.className = 'confirmation-textarea';
                textarea.dataset.label = `location${idx+1}-address`;
                textarea.value = formatted;
                card.appendChild(textarea);
                container.appendChild(card);
            }
        });
    }
}

// Listen for show-confirmation message
window.addEventListener('message', function(event) {
    if (event.data && event.data.type === 'show-confirmation') {
        renderConfirmationFields(event.data.changedFields, event.data.currentLocations);
    }
});

// If the window is loaded directly, show a placeholder
window.addEventListener('DOMContentLoaded', function() {
    // Optionally, show a message or wait for postMessage
}); 