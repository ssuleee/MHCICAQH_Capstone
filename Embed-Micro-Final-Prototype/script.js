/* =================================================================
   CAQH PRESCRIPTION FORM
   =================================================================
   
   This file implements a CAQH-integrated prescription form with:
   - Autofill from CAQH provider data
   - Microattestation for tracking and updating changed provider data
   
   Key UX patterns:
   - Side panel opens/closes with proper focus trapping and ESC key support
   - Microattestation panel persists while user edits form fields
   - Session confirmation prevents showing microattestation repeatedly
   
   ================================================================= */

/* =================================================================
   SIDE PANEL MANAGEMENT & ACCESSIBILITY
   ================================================================= */

// Core panel elements and autofill button
const autofillBtn = document.getElementById("autofillBtn");
const caqPanel = document.getElementById("caqPanel");
autofillBtn.addEventListener("click", (e) => {
  e.preventDefault();
  openSidePanel();

  // Always show the autofill panel when opening the side panel
  // This ensures the panel resets to the autofill view regardless of previous state
  const profileIcon = document.getElementById("caqProfileIcon");
  if (profileIcon && profileIcon.style.display === "flex") {
    // User is logged in, show autofill panel
    showExclusivePanel("caqAutofillPanel");
    // Update headers
    const caqPanelHeader = document.querySelector(".side-panel-header");
    if (caqPanelHeader) caqPanelHeader.textContent = "Autofill";
    const caqPanelSubheader = document.querySelector(".side-panel-subheader");
    if (caqPanelSubheader) {
      caqPanelSubheader.textContent =
        "Select the practice location(s) you'd like to use for this form:";
    }
  } else {
    // User is not logged in, show login form
    showExclusivePanel("caqLoginFormWrap");
    // Update headers
    const caqPanelHeader = document.querySelector(".side-panel-header");
    if (caqPanelHeader) caqPanelHeader.textContent = "Sign in to CAQH";
    const caqPanelSubheader = document.querySelector(".side-panel-subheader");
    if (caqPanelSubheader) {
      caqPanelSubheader.textContent =
        "Securely connect your CAQH account to autofill this form with your provider information.";
    }
  }
});
// Close panel with X button and ensure proper focus return
document.getElementById("caqPanelClose").addEventListener("click", () => {
  // Reset session confirmation when panel is manually closed
  if (sessionConfirmationShown) {
    sessionConfirmationShown = false;
  }
  closeSidePanel();
  // Return focus to autofill button for keyboard accessibility
  autofillBtn.focus();
});

// Keyboard accessibility: Close panel with ESC key
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && caqPanel.classList.contains("open")) {
    // Reset session confirmation when panel is closed with ESC
    if (sessionConfirmationShown) {
      sessionConfirmationShown = false;
    }
    // Reset microattestation state when panel is closed
    resetMicroattestationState();
    closeSidePanel();
    // Return focus to autofill button for keyboard accessibility
    autofillBtn.focus();
  }
});

// Handle clicks outside the panel to close it and reset session state
document.addEventListener("click", (e) => {
  // Check if microattestation panel is currently showing
  const microPanel = document.getElementById("caqMicroattestationPanel");
  const isMicroPanelVisible =
    microPanel && microPanel.style.display === "block";

  // Check if click is on a form field (input, select, textarea, or their labels)
  const isFormFieldClick =
    e.target.matches("input, select, textarea, label") ||
    e.target.closest(".form-group") ||
    e.target.closest("form");

  if (
    caqPanel.classList.contains("open") &&
    !caqPanel.contains(e.target) &&
    !autofillBtn.contains(e.target) &&
    !autofillInProgress && // Don't close panel during autofill
    !microattestationInProgress && // Don't close panel during microattestation updates
    !(isMicroPanelVisible && isFormFieldClick) // Keep microattestation panel open when clicking form fields
  ) {
    // Reset session confirmation when panel is closed by outside click
    if (sessionConfirmationShown) {
      sessionConfirmationShown = false;
    }
    // Reset microattestation state when panel is closed
    resetMicroattestationState();
    closeSidePanel();
  }
});
// File upload logic
const fileUpload = document.getElementById("fileUpload");
const deaFile = document.getElementById("deaFile");
const fileName = document.getElementById("fileName");
fileUpload.addEventListener("click", () => deaFile.click());
deaFile.addEventListener("change", () => {
  fileName.textContent = deaFile.files.length
    ? deaFile.files[0].name
    : "No file selected";
});
// Drag and drop
fileUpload.addEventListener("dragover", (e) => {
  e.preventDefault();
  fileUpload.style.background = "#e0e7ef";
});
fileUpload.addEventListener("dragleave", (e) => {
  e.preventDefault();
  fileUpload.style.background = "#fafbfc";
});
fileUpload.addEventListener("drop", (e) => {
  e.preventDefault();
  fileUpload.style.background = "#fafbfc";
  if (e.dataTransfer.files.length) {
    deaFile.files = e.dataTransfer.files;
    fileName.textContent = deaFile.files[0].name;
  }
});

/* =================================================================
   AUTOMATIC FORM MONITORING & REAL-TIME PREVIEW
   =================================================================
   
   This section handles real-time form monitoring to:
   - Update prescription pad preview as users type
   - Detect when form values differ from CAQH data (microattestation)
   - Debounce rapid changes to prevent excessive processing
   - Skip microattestation detection during automated autofill process
   
   The preview shows users exactly how their prescription pad will look,
   and microattestation ensures any manual changes are tracked for 
   updating the provider's CAQH profile.
   
   ================================================================= */

let formUpdateTimeout = null;
let touchedFields = new Set(); // Track fields that user has interacted with

function updatePreview() {
  // Clear any pending update to debounce rapid changes
  if (formUpdateTimeout) {
    clearTimeout(formUpdateTimeout);
  }

  formUpdateTimeout = setTimeout(() => {
    // First, always update the preview
    proceedWithPreviewUpdate();

    // Add a small delay to ensure form values are stable after preview update
    setTimeout(() => {
      // Skip microattestation detection during autofill
      if (autofillInProgress) {
        return;
      }

      // Then check for any field changes that require microattestation
      const changedFields = checkAllFieldsForChanges();

      if (changedFields && changedFields.length > 0) {
        // Only show microattestation panel if changes are new or different
        if (
          !microattestationPanelShown ||
          !areChangesSame(changedFields, lastDetectedChanges)
        ) {
          showMicroattestationPanel(changedFields);
          microattestationPanelShown = true;
        }
      } else {
        // No changes detected, reset the panel shown flag
        microattestationPanelShown = false;
      }
    }, 50); // Small delay to ensure form is stable
  }, 150); // Debounce delay
}

// Function to mark a field as touched and trigger preview update
function markFieldAsTouched(fieldElement) {
  const fieldKey = getFieldKey(fieldElement);
  if (fieldKey) {
    touchedFields.add(fieldKey);
  }
  updatePreview();
}

// Function to generate a unique key for a field
function getFieldKey(fieldElement) {
  if (fieldElement.name === "printLicense") {
    return "printLicense";
  } else if (fieldElement.id) {
    return fieldElement.id;
  } else if (fieldElement.name) {
    // For location fields, include the index
    const locationGroup = fieldElement.closest(".location-group");
    if (locationGroup) {
      const allGroups = Array.from(
        document.querySelectorAll(".location-group")
      );
      const index = allGroups.indexOf(locationGroup);
      return `${fieldElement.name.replace("[]", "")}-${index}`;
    }
    return fieldElement.name;
  }
  return null;
}

// Function to add automatic form monitoring
function setupAutomaticFormMonitoring() {
  // Monitor provider-level fields
  const providerFields = [
    "deaNumber",
    "npiNumber",
    "licenseNumber",
    "nameDegree",
  ];
  providerFields.forEach((fieldId) => {
    const field = document.getElementById(fieldId);
    if (field) {
      field.addEventListener("input", () => markFieldAsTouched(field));
      field.addEventListener("change", () => markFieldAsTouched(field));
    }
  });

  // Monitor print license radio buttons
  const printLicenseRadios = document.querySelectorAll(
    'input[name="printLicense"]'
  );
  printLicenseRadios.forEach((radio) => {
    radio.addEventListener("change", () => markFieldAsTouched(radio));
  });

  // Monitor existing location fields
  updateLocationFieldListeners();
}

// Function to update location field listeners (called when locations are added/removed)
function updateLocationFieldListeners() {
  // Remove existing listeners from all location fields to avoid duplicates
  const locationFields = document.querySelectorAll(
    '[name="clinic[]"], [name="specialty[]"], [name="street[]"], [name="city[]"], [name="state[]"], [name="zip[]"], [name="telephone[]"], [name="fax[]"]'
  );
  locationFields.forEach((field) => {
    // Clone the field to remove all event listeners
    const newField = field.cloneNode(true);
    field.parentNode.replaceChild(newField, field);
  });

  // Add fresh listeners to all location fields
  const newLocationFields = document.querySelectorAll(
    '[name="clinic[]"], [name="specialty[]"], [name="street[]"], [name="city[]"], [name="state[]"], [name="zip[]"], [name="telephone[]"], [name="fax[]"]'
  );
  newLocationFields.forEach((field) => {
    field.addEventListener("input", () => markFieldAsTouched(field));
    field.addEventListener("change", () => markFieldAsTouched(field));

    // Add phone formatting to telephone fields
    if (field.name === "telephone[]") {
      formatPhoneInput(field);
    }
  });
}

// CAQH Demo Data
const caqhProvider = {
  name: "Sophia Garcia, M.D.",
  specialty: "Ophthalmology",
  caqhId: "14689159",
  username: "sgarcia",
  npi: "5678901234",
  license: "PA56789",
  licenseExp: "6/1/27",
  dea: "CB3028475",
  deaExp: "6/1/29",
  locations: [
    {
      name: "Harmony Health Clinic",
      address: "824 Ostrum St",
      suite: "Ste. 5A",
      city: "Uniontown",
      state: "PA",
      zip: "18015",
      phone: "412-239-9837",
      email: "sgarcia@harmonyhealth.com",
    },
    {
      name: "Greenwood Clinic",
      address: "999 Mission Ave",
      suite: "",
      city: "Pittsburgh",
      state: "PA",
      zip: "15213",
      phone: "412-555-5678",
      email: "sgarcia@greenwood.com",
    },
  ],
};

// --- Microattestation Detection Logic ---
let lastDetectedChanges = null;
let sessionConfirmationShown = false;
let microattestationPanelShown = false; // Track if panel has been shown for current changes

// Function to compare if two sets of changes are the same
function areChangesSame(changes1, changes2) {
  if (!changes1 || !changes2) return false;
  if (changes1.length !== changes2.length) return false;

  // Create a set of unique identifiers for each change
  const getChangeId = (change) =>
    `${change.fieldKey}-${change.fieldType}-${change.currentValue}`;

  const set1 = new Set(changes1.map(getChangeId));
  const set2 = new Set(changes2.map(getChangeId));

  // Check if both sets contain the same elements
  if (set1.size !== set2.size) return false;
  for (let id of set1) {
    if (!set2.has(id)) return false;
  }
  return true;
}

/* =================================================================
   TEXT NORMALIZATION FOR FIELD COMPARISON
   =================================================================
   
   This function standardizes text to enable reliable comparison between
   form values and CAQH data. It handles common variations in:
   - Address abbreviations (Street vs St, Avenue vs Ave)
   - Directional indicators (North vs N, Northeast vs NE)  
   - Unit types (Suite vs Ste, Apartment vs Apt)
   - Punctuation differences (M.D. vs MD)
   - Case sensitivity and extra whitespace
   
   The goal is to detect meaningful differences while ignoring 
   formatting variations that don't change the actual content.
   
   ================================================================= */

function normalizeText(text) {
  if (!text) return "";

  // First trim and convert to lowercase for case-insensitive comparison
  let normalized = text.toLowerCase().trim();

  // Remove only truly irrelevant punctuation while preserving meaningful content
  // Remove: quotes, brackets, parentheses, semicolons, colons, etc.
  // Keep: periods, commas, hyphens, apostrophes, spaces, letters, numbers
  normalized = normalized.replace(/["""''`(){}\[\];:]/g, "");

  // Handle common address abbreviations to standardize format variations
  const abbreviationMap = {
    // Street types - normalize to common abbreviations
    street: "st",
    avenue: "ave",
    boulevard: "blvd",
    road: "rd",
    drive: "dr",
    lane: "ln",
    court: "ct",
    circle: "cir",
    place: "pl",
    square: "sq",
    terrace: "ter",
    parkway: "pkwy",
    highway: "hwy",

    // Directional indicators
    north: "n",
    south: "s",
    east: "e",
    west: "w",
    northeast: "ne",
    northwest: "nw",
    southeast: "se",
    southwest: "sw",

    // Common building/unit types
    suite: "ste",
    apartment: "apt",
    building: "bldg",
    floor: "fl",
    room: "rm",
    unit: "u",
  };

  // Apply abbreviation normalization to standardize variations
  Object.entries(abbreviationMap).forEach(([full, abbrev]) => {
    // Replace full word with abbreviation (with word boundaries to avoid partial matches)
    normalized = normalized.replace(new RegExp(`\\b${full}\\b`, "g"), abbrev);
    // Also normalize existing abbreviations (remove periods for consistency)
    normalized = normalized.replace(
      new RegExp(`\\b${abbrev}\\.?\\b`, "g"),
      abbrev
    );
  });

  // Clean up extra whitespace and trailing punctuation
  normalized = normalized.replace(/\s+/g, " ").trim();

  // Remove trailing periods that don't add meaning (e.g., "M.D." vs "MD" should match)
  normalized = normalized.replace(/\.+$/, "");

  return normalized;
}

// Function to check if a location matches any CAQH location
function doesLocationMatchAnyCaqhLocation(locationData) {
  for (const caqhLocation of caqhProvider.locations) {
    // Build the full address strings for comparison
    const formStreetFull =
      locationData.street +
      (locationData.suite ? ", " + locationData.suite : "");
    const caqhStreetFull =
      caqhLocation.address +
      (caqhLocation.suite ? ", " + caqhLocation.suite : "");

    // Check if all location components match
    const clinicMatches =
      normalizeText(locationData.clinic) === normalizeText(caqhLocation.name);
    const streetMatches =
      normalizeText(formStreetFull) === normalizeText(caqhStreetFull);
    const cityMatches =
      normalizeText(locationData.city) === normalizeText(caqhLocation.city);
    const stateMatches =
      normalizeText(locationData.state) === normalizeText(caqhLocation.state);
    const zipMatches =
      normalizeText(locationData.zip) === normalizeText(caqhLocation.zip);
    const phoneMatches =
      normalizeText(locationData.telephone) ===
      normalizeText(caqhLocation.phone);

    console.log(
      `Checking location against CAQH location "${caqhLocation.name}":`,
      {
        clinicMatches,
        streetMatches,
        cityMatches,
        stateMatches,
        zipMatches,
        phoneMatches,
        formData: locationData,
        caqhData: caqhLocation,
      }
    );

    // If all core fields match, consider this location a match
    if (
      clinicMatches &&
      streetMatches &&
      cityMatches &&
      stateMatches &&
      zipMatches &&
      phoneMatches
    ) {
      return true;
    }
  }
  return false;
}

// Function to check all form fields for changes
function checkAllFieldsForChanges() {
  const changedFields = [];

  // Define provider field mappings
  const providerFieldMappings = {
    deaNumber: "dea",
    npiNumber: "npi",
    licenseNumber: "license",
    nameDegree: "name",
  };

  // Check provider-level fields
  Object.entries(providerFieldMappings).forEach(([fieldId, caqhProperty]) => {
    const formElement = document.getElementById(fieldId);
    if (formElement) {
      const currentValue = normalizeText(formElement.value);
      const caqhValue = normalizeText(caqhProvider[caqhProperty] || "");

      // Only consider it a change if current value is non-empty AND different from CAQH
      if (currentValue && currentValue !== caqhValue) {
        const fieldDisplayNames = {
          deaNumber: "DEA Number",
          npiNumber: "NPI Number",
          licenseNumber: "License Number",
          nameDegree: "Name and Degree",
        };

        changedFields.push({
          fieldKey: fieldId,
          fieldType: "provider",
          currentValue: formElement.value,
          caqhValue: caqhProvider[caqhProperty] || "",
          fieldName: fieldDisplayNames[fieldId] || fieldId,
        });
      }
    }
  });

  // Check location-level fields
  const locationGroups = document.querySelectorAll(".location-group");
  locationGroups.forEach((group, locationIndex) => {
    const locationFieldMappings = {
      clinic: "name",
      specialty: null, // specialty is provider-level, stored in caqhProvider.specialty
      street: "address", // special handling for address + suite
      city: "city",
      state: "state",
      zip: "zip",
      telephone: "phone",
      fax: null, // fax is typically empty in our demo data
    };

    const isNewLocation = locationIndex >= caqhProvider.locations.length;

    Object.entries(locationFieldMappings).forEach(
      ([fieldName, caqhProperty]) => {
        const fieldElement = group.querySelector(`[name="${fieldName}[]"]`);
        if (fieldElement) {
          const currentValue = normalizeText(fieldElement.value);
          let caqhValue = "";

          if (isNewLocation) {
            // For new locations, any non-empty field is a change
            if (currentValue) {
              changedFields.push({
                fieldKey: `${fieldName}-${locationIndex}`,
                fieldType: "location",
                locationIndex: locationIndex,
                currentValue: fieldElement.value,
                caqhValue: "",
                fieldName: getLocationFieldDisplayName(fieldName),
                isNewLocation: true,
              });
            }
          } else {
            // For existing locations, compare against CAQH data
            const caqhLocation = caqhProvider.locations[locationIndex];

            if (fieldName === "specialty") {
              caqhValue = normalizeText(caqhProvider.specialty || "");
            } else if (fieldName === "street") {
              // Handle address + suite combination
              const fullAddress = caqhLocation.suite
                ? `${caqhLocation.address}, ${caqhLocation.suite}`
                : caqhLocation.address;
              caqhValue = normalizeText(fullAddress || "");
            } else if (fieldName === "fax") {
              // Fax is often empty, so treat empty as matching
              caqhValue = "";
            } else if (caqhProperty && caqhLocation[caqhProperty]) {
              caqhValue = normalizeText(caqhLocation[caqhProperty]);
            }

            // Only consider it a change if current value is non-empty AND different from CAQH
            if (currentValue && currentValue !== caqhValue) {
              changedFields.push({
                fieldKey: `${fieldName}-${locationIndex}`,
                fieldType: "location",
                locationIndex: locationIndex,
                currentValue: fieldElement.value,
                caqhValue: caqhValue,
                fieldName: getLocationFieldDisplayName(fieldName),
              });
            }
          }
        }
      }
    );
  });

  return changedFields.length > 0 ? changedFields : null;
}

// Helper function for location field display names
function getLocationFieldDisplayName(fieldName) {
  const locationFieldDisplayNames = {
    clinic: "Clinic / Hospital",
    specialty: "Specialty",
    street: "Street Address",
    city: "City",
    state: "State",
    zip: "Zip Code",
    telephone: "Telephone Number",
    fax: "Fax Number",
  };
  return locationFieldDisplayNames[fieldName] || fieldName;
}

// Helper function to get properly formatted previous value for display
function getFormattedPreviousValue(change) {
  if (change.fieldType === "provider") {
    // Return the original CAQH provider value (not normalized)
    const providerFieldMappings = {
      deaNumber: "dea",
      npiNumber: "npi",
      licenseNumber: "license",
      nameDegree: "name",
    };
    const caqhProperty = providerFieldMappings[change.fieldKey];
    return caqhProvider[caqhProperty] || "";
  } else if (change.fieldType === "location") {
    // Return the original CAQH location value (not normalized)
    const locationIndex = change.locationIndex;
    if (locationIndex >= 0 && locationIndex < caqhProvider.locations.length) {
      const caqhLocation = caqhProvider.locations[locationIndex];
      const fieldName = change.fieldKey.split("-")[0];

      switch (fieldName) {
        case "clinic":
          return caqhLocation.name || "";
        case "specialty":
          return caqhProvider.specialty || "";
        case "street":
          const fullAddress = caqhLocation.suite
            ? `${caqhLocation.address}, ${caqhLocation.suite}`
            : caqhLocation.address;
          return fullAddress || "";
        case "city":
          return caqhLocation.city || "";
        case "state":
          return caqhLocation.state || "";
        case "zip":
          return caqhLocation.zip || "";
        case "telephone":
          return caqhLocation.phone || "";
        case "fax":
          return ""; // Fax is typically empty
        default:
          return "";
      }
    }
  }
  return "";
}

// Function to proceed with preview update without microattestation check
// This updates the visual prescription pad preview to show users exactly
// how their information will appear when printed
function proceedWithPreviewUpdate() {
  const dea = document.getElementById("deaNumber").value.trim();
  const npi = document.getElementById("npiNumber").value.trim();
  const lic = document.getElementById("licenseNumber").value.trim();
  const printLic =
    document.querySelector('input[name="printLicense"]:checked').value ===
    "yes";
  const name = document.getElementById("nameDegree").value.trim();

  // Multi-location fields - build HTML for displaying practice locations
  const locationGroups = document.querySelectorAll(".location-group");
  let locationsHtml = "";
  if (locationGroups.length > 0) {
    locationsHtml =
      '<div style="display:flex;justify-content:space-between;align-items:flex-start;width:100%;margin:10px 0 0 0;">';
    locationGroups.forEach((group, idx) => {
      const clinic = group.querySelector(`[name='clinic[]']`).value.trim();
      const specialty = group
        .querySelector(`[name='specialty[]']`)
        .value.trim();
      const street = group.querySelector(`[name='street[]']`).value.trim();
      const city = group.querySelector(`[name='city[]']`).value.trim();
      const state = group.querySelector(`[name='state[]']`).value.trim();
      const zip = group.querySelector(`[name='zip[]']`).value.trim();
      const tel = group.querySelector(`[name='telephone[]']`).value.trim();
      const fax = group.querySelector(`[name='fax[]']`).value.trim();
      const align = idx === 0 ? "left" : "right";
      locationsHtml += `
        <div style="text-align:${align};min-width:180px;max-width:48%;font-size:0.85em;">
          <span style=\"display:inline-block;width:7px;height:7px;border:1.2px solid #2F3E5B;border-radius:2px;margin-bottom:2px;margin-right:4px;vertical-align:middle;\"></span>
          <span style=\"font-size:1em;font-weight:600;line-height:1.1;vertical-align:middle;\">${clinic}</span><br>
          <span style=\"font-size:0.97em;color:#444;\">${street}</span><br>
          <span style=\"font-size:0.97em;\">${[city, state, zip]
            .filter(Boolean)
            .join(", ")}</span><br>
          <span style=\"font-size:0.97em;\">${tel}${
        fax ? ` | Fax: ${fax}` : ""
      }</span>
        </div>
      `;
    });
    locationsHtml += "</div>";
  }

  // Update preview fields with current form data
  document.getElementById("previewDea").textContent = dea ? `DEA # ${dea}` : "";
  document.getElementById("previewNpi").textContent = npi ? `NPI # ${npi}` : "";
  document.getElementById("previewLic").textContent =
    printLic && lic ? `LIC # ${lic}` : "";
  document.getElementById("previewName").textContent = name;

  // Hide old single-location fields (legacy elements)
  document.getElementById("previewClinic").textContent = "";
  document.getElementById("previewSpecialty").textContent = "";
  document.getElementById("previewStreet").textContent = "";
  document.getElementById("previewCityStateZip").textContent = "";
  document.getElementById("previewTel").textContent = "";

  // Show preview and hide placeholder with proper accessibility attributes
  const previewPlaceholder = document.getElementById("previewPlaceholder");
  const scriptPreview = document.getElementById("scriptPreview");

  // Insert locations into preview with accessibility support
  let locationsPreview = document.getElementById("previewLocations");
  if (!locationsPreview) {
    locationsPreview = document.createElement("div");
    locationsPreview.id = "previewLocations";
    scriptPreview.insertBefore(locationsPreview, scriptPreview.children[2]);
  }
  locationsPreview.innerHTML = locationsHtml;
  locationsPreview.style.fontSize = "0.85em";
  previewPlaceholder.style.display = "none";
  scriptPreview.style.display = "block";
  scriptPreview.setAttribute("aria-hidden", "false"); // Make visible to screen readers
}

// Function to show the microattestation panel
// This appears when user edits form fields that differ from their CAQH profile,
// allowing them to review and save changes back to CAQH as drafts
function showMicroattestationPanel(changedFields) {
  // Store the detected changes for processing
  lastDetectedChanges = changedFields;

  // Open the side panel with proper accessibility support
  openSidePanel();

  // Get or create microattestation panel
  const microPanel = getMicroattestationPanel();

  // Show microattestation panel exclusively
  showExclusivePanel("caqMicroattestationPanel");

  // Check if we should show confirmation view immediately (if shown this session)
  // This prevents repeatedly asking users to confirm the same changes
  if (sessionConfirmationShown) {
    showMicroattestationUpdateView();
  }

  // Update headers only if not showing confirmation
  if (!sessionConfirmationShown) {
    const caqPanelHeader = document.querySelector("#caqPanelHeader");
    if (caqPanelHeader) caqPanelHeader.textContent = "Updates Detected";
    const caqPanelSubheader = document.querySelector("#caqPanelSubheader");
    if (caqPanelSubheader) caqPanelSubheader.textContent = "";
  }

  // Auto-focus first input for keyboard accessibility, but only if user is not currently typing
  setTimeout(() => {
    const firstInput = microPanel.querySelector(".micro-field-input");
    const activeElement = document.activeElement;

    // Check if user is currently focused on a form field - if so, don't steal focus
    const isFormFieldFocused =
      activeElement &&
      (activeElement.matches(
        'input[type="text"], input[type="tel"], select, textarea'
      ) ||
        activeElement.closest(".form-group"));

    if (firstInput && !isFormFieldFocused) {
      firstInput.focus();
    }
  }, 100); // Small delay to ensure panel is fully visible
}

// Function to reset microattestation state
function resetMicroattestationState() {
  lastDetectedChanges = null;
  sessionConfirmationShown = false;
  microattestationPanelShown = false; // Reset panel shown flag

  // Reset touched fields state
  touchedFields.clear();

  // Clean up any existing microattestation panel
  const microPanel = document.getElementById("caqMicroattestationPanel");
  if (microPanel) {
    microPanel.innerHTML = "";
  }
}

// Function to get or create the microattestation panel
// This panel allows users to review and update fields that differ from CAQH data.
// Changes are saved as drafts in CAQH for the next attestation cycle.
function getMicroattestationPanel() {
  let microPanel = document.getElementById("caqMicroattestationPanel");

  if (!microPanel) {
    microPanel = document.createElement("div");
    microPanel.id = "caqMicroattestationPanel";
    microPanel.setAttribute("aria-live", "polite"); // Announce content changes to screen readers
    microPanel.setAttribute("aria-label", "Microattestation Form");
    microPanel.style.display = "none";
    microPanel.style.height = "100%";
    microPanel.style.boxSizing = "border-box";
    microPanel.style.overflow = "auto";

    caqPanel.appendChild(microPanel);
  }

  // Update content based on detected changes
  if (lastDetectedChanges && lastDetectedChanges.length > 0) {
    const fieldCount = lastDetectedChanges.length;
    const fieldsText = fieldCount === 1 ? "field" : "fields";

    // Generate field list HTML
    let fieldsListHtml = "";
    lastDetectedChanges.forEach((change, index) => {
      const fieldId = `microField_${index}`;
      const isPhoneField =
        change.fieldName.toLowerCase().includes("telephone") ||
        change.fieldName.toLowerCase().includes("phone");
      const fieldType = isPhoneField ? "tel" : "text";

      // Add location context for location fields
      let contextInfo = "";
      if (change.type === "location") {
        const locationIndex = change.locationIndex || 0;
        if (change.isNewLocation) {
          contextInfo = `<div style="color: #6b7280; font-size: 0.85em; margin-bottom: 4px;">New location (Location ${
            locationIndex + 1
          })</div>`;
        } else {
          contextInfo = `<div style="color: #6b7280; font-size: 0.85em; margin-bottom: 4px;">Location ${
            locationIndex + 1
          }</div>`;
        }
      }

      fieldsListHtml += `
        <div class="micro-field-item" style="background: #f8f9fa; border: 2px solid #e9ecef; border-radius: 8px; padding: 16px; margin-bottom: 16px;">
          ${contextInfo}
          <h4 style="color: #0072CE; font-size: 1.1em; font-weight: 600; margin: 0 0 12px 0;">${
            change.fieldName
          }</h4>
          
          <div style="margin-bottom: 12px;">
            <label for="${fieldId}" style="color: #374151; font-size: 0.9em; font-weight: 600; display: block; margin-bottom: 6px;">New Value:</label>
            <input type="${fieldType}" id="${fieldId}" class="micro-field-input" 
                   value="${change.currentValue}" 
                   data-field-key="${change.fieldKey}"
                   data-field-type="${change.fieldType}"
                   data-location-index="${
                     change.locationIndex !== undefined
                       ? change.locationIndex
                       : ""
                   }"
                   style="width: 100%; padding: 8px 12px; border: 2px solid #d1d5db; border-radius: 6px; font-size: 1em; box-sizing: border-box;" />
            <div class="field-validation-error" style="color: #ef4444; font-size: 0.85em; margin-top: 4px; display: none;"></div>
          </div>
          
          ${
            change.caqhValue
              ? `<div style="color: #6b7280; font-size: 0.9em;">
              <strong>Previous:</strong> ${getFormattedPreviousValue(change)}
            </div>`
              : `<div style="color: #6b7280; font-size: 0.9em;">
              <strong>Note:</strong> New field (not in CAQH profile)
            </div>`
          }
        </div>
      `;
    });

    microPanel.innerHTML = `
      <div style="margin-bottom: 24px;">
        <p style="color: #0072CE; font-size: 1em; line-height: 1.4; margin: 0 0 20px 0;">
          ${
            fieldCount === 1 ? "1 field differs" : `${fieldCount} fields differ`
          } from your CAQH profile. Review and update below:
        </p>
      </div>
      
      <div class="fields-list" style="max-height: 400px; overflow-y: auto; margin-bottom: 24px; padding-right: 8px;">
        ${fieldsListHtml}
      </div>
      
      <div style="margin-bottom: 16px;">
        <p style="color: #6b7280; font-size: 0.9em; line-height: 1.4; margin: 0;">
          * Changes will be saved as drafts. All profile updates must be reviewed and attested during your next CAQH attestation.
        </p>
      </div>
      
      <div style="display: flex; flex-direction: column; gap: 12px;">
        <button id="caqMicroUpdateAllBtn" style="background: #0072CE; color: #fff; font-weight: 600; font-size: 1em; padding: 14px 20px; border: none; border-radius: 8px; cursor: pointer; width: 100%;">
          Save as Draft to CAQH
        </button>
        <button id="caqMicroCancelBtn" style="background: none; border: 2px solid #0072CE; color: #0072CE; font-weight: 600; font-size: 1em; padding: 12px 20px; border-radius: 8px; cursor: pointer; width: 100%;">
          Cancel
        </button>
      </div>
    `;

    // Add phone number formatting for telephone fields
    microPanel
      .querySelectorAll('.micro-field-input[type="tel"]')
      .forEach((input) => {
        formatPhoneInput(input);
      });

    // Add validation for all fields
    microPanel.querySelectorAll(".micro-field-input").forEach((input) => {
      addFieldValidation(input);
    });

    // Add event listeners
    const updateAllBtn = document.getElementById("caqMicroUpdateAllBtn");
    const cancelBtn = document.getElementById("caqMicroCancelBtn");

    if (updateAllBtn) {
      updateAllBtn.addEventListener("click", function (e) {
        e.preventDefault();
        console.log("Update All button clicked"); // Debug log

        // Set microattestation in progress flag to prevent panel from closing
        microattestationInProgress = true;
        console.log("Set microattestationInProgress = true"); // Debug log

        // Ensure panel stays visible during the update process
        const microPanel = document.getElementById("caqMicroattestationPanel");
        if (microPanel) {
          microPanel.style.display = "block";
        }
        openSidePanel();

        // Validate all fields first
        const isValid = validateAllFields();
        console.log("Validation result:", isValid); // Debug log

        if (isValid) {
          console.log("Validation passed, proceeding with update"); // Debug log
          updateAllFieldsAndShowConfirmation();
        } else {
          console.log("Validation failed, not proceeding with update"); // Debug log
          // Reset flag on validation failure
          microattestationInProgress = false;
          console.log(
            "Reset microattestationInProgress = false due to validation failure"
          ); // Debug log
        }
      });
    } else {
      console.error("Update All button not found!");
    }

    if (cancelBtn) {
      cancelBtn.addEventListener("click", function () {
        console.log("🔴 CLOSING PANEL VIA MICROATTESTATION CANCEL BUTTON");
        // Reset microattestation state when panel is closed
        resetMicroattestationState();
        closeSidePanel();
      });
    }
  }

  return microPanel;
}

// Phone number formatting function
function formatPhoneInput(input) {
  input.addEventListener("input", function (e) {
    // Remove all non-digit characters
    let value = e.target.value.replace(/\D/g, "");

    // Limit to 10 digits
    if (value.length > 10) {
      value = value.substring(0, 10);
    }

    // Format the number
    // let formattedValue = "";
    // if (value.length > 0) {
    //   if (value.length <= 3) {
    //     formattedValue = `(${value}`;
    //   } else if (value.length <= 6) {
    //     formattedValue = `(${value.substring(0, 3)}) ${value.substring(3)}`;
    //   } else {
    //     formattedValue = `(${value.substring(0, 3)}) ${value.substring(
    //       3,
    //       6
    //     )}-${value.substring(6)}`;
    //   }
    // }

    // e.target.value = formattedValue;

    // Trigger validation
    validatePhoneField(input);
  });

  // Format initial value if present
  if (input.value) {
    const event = new Event("input");
    input.dispatchEvent(event);
  }
}

// Phone number validation function
function validatePhoneField(input) {
  const errorDiv = input.parentElement.querySelector(".field-validation-error");
  const digits = input.value.replace(/\D/g, "");

  if (digits.length > 0 && digits.length !== 10) {
    errorDiv.textContent = "Phone number must be exactly 10 digits";
    errorDiv.style.display = "block";
    input.style.borderColor = "#ef4444";
    return false;
  } else {
    errorDiv.style.display = "none";
    input.style.borderColor = "#d1d5db";
    return true;
  }
}

// General field validation function
function addFieldValidation(input) {
  if (input.type === "tel") {
    // Phone validation is handled by validatePhoneField
    return;
  }

  input.addEventListener("blur", function () {
    validateGenericField(input);
  });
}

// Generic field validation
function validateGenericField(input) {
  const errorDiv = input.parentElement.querySelector(".field-validation-error");
  const value = input.value.trim();

  if (value.length === 0) {
    errorDiv.textContent = "This field cannot be empty";
    errorDiv.style.display = "block";
    input.style.borderColor = "#ef4444";
    return false;
  } else {
    errorDiv.style.display = "none";
    input.style.borderColor = "#d1d5db";
    return true;
  }
}

// Validate all fields in the microattestation panel
function validateAllFields() {
  const inputs = document.querySelectorAll(".micro-field-input");
  console.log(`Validating ${inputs.length} micro field inputs`); // Debug log

  let allValid = true;
  let invalidFields = [];

  inputs.forEach((input, index) => {
    let isValid = true;
    const fieldName = input.dataset.fieldKey || `field-${index}`;

    if (input.type === "tel") {
      isValid = validatePhoneField(input);
    } else {
      isValid = validateGenericField(input);
    }

    if (!isValid) {
      allValid = false;
      invalidFields.push(fieldName);
    }

    console.log(`Field ${fieldName} validation result:`, isValid); // Debug log
  });

  if (!allValid) {
    console.log("Validation failed for fields:", invalidFields); // Debug log
  } else {
    console.log("All fields passed validation"); // Debug log
  }

  return allValid;
}

// Update all fields and show confirmation
function updateAllFieldsAndShowConfirmation() {
  console.log("=== STARTING UPDATE ALL PROCESS ===");
  console.log("microattestationInProgress:", microattestationInProgress);

  // Log the current state of caqhProvider BEFORE updates
  console.log("=== CAQH PROVIDER BEFORE UPDATES ===");
  console.log("caqhProvider.name:", caqhProvider.name);
  console.log("caqhProvider.dea:", caqhProvider.dea);
  console.log("caqhProvider.npi:", caqhProvider.npi);
  console.log("caqhProvider.license:", caqhProvider.license);
  console.log("caqhProvider.specialty:", caqhProvider.specialty);
  console.log(
    "caqhProvider.locations:",
    JSON.stringify(caqhProvider.locations, null, 2)
  );

  try {
    // Ensure the microattestation panel stays visible
    const microPanel = document.getElementById("caqMicroattestationPanel");
    if (!microPanel) {
      console.error("Microattestation panel not found!");
      microattestationInProgress = false;
      console.log(
        "Reset microattestationInProgress = false due to panel not found"
      );
      return;
    }

    console.log("Panel found, ensuring visibility...");

    // Keep panel open and visible using exclusive panel management
    showExclusivePanel("caqMicroattestationPanel");
    openSidePanel();

    console.log("Panel visibility set, collecting form updates...");

    // Get all updated values from the form
    const inputs = document.querySelectorAll(".micro-field-input");
    console.log("Found micro field inputs:", inputs.length);

    const updates = [];

    inputs.forEach((input, index) => {
      const update = {
        fieldKey: input.dataset.fieldKey,
        fieldType: input.dataset.fieldType,
        locationIndex: input.dataset.locationIndex,
        newValue: input.value.trim(),
      };
      updates.push(update);
      console.log(`Input ${index}:`, update);
    });

    console.log("=== COLLECTED UPDATES ===");
    console.log("Total updates:", updates.length);
    console.log("Updates:", updates);

    // Apply updates to the main form (this would normally update the backend)
    console.log("=== APPLYING UPDATES TO FORM FIELDS ===");
    updates.forEach((update, index) => {
      if (update.fieldType === "provider") {
        // Update provider fields
        const field = document.getElementById(update.fieldKey);
        if (field) {
          const oldValue = field.value;
          field.value = update.newValue;
          console.log(
            `Form Update ${index}: ${update.fieldKey} "${oldValue}" → "${update.newValue}"`
          );
        } else {
          console.warn(`Form field not found: ${update.fieldKey}`);
        }
      } else if (update.fieldType === "location") {
        // Update location fields
        const fieldId = `${update.fieldKey}-${update.locationIndex}`;
        const field = document.getElementById(fieldId);
        if (field) {
          const oldValue = field.value;
          field.value = update.newValue;
          console.log(
            `Form Update ${index}: ${fieldId} "${oldValue}" → "${update.newValue}"`
          );
        } else {
          console.warn(`Form field not found: ${fieldId}`);
        }
      }
    });

    // Update the caqhProvider object in memory to reflect the changes
    console.log("=== APPLYING UPDATES TO CAQH PROVIDER OBJECT ===");
    updates.forEach((update, index) => {
      if (update.fieldType === "provider") {
        // Update provider-level fields in caqhProvider
        const providerFieldMappings = {
          deaNumber: "dea",
          npiNumber: "npi",
          licenseNumber: "license",
          nameDegree: "name",
        };

        const caqhFieldName = providerFieldMappings[update.fieldKey];
        if (caqhFieldName) {
          const oldValue = caqhProvider[caqhFieldName];
          caqhProvider[caqhFieldName] = update.newValue;
          console.log(
            `CAQH Update ${index}: ${caqhFieldName} "${oldValue}" → "${update.newValue}"`
          );
        }
      } else if (update.fieldType === "location") {
        // Update location-level fields in caqhProvider.locations[locationIndex]
        const locationIndex = parseInt(update.locationIndex);
        if (
          locationIndex >= 0 &&
          locationIndex < caqhProvider.locations.length
        ) {
          const location = caqhProvider.locations[locationIndex];

          if (update.fieldKey === "clinic") {
            const oldValue = location.name;
            location.name = update.newValue;
            console.log(
              `CAQH Update ${index}: locations[${locationIndex}].name "${oldValue}" → "${update.newValue}"`
            );
          } else if (update.fieldKey === "specialty") {
            // Specialty is provider-level, not location-specific
            const oldValue = caqhProvider.specialty;
            caqhProvider.specialty = update.newValue;
            console.log(
              `CAQH Update ${index}: specialty "${oldValue}" → "${update.newValue}"`
            );
          } else if (update.fieldKey === "street") {
            // Parse street address - may contain address + suite (e.g. "123 Main St, Ste 5A")
            const streetValue = update.newValue;
            const parts = streetValue.split(",").map((part) => part.trim());

            const oldAddress = location.address;
            const oldSuite = location.suite;

            if (parts.length > 1) {
              // Has suite/unit info
              location.address = parts[0];
              location.suite = parts.slice(1).join(", ");
            } else {
              // No suite info
              location.address = streetValue;
              location.suite = "";
            }
            console.log(
              `CAQH Update ${index}: locations[${locationIndex}].address "${oldAddress}" → "${location.address}"`
            );
            console.log(
              `CAQH Update ${index}: locations[${locationIndex}].suite "${oldSuite}" → "${location.suite}"`
            );
          } else if (update.fieldKey === "city") {
            const oldValue = location.city;
            location.city = update.newValue;
            console.log(
              `CAQH Update ${index}: locations[${locationIndex}].city "${oldValue}" → "${update.newValue}"`
            );
          } else if (update.fieldKey === "state") {
            const oldValue = location.state;
            location.state = update.newValue;
            console.log(
              `CAQH Update ${index}: locations[${locationIndex}].state "${oldValue}" → "${update.newValue}"`
            );
          } else if (update.fieldKey === "zip") {
            const oldValue = location.zip;
            location.zip = update.newValue;
            console.log(
              `CAQH Update ${index}: locations[${locationIndex}].zip "${oldValue}" → "${update.newValue}"`
            );
          } else if (update.fieldKey === "telephone") {
            const oldValue = location.phone;
            location.phone = update.newValue;
            console.log(
              `CAQH Update ${index}: locations[${locationIndex}].phone "${oldValue}" → "${update.newValue}"`
            );
          }
        }
      }
    });

    console.log("=== CAQH PROVIDER AFTER UPDATES ===");
    console.log("caqhProvider.name:", caqhProvider.name);
    console.log("caqhProvider.dea:", caqhProvider.dea);
    console.log("caqhProvider.npi:", caqhProvider.npi);
    console.log("caqhProvider.license:", caqhProvider.license);
    console.log("caqhProvider.specialty:", caqhProvider.specialty);
    console.log(
      "caqhProvider.locations:",
      JSON.stringify(caqhProvider.locations, null, 2)
    );

    console.log("=== REFRESHING PREVIEW ===");
    // Refresh the preview to show updated values
    try {
      proceedWithPreviewUpdate();
      console.log("Preview update completed successfully");
    } catch (error) {
      console.warn(
        "Preview update failed, but continuing with success view:",
        error
      );
    }

    console.log("=== TESTING CHANGE DETECTION AFTER UPDATE ===");
    // Test if the system still detects changes after the update
    const changedFieldsAfterUpdate = checkAllFieldsForChanges();
    console.log(
      "Changed fields detected AFTER update:",
      changedFieldsAfterUpdate
    );
    if (changedFieldsAfterUpdate && changedFieldsAfterUpdate.length > 0) {
      console.warn("⚠️ ISSUE: System still detecting changes after update!");
      console.log("This suggests the update process didn't work correctly.");
    } else {
      console.log("✅ Good: No changes detected after update");
    }

    console.log("=== SHOWING SUCCESS VIEW ===");
    // Show confirmation view - this will update the panel content and reset the flag
    showMicroattestationUpdateView();

    console.log("=== UPDATE ALL PROCESS COMPLETE ===");
  } catch (error) {
    console.error("=== ERROR IN UPDATE ALL PROCESS ===");
    console.error("Error in updateAllFieldsAndShowConfirmation:", error);
    console.error("Stack trace:", error.stack);
    // Reset flag on any error
    microattestationInProgress = false;
    console.log("Reset microattestationInProgress = false due to error");
    throw error; // Re-throw to maintain error handling
  }
}

// Function to show the update confirmation view
function showMicroattestationUpdateView() {
  console.log("=== ENTERING SHOW MICROATTESTATION UPDATE VIEW ===");
  console.log("microattestationInProgress:", microattestationInProgress);

  const microPanel = document.getElementById("caqMicroattestationPanel");
  if (!microPanel) {
    console.error(
      "❌ Microattestation panel not found in showMicroattestationUpdateView!"
    );
    // Reset flag on error
    microattestationInProgress = false;
    console.log(
      "Reset microattestationInProgress = false due to panel not found"
    );
    return;
  }

  console.log("✅ Microattestation panel found");
  console.log("Panel current display style:", microPanel.style.display);
  console.log("Panel classList:", microPanel.classList.toString());

  // Check the main CAQH panel state
  console.log("Main CAQH panel classes:", caqPanel.classList.toString());
  console.log(
    "Main CAQH panel contains 'open':",
    caqPanel.classList.contains("open")
  );

  // Ensure the panel and side panel remain visible using exclusive panel management
  console.log("Setting panel visibility...");
  showExclusivePanel("caqMicroattestationPanel");
  openSidePanel();

  console.log("After setting visibility:");
  console.log("- microPanel.style.display:", microPanel.style.display);
  console.log(
    "- caqPanel.classList.contains('open'):",
    caqPanel.classList.contains("open")
  );

  // Mark that confirmation has been shown this session
  sessionConfirmationShown = true;
  console.log("✅ Session confirmation flag set to true");

  const updateCount = lastDetectedChanges ? lastDetectedChanges.length : 0;
  const fieldsText = updateCount === 1 ? "field" : "fields";

  console.log(`Showing success for ${updateCount} ${fieldsText}`);
  console.log("lastDetectedChanges:", lastDetectedChanges);

  // Update panel content to show update confirmation
  console.log("Updating panel HTML content...");
  microPanel.innerHTML = `
    <div style="text-align: center; padding: 32px 0;">
      <h2 style="color: #0072CE; font-size: 1.8em; font-weight: 600; margin: 0 0 16px 0;">Update Complete</h2>
      
      <p style="color: #0072CE; line-height: 1.5; margin: 0 0 32px 0; font-size: 1em;">
        Successfully updated ${updateCount} ${fieldsText} in your CAQH profile.<br>
        Changes saved as drafts for your next attestation.
      </p>
      
      <div style="margin-bottom: 32px;">
        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="margin: 0 auto; display: block;">
          <circle cx="12" cy="12" r="10" fill="none" stroke="#0072CE" stroke-width="2.5"/>
          <path d="M8 12L11 15L16 9" stroke="#0072CE" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </div>
      
      <div style="background: #f0f9ff; border: 2px solid #bfdbfe; border-radius: 8px; padding: 16px; margin-bottom: 24px; text-align: left;">
        <div style="color: #1e40af; font-size: 0.9em; font-weight: 600; margin-bottom: 8px;">Next Steps:</div>
        <div style="color: #1e40af; font-size: 0.85em; line-height: 1.4;">
          • Review changes in your CAQH profile<br>
          • Complete attestation by your next due date<br>
          • Updates will be live after attestation approval
        </div>
      </div>
      
      <div style="display: flex; flex-direction: column; gap: 12px;">
        <button id="caqMicroBackToAutofillBtn" style="background: #0072CE; color: #fff; font-weight: 600; font-size: 1em; padding: 14px 20px; border: none; border-radius: 8px; cursor: pointer; width: 100%;">
          Back to Autofill
        </button>
        <button id="caqMicroBackToFormBtn" style="background: none; border: 2px solid #0072CE; color: #0072CE; font-weight: 600; font-size: 1em; padding: 12px 20px; border-radius: 8px; cursor: pointer; width: 100%;">
          Close
        </button>
        <a href="https://proview.caqh.org/Login/Index?ReturnUrl=%2f" target="_blank"><button id="caqMicroViewProfileBtn" style="background: none; border: 2px solid #0072CE; color: #0072CE; font-weight: 600; font-size: 1em; padding: 12px 20px; border-radius: 8px; cursor: pointer; width: 100%;">
          View in CAQH Profile
        </button></a>
      </div>
    </div>
  `;

  console.log("✅ Success panel HTML updated");

  // Add event listeners for the new buttons
  const backToAutofillBtn = document.getElementById(
    "caqMicroBackToAutofillBtn"
  );
  const backToFormBtn = document.getElementById("caqMicroBackToFormBtn");
  const viewProfileBtn = document.getElementById("caqMicroViewProfileBtn");

  console.log("Adding event listeners to buttons...");
  console.log("backToAutofillBtn found:", !!backToAutofillBtn);
  console.log("backToFormBtn found:", !!backToFormBtn);
  console.log("viewProfileBtn found:", !!viewProfileBtn);

  if (backToAutofillBtn) {
    backToAutofillBtn.addEventListener("click", function () {
      console.log("=== BACK TO AUTOFILL BUTTON CLICKED ===");
      // Reset microattestation flag and show autofill panel
      microattestationInProgress = false;
      console.log(
        "Reset microattestationInProgress = false on back to autofill"
      );
      showExclusivePanel("caqAutofillPanel");
      // Update header
      const caqPanelHeader = document.querySelector(".side-panel-header");
      if (caqPanelHeader) {
        caqPanelHeader.textContent = "Autofill";
      }
      console.log("Switched to autofill panel");
    });
    console.log("✅ Back to Autofill button event listener added");
  } else {
    console.error("❌ Back to Autofill button not found after HTML update!");
  }

  if (backToFormBtn) {
    backToFormBtn.addEventListener("click", function () {
      console.log("=== BACK TO FORM BUTTON CLICKED ===");
      // Reset microattestation flag when closing panel
      microattestationInProgress = false;
      console.log("Reset microattestationInProgress = false on back to form");
      // Reset microattestation state when panel is closed
      resetMicroattestationState();
      closeSidePanel();
      console.log("Panel closed via back to form");
    });
    console.log("✅ Back to Form button event listener added");
  } else {
    console.error("❌ Back to Form button not found after HTML update!");
  }

  if (viewProfileBtn) {
    viewProfileBtn.addEventListener("click", function () {
      console.log("=== VIEW PROFILE BUTTON CLICKED ===");
      // Open CAQH in new tab, but don't change the current panel
      // The link will handle the navigation
    });
    console.log("✅ View Profile button event listener added");
  } else {
    console.error("❌ View Profile button not found after HTML update!");
  }

  // Update header to clear old panel title
  const caqPanelHeader = document.querySelector(".side-panel-header");
  if (caqPanelHeader) {
    caqPanelHeader.textContent = "";
    console.log("✅ Panel header cleared");
  } else {
    console.warn("⚠️ Panel header not found");
  }

  // Final visibility check
  console.log("=== FINAL VISIBILITY CHECK ===");
  console.log("microPanel.style.display:", microPanel.style.display);
  console.log(
    "caqPanel.classList.contains('open'):",
    caqPanel.classList.contains("open")
  );
  console.log("microPanel.innerHTML length:", microPanel.innerHTML.length);

  // Reset the microattestation flag after a short delay to ensure panel stays open
  // during the success view rendering and any immediate click events
  setTimeout(() => {
    microattestationInProgress = false;
    console.log(
      "✅ Reset microattestationInProgress = false - success view complete (delayed)"
    );
  }, 100); // Small delay to ensure success view is fully rendered

  console.log("=== SHOW MICROATTESTATION UPDATE VIEW COMPLETED ===");
}

// CAQH login simulation and autofill panel logic
const caqLoginForm = document.getElementById("caqLoginForm");
const caqLoginFormWrap = document.getElementById("caqLoginFormWrap");
const caqAutofillPanel = document.getElementById("caqAutofillPanel");
const caqLocationCheckboxes = document.getElementById("caqLocationCheckboxes");
const caqProviderName = document.getElementById("caqProviderName");
const caqProviderId = document.getElementById("caqProviderId");
const caqPanelHeader = document.querySelector(".side-panel-header");

// Profile panel elements
let caqProfilePanel = null;

// CAQH login form logic
if (caqLoginForm) {
  caqLoginForm.addEventListener("submit", function (e) {
    e.preventDefault();
    // Simulate login success
    showExclusivePanel("caqAutofillPanel");
    if (caqPanelHeader) caqPanelHeader.textContent = "Autofill";
    const caqPanelSubheader = document.querySelector(".side-panel-subheader");
    if (caqPanelSubheader)
      caqPanelSubheader.textContent =
        // "You are affiliated with multiple practice locations. "
        "Select the practice location(s) you'd like to use for this form:";

    // Show profile icon when logged in
    const profileIcon = document.getElementById("caqProfileIcon");
    if (profileIcon) profileIcon.style.display = "flex";
    // Fill provider info
    caqProviderName.textContent = caqhProvider.name;
    caqProviderId.textContent = `CAQH ID: ${caqhProvider.caqhId}`;
    // Fill locations as stylized checkbox cards
    caqLocationCheckboxes.innerHTML = "";

    // Add search bar
    const searchContainer = document.createElement("div");
    searchContainer.style.marginBottom = "16px";

    const searchInput = document.createElement("input");
    searchInput.type = "text";
    searchInput.id = "caqLocationSearch";
    searchInput.placeholder = "Search locations...";
    searchInput.style.width = "87.5%";
    searchInput.style.padding = "12px 16px";
    searchInput.style.border = "2px solid #e5e7eb";
    searchInput.style.borderRadius = "8px";
    searchInput.style.fontSize = "1em";
    searchInput.style.fontFamily = "inherit";
    searchInput.style.outline = "none";
    searchInput.style.transition = "border-color 0.2s";

    // Add focus styling
    searchInput.addEventListener("focus", function () {
      this.style.borderColor = "#0072CE";
    });
    searchInput.addEventListener("blur", function () {
      this.style.borderColor = "#e5e7eb";
    });

    searchContainer.appendChild(searchInput);
    caqLocationCheckboxes.appendChild(searchContainer);

    // Add Select All checkbox card
    const selectAllCard = document.createElement("div");
    selectAllCard.className = "caq-location-card select-all-card";
    selectAllCard.style.display = "flex";
    selectAllCard.style.alignItems = "flex-start";
    selectAllCard.style.gap = "16px";
    selectAllCard.style.background = "#f7fafd";
    selectAllCard.style.border = "1.5px solid #bcd0e5";
    selectAllCard.style.borderRadius = "8px";
    selectAllCard.style.boxShadow = "0 1px 4px rgba(0,0,0,0.06)";
    selectAllCard.style.padding = "12px 14px 12px 14px";
    selectAllCard.style.marginBottom = "18px";
    selectAllCard.style.position = "relative";
    selectAllCard.style.cursor = "pointer";

    // Select All checkbox
    const selectAllCheckbox = document.createElement("input");
    selectAllCheckbox.type = "checkbox";
    selectAllCheckbox.id = "selectAllCheckbox";
    selectAllCheckbox.style.marginTop = "4px";
    selectAllCheckbox.checked = true;

    // Select All label
    const selectAllInfo = document.createElement("div");
    selectAllInfo.style.flex = "1";
    selectAllInfo.innerHTML = `
      <div style="font-size:1.25em;font-weight:600;color:#2F3E5B;">Select All</div>
    `;

    // Function to update select all checkbox state
    function updateSelectAllState() {
      const locationCheckboxes = Array.from(
        caqLocationCheckboxes.querySelectorAll(
          'input[name="caqLocationCheckbox"]'
        )
      ).filter((cb) => {
        // Only consider checkboxes in visible cards
        const card = cb.closest(".caq-location-card");
        return card && card.style.display !== "none";
      });

      const checkedCount = locationCheckboxes.filter((cb) => cb.checked).length;
      selectAllCheckbox.checked =
        checkedCount === locationCheckboxes.length &&
        locationCheckboxes.length > 0;
    }

    // Make the whole card clickable
    selectAllCard.addEventListener("click", function (e) {
      if (e.target !== selectAllCheckbox) {
        selectAllCheckbox.checked = !selectAllCheckbox.checked;
      }
      // Toggle all visible location checkboxes based on select all state
      const locationCheckboxes = Array.from(
        caqLocationCheckboxes.querySelectorAll(
          'input[name="caqLocationCheckbox"]'
        )
      ).filter((cb) => {
        const card = cb.closest(".caq-location-card");
        return card && card.style.display !== "none";
      });
      locationCheckboxes.forEach(
        (cb) => (cb.checked = selectAllCheckbox.checked)
      );
    });

    // Prevent card click from toggling twice if checkbox is clicked
    selectAllCheckbox.addEventListener("click", function (e) {
      e.stopPropagation();
      // Toggle all visible location checkboxes based on select all state
      const locationCheckboxes = Array.from(
        caqLocationCheckboxes.querySelectorAll(
          'input[name="caqLocationCheckbox"]'
        )
      ).filter((cb) => {
        const card = cb.closest(".caq-location-card");
        return card && card.style.display !== "none";
      });
      locationCheckboxes.forEach(
        (cb) => (cb.checked = selectAllCheckbox.checked)
      );
    });

    selectAllCard.appendChild(selectAllCheckbox);
    selectAllCard.appendChild(selectAllInfo);
    caqLocationCheckboxes.appendChild(selectAllCard);
    caqhProvider.locations.forEach((loc, i) => {
      const card = document.createElement("div");
      card.className = "caq-location-card";
      card.style.display = "flex";
      card.style.alignItems = "flex-start";
      card.style.gap = "16px";
      card.style.background = "#f7fafd";
      card.style.border = "1.5px solid #bcd0e5";
      card.style.borderRadius = "8px";
      card.style.boxShadow = "0 1px 4px rgba(0,0,0,0.06)";
      card.style.padding = "18px 18px 14px 14px";
      card.style.marginBottom = "18px";
      card.style.position = "relative";
      card.style.cursor = "pointer";
      // Checkbox input
      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.name = "caqLocationCheckbox";
      checkbox.id = `caqLocationCheckbox-${i}`;
      checkbox.value = i;
      checkbox.style.marginTop = "4px";
      checkbox.checked = true;
      // Info
      const info = document.createElement("div");
      info.style.flex = "1";
      info.innerHTML = `
        <div style=\"font-size:1.25em;font-weight:600;color:#2F3E5B;\">${
          loc.name
        }</div>
        <div style=\"font-size:1.08em;color:#6b7280;margin-top:2px;\">${
          loc.address
        }</div>
        ${
          loc.suite
            ? `<div style=\"font-size:1.08em;color:#6b7280;\">${loc.suite}</div>`
            : ""
        }
      `;
      // Make the whole card clickable
      card.addEventListener("click", function (e) {
        if (e.target !== checkbox) {
          checkbox.checked = !checkbox.checked;
        }
        updateSelectAllState();
      });
      // Prevent card click from toggling twice if checkbox is clicked
      checkbox.addEventListener("click", function (e) {
        e.stopPropagation();
        updateSelectAllState();
      });
      card.appendChild(checkbox);
      card.appendChild(info);
      caqLocationCheckboxes.appendChild(card);
    });

    // Add search functionality
    searchInput.addEventListener("input", function () {
      const searchTerm = this.value.toLowerCase().trim();
      const locationCards = caqLocationCheckboxes.querySelectorAll(
        ".caq-location-card:not(.select-all-card)"
      );

      locationCards.forEach((card) => {
        const clinicName = card
          .querySelector("div > div:first-child")
          .textContent.toLowerCase();
        const address = card
          .querySelector("div > div:nth-child(2)")
          .textContent.toLowerCase();

        const matches =
          clinicName.includes(searchTerm) || address.includes(searchTerm);
        card.style.display = matches ? "flex" : "none";
      });

      // Update select all state after filtering
      updateSelectAllState();
    });
  });
}
// Autofill logic
const caqAutofillBtn = document.getElementById("caqAutofillBtn");
// --- Autofill abort and pause flags ---
let autofillAborted = false;
let autofillPaused = false;
let autofillInProgress = false; // Track if autofill is currently running
let microattestationInProgress = false; // Track if microattestation update is in progress
if (caqAutofillBtn) {
  caqAutofillBtn.addEventListener("click", async function (e) {
    e.preventDefault();

    // Reset session confirmation state for fresh autofill
    sessionConfirmationShown = false;
    console.log("Reset sessionConfirmationShown = false for autofill");

    // Reset microattestation state for fresh autofill
    resetMicroattestationState();

    // Set autofill in progress flag to prevent panel from closing
    autofillInProgress = true;

    // Show loader panel exclusively
    showExclusivePanel("caqLoader");
    autofillAborted = false;
    autofillPaused = false;

    // Reset pause button state
    const pauseBtn = document.getElementById("caqPauseBtn");
    if (pauseBtn) pauseBtn.textContent = "Pause";
    const spinner = document.getElementById("caqLoaderSpinner");
    if (spinner) spinner.style.display = "block";
    const selectedLocations = Array.from(
      caqLocationCheckboxes.querySelectorAll(
        'input[name="caqLocationCheckbox"]:checked'
      )
    ).map((input) => parseInt(input.value, 10));
    const locs = selectedLocations.map((idx) => caqhProvider.locations[idx]);
    // Remove all but the first location group
    const groups = Array.from(
      locationsContainer.querySelectorAll(".location-group")
    );
    for (let i = groups.length - 1; i > 0; --i) groups[i].remove();
    // Add location groups if needed, with button press effect
    for (let i = 1; i < locs.length; ++i) {
      if (autofillAborted) {
        autofillInProgress = false; // Reset flag on abort
        return handleAutofillAbort();
      }
      await waitForUnpause();
      if (autofillAborted) {
        autofillInProgress = false; // Reset flag on abort
        return handleAutofillAbort();
      }

      addLocationBtn.classList.add("active");
      addLocationBtn.scrollIntoView({ behavior: "smooth", block: "center" });
      await new Promise((res) => setTimeout(res, 180));
      addLocationBtn.classList.remove("active");
      addLocationBtn.click();
      await new Promise((res) => setTimeout(res, 120));
    }
    updateRemoveButtons();
    // Update location field listeners after autofill adds locations
    updateLocationFieldListeners();
    // Helper for pretty field names
    function prettyFieldName(id) {
      const map = {
        deaNumber: "DEA Number",
        npiNumber: "NPI Number",
        licenseNumber: "License Number",
        nameDegree: "Name and Degree",
        printLicense: "Print License",
        clinic: "Clinic / Hospital",
        specialty: "Specialty",
        street: "Street Address",
        city: "City",
        state: "State",
        zip: "Zip Code",
        telephone: "Telephone Number",
        fax: "Fax Number",
      };
      // Remove trailing -0, -1, etc.
      id = id.replace(/-\d+$/, "");
      return (
        map[id] ||
        id
          .replace(/([A-Z])/g, " $1")
          .replace(/^./, (c) => c.toUpperCase())
          .trim()
      );
    }
    // Fill provider-wide fields first (top to bottom)
    const providerFields = [
      { id: "deaNumber", value: caqhProvider.dea },
      { id: "npiNumber", value: caqhProvider.npi },
      { id: "licenseNumber", value: caqhProvider.license },
      { id: "nameDegree", value: caqhProvider.name },
    ];
    const printLicenseRadio = document.querySelector(
      'input[name="printLicense"][value="yes"]'
    );
    printLicenseRadio.checked = true;
    // Mark print license radio as touched since it was set by autofill
    markFieldAsTouched(printLicenseRadio);
    for (let i = 0; i < providerFields.length; ++i) {
      if (autofillAborted) {
        autofillInProgress = false; // Reset flag on abort
        return handleAutofillAbort();
      }
      await waitForUnpause();
      if (autofillAborted) {
        autofillInProgress = false; // Reset flag on abort
        return handleAutofillAbort();
      }

      document.getElementById(
        "caqLoaderMsg"
      ).textContent = `Filling in ${prettyFieldName(providerFields[i].id)}...`;
      await new Promise((res) => setTimeout(res, 200));
      await fillFieldCharByChar(providerFields[i].id, providerFields[i].value);
    }
    // Fill each location group in order
    for (let i = 0; i < locs.length; ++i) {
      if (autofillAborted) {
        autofillInProgress = false; // Reset flag on abort
        return handleAutofillAbort();
      }
      await waitForUnpause();
      if (autofillAborted) {
        autofillInProgress = false; // Reset flag on abort
        return handleAutofillAbort();
      }

      const loc = locs[i];
      const group = locationsContainer.querySelectorAll(".location-group")[i];
      const fields = [
        { id: `clinic-${i}`, value: loc.name },
        { id: `specialty-${i}`, value: caqhProvider.specialty },
        {
          id: `street-${i}`,
          value: loc.address + (loc.suite ? ", " + loc.suite : ""),
        },
        { id: `city-${i}`, value: loc.city },
        { id: `state-${i}`, value: loc.state },
        { id: `zip-${i}`, value: loc.zip },
        { id: `telephone-${i}`, value: loc.phone },
        { id: `fax-${i}`, value: "" },
      ];
      for (let f = 0; f < fields.length; ++f) {
        if (autofillAborted) {
          autofillInProgress = false; // Reset flag on abort
          return handleAutofillAbort();
        }
        await waitForUnpause();
        if (autofillAborted) {
          autofillInProgress = false; // Reset flag on abort
          return handleAutofillAbort();
        }

        document.getElementById(
          "caqLoaderMsg"
        ).textContent = `Filling in ${prettyFieldName(fields[f].id)}...`;
        await new Promise((res) => setTimeout(res, 200));
        await fillFieldCharByChar(fields[f].id, fields[f].value);
      }
    }
    // Scroll file upload into view and show upload progress
    const licenseFileName = "state-license.jpeg";
    const licenseFilePath = "img/state-license.jpeg";
    const fileUpload = document.getElementById("fileUpload");
    const fileName = document.getElementById("fileName");
    fileUpload.scrollIntoView({ behavior: "smooth", block: "center" });
    function showLicenseUploadProgress(onComplete) {
      fileName.style.display = "none";
      const prevBar = document.getElementById("licenseUploadBar");
      if (prevBar) prevBar.remove();
      const clickDragText = Array.from(fileUpload.childNodes).find(
        (n) => n.nodeType === 3 || (n.nodeType === 1 && n.tagName === "BR")
      );
      if (clickDragText) clickDragText.remove();
      const barWrap = document.createElement("div");
      barWrap.id = "licenseUploadBar";
      barWrap.style.width = "100%";
      barWrap.style.background = "#e5e7eb";
      barWrap.style.borderRadius = "6px";
      barWrap.style.margin = "12px 0 0 0";
      barWrap.style.height = "14px";
      barWrap.style.overflow = "hidden";
      const bar = document.createElement("div");
      bar.style.height = "100%";
      bar.style.width = "0%";
      bar.style.background = "#0072CE";
      bar.style.transition = "width 0.2s";
      barWrap.appendChild(bar);
      fileUpload.appendChild(barWrap);
      // Show uploading message
      document.getElementById("caqLoaderMsg").textContent =
        "Uploading State License...";
      let progress = 0;
      const interval = setInterval(async () => {
        if (autofillAborted) {
          clearInterval(interval);
          barWrap.remove();
          fileName.style.display = "block";
          autofillInProgress = false; // Reset flag on abort
          return;
        }

        // Wait for unpause before continuing progress
        if (autofillPaused) {
          return; // Skip this interval tick if paused
        }

        progress += Math.random() * 18 + 8;
        if (progress > 100) progress = 100;
        bar.style.width = progress + "%";
        if (progress >= 100) {
          clearInterval(interval);
          setTimeout(() => {
            barWrap.remove();
            fileName.textContent = licenseFileName;
            fileName.style.display = "block";
            if (typeof onComplete === "function") onComplete();
          }, 350);
        }
      }, 120);
    }
    setTimeout(async () => {
      if (autofillAborted) {
        autofillInProgress = false; // Reset flag on abort
        return handleAutofillAbort();
      }
      await waitForUnpause();
      if (autofillAborted) {
        autofillInProgress = false; // Reset flag on abort
        return handleAutofillAbort();
      }

      showLicenseUploadProgress(() => {
        if (autofillAborted) {
          autofillInProgress = false; // Reset flag on abort
          return handleAutofillAbort();
        }

        // Autofill completed successfully
        autofillInProgress = false; // Reset flag on completion

        showAutofillSuccess();
        document.getElementById(
          "caqSuccessMsg"
        ).innerHTML = `Autofill complete<br>for <b>${
          caqhProvider.name
        }</b><br>at <b>${locs.map((l) => l.name).join(", ")}</b>`;
        // Trigger preview update after autofill completes to check for microattestation
        setTimeout(() => {
          updatePreview();
        }, 100);
      });
    }, 2500);
  });
}
/* =================================================================
   AUTOFILL PROGRESS LOADER WITH ACCESSIBILITY
   =================================================================
   
   This creates the loading interface shown during automated form filling.
   Users can pause/resume the process, and screen readers announce
   progress updates through aria-live regions.
   
   ================================================================= */

// Loader element for CAQH autofill with accessibility support
const caqLoader = document.createElement("div");
caqLoader.id = "caqLoader";
caqLoader.setAttribute("aria-live", "polite"); // Announce progress to screen readers
caqLoader.setAttribute("aria-label", "Autofill Progress");
caqLoader.style.display = "none";
caqLoader.style.justifyContent = "center";
caqLoader.style.alignItems = "center";
caqLoader.style.flexDirection = "column";
caqLoader.style.height = "320px";
caqLoader.innerHTML = `
  <div id="caqLoaderSpinner" style="margin-bottom:18px;" aria-hidden="true">
    <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="24" cy="24" r="20" stroke="#0072CE" stroke-width="4" opacity="0.2"/>
      <circle cx="24" cy="24" r="20" stroke="#0072CE" stroke-width="4" stroke-dasharray="100" stroke-dashoffset="60" style="transform-origin:center;animation:caq-spin 1s linear infinite;"/>
    </svg>
  </div>
  <div id="caqLoaderMsg" style="font-size:1.1em;color:#0072CE;font-weight:500;text-align:center;margin-bottom:24px;" aria-live="polite"></div>
  <button id="caqPauseBtn" style="background:none;border:2px solid #0072CE;color:#0072CE;font-weight:600;font-size:1em;padding:8px 24px;border-radius:8px;cursor:pointer;">Pause</button>
`;
caqAutofillPanel.parentNode.insertBefore(
  caqLoader,
  caqAutofillPanel.nextSibling
);

// Add pause/resume functionality
const caqPauseBtn = caqLoader.querySelector("#caqPauseBtn");
caqPauseBtn.addEventListener("click", function () {
  if (autofillPaused) {
    resumeAutofill();
  } else {
    pauseAutofill();
  }
});

function pauseAutofill() {
  autofillPaused = true;
  caqPauseBtn.textContent = "Resume";
  document.getElementById("caqLoaderMsg").textContent = "Autofill paused";

  // Hide spinner when paused
  const spinner = document.getElementById("caqLoaderSpinner");
  if (spinner) spinner.style.display = "none";

  // Auto-redirect to location selection after 2 seconds of being paused
  setTimeout(() => {
    if (autofillPaused && !autofillAborted) {
      // Still paused and not aborted
      // Return to location selection
      showExclusivePanel("caqAutofillPanel");
      // Update button text for repeat autofill
      const autofillBtn = document.getElementById("caqAutofillBtn");
      if (autofillBtn) {
        autofillBtn.textContent = "Autofill Again";
      }
      // Reset autofill state
      autofillPaused = false;
      autofillAborted = true; // Mark as aborted to stop any ongoing processes
      autofillInProgress = false; // Reset flag so panel can be closed again
    }
  }, 2000);
}

function resumeAutofill() {
  autofillPaused = false;
  caqPauseBtn.textContent = "Pause";

  // Show spinner when resumed
  const spinner = document.getElementById("caqLoaderSpinner");
  if (spinner) spinner.style.display = "block";

  // Restore the current message (don't override with "Autofill paused")
  const currentMsg = document.getElementById("caqLoaderMsg").textContent;
  if (currentMsg === "Autofill paused") {
    document.getElementById("caqLoaderMsg").textContent =
      "Resuming autofill...";
  }
}

// Helper function to wait for pause to be lifted
async function waitForUnpause() {
  while (autofillPaused && !autofillAborted) {
    await new Promise((res) => setTimeout(res, 100));
  }
}
// Success panel for completed autofill with accessibility support
const caqSuccess = document.createElement("div");
caqSuccess.id = "caqSuccess";
caqSuccess.setAttribute("aria-live", "assertive"); // Immediately announce completion
caqSuccess.setAttribute("aria-label", "Autofill Success");
caqSuccess.style.display = "none";
caqSuccess.style.justifyContent = "center";
caqSuccess.style.alignItems = "center";
caqSuccess.style.flexDirection = "column";
caqSuccess.style.height = "320px";
caqSuccess.innerHTML = `
  <div style="margin-bottom:18px;" aria-hidden="true">
    <svg width="56" height="56" viewBox="0 0 56 56" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="28" cy="28" r="26" fill="#E6F7ED" stroke="#10B981" stroke-width="4"/>
      <path d="M17 29.5L25.5 38L39 22" stroke="#10B981" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>
  </div>
  <div id="caqSuccessMsg" style="font-size:1.1em;color:#10B981;font-weight:600;text-align:center;" aria-live="assertive"></div>
`;
caqLoader.parentNode.insertBefore(caqSuccess, caqLoader.nextSibling);
// Add logic for CTAs
document.addEventListener("click", function (e) {
  if (e.target && e.target.id === "caqSuccessCloseBtn") {
    closeSidePanel();
  } else if (e.target && e.target.id === "caqSuccessAgainBtn") {
    // Trigger the main autofill button to follow the proper flow
    const autofillBtn = document.getElementById("caqAutofillBtn");
    if (autofillBtn) {
      // Programmatically click the main autofill button
      // This will trigger the full flow: reset states -> show loader -> autofill -> success -> return to autofill panel
      autofillBtn.click();
    }
  }
});

// Auto-return to location selection after success
function showAutofillSuccess() {
  showExclusivePanel("caqSuccess");

  // Auto-return to location selection after 1.5 seconds
  setTimeout(() => {
    const successPanel = document.getElementById("caqSuccess");
    if (successPanel && successPanel.style.display === "flex") {
      // Only if still showing success
      showExclusivePanel("caqAutofillPanel");
      // Update button text for repeat autofill
      const autofillBtn = document.getElementById("caqAutofillBtn");
      if (autofillBtn) {
        autofillBtn.textContent = "Autofill Again";
      }
      // Ensure autofill flag remains false so panel can be closed
      autofillInProgress = false;
    }
  }, 1500);
}

// Helper: fill a field word by word
async function fillFieldCharByChar(id, value) {
  const el = document.getElementById(id);
  if (!el) return;

  await waitForUnpause();
  if (autofillAborted) return;

  el.scrollIntoView({ behavior: "smooth", block: "center" });
  // Adjust for fixed bottom bar if needed
  const bar = document.querySelector(".form-actions-fixed");
  if (bar) {
    const barRect = bar.getBoundingClientRect();
    const elRect = el.getBoundingClientRect();
    // If the field is covered by the bar, scroll up
    if (elRect.bottom > barRect.top) {
      window.scrollBy({
        top: elRect.bottom - barRect.top + 18, // 18px extra padding
        left: 0,
        behavior: "smooth",
      });
    }
  }
  el.focus();
  el.value = "";

  // Split value into words for more realistic typing
  const words = value.split(" ");
  let currentValue = "";

  for (let i = 0; i < words.length; i++) {
    await waitForUnpause();
    if (autofillAborted) return;

    // Add the word (and space if not the last word)
    currentValue += words[i];
    if (i < words.length - 1) {
      currentValue += " ";
    }

    el.value = currentValue;
    await new Promise((res) => setTimeout(res, 120)); // Slightly faster per word
  }

  // Mark the field as touched since it was filled by autofill
  markFieldAsTouched(el);
}
// --- Multiple Locations Logic ---
const locationsContainer = document.getElementById("locationsContainer");
const addLocationBtn = document.getElementById("addLocationBtn");
function createLocationGroup(idx) {
  const group = document.createElement("div");
  group.className = "location-group";
  group.innerHTML = `
    <div class="form-group">
      <label for="clinic-${idx}">Clinic / Hospital</label>
      <input type="text" id="clinic-${idx}" name="clinic[]" placeholder="Clinic / Hospital">
    </div>
    <div class="form-group">
      <label for="specialty-${idx}">Specialty</label>
      <input type="text" id="specialty-${idx}" name="specialty[]" placeholder="Specialty">
    </div>
    <div class="form-group">
      <label for="street-${idx}">Street Address</label>
      <input type="text" id="street-${idx}" name="street[]" placeholder="Street Address">
    </div>
    <div class="form-group">
      <label for="city-${idx}">City</label>
      <input type="text" id="city-${idx}" name="city[]" placeholder="City">
    </div>
    <div class="form-group">
      <label for="state-${idx}">State</label>
      <input type="text" id="state-${idx}" name="state[]" placeholder="State">
    </div>
    <div class="form-group">
      <label for="zip-${idx}">Zip Code</label>
      <input type="text" id="zip-${idx}" name="zip[]" placeholder="Zip Code">
    </div>
    <div class="form-group">
      <label for="telephone-${idx}">Telephone Number <span style='color: #ef4444;'>*</span></label>
      <input type="text" id="telephone-${idx}" name="telephone[]" placeholder="Telephone Number" required>
    </div>
    <div class="form-group">
      <label for="fax-${idx}">Fax Number</label>
      <input type="text" id="fax-${idx}" name="fax[]" placeholder="Fax Number">
    </div>
    <button type="button" class="remove-location-btn" style="display:none;margin-bottom:18px;background:#f3f4f6;color:#e11d48;border:none;padding:6px 12px;border-radius:4px;cursor:pointer;">Remove Location</button>
    <hr style="margin:18px 0;">
  `;
  return group;
}
function updateRemoveButtons() {
  const groups = locationsContainer.querySelectorAll(".location-group");
  groups.forEach((group, i) => {
    const btn = group.querySelector(".remove-location-btn");
    btn.style.display = groups.length > 1 ? "block" : "none";
  });
}
addLocationBtn.addEventListener("click", () => {
  const idx = locationsContainer.querySelectorAll(".location-group").length;
  const group = createLocationGroup(idx);
  locationsContainer.appendChild(group);
  updateRemoveButtons();
  // Update location field listeners after adding new location
  updateLocationFieldListeners();
  // Reset microattestation panel flag since form structure changed
  microattestationPanelShown = false;
});
locationsContainer.addEventListener("click", function (e) {
  if (e.target.classList.contains("remove-location-btn")) {
    const group = e.target.closest(".location-group");
    if (group) {
      // Get the current index of the group being removed
      const groups = Array.from(
        locationsContainer.querySelectorAll(".location-group")
      );
      const removedIndex = groups.indexOf(group);

      // Clean up touched fields for all locations at and after the removed index
      const locationFieldKeys = [
        "clinic",
        "specialty",
        "street",
        "city",
        "state",
        "zip",
        "telephone",
        "fax",
      ];
      for (let i = removedIndex; i < groups.length; i++) {
        locationFieldKeys.forEach((fieldKey) => {
          touchedFields.delete(`${fieldKey}-${i}`);
        });
      }
      console.log(
        `Cleaned up touched fields for removed location ${removedIndex} and subsequent locations`
      );

      group.remove();
      // Re-index remaining groups' IDs
      const remainingGroups =
        locationsContainer.querySelectorAll(".location-group");
      remainingGroups.forEach((g, i) => {
        g.querySelectorAll("input").forEach((input) => {
          const base = input.name.replace(/\[\]$/, "");
          input.id = `${base}-${i}`;
        });
        g.querySelectorAll("label").forEach((label) => {
          const htmlFor = label.getAttribute("for");
          if (htmlFor) {
            const base = htmlFor.replace(/-\d+$/, "");
            label.setAttribute("for", `${base}-${i}`);
          }
        });
      });

      // Re-add touched field state for remaining locations if they were previously touched
      // (We need to check the actual field values to see if they should be considered touched)
      remainingGroups.forEach((g, newIndex) => {
        const inputs = g.querySelectorAll("input");
        inputs.forEach((input) => {
          if (input.value.trim()) {
            // If the field has a value, mark it as touched with the new index
            const base = input.name.replace(/\[\]$/, "");
            const newFieldKey = `${base}-${newIndex}`;
            touchedFields.add(newFieldKey);
          }
        });
      });

      updateRemoveButtons();
      // Update location field listeners after removing location
      updateLocationFieldListeners();
      // Reset microattestation panel flag since form structure changed
      microattestationPanelShown = false;
      // Trigger preview update after location removal
      updatePreview();
    }
  }
});
updateRemoveButtons();

// Initialize automatic form monitoring when the DOM is loaded
document.addEventListener("DOMContentLoaded", function () {
  setupAutomaticFormMonitoring();
  // Trigger initial preview update
  updatePreview();
});

// Add keyframes for loader spinner if not already present
if (!document.getElementById("caqSpinKeyframes")) {
  const style = document.createElement("style");
  style.id = "caqSpinKeyframes";
  style.innerHTML = `@keyframes caq-spin { 100% { transform: rotate(360deg); } }`;
  document.head.appendChild(style);
}
// Add CAQH logo to the top left of the side panel, with profile icon and close button
if (caqPanel && !document.getElementById("caqhLogoTop")) {
  const logoBar = document.createElement("div");
  logoBar.style.display = "flex";
  logoBar.style.alignItems = "center";
  logoBar.style.justifyContent = "space-between";
  logoBar.style.position = "absolute";
  logoBar.style.top = "18px";
  logoBar.style.left = "18px";
  logoBar.style.right = "18px";
  logoBar.style.height = "32px";
  logoBar.style.zIndex = "1102";

  // Logo
  const logo = document.createElement("img");
  logo.src = "img/caqh-logo.png";
  logo.id = "caqhLogoTop";
  logo.alt = "CAQH Logo";
  logo.style.height = "18px";
  logo.style.width = "auto";
  logo.style.display = "block";

  // Right side container for profile icon and close button
  const rightSide = document.createElement("div");
  rightSide.style.display = "flex";
  rightSide.style.alignItems = "center";
  rightSide.style.gap = "12px";

  // Profile icon
  const profileIcon = document.createElement("div");
  profileIcon.id = "caqProfileIcon";
  profileIcon.style.width = "24px";
  profileIcon.style.height = "24px";
  profileIcon.style.borderRadius = "50%";
  profileIcon.style.background = "#6b7280";
  profileIcon.style.cursor = "pointer";
  profileIcon.style.display = "none"; // Hidden by default
  profileIcon.style.alignItems = "center";
  profileIcon.style.justifyContent = "center";
  profileIcon.style.color = "white";
  profileIcon.style.fontSize = "12px";
  profileIcon.style.fontWeight = "600";
  profileIcon.innerHTML = `
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 12C14.7614 12 17 9.76142 17 7C17 4.23858 14.7614 2 12 2C9.23858 2 7 4.23858 7 7C7 9.76142 9.23858 12 12 12Z" fill="currentColor"/>
      <path d="M12 14C7.58172 14 4 17.5817 4 22H20C20 17.5817 16.4183 14 12 14Z" fill="currentColor"/>
    </svg>
  `;

  // Move the close button into the flex bar
  const closeBtn = document.getElementById("caqPanelClose");
  if (closeBtn) {
    closeBtn.style.position = "static";
    closeBtn.style.margin = "0";
    closeBtn.style.top = "unset";
    closeBtn.style.right = "unset";
    closeBtn.style.transform = "none";

    rightSide.appendChild(profileIcon);
    rightSide.appendChild(closeBtn);
    logoBar.appendChild(logo);
    logoBar.appendChild(rightSide);
    caqPanel.insertBefore(logoBar, caqPanel.firstChild);

    // Add click handler for profile icon
    profileIcon.addEventListener("click", function () {
      showProfilePanel();
    });
  }
}

// Create and show profile panel
function showProfilePanel() {
  // Create profile panel if it doesn't exist
  if (!caqProfilePanel) {
    caqProfilePanel = document.createElement("div");
    caqProfilePanel.id = "caqProfilePanel";
    // caqProfilePanel.style.padding = "24px 24px 24px 24px";
    caqProfilePanel.style.height = "100%";
    caqProfilePanel.style.boxSizing = "border-box";
    caqProfilePanel.style.overflow = "auto";

    caqProfilePanel.innerHTML = `
      <div style="margin-bottom: 24px;">
        <button id="caqProfileBackBtn" style="background: none; border: none; color: #6b7280; font-size: 16px; cursor: pointer; padding: 0; display: flex; align-items: center; gap: 8px;">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M15 18L9 12L15 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          Back
        </button>
      </div>
      
      <h2 style="color: #0072CE; font-size: 1.5em; font-weight: 600; margin-bottom: 24px;">Account Information</h2>
      
      <div style="background: #f9fafb; border: 2px solid #e5e7eb; border-radius: 12px; padding: 24px; margin-bottom: 32px;">
        <div style="margin-bottom: 20px;">
          <div style="color: #0072CE; font-size: 0.9em; font-weight: 600; margin-bottom: 4px;">Username</div>
          <div style="color: #374151; font-size: 1.1em;">${caqhProvider.username}</div>
        </div>
        
        <div style="margin-bottom: 20px;">
          <div style="color: #0072CE; font-size: 0.9em; font-weight: 600; margin-bottom: 4px;">Full Name</div>
          <div style="color: #374151; font-size: 1.1em;">${caqhProvider.name}</div>
        </div>
        
        <div style="margin-bottom: 20px;">
          <div style="color: #0072CE; font-size: 0.9em; font-weight: 600; margin-bottom: 4px;">CAQH ID</div>
          <div style="color: #374151; font-size: 1.1em;">${caqhProvider.caqhId}</div>
        </div>
        
        <div style="margin-bottom: 0;">
          <div style="color: #0072CE; font-size: 0.9em; font-weight: 600; margin-bottom: 4px;">NPI Number</div>
          <div style="color: #374151; font-size: 1.1em;">${caqhProvider.npi}</div>
        </div>
      </div>
      
      <button id="caqProfileLogOutBtn" style="background: none; border: 2px solid #0072CE; color: #0072CE; font-weight: 600; font-size: 1em; padding: 12px 24px; border-radius: 8px; cursor: pointer; width: 100%; text-align: center;">
        Log Out
      </button>
    `;

    // Insert profile panel into the side panel
    caqPanel.appendChild(caqProfilePanel);

    // Add event listeners
    document
      .getElementById("caqProfileBackBtn")
      .addEventListener("click", function () {
        hideProfilePanel();
      });

    document
      .getElementById("caqProfileLogOutBtn")
      .addEventListener("click", function () {
        signOutUser();
      });
  }

  // Show profile panel exclusively
  showExclusivePanel("caqProfilePanel");

  // Update header
  if (caqPanelHeader) caqPanelHeader.textContent = "";
  const caqPanelSubheader = document.querySelector(".side-panel-subheader");
  if (caqPanelSubheader) caqPanelSubheader.textContent = "";
}

// Hide profile panel and return to autofill panel
function hideProfilePanel() {
  showExclusivePanel("caqAutofillPanel");

  // Restore headers
  if (caqPanelHeader) caqPanelHeader.textContent = "Autofill";
  const caqPanelSubheader = document.querySelector(".side-panel-subheader");
  if (caqPanelSubheader)
    caqPanelSubheader.textContent =
      "Select the practice location(s) you'd like to use for this form:";
}

// Sign out user and return to login
function signOutUser() {
  // Reset microattestation state
  resetMicroattestationState();

  // Show login form exclusively
  showExclusivePanel("caqLoginFormWrap");

  // Hide profile icon when signed out
  const profileIcon = document.getElementById("caqProfileIcon");
  if (profileIcon) profileIcon.style.display = "none";

  // Reset headers
  if (caqPanelHeader) caqPanelHeader.textContent = "Sign in to CAQH";
  const caqPanelSubheader = document.querySelector(".side-panel-subheader");
  if (caqPanelSubheader) caqPanelSubheader.textContent = "";
}

// --- Autofill abort handler ---
function handleAutofillAbort() {
  // Reset autofill flags
  autofillInProgress = false;

  showExclusivePanel("caqAutofillPanel");
  document.getElementById("caqLoaderMsg").textContent = "";

  // Reset pause state
  autofillPaused = false;
  const pauseBtn = document.getElementById("caqPauseBtn");
  if (pauseBtn) pauseBtn.textContent = "Pause";
  const spinner = document.getElementById("caqLoaderSpinner");
  if (spinner) spinner.style.display = "block";
}

// Panel close button functionality
const caqPanelClose = document.getElementById("caqPanelClose");
if (caqPanelClose) {
  caqPanelClose.addEventListener("click", () => {
    // Reset microattestation state when panel is closed
    resetMicroattestationState();
    closeSidePanel();
  });
}

// Helper function to scroll panel to top
function scrollPanelToTop() {
  const panel = document.getElementById("caqPanel");
  if (panel) {
    panel.scrollTop = 0;
  }
}

/* =================================================================
   ACCESSIBLE PANEL MANAGEMENT 
   =================================================================
   
   These functions handle opening/closing the side panel with proper
   accessibility support including focus management and ARIA attributes.
   
   ================================================================= */

// Helper function to open the side panel with accessibility support
function openSidePanel() {
  caqPanel.classList.add("open");
  document.body.classList.add("panel-open");

  // Set proper ARIA state for screen readers
  caqPanel.setAttribute("aria-hidden", "false");

  // Focus management will be handled by individual panel functions
  // that know which element should receive focus
}

// Helper function to close the side panel with accessibility cleanup
function closeSidePanel() {
  caqPanel.classList.remove("open");
  document.body.classList.remove("panel-open");

  // Hide from screen readers when closed
  caqPanel.setAttribute("aria-hidden", "true");

  // Hide preview from screen readers when panel closes
  const scriptPreview = document.getElementById("scriptPreview");
  if (scriptPreview && scriptPreview.style.display === "none") {
    scriptPreview.setAttribute("aria-hidden", "true");
  }
}

// Helper function to manage exclusive panel views with accessibility support
// This ensures only one panel is visible at a time and proper ARIA states are maintained
function showExclusivePanel(panelToShow) {
  // Define all possible panels for systematic management
  const allPanels = [
    { id: "caqLoginFormWrap", display: "block" },
    { id: "caqAutofillPanel", display: "block" },
    { id: "caqLoader", display: "flex" },
    { id: "caqSuccess", display: "flex" },
    { id: "caqMicroattestationPanel", display: "block" },
  ];

  // Hide all panels first and set proper ARIA states
  allPanels.forEach(({ id }) => {
    const panel = document.getElementById(id);
    if (panel) {
      panel.style.display = "none";
      panel.setAttribute("aria-hidden", "true");
    }
  });

  // Also handle profile panel if it exists
  if (caqProfilePanel) {
    caqProfilePanel.style.display = "none";
    caqProfilePanel.setAttribute("aria-hidden", "true");
  }

  // Show the requested panel with proper accessibility attributes
  const targetPanel = allPanels.find((panel) => panel.id === panelToShow);
  const panelElement = document.getElementById(panelToShow);

  if (panelElement && targetPanel) {
    panelElement.style.display = targetPanel.display;
    panelElement.setAttribute("aria-hidden", "false");

    // Scroll to top when switching views for better UX
    scrollPanelToTop();
  } else if (panelToShow === "caqProfilePanel" && caqProfilePanel) {
    caqProfilePanel.style.display = "block";
    caqProfilePanel.setAttribute("aria-hidden", "false");
    scrollPanelToTop();
  }
}
