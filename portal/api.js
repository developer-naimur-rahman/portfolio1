// ===============================
// 🚀 API ENDPOINT
// ===============================
const API_URL = "https://script.google.com/macros/s/AKfycbylKkKbbLkP8-M4_8Yi6eYFJF3V4gW4sLOeZ7sUyl1pCImSzFEGkFkdeEKnyhCYQgx8uA/exec";


// ===============================
// 🔥 CORE REQUEST WRAPPER
// ===============================
async function apiRequest(action, payload = {}) {
    try {
        const res = await fetch(API_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                action,
                ...payload
            })
        });

        return await res.json();

    } catch (error) {
        console.error("API ERROR:", error);
        return { success: false, error: error.message };
    }
}


// ===============================
// 👤 USER
// ===============================
function getUser(email) {
    return apiRequest("getUser", { email });
}


// ===============================
// 📊 DASHBOARD
// ===============================
function getDashboard(email, role) {
    return apiRequest("getDashboard", { email, role });
}


// ===============================
// 📁 PROJECTS
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
// 🎬 EDITOR SYSTEM
// ===============================
function assignEditor(data) {
    return apiRequest("assignEditor", data);
}

function submitDelivery(data) {
    return apiRequest("submitDelivery", data);
}


// ===============================
// 🔁 REVISION
// ===============================
function createRevision(data) {
    return apiRequest("createRevision", data);
}


// ===============================
// 📂 DROPDOWN
// ===============================
function getDropdownOptions(type) {
    return apiRequest("getDropdownOptions", { type });
}