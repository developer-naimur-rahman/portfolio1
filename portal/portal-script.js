// ============================
// GLOBAL STATE
// ============================
let CURRENT_USER = null;
let CURRENT_ROLE = null;
let CURRENT_EMAIL = null;
CURRENT_ROLE = "client";

// ============================
// INIT
// ============================
window.addEventListener("DOMContentLoaded", async () => {
    loadUserFromStorage();
    await initApp();
});

// ============================
// LOAD USER FROM LOCAL STORAGE
// ============================
function loadUserFromStorage() {
    CURRENT_EMAIL = localStorage.getItem("clientEmail");
    CURRENT_USER = localStorage.getItem("clientName");

    // default role (backend confirm করবে later)
    CURRENT_ROLE = "client";
}

// ============================
// APP INIT
// ============================
async function initApp() {
    if (!CURRENT_EMAIL) {
        window.location.href = "index.html";
        return;
    }

    document.getElementById("userInfo").innerText = CURRENT_USER || "User";

    await loadDashboard();
}

// ============================
// DASHBOARD LOAD
// ============================
async function loadDashboard() {
    const data = await getDashboard(CURRENT_EMAIL, CURRENT_ROLE);

    if (!data) return;

    document.getElementById("activeCount").innerText = data.active || 0;
    document.getElementById("completedCount").innerText = data.completed || 0;
    document.getElementById("revisionCount").innerText = data.revision || 0;
    document.getElementById("revenue").innerText = (data.revenue || 0) + " BDT";

    await loadProjects();
}

// ============================
// LOAD PROJECTS TABLE
// ============================
async function loadProjects() {
    const data = await getProjects(CURRENT_EMAIL, CURRENT_ROLE);

    const table = document.getElementById("projectTable");
    table.innerHTML = "";

    if (!data || !data.length) {
        table.innerHTML = `<tr><td colspan="5">No Projects Found</td></tr>`;
        return;
    }

    data.forEach(row => {
        table.innerHTML += `
            <tr>
                <td>${row[1] || "-"}</td>
                <td>${row[3] || "-"}</td>
                <td>${row[10] || "-"}</td>
                <td>${row[7] || "-"}</td>
                <td>${row[20] || "-"}</td>
            </tr>
        `;
    });
}

// ============================
// MENU ACTIONS
// ============================
function loadRevisions() {
    alert("Revision Module will be connected in Step 4");
}

function loadMessages() {
    alert("Message Module will be connected in Step 5");
}

// ============================
// REFRESH SYSTEM
// ============================
async function refreshAll() {
    await loadDashboard();
}

// ============================
// LOGOUT
// ============================
function logout() {
    localStorage.clear();
    window.location.href = "index.html";
}