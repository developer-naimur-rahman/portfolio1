// ============================
// Google Apps Script Backend (Refactored)
// Secure production-ready API for Dashboard
// Compatible with existing frontend action names
// ============================

// ----------------------------
// CONFIGURATION
// ----------------------------
// If your Apps Script project is standalone, set SPREADSHEET_ID to your sheet's id.
const SPREADSHEET_ID = '1T7DINM4kEqLUjRePq4ML5z0AYpnkpS5LlMulixgez8k';

const CONFIG = {
  ADMIN_EMAIL: 'naimur582582@gmail.com',
  SHEETS: {
    PROJECTS: 'Projects',
    REVISIONS: 'Revision',
    MESSAGES: 'Message',
    USERS: 'User'
  },
  ROLES: {
    ADMIN: 'admin',
    EDITOR: 'editor',
    CLIENT: 'client'
  },
  // Permission map for actions. Values are allowed roles.
  PERMISSIONS: {
    getUser: ['admin', 'editor', 'client'],
    getProjects: ['admin', 'editor', 'client'],
    addProject: ['admin', 'editor', 'client'],
    updateProject: ['admin', 'editor', 'client'],
    deleteProject: ['admin', 'editor', 'client'],
    addRevision: ['admin', 'editor', 'client'],
    getRevisions: ['admin', 'editor', 'client'],
    addMessage: ['admin', 'editor', 'client'],
    getMessages: ['admin', 'editor', 'client']
  },
  // Basic API hardening
  MAX_PROJECTS_SCAN: 5000 // safety cap to avoid full sheet blows-ups
};

// ----------------------------
// RESPONSE / UTILITIES
// ----------------------------
function createResponse(payload, success = true) {
  try {
    const base = {
      success: !!success,
      timestamp: new Date().toISOString()
    };
    // Merge payload keys at top level for backward compatibility (getUser expects role at top level)
    const finalObj = Object.assign({}, base, payload || {});
    return ContentService.createTextOutput(JSON.stringify(finalObj)).setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    Logger.log('createResponse error: ' + err.message);
    return ContentService.createTextOutput(JSON.stringify({ success: false, error: 'Internal server error', timestamp: new Date().toISOString() })).setMimeType(ContentService.MimeType.JSON);
  }
}

function parseRequestBody(e) {
  try {
    if (!e) return null;
    // For Apps Script POST
    if (e.postData && e.postData.contents) {
      return JSON.parse(e.postData.contents);
    }
    // For direct test calls (optional)
    if (typeof e === 'object') return e;
    return null;
  } catch (err) {
    Logger.log('parseRequestBody error: ' + err.message);
    return null;
  }
}

function normalizeEmail(email) {
  if (!email || typeof email !== 'string') return null;
  const e = email.trim().toLowerCase();
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(e) ? e : null;
}

function normalizeRole(role) {
  if (!role || typeof role !== 'string') return null;
  const r = role.trim().toLowerCase();
  return ['admin', 'editor', 'client'].includes(r) ? r : null;
}

function getEffectiveRole(request, user) {
  const email = normalizeEmail(request.email || request.editorEmail || request.requesterEmail || request.email);
  if (email && email === (CONFIG.ADMIN_EMAIL || '').toString().trim().toLowerCase()) {
    return CONFIG.ROLES.ADMIN;
  }
  if (user && user.role) return user.role;
  const fallback = normalizeRole(request.role);
  return fallback || CONFIG.ROLES.CLIENT;
}

function safeGetSheet(name) {
  try {
    if (!name) return null;
    // Prefer explicit spreadsheet ID when provided (standalone script)
    var ss = null;
    try {
      if (typeof SPREADSHEET_ID !== 'undefined' && SPREADSHEET_ID) ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    } catch (e) {
      // fall back to active spreadsheet
      ss = null;
    }
    if (!ss) ss = SpreadsheetApp.getActiveSpreadsheet();
    if (!ss) {
      Logger.log('safeGetSheet: no spreadsheet available');
      return null;
    }
    const sh = ss.getSheetByName(name);
    if (!sh) Logger.log('safeGetSheet: missing sheet -> ' + name);
    return sh;
  } catch (err) {
    Logger.log('safeGetSheet error: ' + err.message);
    return null;
  }
}

function findHeaderIndexes(sheet, headerRowIndex = 1) {
  const headers = {};
  if (!sheet) return headers;
  try {
    const firstRow = sheet.getRange(headerRowIndex, 1, 1, sheet.getLastColumn()).getValues()[0] || [];
    firstRow.forEach((value, idx) => {
      if (!value) return;
      const text = value.toString().trim().toLowerCase();
      if (!text) return;
      headers[text] = idx;
    });
  } catch (err) {
    Logger.log('findHeaderIndexes error: ' + err.message);
  }
  return headers;
}

function logAction(tag, details) {
  try { Logger.log('[' + new Date().toISOString() + '] ' + tag + ' ' + JSON.stringify(details || {})); } catch (e) {}
}

// ----------------------------
// AUTH / USER helpers
// ----------------------------
function createOrUpdateUser(email, name, role) {
  try {
    const e = normalizeEmail(email);
    if (!e) return null;
    
    // Check if admin by email
    if (e === CONFIG.ADMIN_EMAIL.toString().trim().toLowerCase()) {
      return { email: e, name: name || 'Admin User', role: CONFIG.ROLES.ADMIN };
    }
    
    const sheet = safeGetSheet(CONFIG.SHEETS.USERS);
    if (!sheet) return null;
    
    const headers = findHeaderIndexes(sheet);
    const rows = sheet.getDataRange().getValues();
    const emailIdx = headers['email'] ?? headers['user email'] ?? headers['email address'] ?? 2;
    const nameIdx = headers['name'] ?? headers['full name'] ?? 1;
    const roleIdx = headers['role'] ?? 3;
    
    // Check if user exists
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      const rowEmail = (row[emailIdx] || '').toString().trim().toLowerCase();
      if (rowEmail === e) {
        // User exists, update name if provided
        if (name && name !== row[nameIdx]) {
          row[nameIdx] = name;
          sheet.getRange(i + 1, nameIdx + 1).setValue(name);
        }
        return { email: e, name: row[nameIdx] || name || '', role: row[roleIdx] || role || CONFIG.ROLES.CLIENT };
      }
    }
    
    // User doesn't exist, create new user
    const newRole = normalizeRole(role) || CONFIG.ROLES.CLIENT;
    const newRow = [
      'USR-' + Date.now(),
      name || 'New User',
      e,
      newRole,
      'active',
      new Date()
    ];
    sheet.appendRow(newRow);
    logAction('createUser', { email: e, name: name, role: newRole });
    return { email: e, name: name || 'New User', role: newRole };
  } catch (err) {
    Logger.log('createOrUpdateUser error: ' + err.message);
    return null;
  }
}

function getUserByEmail(email) {
  try {
    const e = normalizeEmail(email);
    if (!e) return null;
    const sheet = safeGetSheet(CONFIG.SHEETS.USERS);
    if (!sheet) return null;
    const headers = findHeaderIndexes(sheet);
    const rows = sheet.getDataRange().getValues();
    const emailIdx = headers['email'] ?? headers['user email'] ?? headers['email address'] ?? 2;
    const nameIdx = headers['name'] ?? headers['full name'] ?? 1;
    const roleIdx = headers['role'] ?? 3;
    const idIdx = headers['id'] ?? 0;
    const statusIdx = headers['status'] ?? 4;

    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      const rowEmail = (row[emailIdx] || '').toString().trim().toLowerCase();
      if (rowEmail === e) {
        return {
          id: row[idIdx] || '',
          name: row[nameIdx] || '',
          email: rowEmail,
          role: row[roleIdx] ? row[roleIdx].toString().trim().toLowerCase() : null,
          status: row[statusIdx] || 'active'
        };
      }
    }
    return null;
  } catch (err) {
    Logger.log('getUserByEmail error: ' + err.message);
    return null;
  }
}

function checkPermission(action, userRole) {
  if (!action || !userRole) return false;
  const allowed = CONFIG.PERMISSIONS[action];
  if (!allowed) return false;
  return allowed.indexOf(userRole) !== -1;
}

// ----------------------------
// PROJECT helpers
// ----------------------------
function findProjectRow(projectId) {
  try {
    if (!projectId) return null;
    const sheet = safeGetSheet(CONFIG.SHEETS.PROJECTS);
    if (!sheet) return null;
    const rows = sheet.getDataRange().getValues();
    // columns: index 1 is Project ID (B)
    for (let i = 1; i < rows.length; i++) {
      if ((rows[i][1] || '') === projectId) return { index: i + 1, row: rows[i] };
    }
    return null;
  } catch (err) {
    Logger.log('findProjectRow error: ' + err.message);
    return null;
  }
}

function generateProjectId() {
  try {
    const sheet = safeGetSheet(CONFIG.SHEETS.PROJECTS);
    if (!sheet) return 'MN-' + Date.now().toString().slice(-4);
    const rows = sheet.getDataRange().getValues();
    let max = 100;
    for (let i = 1; i < rows.length; i++) {
      const id = (rows[i][1] || '').toString();
      const m = id.match(/MN-(\d+)/);
      if (m && m[1]) max = Math.max(max, parseInt(m[1], 10));
    }
    return 'MN-' + (max + 1);
  } catch (err) {
    Logger.log('generateProjectId error: ' + err.message);
    return 'MN-' + Date.now().toString().slice(-4);
  }
}

// ----------------------------
// ACTION HANDLERS
// ----------------------------
function handleGetUser(request) {
  try {
    const email = normalizeEmail(request.email);
    if (!email) return createResponse({ error: 'Invalid email' }, false);
    if (email === CONFIG.ADMIN_EMAIL.toString().trim().toLowerCase()) {
      const adminUser = createOrUpdateUser(email, request.name || 'Admin User', CONFIG.ROLES.ADMIN);
      return createResponse({ role: CONFIG.ROLES.ADMIN, name: adminUser?.name || 'Admin User', email: email });
    }
    
    // Try to get user, create if doesn't exist
    let user = getUserByEmail(email);
    if (!user) {
      const fallbackRole = normalizeRole(request.role) || CONFIG.ROLES.CLIENT;
      user = createOrUpdateUser(email, request.name || 'Unknown User', fallbackRole);
    }
    
    if (!user) {
      const fallbackRole = normalizeRole(request.role) || CONFIG.ROLES.CLIENT;
      return createResponse({ role: fallbackRole, name: 'Unknown User', email: email });
    }
    return createResponse({ role: user.role || normalizeRole(request.role) || CONFIG.ROLES.CLIENT, name: user.name, email: user.email });
  } catch (err) {
    Logger.log('handleGetUser error: ' + err.message);
    return createResponse({ error: 'Failed to get user' }, false);
  }
}

function handleGetProjects(request) {
  try {
    const email = normalizeEmail(request.email);
    if (!email) return createResponse({ error: 'Missing email' }, false);
    const user = getUserByEmail(email);
    const role = getEffectiveRole(request, user);
    if (!checkPermission('getProjects', role)) return createResponse({ error: 'Insufficient permissions' }, false);

    const sheet = safeGetSheet(CONFIG.SHEETS.PROJECTS);
    if (!sheet) return createResponse({ data: [] });
    const headers = findHeaderIndexes(sheet);
    const rows = sheet.getDataRange().getValues();
    const out = [];
    const cap = Math.min(rows.length, CONFIG.MAX_PROJECTS_SCAN);
    const clientEmailIdx = headers['client email'] ?? headers['email'] ?? 2;
    const editorEmailIdx = headers['editor email'] ?? headers['assigned editor email'] ?? headers['assigned editor'] ?? 8;

    for (let i = 1; i < cap; i++) {
      out.push(rows[i]);
    }
    return createResponse({ data: out });
  } catch (err) {
    Logger.log('handleGetProjects error: ' + err.message);
    return createResponse({ error: 'Failed to fetch projects' }, false);
  }
}

function handleAddProject(request) {
  try {
    // Get requester email - try multiple keys for compatibility
    const requesterEmail = normalizeEmail(request.requesterEmail || request.editorEmail || request.email);
    if (!requesterEmail) {
      return createResponse({ error: 'Missing requester email' }, false);
    }

    // Get or create user from sheet - AUTO-REGISTERS new users
    let user = getUserByEmail(requesterEmail);
    if (!user) {
      user = createOrUpdateUser(requesterEmail, request.createdBy || request.name || 'New User', request.role);
    }
    
    // Determine role: admin override, then user role, then request role
    let role = null;
    if (requesterEmail === CONFIG.ADMIN_EMAIL.toString().trim().toLowerCase()) {
      role = CONFIG.ROLES.ADMIN;
    } else if (user && user.role) {
      role = user.role;
    } else {
      role = normalizeRole(request.role) || CONFIG.ROLES.CLIENT;
    }

    // Check permission
    if (!checkPermission('addProject', role)) {
      return createResponse({ error: 'Insufficient permissions for action: addProject' }, false);
    }

    // Validate project name
    const projectName = (request.projectName || '').toString().trim();
    if (!projectName) {
      return createResponse({ error: 'Missing or invalid projectName' }, false);
    }

    // Generate project ID
    const projectId = generateProjectId();
    const now = new Date();
    
    // Build row data with proper email handling - FIX INVALID EDITOR EMAIL
    const clientEmail = normalizeEmail(request.clientEmail) || requesterEmail || '';
    
    // For ADMIN/EDITOR: assign themselves, for CLIENT: leave empty
    let editorEmail = '';
    let assignedEditor = '';
    if (role === CONFIG.ROLES.ADMIN || role === CONFIG.ROLES.EDITOR) {
      editorEmail = requesterEmail;
      assignedEditor = user ? user.name : requesterEmail;
    }
    // For CLIENT: editorEmail and assignedEditor remain empty
    
    const createdBy = user ? user.name : requesterEmail;
    
    const row = [
      now,                                    // A: Timestamp
      projectId,                              // B: Project ID
      clientEmail,                            // C: Client Email
      projectName,                            // D: Project Name
      request.category || '',                 // E: Category
      request.projectType || '',              // F: Project Type
      request.clientWebsite || '',            // G: Client Website
      assignedEditor,                         // H: Assigned Editor
      editorEmail,                            // I: Editor Email
      request.status || 'Pending',            // J: Status
      request.priority || 'Normal',           // K: Priority
      request.approval || 'Pending',          // L: Approval
      request.footage || '',                  // M: Footage
      request.script || '',                   // N: Script
      request.scriptLink || '',               // O: Script Link
      request.ref1 || '',                     // P: Reference 1
      request.ref2 || '',                     // Q: Reference 2
      request.deliveryLink || '',             // R: Delivery Link
      request.deliveryType || '',             // S: Delivery Type
      request.deadline || '',                 // T: Deadline
      now,                                    // U: Start Date
      '',                                     // V: Completed Date
      Number(request.budget) || 0,            // W: Budget
      createdBy,                              // X: Created By
      now,                                    // Y: Last Updated
      false                                   // Z: Archive
    ];

    // Append to projects sheet
    const sheet = safeGetSheet(CONFIG.SHEETS.PROJECTS);
    if (!sheet) {
      return createResponse({ error: 'Projects sheet not found' }, false);
    }
    
    sheet.appendRow(row);
    logAction('addProject', { projectId: projectId, by: requesterEmail, role: role });
    return createResponse({ success: true, projectID: projectId });
  } catch (err) {
    Logger.log('handleAddProject error: ' + err.message);
    return createResponse({ error: 'Failed to add project: ' + err.message }, false);
  }
}

function handleUpdateProject(request) {
  try {
    const projectId = request.projectID;
    if (!projectId) return createResponse({ error: 'Missing projectID' }, false);
    const updaterEmail = normalizeEmail(request.updaterEmail || request.email || request.requesterEmail);
    if (!updaterEmail) return createResponse({ error: 'Missing updater email' }, false);
    const user = getUserByEmail(updaterEmail);
    const role = getEffectiveRole(request, user);
    if (!checkPermission('updateProject', role)) return createResponse({ error: 'Insufficient permissions' }, false);

    const found = findProjectRow(projectId);
    if (!found) return createResponse({ error: 'Project not found' }, false);

    const allowed = ['clientEmail','projectName','category','projectType','clientWebsite','assignedEditor','editorEmail','status', 'priority', 'approval', 'deliveryLink', 'deliveryType', 'deadline', 'footage', 'scriptLink', 'ref1', 'ref2', 'budget'];
    const updates = {};
    allowed.forEach(k => { if (request[k] !== undefined) updates[k] = request[k]; });

    const sheet = safeGetSheet(CONFIG.SHEETS.PROJECTS);
    if (!sheet) return createResponse({ error: 'Projects sheet not found' }, false);
    const range = sheet.getRange(found.index, 1, 1, found.row.length);
    const current = found.row.slice();

    if (updates.clientEmail) current[2] = normalizeEmail(updates.clientEmail) || current[2];
    if (updates.projectName) current[3] = updates.projectName;
    if (updates.category !== undefined) current[4] = updates.category;
    if (updates.projectType !== undefined) current[5] = updates.projectType;
    if (updates.clientWebsite !== undefined) current[6] = updates.clientWebsite;
    if (updates.assignedEditor !== undefined) current[7] = updates.assignedEditor;
    if (updates.editorEmail !== undefined) current[8] = normalizeEmail(updates.editorEmail) || current[8];
    if (updates.status) current[9] = updates.status;
    if (updates.priority) current[10] = updates.priority;
    if (updates.approval) current[11] = updates.approval;
    if (updates.footage !== undefined) current[12] = updates.footage;
    if (updates.scriptLink !== undefined) current[14] = updates.scriptLink;
    if (updates.ref1 !== undefined) current[15] = updates.ref1;
    if (updates.ref2 !== undefined) current[16] = updates.ref2;
    if (updates.deliveryLink !== undefined) current[17] = updates.deliveryLink;
    if (updates.deliveryType !== undefined) current[18] = updates.deliveryType;
    if (updates.deadline !== undefined) current[19] = updates.deadline;
    if (updates.budget !== undefined) current[22] = Number(updates.budget) || current[22];

    current[24] = new Date();

    range.setValues([current]);
    logAction('updateProject', { projectId: projectId, by: updaterEmail, updates: Object.keys(updates) });
    return createResponse({ success: true });
  } catch (err) {
    Logger.log('handleUpdateProject error: ' + err.message);
    return createResponse({ error: 'Failed to update project' }, false);
  }
}

function handleDeleteProject(request) {
  try {
    const projectId = request.projectID;
    if (!projectId) return createResponse({ error: 'Missing projectID' }, false);
    const deleter = normalizeEmail(request.deleterEmail || request.email || request.requesterEmail);
    if (!deleter) return createResponse({ error: 'Missing deleter email' }, false);
    const user = getUserByEmail(deleter);
    const role = getEffectiveRole(request, user);
    if (!checkPermission('deleteProject', role)) return createResponse({ error: 'Insufficient permissions' }, false);

    const found = findProjectRow(projectId);
    if (!found) return createResponse({ error: 'Project not found' }, false);
    const sheet = safeGetSheet(CONFIG.SHEETS.PROJECTS);
    if (!sheet) return createResponse({ error: 'Projects sheet not found' }, false);
    sheet.deleteRow(found.index);
    logAction('deleteProject', { projectId: projectId, by: deleter });
    return createResponse({ success: true });
  } catch (err) {
    Logger.log('handleDeleteProject error: ' + err.message);
    return createResponse({ error: 'Failed to delete project' }, false);
  }
}

function handleAddRevision(request) {
  try {
    const requester = normalizeEmail(request.requesterEmail || request.editorEmail || request.email);
    if (!requester) return createResponse({ error: 'Missing requester email' }, false);
    const user = getUserByEmail(requester);
    const role = getEffectiveRole(request, user);
    if (!checkPermission('addRevision', role)) return createResponse({ error: 'Insufficient permissions' }, false);

    const projectId = request.projectID;
    if (!projectId) return createResponse({ error: 'Missing projectID' }, false);
    const found = findProjectRow(projectId);
    if (!found) return createResponse({ error: 'Project not found' }, false);

    const sheet = safeGetSheet(CONFIG.SHEETS.REVISIONS);
    if (!sheet) return createResponse({ error: 'Revisions sheet not found' }, false);

    const now = new Date();
    const revRow = [
      'REV-' + Date.now(), // Revision ID
      projectId,
      request.projectName || found.row[3] || '',
      normalizeEmail(request.clientEmail) || found.row[2] || '',
      request.assignedEditor || found.row[7] || (user && user.name) || '',
      Number(request.revisionNumber) || 1,
      request.version || 'v1.0',
      request.requestType || '',
      request.method || 'Panel',
      request.filesLink || '',
      request.referenceLink || request.ref1 || '',
      request.revisionNotes || '',
      request.editorNotes || '',
      request.clientNotes || '',
      requester,
      role || (user && user.role) || '',
      request.status || 'Pending',
      request.approval || 'Pending',
      request.clientVisible || 'Yes',
      now,
      now
    ];
    sheet.appendRow(revRow);
    logAction('addRevision', { projectId: projectId, by: requester, role: role });
    return createResponse({ success: true });
  } catch (err) {
    Logger.log('handleAddRevision error: ' + err.message);
    return createResponse({ error: 'Failed to add revision' }, false);
  }
}

function handleGetRevisions(request) {
  try {
    const projectId = request.projectID;
    if (!projectId) return createResponse({ error: 'Missing projectID' }, false);
    const viewer = normalizeEmail(request.viewerEmail || request.email);
    if (!viewer) return createResponse({ error: 'Missing viewer email' }, false);
    const user = getUserByEmail(viewer);
    const role = getEffectiveRole(request, user);
    if (!checkPermission('getRevisions', role)) return createResponse({ error: 'Insufficient permissions' }, false);

    const sheet = safeGetSheet(CONFIG.SHEETS.REVISIONS);
    if (!sheet) return createResponse({ data: [] });
    const rows = sheet.getDataRange().getValues();
    const out = [];
    for (let i = 1; i < rows.length; i++) {
      if ((rows[i][1] || '') === projectId) {
        if (role === CONFIG.ROLES.CLIENT) {
          const vis = (rows[i][18] || '').toString().toLowerCase();
          if (vis !== 'yes') continue;
        }
        out.push(rows[i]);
      }
    }
    return createResponse({ data: out });
  } catch (err) {
    Logger.log('handleGetRevisions error: ' + err.message);
    return createResponse({ error: 'Failed to fetch revisions' }, false);
  }
}

function handleAddMessage(request) {
  try {
    const sender = normalizeEmail(request.senderEmail || request.email);
    if (!sender) return createResponse({ error: 'Missing sender email' }, false);
    const user = getUserByEmail(sender);
    if (!user) return createResponse({ error: 'Sender not found' }, false);
    if (!checkPermission('addMessage', user.role)) return createResponse({ error: 'Insufficient permissions' }, false);

    const projectId = request.projectID || '';
    const sheet = safeGetSheet(CONFIG.SHEETS.MESSAGES);
    if (!sheet) return createResponse({ error: 'Messages sheet not found' }, false);
    const now = new Date();
    const row = [
      'MSG-' + Date.now(),
      projectId,
      request.projectName || '',
      user.email,
      user.name || '',
      user.role || '',
      request.messageType || 'text',
      request.messageText || '',
      request.fileLink || '',
      request.clientVisible || 'Yes',
      now,
      now
    ];
    sheet.appendRow(row);
    logAction('addMessage', { projectId: projectId, by: user.email });
    return createResponse({ success: true });
  } catch (err) {
    Logger.log('handleAddMessage error: ' + err.message);
    return createResponse({ error: 'Failed to add message' }, false);
  }
}

function handleGetMessages(request) {
  try {
    const projectId = request.projectID;
    if (!projectId) return createResponse({ error: 'Missing projectID' }, false);
    const viewer = normalizeEmail(request.viewerEmail || request.email);
    if (!viewer) return createResponse({ error: 'Missing viewer email' }, false);
    const user = getUserByEmail(viewer);
    if (!user) return createResponse({ error: 'Viewer not found' }, false);
    if (!checkPermission('getMessages', user.role)) return createResponse({ error: 'Insufficient permissions' }, false);

    const sheet = safeGetSheet(CONFIG.SHEETS.MESSAGES);
    if (!sheet) return createResponse({ data: [] });
    const rows = sheet.getDataRange().getValues();
    const out = [];
    for (let i = 1; i < rows.length; i++) {
      const r = rows[i];
      if ((r[1] || '') === projectId) {
        out.push(r);
      }
    }
    return createResponse({ data: out });
  } catch (err) {
    Logger.log('handleGetMessages error: ' + err.message);
    return createResponse({ error: 'Failed to get messages' }, false);
  }
}

// ----------------------------
// MAIN ENTRY POINTS
// ----------------------------
function doGet(e) {
  return createResponse({ message: 'API Running' });
}

function doPost(e) {
  try {
    const req = parseRequestBody(e);
    if (!req || !req.action) return createResponse({ error: 'Invalid request' }, false);
    const action = req.action;

    // Route actions
    switch (action) {
      case 'getUser': return handleGetUser(req);
      case 'getProjects': return handleGetProjects(req);
      case 'addProject': return handleAddProject(req);
      case 'updateProject': return handleUpdateProject(req);
      case 'deleteProject': return handleDeleteProject(req);
      case 'createRevision':
      case 'addRevision': return handleAddRevision(req);
      case 'getRevisions': return handleGetRevisions(req);
      case 'sendMessage':
      case 'addMessage': return handleAddMessage(req);
      case 'getMessages': return handleGetMessages(req);
      default:
        return createResponse({ error: 'Unknown action' }, false);
    }
  } catch (err) {
    Logger.log('doPost error: ' + err.message);
    return createResponse({ error: 'Server error' }, false);
  }
}

// End of file
