const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

// Auth API calls
export const authApi = {
  // Create a new access code
  createAccessCode: async (accessCode) => {
    const response = await fetch(`${API_BASE_URL}/auth/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ accessCode }),
    });
    return response.json();
  },

  // Validate an access code
  validateAccessCode: async (accessCode) => {
    const response = await fetch(`${API_BASE_URL}/auth/validate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ accessCode }),
    });
    return response.json();
  },
};

// Folders API calls
export const foldersApi = {
  // Get folder contents (subfolders and notes)
  getFolderContents: async (accessCode, folderId = 'root') => {
    const response = await fetch(`${API_BASE_URL}/folders/${folderId}/contents`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'x-access-code': accessCode,
      },
    });
    return response.json();
  },

  // Get all folders
  getAllFolders: async (accessCode) => {
    const response = await fetch(`${API_BASE_URL}/folders/all`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'x-access-code': accessCode,
      },
    });
    return response.json();
  },

  // Create a new folder
  createFolder: async (accessCode, folderData) => {
    const response = await fetch(`${API_BASE_URL}/folders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-access-code': accessCode,
      },
      body: JSON.stringify(folderData),
    });
    return response.json();
  },

  // Update a folder
  updateFolder: async (accessCode, folderId, folderData) => {
    const response = await fetch(`${API_BASE_URL}/folders/${folderId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'x-access-code': accessCode,
      },
      body: JSON.stringify(folderData),
    });
    return response.json();
  },

  // Delete a folder
  deleteFolder: async (accessCode, folderId) => {
    const response = await fetch(`${API_BASE_URL}/folders/${folderId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'x-access-code': accessCode,
      },
    });
    return response.json();
  },
};

// Notes API calls
export const notesApi = {
  // Get all notes
  getNotes: async (accessCode) => {
    const response = await fetch(`${API_BASE_URL}/notes`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'x-access-code': accessCode,
      },
    });
    return response.json();
  },

  // Create a new note
  createNote: async (accessCode, noteData) => {
    const response = await fetch(`${API_BASE_URL}/notes`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-access-code': accessCode,
      },
      body: JSON.stringify(noteData),
    });
    return response.json();
  },

  // Update a note
  updateNote: async (accessCode, noteId, noteData) => {
    const response = await fetch(`${API_BASE_URL}/notes/${noteId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'x-access-code': accessCode,
      },
      body: JSON.stringify(noteData),
    });
    return response.json();
  },

  // Delete a note
  deleteNote: async (accessCode, noteId) => {
    const response = await fetch(`${API_BASE_URL}/notes/${noteId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'x-access-code': accessCode,
      },
    });
    return response.json();
  },
};
