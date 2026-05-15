// ============================
// GOOGLE APPS SCRIPT BACKEND
// Production Dashboard API
// ============================

// ============================
// CONFIGURATION
// ============================
const CONFIG = {
  SHEETS: {
    PROJECTS: 'Projects',
    USERS: 'User',  // Updated to match user's sheet name
    REVISIONS: 'Revision',
    MESSAGES: 'Message'
  },
  ROLES: {
    ADMIN: 'admin',
    EDITOR: 'editor',
    CLIENT: 'client'
  },
  PERMISSIONS: {
    CREATE_PROJECT: ['admin', 'editor'],
    UPDATE_PROJECT: ['admin', 'editor'],
    DELETE_PROJECT: ['admin'],
    VIEW_ALL_PROJECTS: ['admin', 'editor'],
    CREATE_REVISION: ['admin', 'editor'],
    SEND_MESSAGE: ['admin', 'editor', 'client'],
    VIEW_MESSAGES: ['admin', 'editor', 'client']
  },
  ADMIN_EMAIL: 'naimur582582@gmail.com'
};

// ============================
// RESPONSE HELPER
// ============================
function createResponse(data, success = true) {
  try {
    const response = {
      success: success,
      timestamp: new Date().toISOString(),
      ...data
    };

    return ContentService
      .createTextOutput(JSON.stringify(response))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    Logger.log('Response creation error: ' + error.message);
    return ContentService
      .createTextOutput(JSON.stringify({
        success: false,
        error: 'Internal server error',
        timestamp: new Date().toISOString()
      }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// ============================
// SHEET ACCESS HELPER
// ============================
function safeGetSheet(name) {
  try {
    if (!name) return null;
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    if (!ss) {
      Logger.log('No active spreadsheet');
      return null;
    }
    const sheet = ss.getSheetByName(name);
    if (!sheet) Logger.log('Sheet not found: ' + name);
    return sheet;
  } catch (err) {
    Logger.log('safeGetSheet error for ' + name + ': ' + err.message);
    return null;
  }
}

// ============================
// CORS HANDLER
// ============================
function doOptions(e) {
  // Handle preflight requests for CORS
  return ContentService
    .createTextOutput('')
    .setMimeType(ContentService.MimeType.TEXT);
}

function doGet(e) {
  return createResponse({ 
    success: true, 
    message: "API Running", 
    timestamp: new Date().toISOString(),
    version: "2.0"
  });
}

// ============================
// MAIN REQUEST HANDLER
// ============================
function doPost(e) {
  try {
    // Parse and validate request
    const requestData = parseRequestBody(e);
    if (!requestData) {
      return createResponse({error: 'Invalid or missing request body'}, false);
    }

    const action = requestData.action;
    if (!action) {
      return createResponse({error: 'Missing action parameter'}, false);
    }

    // Route to appropriate handler
    switch (action) {
      case 'getProjects':
        return handleGetProjects(requestData);
      case 'addProject':
        return handleAddProject(requestData);
      case 'updateProject':
        return handleUpdateProject(requestData);
      case 'deleteProject':
        return handleDeleteProject(requestData);
      case 'createRevision':
        return handleCreateRevision(requestData);
      case 'sendMessage':
        return handleSendMessage(requestData);
      case 'getMessages':
        return handleGetMessages(requestData);
      case 'getUser':
        return handleGetUser(requestData);
      default:
        return createResponse({error: 'Unknown action: ' + action}, false);
    }

  } catch (error) {
    Logger.log('doPost error: ' + error.message);
    return createResponse({error: 'Request processing failed'}, false);
  }
}

// ============================
// REQUEST PARSING UTILITIES
// ============================
function parseRequestBody(e) {
  try {
    if (!e || !e.postData || !e.postData.contents) {
      Logger.log('Missing postData');
      return null;
    }

    const data = JSON.parse(e.postData.contents);
    return data;
  } catch (error) {
    Logger.log('JSON parsing error: ' + error.message);
    return null;
  }
}

function validateEmail(email) {
  if (!email || typeof email !== 'string') return null;
  const cleanEmail = email.trim().toLowerCase();
  // Basic email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(cleanEmail) ? cleanEmail : null;
}

// ============================
// USER MANAGEMENT
// ============================
function handleGetUser(requestData) {
  try {
    const email = validateEmail(requestData.email);
    if (!email) {
      return createResponse({error: 'Invalid email'}, false);
    }

    const user = getUserByEmail(email);
    if (!user) {
      return createResponse({error: 'User not found'}, false);
    }

    return createResponse({
      role: user.role,
      name: user.name,
      email: user.email
    });

  } catch (error) {
    Logger.log('handleGetUser error: ' + error.message);
    return createResponse({error: 'Failed to get user'}, false);
  }
}

function getUserByEmail(email) {
  try {
    const sheet = safeGetSheet(CONFIG.SHEETS.USERS);
    if (!sheet) return null;

    const data = sheet.getDataRange().getValues();

    // Skip header row, find user by email (column C - index 2)
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      if (row[2] && row[2].toString().trim().toLowerCase() === email) {
        return {
          id: row[0] || '',
          name: row[1] || 'Unknown',
          email: email,
          role: row[3] || CONFIG.ROLES.CLIENT,
          status: row[4] || 'active'
        };
      }
    }

    return null;
  } catch (error) {
    Logger.log('getUserByEmail error: ' + error.message);
    return null;
  }
}

// ============================
// PROJECT MANAGEMENT
// ============================
function handleGetProjects(requestData) {
  try {
    const email = validateEmail(requestData.email);
    const role = requestData.role;

    if (!email || !role) {
      return createResponse({error: 'Missing email or role'}, false);
    }

    // Get actual user role from database
    const user = getUserByEmail(email);
    const actualRole = user ? user.role : CONFIG.ROLES.CLIENT;

    // Verify role matches (or allow if user not found, treat as client)
    if (user && actualRole !== role) {
      return createResponse({error: 'Unauthorized'}, false);
    }

    const projects = getProjectsForUser(email, actualRole);
    return createResponse({data: projects});

  } catch (error) {
    Logger.log('handleGetProjects error: ' + error.message);
    return createResponse({error: 'Failed to get projects'}, false);
  }
}

function getProjectsForUser(email, role) {
  try {
    const sheet = safeGetSheet(CONFIG.SHEETS.PROJECTS);
    if (!sheet) return [];

    const data = sheet.getDataRange().getValues();
    const projects = [];

    // Skip header row
    for (let i = 1; i < data.length; i++) {
      const row = data[i];

      // Filter based on role
      if (role === CONFIG.ROLES.CLIENT) {
        // Clients only see their own projects
        if (row[2] && row[2].toString().trim().toLowerCase() !== email) {
          continue;
        }
      }
      // Admins and editors see all projects

      projects.push(row);
    }

    return projects;
  } catch (error) {
    Logger.log('getProjectsForUser error: ' + error.message);
    return [];
  }
}

function handleAddProject(requestData) {
  try {
    // The requester is the editor, validate editorEmail
    const requesterEmail = validateEmail(requestData.editorEmail);
    if (!requesterEmail) {
      return createResponse({error: 'Invalid editor email'}, false);
    }

    const user = getUserByEmail(requesterEmail);
    if (!user) {
      return createResponse({error: 'Editor not found'}, false);
    }

    if (!CONFIG.PERMISSIONS.CREATE_PROJECT.includes(user.role)) {
      return createResponse({error: 'Insufficient permissions'}, false);
    }

    const projectId = generateProjectId();
    const newProject = createProjectData(requestData, projectId, user);

    const success = addProjectToSheet(newProject);
    if (!success) {
      return createResponse({error: 'Failed to create project'}, false);
    }

    return createResponse({success: true, projectID: projectId});

  } catch (error) {
    Logger.log('handleAddProject error: ' + error.message);
    return createResponse({error: 'Failed to add project'}, false);
  }
}

function generateProjectId() {
  try {
    const sheet = safeGetSheet(CONFIG.SHEETS.PROJECTS);
    if (!sheet) return 'MN-101';

    const data = sheet.getDataRange().getValues();
    let maxId = 100;

    // Find highest existing ID
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      if (row[1] && row[1].toString().startsWith('MN-')) {
        const idNum = parseInt(row[1].toString().split('-')[1]);
        if (!isNaN(idNum) && idNum > maxId) {
          maxId = idNum;
        }
      }
    }

    return 'MN-' + (maxId + 1);
  } catch (error) {
    Logger.log('generateProjectId error: ' + error.message);
    return 'MN-' + Date.now().toString().slice(-3);
  }
}

function createProjectData(requestData, projectId, user) {
  const now = new Date();
  return [
    now,                          // 1 A: Timestamp
    projectId,                    // 2 B: Project ID
    requestData.clientEmail || '', // 3 C: Client Email
    requestData.projectName || '', // 4 D: Project Name
    requestData.category || '',   // 5 E: Category
    requestData.projectType || '', // 6 F: Project Type
    requestData.clientWebsite || '', // 7 G: Client Website
    requestData.assignedEditor || '', // 8 H: Assigned Editor
    requestData.editorEmail || '', // 9 I: Editor Email
    'Pending',                    // 10 J: Status
    requestData.priority || 'Normal', // 11 K: Priority
    requestData.approval || 'Pending', // 12 L: Approval Status
    requestData.footage || '',    // 13 M: Footage Link
    requestData.script || '',     // 14 N: Script
    requestData.scriptLink || '', // 15 O: Script Link
    requestData.ref1 || '',       // 16 P: Reference Link-1
    requestData.ref2 || '',       // 17 Q: Reference Link-2
    '',                           // 18 R: Delivery Link
    requestData.deliveryType || '', // 19 S: Delivery Type
    requestData.deadline || '',   // 20 T: Deadline
    now,                          // 21 U: Start Date
    '',                           // 22 V: Completed Date
    Number(requestData.budget) || 0, // 23 W: Budget (BDT)
    user.name,                    // 24 X: Created By
    now,                          // 25 Y: Last Updated
    false                         // 26 Z: Archive
  ];
}

function addProjectToSheet(projectData) {
  try {
    const sheet = safeGetSheet(CONFIG.SHEETS.PROJECTS);
    if (!sheet) return false;

    sheet.appendRow(projectData);
    return true;
  } catch (error) {
    Logger.log('addProjectToSheet error: ' + error.message);
    return false;
  }
}

function handleUpdateProject(requestData) {
  try {
    const projectId = requestData.projectID;
    if (!projectId) {
      return createResponse({error: 'Missing project ID'}, false);
    }

    // Verify updater permissions
    const updaterEmail = validateEmail(requestData.updaterEmail || requestData.email);
    if (!updaterEmail) {
      return createResponse({error: 'Invalid updater email'}, false);
    }

    const user = getUserByEmail(updaterEmail);
    if (!user) {
      return createResponse({error: 'Updater not found'}, false);
    }

    if (!CONFIG.PERMISSIONS.UPDATE_PROJECT.includes(user.role)) {
      return createResponse({error: 'Insufficient permissions'}, false);
    }

    const success = updateProjectInSheet(projectId, requestData);
    if (!success) {
      return createResponse({error: 'Failed to update project'}, false);
    }

    return createResponse({success: true});

  } catch (error) {
    Logger.log('handleUpdateProject error: ' + error.message);
    return createResponse({error: 'Failed to update project'}, false);
  }
}

function updateProjectInSheet(projectId, updateData) {
  try {
    const sheet = safeGetSheet(CONFIG.SHEETS.PROJECTS);
    if (!sheet) return false;

    const data = sheet.getDataRange().getValues();

    for (let i = 1; i < data.length; i++) {
      if (data[i][1] === projectId) {
        // Update specific fields
        if (updateData.status) data[i][9] = updateData.status;
        if (updateData.priority) data[i][10] = updateData.priority;
        if (updateData.approval) data[i][11] = updateData.approval;

        // Update last modified
        data[i][24] = new Date();

        // Write back to sheet
        const range = sheet.getRange(i + 1, 1, 1, data[i].length);
        range.setValues([data[i]]);

        return true;
      }
    }

    return false;
  } catch (error) {
    Logger.log('updateProjectInSheet error: ' + error.message);
    return false;
  }
}

function handleDeleteProject(requestData) {
  try {
    const projectId = requestData.projectID;
    if (!projectId) {
      return createResponse({error: 'Missing project ID'}, false);
    }

    // Verify deleter permissions (only admins can delete)
    const deleterEmail = validateEmail(requestData.deleterEmail || requestData.email);
    if (!deleterEmail) {
      return createResponse({error: 'Invalid deleter email'}, false);
    }

    const user = getUserByEmail(deleterEmail);
    if (!user || !CONFIG.PERMISSIONS.DELETE_PROJECT.includes(user.role)) {
      return createResponse({error: 'Insufficient permissions'}, false);
    }

    const success = deleteProjectFromSheet(projectId);
    if (!success) {
      return createResponse({error: 'Failed to delete project'}, false);
    }

    return createResponse({success: true});

  } catch (error) {
    Logger.log('handleDeleteProject error: ' + error.message);
    return createResponse({error: 'Failed to delete project'}, false);
  }
}

function deleteProjectFromSheet(projectId) {
  try {
    const sheet = safeGetSheet(CONFIG.SHEETS.PROJECTS);
    if (!sheet) return false;

    const data = sheet.getDataRange().getValues();

    for (let i = 1; i < data.length; i++) {
      if (data[i][1] === projectId) {
        sheet.deleteRow(i + 1);
        return true;
      }
    }

    return false;
  } catch (error) {
    Logger.log('deleteProjectFromSheet error: ' + error.message);
    return false;
  }
}

// ============================
// REVISION SYSTEM
// ============================
function handleCreateRevision(requestData) {
  try {
    // Verify requester permissions
    const requesterEmail = validateEmail(requestData.requesterEmail || requestData.editorEmail);
    if (!requesterEmail) {
      return createResponse({error: 'Invalid requester email'}, false);
    }

    const user = getUserByEmail(requesterEmail);
    if (!user) {
      return createResponse({error: 'Requester not found'}, false);
    }

    if (!CONFIG.PERMISSIONS.CREATE_REVISION.includes(user.role)) {
      return createResponse({error: 'Insufficient permissions'}, false);
    }

    const success = createRevisionInSheet(requestData);
    if (!success) {
      return createResponse({error: 'Failed to create revision'}, false);
    }

    return createResponse({success: true});

  } catch (error) {
    Logger.log('handleCreateRevision error: ' + error.message);
    return createResponse({error: 'Failed to create revision'}, false);
  }
}

function createRevisionInSheet(requestData) {
  try {
    const sheet = safeGetSheet(CONFIG.SHEETS.REVISIONS);
    if (!sheet) {
      Logger.log('Revisions sheet not found');
      return false;
    }

    const revisionData = [
      'REV-' + Date.now(),           // Revision ID
      requestData.projectID || '',   // Project ID
      requestData.projectName || '', // Project Name
      requestData.clientEmail || '', // Client Email
      requestData.editorEmail || '', // Editor Email
      requestData.revisionNumber || 1, // Revision Number
      requestData.version || 'v1.0', // Version
      requestData.requestType || '', // Request Type
      requestData.method || 'Panel', // Method
      requestData.filesLink || '',   // Files Link
      requestData.referenceLink || '', // Reference Link
      requestData.revisionNotes || '', // Revision Notes
      requestData.editorNotes || '', // Editor Notes
      requestData.clientNotes || '', // Client Notes
      requestData.uploadedBy || '',  // Uploaded By
      requestData.userRole || '',    // User Role
      'Pending',                     // Status
      'Pending',                     // Approval
      'Yes',                         // Client Visible
      new Date(),                    // Created Date
      new Date()                     // Last Updated
    ];

    sheet.appendRow(revisionData);
    return true;
  } catch (error) {
    Logger.log('createRevisionInSheet error: ' + error.message);
    return false;
  }
}

// ============================
// MESSAGE SYSTEM
// ============================
function handleSendMessage(requestData) {
  try {
    // Verify sender permissions
    const senderEmail = validateEmail(requestData.senderEmail);
    if (!senderEmail) {
      return createResponse({error: 'Invalid sender email'}, false);
    }

    const user = getUserByEmail(senderEmail);
    if (!user) {
      return createResponse({error: 'Sender not found'}, false);
    }

    if (!CONFIG.PERMISSIONS.SEND_MESSAGE.includes(user.role)) {
      return createResponse({error: 'Insufficient permissions'}, false);
    }

    const success = sendMessageToSheet(requestData);
    if (!success) {
      return createResponse({error: 'Failed to send message'}, false);
    }

    return createResponse({success: true});

  } catch (error) {
    Logger.log('handleSendMessage error: ' + error.message);
    return createResponse({error: 'Failed to send message'}, false);
  }
}

function sendMessageToSheet(requestData) {
  try {
    const sheet = safeGetSheet(CONFIG.SHEETS.MESSAGES);
    if (!sheet) {
      Logger.log('Messages sheet not found');
      return false;
    }

    const messageData = [
      'MSG-' + Date.now(),           // Message ID
      requestData.projectID || '',   // Project ID
      requestData.projectName || '', // Project Name
      requestData.senderEmail || '', // Sender Email
      requestData.senderName || '',  // Sender Name
      requestData.senderRole || '',  // Sender Role
      requestData.messageType || 'text', // Message Type
      requestData.messageText || '', // Message Text
      requestData.fileLink || '',    // File Link
      requestData.clientVisible || 'Yes', // Client Visible
      new Date(),                    // Created Date
      new Date()                     // Last Updated
    ];

    sheet.appendRow(messageData);
    return true;
  } catch (error) {
    Logger.log('sendMessageToSheet error: ' + error.message);
    return false;
  }
}

function handleGetMessages(requestData) {
  try {
    const projectId = requestData.projectID;
    if (!projectId) {
      return createResponse({error: 'Missing project ID'}, false);
    }

    // Verify viewer permissions (can be client, editor, or admin)
    const viewerEmail = validateEmail(requestData.viewerEmail || requestData.email);
    if (!viewerEmail) {
      return createResponse({error: 'Invalid viewer email'}, false);
    }

    const user = getUserByEmail(viewerEmail);
    if (!user) {
      return createResponse({error: 'Viewer not found'}, false);
    }

    if (!CONFIG.PERMISSIONS.VIEW_MESSAGES.includes(user.role)) {
      return createResponse({error: 'Insufficient permissions'}, false);
    }

    const messages = getMessagesForProject(projectId, user);
    return createResponse({data: messages});

  } catch (error) {
    Logger.log('handleGetMessages error: ' + error.message);
    return createResponse({error: 'Failed to get messages'}, false);
  }
}

function getMessagesForProject(projectId, user) {
  try {
    const sheet = safeGetSheet(CONFIG.SHEETS.MESSAGES);
    if (!sheet) {
      Logger.log('Messages sheet not found');
      return [];
    }

    const data = sheet.getDataRange().getValues();
    const messages = [];

    // Skip header row
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      if (row[1] === projectId) { // Project ID column
        // Filter based on visibility and role
        const clientVisible = (row[9] || '').toString().toLowerCase() === 'yes';
        if (user.role === CONFIG.ROLES.ADMIN || user.role === CONFIG.ROLES.EDITOR || clientVisible) {
          messages.push(row);
        }
      }
    }

    return messages;
  } catch (error) {
    Logger.log('getMessagesForProject error: ' + error.message);
    return [];
  }
}

// ============================
// UTILITY FUNCTIONS
// ============================
function logAction(action, details) {
  Logger.log('[' + new Date().toISOString() + '] ' + action + ': ' + JSON.stringify(details));
}