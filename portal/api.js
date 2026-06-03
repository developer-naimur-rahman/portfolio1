// ===============================
// API ENDPOINT (dynamic + mock support)
// ===============================
function getStoredApiUrl() {
    return localStorage.getItem('portal_api_url') || "https://script.google.com/macros/s/AKfycbylKkKbbLkP8-M4_8Yi6eYFJF3V4gW4sLOeZ7sUyl1pCImSzFEGkFkdeEKnyhCYQgx8uA/exec";
}

let MOCK_MODE = false;

// Clear stale mock-mode state so the real backend is used by default.
if (localStorage.getItem('portal_mock_mode') === 'true') {
    localStorage.removeItem('portal_mock_mode');
}
if (localStorage.getItem('portal_admin_email')) {
    localStorage.removeItem('portal_admin_email');
}

function setApiUrl(url) {
    localStorage.setItem('portal_api_url', url);
}

function setMockMode(enabled) {
    MOCK_MODE = !!enabled;
    localStorage.setItem('portal_mock_mode', MOCK_MODE ? 'true' : 'false');
}

async function apiRequest(action, payload = {}) {
    try {
        if (MOCK_MODE) {
            console.warn('[API] MOCK_MODE active - using mock handler');
            return await mockHandler(action, payload);
        }

        const API_URL = getStoredApiUrl();
        console.log('[API] request', { action, payload, API_URL });
        const res = await fetch(API_URL, {
            method: "POST",
            mode: "cors",
            cache: "no-cache",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ action, ...payload })
        });

        if (!res.ok) {
            const text = await res.text();
            throw new Error(`API request failed (${res.status}): ${text}`);
        }

        return await res.json();
    } catch (err) {
        console.error("API ERROR:", err);
        return { success: false, error: err.message };
    }
}

async function testConnection() {
    if (MOCK_MODE) return true;
    try {
        const res = await fetch(getStoredApiUrl(), { method: 'GET', mode: 'cors', cache: 'no-cache' });
        return res.ok;
    } catch (e) {
        return false;
    }
}

// ============ Mock handler ============
async function mockHandler(action, payload) {
    // simple in-memory mock data stored in localStorage
    const key = 'portal_mock_projects';
    let projects = JSON.parse(localStorage.getItem(key) || '[]');

    switch (action) {
        case 'health':
        case 'getHealth':
            return { success: true, status: 'ok' };
        case 'getUser':
            return { success: true, data: { role: payload.email === localStorage.getItem('portal_admin_email') ? 'admin' : 'client', name: payload.email.split('@')[0] } };
        case 'getProjects':
            return { success: true, data: projects };
        case 'addProject':
        case 'createProject':
        case 'add_project':
            const id = `MN-${Date.now()}`;
            const row = [id, id, payload.clientEmail || 'client@example.com', payload.projectName || 'Untitled', '', '', '', payload.editorEmail || '', payload.editorEmail || '', payload.status || 'Pending', payload.priority || 'Normal', payload.approval || 'Pending', payload.footage || '', '', payload.ref1 || '', '', '', payload.files || '', '', payload.deadline || '', '', '', payload.budget || 0, payload.createdBy || 'mock'];
            projects.push(row);
            localStorage.setItem(key, JSON.stringify(projects));
            return { success: true, data: row };
        case 'updateProject':
            // payload.projectID, status, priority, approval
            projects = projects.map(p => {
                if (p[1] === payload.projectID) {
                    p[9] = payload.status || p[9];
                    p[10] = payload.priority || p[10];
                    p[11] = payload.approval || p[11];
                }
                return p;
            });
            localStorage.setItem(key, JSON.stringify(projects));
            return { success: true };
        case 'deleteProject':
            projects = projects.filter(p => p[1] !== payload.projectID);
            localStorage.setItem(key, JSON.stringify(projects));
            return { success: true };
        case 'getDropdownOptions':
            return { success: true, data: ['Option A', 'Option B'] };
        default:
            return { success: false, error: 'Unknown action (mock)' };
    }
}

// expose
window.APP_API = {
    apiRequest,
    testConnection,
    setApiUrl,
    setMockMode,
    getStoredApiUrl: getStoredApiUrl,
    isMockMode: () => MOCK_MODE
};

// Auto-seed mock data when mock mode is enabled and no projects exist
function seedMockDataIfNeeded() {
    if (!MOCK_MODE) return;
    const key = 'portal_mock_projects';
    let projects = JSON.parse(localStorage.getItem(key) || '[]');
    if (projects.length > 0) return;

    const sample = [];
    for (let i = 1; i <= 4; i++) {
        const id = `MN-${100 + i}`;
        sample.push([id, id, `client${i}@example.com`, `Sample Project ${i}`, '', '', '', 'Naimur Rahman', 'naimur582582@gmail.com', i % 4 === 0 ? 'Completed' : 'Pending', i % 3 === 0 ? 'High' : 'Normal', 'Pending', '', '', '', '', '', '', '', '', '', '', (i * 150).toString(), `MockUser`]);
    }
    localStorage.setItem(key, JSON.stringify(sample));
}

seedMockDataIfNeeded();

// ===============================
// AUTH / USER
// ===============================
function getUser(email) {
    return apiRequest("getUser", { email });
}

// ===============================
// DASHBOARD
// ===============================
function getDashboard(email, role) {
    return apiRequest("getDashboard", { email, role });
}

// ===============================
// PROJECTS
// ===============================
function getProjects(email, role) {
    return apiRequest("getProjects", { email, role });
}

function createProject(data) {
    return apiRequest("createProject", data);
}

function updateProject(data) {
    return apiRequest("updateProject", data);
}

// ===============================
// EDITOR
// ===============================
function assignEditor(data) {
    return apiRequest("assignEditor", data);
}

// ===============================
// DELIVERY
// ===============================
function submitDelivery(data) {
    return apiRequest("submitDelivery", data);
}

// ===============================
// REVISION
// ===============================
function createRevision(data) {
    return apiRequest("createRevision", data);
}

// ===============================
// DROPDOWN
// ===============================
function getDropdownOptions(type) {
    return apiRequest("getDropdownOptions", { type });
}