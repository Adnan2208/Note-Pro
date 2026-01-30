import { useState, useEffect } from 'react';
import { notesApi, foldersApi } from '../api/api';

function Notes({ accessCode, onLogout }) {
  const [currentFolderId, setCurrentFolderId] = useState('root');
  const [currentFolder, setCurrentFolder] = useState(null);
  const [folders, setFolders] = useState([]);
  const [notes, setNotes] = useState([]);
  const [breadcrumbs, setBreadcrumbs] = useState([{ id: 'root', name: 'Home' }]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // Modal states
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [showFolderModal, setShowFolderModal] = useState(false);
  const [editingNote, setEditingNote] = useState(null);
  const [editingFolder, setEditingFolder] = useState(null);
  const [noteForm, setNoteForm] = useState({ title: '', content: '' });
  const [folderName, setFolderName] = useState('');

  // View note modal
  const [viewingNote, setViewingNote] = useState(null);

  useEffect(() => {
    fetchFolderContents();
  }, [currentFolderId]);

  const fetchFolderContents = async () => {
    try {
      setIsLoading(true);
      const response = await foldersApi.getFolderContents(accessCode, currentFolderId);
      if (response.success) {
        setCurrentFolder(response.currentFolder);
        setFolders(response.folders);
        setNotes(response.notes);
        
        // Update breadcrumbs
        if (response.currentFolder) {
          await updateBreadcrumbs(response.currentFolder);
        } else {
          setBreadcrumbs([{ id: 'root', name: 'Home' }]);
        }
      } else {
        setError(response.message);
      }
    } catch (err) {
      setError('Failed to fetch contents');
    } finally {
      setIsLoading(false);
    }
  };

  const updateBreadcrumbs = async (folder) => {
    const crumbs = [{ id: 'root', name: 'Home' }];
    
    // Build breadcrumb from path
    if (folder.path && folder.path !== '/') {
      const pathParts = folder.path.split('/').filter(Boolean);
      // We need to fetch parent folders to get their IDs
      const allFoldersRes = await foldersApi.getAllFolders(accessCode);
      if (allFoldersRes.success) {
        let currentPath = '';
        for (const part of pathParts) {
          currentPath = currentPath ? `${currentPath}/${part}` : `/${part}`;
          const parentFolder = allFoldersRes.folders.find(
            f => f.path === currentPath.slice(0, currentPath.lastIndexOf('/')) || 
                 (currentPath.split('/').length === 2 && f.path === '/') &&
                 f.name === part
          );
          if (parentFolder) {
            crumbs.push({ id: parentFolder._id, name: parentFolder.name });
          }
        }
      }
    }
    
    crumbs.push({ id: folder._id, name: folder.name });
    setBreadcrumbs(crumbs);
  };

  const navigateToFolder = (folderId) => {
    setCurrentFolderId(folderId);
  };

  const handleCreateFolder = async () => {
    if (!folderName.trim()) {
      setError('Folder name is required');
      return;
    }

    try {
      const response = await foldersApi.createFolder(accessCode, {
        name: folderName.trim(),
        parentId: currentFolderId === 'root' ? null : currentFolderId
      });

      if (response.success) {
        setFolders([...folders, response.folder]);
        setFolderName('');
        setShowFolderModal(false);
      } else {
        setError(response.message);
      }
    } catch (err) {
      setError('Failed to create folder');
    }
  };

  const handleUpdateFolder = async () => {
    if (!folderName.trim()) {
      setError('Folder name is required');
      return;
    }

    try {
      const response = await foldersApi.updateFolder(accessCode, editingFolder._id, {
        name: folderName.trim()
      });

      if (response.success) {
        setFolders(folders.map(f => f._id === editingFolder._id ? response.folder : f));
        setFolderName('');
        setEditingFolder(null);
        setShowFolderModal(false);
      } else {
        setError(response.message);
      }
    } catch (err) {
      setError('Failed to update folder');
    }
  };

  const handleDeleteFolder = async (folder) => {
    if (!confirm(`Delete folder "${folder.name}" and all its contents?`)) return;

    try {
      const response = await foldersApi.deleteFolder(accessCode, folder._id);
      if (response.success) {
        setFolders(folders.filter(f => f._id !== folder._id));
      } else {
        setError(response.message);
      }
    } catch (err) {
      setError('Failed to delete folder');
    }
  };

  const handleCreateNote = async () => {
    if (!noteForm.title.trim() || !noteForm.content.trim()) {
      setError('Title and content are required');
      return;
    }

    try {
      const response = await notesApi.createNote(accessCode, {
        ...noteForm,
        folderId: currentFolderId === 'root' ? null : currentFolderId
      });

      if (response.success) {
        setNotes([response.note, ...notes]);
        setNoteForm({ title: '', content: '' });
        setShowNoteModal(false);
      } else {
        setError(response.message);
      }
    } catch (err) {
      setError('Failed to create note');
    }
  };

  const handleUpdateNote = async () => {
    if (!noteForm.title.trim() || !noteForm.content.trim()) {
      setError('Title and content are required');
      return;
    }

    try {
      const response = await notesApi.updateNote(accessCode, editingNote._id, noteForm);
      if (response.success) {
        setNotes(notes.map(n => n._id === editingNote._id ? response.note : n));
        setNoteForm({ title: '', content: '' });
        setEditingNote(null);
        setShowNoteModal(false);
        if (viewingNote && viewingNote._id === editingNote._id) {
          setViewingNote(response.note);
        }
      } else {
        setError(response.message);
      }
    } catch (err) {
      setError('Failed to update note');
    }
  };

  const handleDeleteNote = async (note) => {
    if (!confirm(`Delete note "${note.title}"?`)) return;

    try {
      const response = await notesApi.deleteNote(accessCode, note._id);
      if (response.success) {
        setNotes(notes.filter(n => n._id !== note._id));
        if (viewingNote && viewingNote._id === note._id) {
          setViewingNote(null);
        }
      } else {
        setError(response.message);
      }
    } catch (err) {
      setError('Failed to delete note');
    }
  };

  const handleTogglePin = async (note) => {
    try {
      const response = await notesApi.updateNote(accessCode, note._id, {
        isPinned: !note.isPinned
      });
      if (response.success) {
        setNotes(notes.map(n => n._id === note._id ? response.note : n)
          .sort((a, b) => {
            if (a.isPinned && !b.isPinned) return -1;
            if (!a.isPinned && b.isPinned) return 1;
            return new Date(b.createdAt) - new Date(a.createdAt);
          }));
      }
    } catch (err) {
      setError('Failed to update note');
    }
  };

  const openNoteModal = (note = null) => {
    if (note) {
      setEditingNote(note);
      setNoteForm({ title: note.title, content: note.content });
    } else {
      setEditingNote(null);
      setNoteForm({ title: '', content: '' });
    }
    setShowNoteModal(true);
  };

  const openFolderModal = (folder = null) => {
    if (folder) {
      setEditingFolder(folder);
      setFolderName(folder.name);
    } else {
      setEditingFolder(null);
      setFolderName('');
    }
    setShowFolderModal(true);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-black">Note Pro</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-500 font-mono bg-gray-100 px-3 py-1 rounded">
              {accessCode}
            </span>
            <button
              onClick={onLogout}
              className="text-sm text-gray-600 hover:text-black transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        {/* Error Message */}
        {error && (
          <div className="mb-4 p-3 bg-white border border-gray-300 text-gray-700 text-sm rounded-lg flex justify-between items-center">
            {error}
            <button onClick={() => setError('')} className="text-gray-400 hover:text-black">✕</button>
          </div>
        )}

        {/* Toolbar */}
        <div className="flex items-center justify-between mb-6">
          {/* Breadcrumbs */}
          <nav className="flex items-center gap-1 text-sm">
            {breadcrumbs.map((crumb, index) => (
              <div key={crumb.id} className="flex items-center">
                {index > 0 && <span className="mx-2 text-gray-400">/</span>}
                <button
                  onClick={() => navigateToFolder(crumb.id)}
                  className={`hover:text-black transition-colors ${
                    index === breadcrumbs.length - 1 ? 'text-black font-medium' : 'text-gray-500'
                  }`}
                >
                  {crumb.name}
                </button>
              </div>
            ))}
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => openFolderModal()}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors text-sm"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V8a2 2 0 00-2-2h-5L9 4H4zm7 5a1 1 0 10-2 0v1H8a1 1 0 100 2h1v1a1 1 0 102 0v-1h1a1 1 0 100-2h-1V9z" clipRule="evenodd" />
              </svg>
              New Folder
            </button>
            <button
              onClick={() => openNoteModal()}
              className="flex items-center gap-2 px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors text-sm"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
              </svg>
              New Note
            </button>
          </div>
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="text-center py-16">
            <div className="inline-block w-8 h-8 border-2 border-gray-300 border-t-black rounded-full animate-spin"></div>
            <p className="mt-4 text-gray-500">Loading...</p>
          </div>
        ) : folders.length === 0 && notes.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-lg border border-gray-200">
            <div className="text-6xl mb-4">📁</div>
            <p className="text-gray-500 text-lg">This folder is empty</p>
            <p className="text-gray-400 text-sm mt-2">Create a new folder or note to get started</p>
          </div>
        ) : (
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            {/* Table Header */}
            <div className="grid grid-cols-12 gap-4 px-4 py-3 bg-gray-50 border-b border-gray-200 text-sm font-medium text-gray-500">
              <div className="col-span-6">Name</div>
              <div className="col-span-3">Modified</div>
              <div className="col-span-3 text-right">Actions</div>
            </div>

            {/* Folders */}
            {folders.map((folder) => (
              <div
                key={folder._id}
                className="grid grid-cols-12 gap-4 px-4 py-3 border-b border-gray-100 hover:bg-gray-50 transition-colors items-center"
              >
                <div className="col-span-6 flex items-center gap-3">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" />
                  </svg>
                  <button
                    onClick={() => navigateToFolder(folder._id)}
                    className="text-black hover:underline font-medium"
                  >
                    {folder.name}
                  </button>
                </div>
                <div className="col-span-3 text-sm text-gray-500">
                  {formatDate(folder.updatedAt)}
                </div>
                <div className="col-span-3 flex justify-end gap-2">
                  <button
                    onClick={() => openFolderModal(folder)}
                    className="p-1 text-gray-400 hover:text-black transition-colors"
                    title="Rename"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => handleDeleteFolder(folder)}
                    className="p-1 text-gray-400 hover:text-black transition-colors"
                    title="Delete"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}

            {/* Notes */}
            {notes.map((note) => (
              <div
                key={note._id}
                className="grid grid-cols-12 gap-4 px-4 py-3 border-b border-gray-100 hover:bg-gray-50 transition-colors items-center"
              >
                <div className="col-span-6 flex items-center gap-3">
                  <div className="relative">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
                    </svg>
                    {note.isPinned && (
                      <div className="absolute -top-1 -right-1 w-2 h-2 bg-black rounded-full"></div>
                    )}
                  </div>
                  <button
                    onClick={() => setViewingNote(note)}
                    className="text-black hover:underline font-medium truncate"
                  >
                    {note.title}
                  </button>
                </div>
                <div className="col-span-3 text-sm text-gray-500">
                  {formatDate(note.updatedAt)}
                </div>
                <div className="col-span-3 flex justify-end gap-2">
                  <button
                    onClick={() => handleTogglePin(note)}
                    className={`p-1 transition-colors ${note.isPinned ? 'text-black' : 'text-gray-400 hover:text-black'}`}
                    title={note.isPinned ? 'Unpin' : 'Pin'}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M5 5a2 2 0 012-2h6a2 2 0 012 2v2H5V5z" />
                      <path fillRule="evenodd" d="M4 7h12v6a2 2 0 01-2 2H6a2 2 0 01-2-2V7zm4 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" clipRule="evenodd" />
                    </svg>
                  </button>
                  <button
                    onClick={() => openNoteModal(note)}
                    className="p-1 text-gray-400 hover:text-black transition-colors"
                    title="Edit"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => handleDeleteNote(note)}
                    className="p-1 text-gray-400 hover:text-black transition-colors"
                    title="Delete"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Note Modal */}
      {showNoteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-lg font-semibold text-black">
                {editingNote ? 'Edit Note' : 'New Note'}
              </h2>
              <button
                onClick={() => { setShowNoteModal(false); setEditingNote(null); }}
                className="text-gray-400 hover:text-black"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-6">
              <input
                type="text"
                placeholder="Note title"
                value={noteForm.title}
                onChange={(e) => setNoteForm({ ...noteForm, title: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-black mb-4"
              />
              <textarea
                placeholder="Write your note..."
                value={noteForm.content}
                onChange={(e) => setNoteForm({ ...noteForm, content: e.target.value })}
                rows={10}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-black resize-none"
              />
            </div>
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
              <button
                onClick={() => { setShowNoteModal(false); setEditingNote(null); }}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={editingNote ? handleUpdateNote : handleCreateNote}
                className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
              >
                {editingNote ? 'Update' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Folder Modal */}
      {showFolderModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-md">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-lg font-semibold text-black">
                {editingFolder ? 'Rename Folder' : 'New Folder'}
              </h2>
              <button
                onClick={() => { setShowFolderModal(false); setEditingFolder(null); setFolderName(''); }}
                className="text-gray-400 hover:text-black"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-6">
              <input
                type="text"
                placeholder="Folder name"
                value={folderName}
                onChange={(e) => setFolderName(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-black"
                autoFocus
              />
            </div>
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
              <button
                onClick={() => { setShowFolderModal(false); setEditingFolder(null); setFolderName(''); }}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={editingFolder ? handleUpdateFolder : handleCreateFolder}
                className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
              >
                {editingFolder ? 'Rename' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Note Modal */}
      {viewingNote && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-lg font-semibold text-black truncate pr-4">
                {viewingNote.title}
              </h2>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => { openNoteModal(viewingNote); setViewingNote(null); }}
                  className="text-gray-400 hover:text-black p-1"
                  title="Edit"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                  </svg>
                </button>
                <button
                  onClick={() => setViewingNote(null)}
                  className="text-gray-400 hover:text-black"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            <div className="p-6 overflow-y-auto flex-1">
              <p className="text-gray-600 text-sm mb-4">
                Last updated: {formatDate(viewingNote.updatedAt)}
              </p>
              <div className="prose prose-sm max-w-none whitespace-pre-wrap text-gray-800">
                {viewingNote.content}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Notes;
