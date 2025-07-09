// Show/hide CAQH panel
const autofillBtn = document.getElementById("autofillBtn");
const caqPanel = document.getElementById("caqPanel");
autofillBtn.addEventListener("click", (e) => {
  e.preventDefault();
  caqPanel.classList.add("open");
});
// Close panel with X button
document.getElementById("caqPanelClose").addEventListener("click", () => {
  caqPanel.classList.remove("open");
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
// --- Multi-location Preview Logic ---
function updatePreview() {
  const dea = document.getElementById("deaNumber").value.trim();
  const npi = document.getElementById("npiNumber").value.trim();
  const lic = document.getElementById("licenseNumber").value.trim();
  const printLic =
    document.querySelector('input[name="printLicense"]:checked').value ===
    "yes";
  const name = document.getElementById("nameDegree").value.trim();
  // Multi-location fields
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
  // Top line: DEA, NPI, LIC
  document.getElementById("previewDea").textContent = dea ? `DEA # ${dea}` : "";
  document.getElementById("previewNpi").textContent = npi ? `NPI # ${npi}` : "";
  document.getElementById("previewLic").textContent =
    printLic && lic ? `LIC # ${lic}` : "";
  // Name
  document.getElementById("previewName").textContent = name;
  // Hide old single-location fields
  document.getElementById("previewClinic").textContent = "";
  document.getElementById("previewSpecialty").textContent = "";
  document.getElementById("previewStreet").textContent = "";
  document.getElementById("previewCityStateZip").textContent = "";
  document.getElementById("previewTel").textContent = "";
  // Insert locations into preview
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
    caqLoginFormWrap.style.display = "none";
    caqAutofillPanel.style.display = "block";
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
        }${loc.suite ? ", " + loc.suite : ""}</div>
      `;
      // Ellipsis
      const ellipsis = document.createElement("div");
      ellipsis.innerHTML =
        '<svg width="22" height="22" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="11" cy="5.5" r="1.5" fill="#2F3E5B"/><circle cx="11" cy="11" r="1.5" fill="#2F3E5B"/><circle cx="11" cy="16.5" r="1.5" fill="#2F3E5B"/></svg>';
      ellipsis.style.position = "absolute";
      ellipsis.style.right = "16px";
      ellipsis.style.top = "50%";
      ellipsis.style.transform = "translateY(-50%)";
      ellipsis.style.cursor = "pointer";
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
      card.appendChild(ellipsis);
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
if (caqAutofillBtn) {
  caqAutofillBtn.addEventListener("click", async function (e) {
    e.preventDefault();
    caqAutofillPanel.style.display = "none";
    caqLoader.style.display = "flex";
    caqSuccess.style.display = "none";
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
      if (autofillAborted) return handleAutofillAbort();
      await waitForUnpause();
      if (autofillAborted) return handleAutofillAbort();

      addLocationBtn.classList.add("active");
      addLocationBtn.scrollIntoView({ behavior: "smooth", block: "center" });
      await new Promise((res) => setTimeout(res, 180));
      addLocationBtn.classList.remove("active");
      addLocationBtn.click();
      await new Promise((res) => setTimeout(res, 120));
    }
    updateRemoveButtons();
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
    document.querySelector(
      'input[name="printLicense"][value="yes"]'
    ).checked = true;
    for (let i = 0; i < providerFields.length; ++i) {
      if (autofillAborted) return handleAutofillAbort();
      await waitForUnpause();
      if (autofillAborted) return handleAutofillAbort();

      document.getElementById(
        "caqLoaderMsg"
      ).textContent = `Filling in ${prettyFieldName(providerFields[i].id)}...`;
      await new Promise((res) => setTimeout(res, 200));
      await fillFieldCharByChar(providerFields[i].id, providerFields[i].value);
    }
    // Fill each location group in order
    for (let i = 0; i < locs.length; ++i) {
      if (autofillAborted) return handleAutofillAbort();
      await waitForUnpause();
      if (autofillAborted) return handleAutofillAbort();

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
        if (autofillAborted) return handleAutofillAbort();
        await waitForUnpause();
        if (autofillAborted) return handleAutofillAbort();

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
      if (autofillAborted) return handleAutofillAbort();
      await waitForUnpause();
      if (autofillAborted) return handleAutofillAbort();

      showLicenseUploadProgress(() => {
        if (autofillAborted) return handleAutofillAbort();
        caqLoader.style.display = "none";
        caqSuccess.style.display = "flex";
        document.getElementById(
          "caqSuccessMsg"
        ).innerHTML = `Autofill complete<br>for <b>${
          caqhProvider.name
        }</b><br>at <b>${locs.map((l) => l.name).join(", ")}</b>`;
      });
    }, 2500);
  });
}
// Loader and success message elements for CAQH autofill
const caqLoader = document.createElement("div");
caqLoader.id = "caqLoader";
caqLoader.style.display = "none";
caqLoader.style.justifyContent = "center";
caqLoader.style.alignItems = "center";
caqLoader.style.flexDirection = "column";
caqLoader.style.height = "320px";
caqLoader.innerHTML = `
  <div id="caqLoaderSpinner" style="margin-bottom:18px;">
    <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="24" cy="24" r="20" stroke="#0072CE" stroke-width="4" opacity="0.2"/>
      <circle cx="24" cy="24" r="20" stroke="#0072CE" stroke-width="4" stroke-dasharray="100" stroke-dashoffset="60" style="transform-origin:center;animation:caq-spin 1s linear infinite;"/>
    </svg>
  </div>
  <div id="caqLoaderMsg" style="font-size:1.1em;color:#0072CE;font-weight:500;text-align:center;margin-bottom:24px;"></div>
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
const caqSuccess = document.createElement("div");
caqSuccess.id = "caqSuccess";
caqSuccess.style.display = "none";
caqSuccess.style.justifyContent = "center";
caqSuccess.style.alignItems = "center";
caqSuccess.style.flexDirection = "column";
caqSuccess.style.height = "320px";
caqSuccess.innerHTML = `
  <div style="margin-bottom:18px;">
    <svg width="56" height="56" viewBox="0 0 56 56" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="28" cy="28" r="26" fill="#E6F7ED" stroke="#10B981" stroke-width="4"/>
      <path d="M17 29.5L25.5 38L39 22" stroke="#10B981" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>
  </div>
  <div id="caqSuccessMsg" style="font-size:1.1em;color:#10B981;font-weight:600;text-align:center;"></div>
  <div style="margin-top:24px;display:flex;gap:16px;justify-content:center;width:100%;align-items:center;">
    <button id="caqSuccessCloseBtn" style="background:#0072CE;color:#fff;font-weight:700;border:none;padding:8px 24px;border-radius:8px;cursor:pointer;font-size:1em;">Close</button>
    <button id="caqSuccessAgainBtn" style="background:none;color:#0072CE;font-weight:500;border:none;padding:8px 8px;border-radius:8px;cursor:pointer;font-size:1em;text-decoration:underline;text-underline-offset:2px;">Back to location selection</button>
  </div>
`;
caqLoader.parentNode.insertBefore(caqSuccess, caqLoader.nextSibling);
// Add logic for CTAs
document.addEventListener("click", function (e) {
  if (e.target && e.target.id === "caqSuccessCloseBtn") {
    caqPanel.classList.remove("open");
  } else if (e.target && e.target.id === "caqSuccessAgainBtn") {
    caqSuccess.style.display = "none";
    caqAutofillPanel.style.display = "block";
  }
});
// Helper: fill a field character by character
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
  for (let i = 0; i < value.length; ++i) {
    await waitForUnpause();
    if (autofillAborted) return;

    el.value += value[i];
    await new Promise((res) => setTimeout(res, 28));
  }
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
});
locationsContainer.addEventListener("click", function (e) {
  if (e.target.classList.contains("remove-location-btn")) {
    const group = e.target.closest(".location-group");
    if (group) {
      group.remove();
      // Re-index remaining groups' IDs
      const groups = locationsContainer.querySelectorAll(".location-group");
      groups.forEach((g, i) => {
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
      updateRemoveButtons();
    }
  }
});
updateRemoveButtons();
document.addEventListener("DOMContentLoaded", function () {
  const updateBtn = document.querySelector(".update-btn");
  if (updateBtn) {
    updateBtn.addEventListener("click", updatePreview);
  }
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
  // Hide other panels
  if (caqLoginFormWrap) caqLoginFormWrap.style.display = "none";
  if (caqAutofillPanel) caqAutofillPanel.style.display = "none";
  if (caqLoader) caqLoader.style.display = "none";
  if (caqSuccess) caqSuccess.style.display = "none";

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

  // Show profile panel
  caqProfilePanel.style.display = "block";

  // Update header
  if (caqPanelHeader) caqPanelHeader.textContent = "";
  const caqPanelSubheader = document.querySelector(".side-panel-subheader");
  if (caqPanelSubheader) caqPanelSubheader.textContent = "";
}

// Hide profile panel and return to autofill panel
function hideProfilePanel() {
  if (caqProfilePanel) caqProfilePanel.style.display = "none";
  if (caqAutofillPanel) caqAutofillPanel.style.display = "block";

  // Restore headers
  if (caqPanelHeader) caqPanelHeader.textContent = "Autofill";
  const caqPanelSubheader = document.querySelector(".side-panel-subheader");
  if (caqPanelSubheader)
    caqPanelSubheader.textContent =
      "Select the practice location(s) you'd like to use for this form:";
}

// Sign out user and return to login
function signOutUser() {
  // Hide all panels
  if (caqProfilePanel) caqProfilePanel.style.display = "none";
  if (caqAutofillPanel) caqAutofillPanel.style.display = "none";
  if (caqLoader) caqLoader.style.display = "none";
  if (caqSuccess) caqSuccess.style.display = "none";

  // Show login form
  if (caqLoginFormWrap) caqLoginFormWrap.style.display = "block";

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
  caqLoader.style.display = "none";
  caqAutofillPanel.style.display = "block";
  document.getElementById("caqLoaderMsg").textContent = "";

  // Reset pause state
  autofillPaused = false;
  const pauseBtn = document.getElementById("caqPauseBtn");
  if (pauseBtn) pauseBtn.textContent = "Pause";
  const spinner = document.getElementById("caqLoaderSpinner");
  if (spinner) spinner.style.display = "block";
}
