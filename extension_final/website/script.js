// script.js for Service Location Address Demo Website

// Wait for the DOM to load
window.addEventListener('DOMContentLoaded', function() {
    // Get the form element
    const form = document.getElementById('service-location-form');

    // Handle form submission
    form.addEventListener('submit', function(event) {
        event.preventDefault(); // Prevent actual form submission
        // In a real app, you would validate and send data to a server here
        alert('Form submitted! (Demo only, no data sent)');
    });

    // --- Extension Popup Logic ---
    const extBtn = document.getElementById('extension-btn');
    const extPopup = document.getElementById('extension-popup');

    if (extBtn && extPopup) {
        extBtn.addEventListener('click', function() {
            extPopup.style.display = 'flex';
        });
    }

    // Listen for close message from extension iframe
    window.addEventListener('message', function(event) {
        if (event && event.data && event.data.type === 'close-extension-popup') {
            extPopup.style.display = 'none';
        }
    });

    // --- Add Location Logic ---
    const addBtn = document.getElementById('add-location-btn');
    const locationsList = document.getElementById('locations-list');
    let locationCount = 1;

    addBtn.addEventListener('click', function() {
        locationCount++;
        const newFields = document.createElement('div');
        newFields.className = 'location-fields';
        newFields.innerHTML = `
            <hr style="margin: 18px 0;">
            <div class="form-grid">
                <div class="form-col">
                    <div class="form-row"><label for="practice-location-${locationCount}">Practice Location</label><input type="text" id="practice-location-${locationCount}" name="practice-location-${locationCount}"></div>
                    <div class="form-row"><label for="practice-name-${locationCount}">Practice Location Name</label><input type="text" id="practice-name-${locationCount}" name="practice-name-${locationCount}"></div>
                    <div class="form-row"><label for="street-${locationCount}">* Street</label><input type="text" id="street-${locationCount}" name="street-${locationCount}" required></div>
                    <div class="form-row"><label for="room-${locationCount}">Room/Suite</label><input type="text" id="room-${locationCount}" name="room-${locationCount}"></div>
                </div>
                <div class="form-col">
                    <div class="form-row"><label for="city-${locationCount}">* City</label><input type="text" id="city-${locationCount}" name="city-${locationCount}" required></div>
                    <div class="form-row"><label for="state-${locationCount}">* State</label><select id="state-${locationCount}" name="state-${locationCount}" required><option value="PA">PA - Pennsylvania</option></select></div>
                    <div class="form-row"><label for="zip-${locationCount}">* Zip+4</label><input type="text" id="zip-${locationCount}" name="zip-${locationCount}" required placeholder="12345 or 12345-6789"></div>
                    <div class="form-row"><label for="county-${locationCount}">* County</label><select id="county-${locationCount}" name="county-${locationCount}" required><option value="">Select a County</option></select></div>
                </div>
            </div>
            <div class="delete-address-row"><a href="#" class="delete-address-link">Delete this address</a></div>
        `;
        locationsList.appendChild(newFields);
        // Copy county options from the first county select
        const firstCounty = document.querySelector('select[name="county"]');
        const newCounty = newFields.querySelector(`select[name="county-${locationCount}"]`);
        if (firstCounty && newCounty) {
            newCounty.innerHTML = firstCounty.innerHTML;
        }
        // Add delete handler
        newFields.querySelector('.delete-address-link').addEventListener('click', function(e) {
            e.preventDefault();
            newFields.remove();
        });
    });

    // Animated autofill with typing effect
    let autofillPaused = false;
    function typeIntoField(field, value, cb) {
        field.value = '';
        let i = 0;
        function typeChar() {
            if (autofillPaused) return;
            field.value += value[i];
            i++;
            if (i < value.length) {
                setTimeout(typeChar, 5); // even faster
            } else if (cb) {
                setTimeout(cb, 20); // even faster
            }
        }
        if (value.length > 0) {
            typeChar();
        } else if (cb) {
            setTimeout(cb, 20);
        }
    }

    window.addEventListener('message', function(event) {
        if (event.data && event.data.type === 'autofill-pause') {
            autofillPaused = true;
            // Optionally, navigate back to location selection
            window.parent.postMessage({ type: 'show-location-selection' }, '*');
            return;
        }
        if (!event.data || event.data.type !== 'autofill-locations') return;
        autofillPaused = false;
        const locations = event.data.locations || [];

        // Helper to send progress to extension
        function sendProgress(fieldName) {
            const extFrame = document.querySelector('iframe[src*="extension/"]');
            if (extFrame && extFrame.contentWindow) {
                extFrame.contentWindow.postMessage({ type: 'autofill-progress', fieldName }, '*');
            }
        }

        // Remove all but the first location block
        const locationsList = document.getElementById('locations-list');
        const allBlocks = locationsList.querySelectorAll('.location-fields');
        allBlocks.forEach((block, idx) => { if (idx > 0) block.remove(); });

        // Fields and values to fill (practitioner info)
        const fillSteps = [
            { selector: '#first-name', value: 'Sophia', label: 'First Name' },
            { selector: '#middle-name', value: '', label: 'Middle Name' },
            { selector: '#last-name', value: 'Garcia, M.D.', label: 'Last Name' },
            { selector: '#phone', value: '412-239-9837', label: 'Phone Number' },
            { selector: '#email', value: 'sgarcia@harmonyhealth.com', label: 'Email' },
            { selector: '#npi', value: '5678901234', label: 'NPI Number' },
            { selector: '#license-number', value: 'PA56789', label: 'PA License Number' },
            { selector: '#license-state', value: 'PA', label: 'PA License State', isSelect: true },
            { selector: '#license-exp', value: '2027/06/01', label: 'PA License Expiration Date' }
        ];

        // Location fields for each block
        function getLocationSteps(loc, idx) {
            const suffix = idx === 0 ? '' : `-${idx+1}`;
            return [
                { selector: `[name='practice-location${suffix}']`, value: loc.name, label: `Practice Location Name` },
                { selector: `[name='practice-name${suffix}']`, value: loc.name, label: `Practice Location Name` },
                { selector: `[name='street${suffix}']`, value: loc.street, label: 'Street' },
                { selector: `[name='room${suffix}']`, value: loc.room, label: 'Room/Suite' },
                { selector: `[name='city${suffix}']`, value: loc.city, label: 'City' },
                { selector: `[name='state${suffix}']`, value: loc.state, label: 'State', isSelect: true },
                { selector: `[name='zip${suffix}']`, value: loc.zip, label: 'Zip+4' },
                { selector: `[name='county${suffix}']`, value: 'Allegheny', label: 'County', isSelect: true }
            ];
        }

        // Add and fill more locations if needed
        for (let i = 1; i < locations.length; i++) {
            document.getElementById('add-location-btn').click();
            // Set county for the new block immediately
            const blocks = locationsList.querySelectorAll('.location-fields');
            const block = blocks[blocks.length - 1];
            const countySelect = block.querySelector(`[name='county-${i+1}']`);
            if (countySelect) countySelect.value = 'Allegheny';
        }
        const blocks = locationsList.querySelectorAll('.location-fields');

        // Sequentially fill all fields with animation
        let steps = [...fillSteps];
        if (locations.length) {
            locations.forEach((loc, idx) => {
                steps = steps.concat(getLocationSteps(loc, idx));
            });
        }

        function highlightFieldRow(field) {
            const row = field.closest('.form-row');
            if (row) {
                row.style.boxShadow = '0 0 0 2px #0072CE';
                row.style.borderRadius = '6px';
            }
        }
        function unhighlightFieldRow(field) {
            const row = field.closest('.form-row');
            if (row) {
                row.style.boxShadow = '';
                row.style.borderRadius = '';
            }
        }

        function fillStep(idx) {
            if (idx >= steps.length) {
                sendProgress('Complete!');
                // Show complete screen in extension
                const extFrame = document.querySelector('iframe[src*="extension/"]');
                if (extFrame && extFrame.contentWindow) {
                    let providerName = 'Sophia Garcia';
                    let practiceNames = '';
                    if (locations.length) {
                        practiceNames = locations.map(loc => loc.name).join(', ');
                    }
                    // Store in sessionStorage for extension to read
                    try {
                        extFrame.contentWindow.sessionStorage.setItem('autofillProviderName', providerName);
                        extFrame.contentWindow.sessionStorage.setItem('autofillPracticeName', practiceNames || '[Practice Name]');
                    } catch (e) {}
                    extFrame.contentWindow.postMessage({ type: 'show-autofill-complete' }, '*');
                    extFrame.contentWindow.postMessage({
                        type: 'autofill-complete-names',
                        providerName: providerName,
                        practiceName: practiceNames || '[Practice Name]'
                    }, '*');
                }
                return;
            }
            const step = steps[idx];
            sendProgress(step.label);
            let field = document.querySelector(step.selector);
            if (!field) { fillStep(idx+1); return; }
            // Scroll and highlight
            field.scrollIntoView({ behavior: 'smooth', block: 'center' });
            highlightFieldRow(field);
            if (step.isSelect) {
                field.value = step.value;
                setTimeout(() => {
                    unhighlightFieldRow(field);
                    fillStep(idx+1);
                }, 60);
            } else {
                typeIntoField(field, step.value, () => {
                    unhighlightFieldRow(field);
                    fillStep(idx+1);
                });
            }
        }
        fillStep(0);
    });
}); 