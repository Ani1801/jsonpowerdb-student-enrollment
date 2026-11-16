/**
 * Student Enrollment Form - JavaScript Controller
 * JsonPowerDB (JPDB) Micro-Project Integration
 * 
 * Target Database Details:
 * - Database: SCHOOL-DB
 * - Relation: STUDENT-TABLE
 * - Primary Key: Roll-No
 * - API Base URL: http://api.login2explore.com:5577
 * - Endpoints: /api/iml (Manipulation), /api/irl (Retrieval)
 */

/* ==========================================================================
   1. Database & Connection Configuration
   ========================================================================== */

/**
 * JPDB Connection Token Configuration
 * -----------------------------------
 * The connection token is loaded from local configuration (config.js) via
 * window.JPDB_CONFIG.connectionToken to keep credentials out of version control.
 * 
 * Note on Client-Side Security:
 * The connection token is loaded into the browser runtime to execute direct JPDB REST calls.
 * While kept out of Git tracking via config.js, it is accessible to users inspecting network traffic in the browser.
 */
const JPDB_CONNECTION_TOKEN = (typeof window.JPDB_CONFIG !== "undefined" && window.JPDB_CONFIG.connectionToken)
    ? window.JPDB_CONFIG.connectionToken
    : "";

// JsonPowerDB API URL & Endpoints
// Note: Port 5577 is served over HTTPS (TLS). Using http:// causes an immediate protocol error.
const JPDB_BASE_URL = "https://api.login2explore.com:5577";
const JPDB_IRL_ENDPOINT = "/api/irl"; // Integrated Retrieval Language endpoint
const JPDB_IML_ENDPOINT = "/api/iml"; // Integrated Manipulation Language endpoint

// Database & Relation constants
const DB_NAME = "SCHOOL-DB";
const REL_NAME = "STUDENT-TABLE";
const PRIMARY_KEY = "Roll-No";

/* ==========================================================================
   2. Application State Variables
   ========================================================================== */

// Holds the internal record number (rec_no) when updating an existing record
let currentRecNo = null;

// Lock flag to prevent duplicate simultaneous database lookups
let isCheckingRollNo = false;

// Cache the last searched Roll-No to avoid duplicate redundant calls
let lastCheckedRollNo = null;

/* ==========================================================================
   3. Initialization & Lifecycle Handlers
   ========================================================================== */

$(document).ready(function () {
    // Check protocol (file:// vs http://)
    checkProtocol();

    // Check if helper libraries are loaded
    verifyDependencies();

    // Set form to initial pristine state
    initForm();

    // Event Bindings
    bindEvents();
});

/**
 * Detects if the page is opened directly from disk (file://) or over HTTPS
 */
function checkProtocol() {
    if (window.location.protocol === "file:") {
        console.warn("CORS Security Alert: Opening HTML files via file:// causes modern browsers to block cross-origin requests. Please serve using a local server (e.g. 'python -m http.server 8000') and open http://localhost:8000.");
    }
}

/**
 * Verifies that jQuery and jpdb-commons helper functions are loaded
 */
function verifyDependencies() {
    if (typeof jQuery === "undefined") {
        console.error("jQuery is missing. Please ensure an active internet connection to load the CDN.");
        showStatus("Error: jQuery library could not be loaded.", "error");
        return;
    }
    if (typeof executeCommandAtGivenBaseUrl === "undefined" || typeof createPUTRequest === "undefined") {
        console.warn("JPDB Commons library is not loaded or unreachable.");
        showStatus("Warning: JPDB Commons helper library is not loaded. Check network or script tag.", "warning");
    }
}

/**
 * Attaches event listeners for input interaction and button clicks
 */
function bindEvents() {
    // Trigger lookup when user finishes entering Roll-No (on change or blur)
    $("#Roll-No").on("change", function () {
        handleRollNoLookup();
    });

    // Also trigger lookup if user hits Enter in the Roll-No field
    $("#Roll-No").on("keydown", function (e) {
        if (e.key === "Enter" || e.keyCode === 13) {
            e.preventDefault();
            handleRollNoLookup();
        }
    });

    // Save Button Click
    $("#btn-save").on("click", function () {
        saveStudent();
    });

    // Update Button Click
    $("#btn-update").on("click", function () {
        updateStudent();
    });

    // Reset Button Click
    $("#btn-reset").on("click", function () {
        initForm();
    });
}

/**
 * Restores the exact initial form state:
 * - All fields empty
 * - Only Roll-No enabled
 * - All other fields disabled
 * - Save, Update, Reset disabled
 * - Cursor automatically focused on Roll-No
 */
function initForm() {
    // Clear all form inputs
    $("#Roll-No").val("");
    $("#Full-Name").val("");
    $("#Class").val("");
    $("#Birth-Date").val("");
    $("#Address").val("");
    $("#Enrollment-Date").val("");

    // Enable only Roll-No
    $("#Roll-No").prop("disabled", false);

    // Disable all other fields
    setRemainingFieldsDisabled(true);

    // Disable all action buttons
    $("#btn-save").prop("disabled", true);
    $("#btn-update").prop("disabled", true);
    $("#btn-reset").prop("disabled", true);

    // Reset tracking state
    currentRecNo = null;
    lastCheckedRollNo = null;
    isCheckingRollNo = false;

    // Show initial guidance message
    if (window.location.protocol === "file:") {
        showStatus("⚠️ Notice: Running from file://. Browsers block database requests from file:// (CORS). Run 'python -m http.server 8000' and open http://localhost:8000.", "warning");
    } else if (!isTokenConfigured()) {
        showStatus("Setup needed: Configure your JPDB Connection Token in config.js (copy from config.example.js).", "warning");
    } else {
        showStatus("Enter Student Roll-No to check existing records or register a new student.", "info");
    }

    // Auto-focus on primary key field
    $("#Roll-No").focus();
}

/**
 * Checks whether the user has replaced the placeholder token with a real token
 */
function isTokenConfigured() {
    return (
        typeof JPDB_CONNECTION_TOKEN === "string" &&
        JPDB_CONNECTION_TOKEN.trim() !== "" &&
        JPDB_CONNECTION_TOKEN !== "YOUR_JPDB_CONNECTION_TOKEN"
    );
}

/**
 * Helper to enable or disable non-primary key form fields
 */
function setRemainingFieldsDisabled(disabled) {
    $("#Full-Name").prop("disabled", disabled);
    $("#Class").prop("disabled", disabled);
    $("#Birth-Date").prop("disabled", disabled);
    $("#Address").prop("disabled", disabled);
    $("#Enrollment-Date").prop("disabled", disabled);
}

/* ==========================================================================
   4. Database Operations: GET_BY_KEY (Lookup)
   ========================================================================== */

/**
 * Handles Roll-No validation and triggers database lookup using GET_BY_KEY
 */
function handleRollNoLookup() {
    const rollNoVal = $("#Roll-No").val().trim();

    // If field is cleared, reset to initial state
    if (!rollNoVal) {
        initForm();
        return;
    }

    // Prevent duplicate request if already searching or if same value was just checked
    if (isCheckingRollNo) {
        return;
    }

    if (rollNoVal === lastCheckedRollNo) {
        return;
    }

    // Check token configuration before executing API call
    if (!isTokenConfigured()) {
        showStatus("Cannot query database: Please configure your JPDB Connection Token in config.js.", "warning");
        $("#Roll-No").focus();
        return;
    }

    isCheckingRollNo = true;
    showStatus(`Looking up Roll-No "${rollNoVal}" in ${DB_NAME}...`, "info");

    // Build GET_BY_KEY query JSON
    const keyData = {};
    keyData[PRIMARY_KEY] = rollNoVal;

    // Generate documented JPDB GET_BY_KEY request payload
    const getRequest = createGET_BY_KEYRequest(
        JPDB_CONNECTION_TOKEN,
        DB_NAME,
        REL_NAME,
        JSON.stringify(keyData),
        false, // createTime flag
        false  // updateTime flag
    );

    let resObj = null;
    try {
        // Execute synchronous command to get immediate result for state transition
        jQuery.ajaxSetup({ async: false });
        resObj = executeCommandAtGivenBaseUrl(getRequest, JPDB_BASE_URL, JPDB_IRL_ENDPOINT);
        jQuery.ajaxSetup({ async: true });
    } catch (err) {
        handleNetworkException(err, "Lookup");
        isCheckingRollNo = false;
        return;
    }

    isCheckingRollNo = false;

    // Handle unexpected/empty response
    if (!resObj) {
        showStatus("No response from server. Check server address or CORS configuration.", "error");
        return;
    }

    lastCheckedRollNo = rollNoVal;

    // ----------------------------------------------------
    // Scenario A: Record EXISTS in database (Status 200)
    // ----------------------------------------------------
    if (resObj.status === 200 || resObj.status === "200") {
        handleRecordFound(resObj, rollNoVal);
    } 
    // ----------------------------------------------------
    // Scenario B: Record DOES NOT EXIST in database (Status 400)
    // ----------------------------------------------------
    else if (resObj.status === 400 || resObj.status === "400") {
        handleRecordNotFound(rollNoVal);
    } 
    // ----------------------------------------------------
    // Scenario C: Authentication Error (Status 401)
    // ----------------------------------------------------
    else if (resObj.status === 401 || resObj.status === "401") {
        showStatus("Authentication Error (401): Invalid or unauthorized JPDB connection token.", "error");
    } 
    // ----------------------------------------------------
    // Scenario D: Other Database Errors
    // ----------------------------------------------------
    else {
        const message = resObj.message || "Unknown error occurred.";
        showStatus(`Database Error (${resObj.status}): ${message}`, "error");
    }
}

/**
 * Workflow when record is found:
 * - Populate all fields with retrieved database values
 * - Disable Roll-No
 * - Enable all remaining fields
 * - Enable Update and Reset
 * - Disable Save
 * - Focus Full-Name
 */
function handleRecordFound(resObj, rollNoVal) {
    let payload = resObj.data;

    // In JPDB, resObj.data can be a JSON string or parsed object
    if (typeof payload === "string") {
        try {
            payload = JSON.parse(payload);
        } catch (e) {
            console.error("Failed to parse response payload:", e);
        }
    }

    // Extract student record and internal record number
    const record = payload.record || payload;
    currentRecNo = payload.rec_no || (payload.record && payload.record.rec_no) || null;

    // Populate form fields with database values
    $("#Roll-No").val(record["Roll-No"] || rollNoVal);
    $("#Full-Name").val(record["Full-Name"] || "");
    $("#Class").val(record["Class"] || "");
    $("#Birth-Date").val(record["Birth-Date"] || "");
    $("#Address").val(record["Address"] || "");
    $("#Enrollment-Date").val(record["Enrollment-Date"] || "");

    // Required workflow state transitions
    $("#Roll-No").prop("disabled", true);
    setRemainingFieldsDisabled(false);

    $("#btn-save").prop("disabled", true);
    $("#btn-update").prop("disabled", false);
    $("#btn-reset").prop("disabled", false);

    showStatus(`Student record found for Roll-No: ${rollNoVal}. Details loaded. Ready to update.`, "success");
    $("#Full-Name").focus();
}

/**
 * Workflow when record does not exist:
 * - Keep Roll-No enabled
 * - Enable remaining fields
 * - Enable Save and Reset
 * - Disable Update
 * - Focus Full-Name
 */
function handleRecordNotFound(rollNoVal) {
    currentRecNo = null;

    // Clear any previous values in remaining fields
    $("#Full-Name").val("");
    $("#Class").val("");
    $("#Birth-Date").val("");
    $("#Address").val("");
    $("#Enrollment-Date").val("");

    // Required workflow state transitions
    $("#Roll-No").prop("disabled", false);
    setRemainingFieldsDisabled(false);

    $("#btn-save").prop("disabled", false);
    $("#btn-update").prop("disabled", true);
    $("#btn-reset").prop("disabled", false);

    showStatus(`Roll-No: "${rollNoVal}" is available. Please fill all fields and click Save to enroll.`, "info");
    $("#Full-Name").focus();
}

/* ==========================================================================
   5. Database Operations: PUT (Insert / Save)
   ========================================================================== */

/**
 * Validates and saves a new student record using JPDB PUT operation
 */
function saveStudent() {
    // Check token configuration
    if (!isTokenConfigured()) {
        showStatus("Please set your JPDB Connection Token in config.js before saving.", "warning");
        return;
    }

    // Validate that every field is filled
    const formData = validateAndGetFormData();
    if (!formData) {
        return; // Validation failed, error message already shown
    }

    // Prevent double-click submissions
    setButtonsDisabled(true);
    showStatus("Saving student record to JsonPowerDB...", "info");

    // Construct documented JPDB PUT request
    const putRequest = createPUTRequest(
        JPDB_CONNECTION_TOKEN,
        JSON.stringify(formData),
        DB_NAME,
        REL_NAME
    );

    let resObj = null;
    try {
        jQuery.ajaxSetup({ async: false });
        resObj = executeCommandAtGivenBaseUrl(putRequest, JPDB_BASE_URL, JPDB_IML_ENDPOINT);
        jQuery.ajaxSetup({ async: true });
    } catch (err) {
        handleNetworkException(err, "Save");
        setButtonsDisabled(false);
        return;
    }

    // Only show success if database actually confirms 200
    if (resObj && (resObj.status === 200 || resObj.status === "200")) {
        alert(`Success: Student with Roll-No ${formData["Roll-No"]} enrolled successfully!`);
        initForm();
        showStatus(`Student with Roll-No "${formData["Roll-No"]}" enrolled successfully.`, "success");
    } else {
        const errorMsg = (resObj && resObj.message) ? resObj.message : "Failed to insert record.";
        const status = (resObj && resObj.status) ? ` (${resObj.status})` : "";
        showStatus(`Database insertion failed${status}: ${errorMsg}`, "error");

        // Re-enable appropriate controls on failure
        $("#btn-save").prop("disabled", false);
        $("#btn-reset").prop("disabled", false);
    }
}

/* ==========================================================================
   6. Database Operations: UPDATE (Modify Existing Record)
   ========================================================================== */

/**
 * Validates and updates an existing student record using JPDB UPDATE operation
 */
function updateStudent() {
    // Check token configuration
    if (!isTokenConfigured()) {
        showStatus("Please set your JPDB Connection Token in config.js before updating.", "warning");
        return;
    }

    // Ensure we have an active record number from a previous successful lookup
    if (!currentRecNo) {
        showStatus("Missing internal record ID. Please search Roll-No again before updating.", "error");
        return;
    }

    // Validate that every field is filled
    const formData = validateAndGetFormData();
    if (!formData) {
        return;
    }

    // Ensure primary key (Roll-No) is NOT changed in the update payload
    const updateFields = {
        "Full-Name": formData["Full-Name"],
        "Class": formData["Class"],
        "Birth-Date": formData["Birth-Date"],
        "Address": formData["Address"],
        "Enrollment-Date": formData["Enrollment-Date"]
    };

    // Prevent double-click submissions
    setButtonsDisabled(true);
    showStatus("Updating student record in JsonPowerDB...", "info");

    // Construct documented JPDB UPDATE request
    // createUPDATERecordRequest concatenates jsonObj directly into JSON, so pass stringified JSON
    const updateRequest = createUPDATERecordRequest(
        JPDB_CONNECTION_TOKEN,
        JSON.stringify(updateFields),
        DB_NAME,
        REL_NAME,
        currentRecNo
    );

    let resObj = null;
    try {
        jQuery.ajaxSetup({ async: false });
        resObj = executeCommandAtGivenBaseUrl(updateRequest, JPDB_BASE_URL, JPDB_IML_ENDPOINT);
        jQuery.ajaxSetup({ async: true });
    } catch (err) {
        handleNetworkException(err, "Update");
        setButtonsDisabled(false);
        return;
    }

    // Confirm database success
    if (resObj && (resObj.status === 200 || resObj.status === "200")) {
        alert(`Success: Student record for Roll-No ${formData["Roll-No"]} updated successfully!`);
        initForm();
        showStatus(`Student record for Roll-No "${formData["Roll-No"]}" updated successfully.`, "success");
    } else {
        const errorMsg = (resObj && resObj.message) ? resObj.message : "Failed to update record.";
        const status = (resObj && resObj.status) ? ` (${resObj.status})` : "";
        showStatus(`Database update failed${status}: ${errorMsg}`, "error");

        // Re-enable appropriate controls on failure
        $("#btn-update").prop("disabled", false);
        $("#btn-reset").prop("disabled", false);
    }
}

/* ==========================================================================
   7. Form Validation & Data Extraction
   ========================================================================== */

/**
 * Validates that all form fields are non-empty.
 * Returns the populated data object if valid, or null if invalid.
 */
function validateAndGetFormData() {
    const rollNo = $("#Roll-No").val().trim();
    if (!rollNo) {
        showStatus("Validation Error: Student Roll-No is required.", "warning");
        $("#Roll-No").focus();
        return null;
    }

    const fullName = $("#Full-Name").val().trim();
    if (!fullName) {
        showStatus("Validation Error: Full-Name is required.", "warning");
        $("#Full-Name").focus();
        return null;
    }

    const studentClass = $("#Class").val().trim();
    if (!studentClass) {
        showStatus("Validation Error: Class is required.", "warning");
        $("#Class").focus();
        return null;
    }

    const birthDate = $("#Birth-Date").val().trim();
    if (!birthDate) {
        showStatus("Validation Error: Birth-Date is required.", "warning");
        $("#Birth-Date").focus();
        return null;
    }

    const address = $("#Address").val().trim();
    if (!address) {
        showStatus("Validation Error: Address is required.", "warning");
        $("#Address").focus();
        return null;
    }

    const enrollmentDate = $("#Enrollment-Date").val().trim();
    if (!enrollmentDate) {
        showStatus("Validation Error: Enrollment-Date is required.", "warning");
        $("#Enrollment-Date").focus();
        return null;
    }

    // Return object mapped with exact database column names
    return {
        "Roll-No": rollNo,
        "Full-Name": fullName,
        "Class": studentClass,
        "Birth-Date": birthDate,
        "Address": address,
        "Enrollment-Date": enrollmentDate
    };
}

/**
 * Helper to disable/enable all buttons during in-flight network requests
 */
function setButtonsDisabled(disabled) {
    $("#btn-save").prop("disabled", disabled);
    $("#btn-update").prop("disabled", disabled);
    $("#btn-reset").prop("disabled", disabled);
}

/* ==========================================================================
   8. Status & Notification Display
   ========================================================================== */

/**
 * Displays status message to the user with contextual styling
 * @param {string} message - Text to display
 * @param {'info'|'success'|'warning'|'error'} type - Notification severity
 */
function showStatus(message, type = "info") {
    const $statusBox = $("#status-message");
    const $statusText = $("#status-text");
    const $statusIcon = $("#status-icon");

    $statusBox.removeClass("status-info status-success status-warning status-error");

    let icon = "ℹ️";
    switch (type) {
        case "success":
            icon = "✅";
            $statusBox.addClass("status-success");
            break;
        case "error":
            icon = "❌";
            $statusBox.addClass("status-error");
            break;
        case "warning":
            icon = "⚠️";
            $statusBox.addClass("status-warning");
            break;
        case "info":
        default:
            icon = "ℹ️";
            $statusBox.addClass("status-info");
            break;
    }

    $statusIcon.text(icon);
    $statusText.text(message);
}

/**
 * Provides comprehensive error feedback when a network or CORS exception occurs
 */
function handleNetworkException(err, operationName) {
    console.error(`${operationName} network/CORS error:`, err);
    if (window.location.protocol === "file:") {
        showStatus("CORS Blocked: Browsers block database requests when opened via file://. Please serve via http://localhost (run 'python -m http.server 8000' in the folder) and open http://localhost:8000.", "error");
    } else {
        showStatus(`Network error: Failed to reach JPDB server at ${JPDB_BASE_URL}. Verify your internet connectivity or firewall.`, "error");
    }
}

