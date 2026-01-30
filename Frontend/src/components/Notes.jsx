import { useState, useEffect } from 'react';
import { notesApi } from '../api/api';

function Notes({ accessCode, onLogout }) {
  const [notes, setNotes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [editingNote, setEditingNote] = useState(null);
  const [formData, setFormData] = useState({ title: '', content: '' });
  const [error, setError] = useState('');

  // Fetch notes on mount
  useEffect(() => {
    fetchNotes();
  }, [accessCode]);

  const fetchNotes = async () => {
    try {
      setIsLoading(true);
      const response = await notesApi.getNotes(accessCode);
      if (response.success) {
        setNotes(response.notes);
      } else {
        setError(response.message);
      }
    } catch (err) {
      setError('Failed to fetch notes');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateNote = async (e) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.content.trim()) {
      setError('Title and content are required');
      return;
    }

    try {
      const response = await notesApi.createNote(accessCode, formData);
      if (response.success) {
        setNotes([response.note, ...notes]);
        setFormData({ title: '', content: '' });
        setIsCreating(false);
        setError('');
      } else {
        setError(response.message);
      }
    } catch (err) {
      setError('Failed to create note');
    }
  };

  const handleUpdateNote = async (e) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.content.trim()) {
      setError('Title and content are required');
      return;
    }

    try {
      const response = await notesApi.updateNote(accessCode, editingNote._id, formData);
      if (response.success) {
        setNotes(notes.map(note => 
          note._id === editingNote._id ? response.note : note
        ));
        setFormData({ title: '', content: '' });
        setEditingNote(null);
        setError('');
      } else {
        setError(response.message);
      }
    } catch (err) {
      setError('Failed to update note');
    }
  };

  const handleDeleteNote = async (noteId) => {
    if (!confirm('Are you sure you want to delete this note?')) return;

    try {
      const response = await notesApi.deleteNote(accessCode, noteId);
      if (response.success) {
        setNotes(notes.filter(note => note._id !== noteId));
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
        setNotes(notes.map(n => 
          n._id === note._id ? response.note : n
        ).sort((a, b) => {
          if (a.isPinned && !b.isPinned) return -1;
          if (!a.isPinned && b.isPinned) return 1;
          return new Date(b.createdAt) - new Date(a.createdAt);
        }));
      }
    } catch (err) {
      setError('Failed to update note');
    }
  };

  const startEditing = (note) => {
    setEditingNote(note);
    setFormData({ title: note.title, content: note.content });
    setIsCreating(false);
  };

  const cancelForm = () => {
    setIsCreating(false);
    setEditingNote(null);
    setFormData({ title: '', content: '' });
    setError('');
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
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

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-gray-100 border border-gray-300 text-gray-800 rounded-lg">
            {error}
            <button 
              onClick={() => setError('')}
              className="ml-4 text-gray-600 hover:text-black"
            >
              ✕
            </button>
          </div>
        )}

        {/* Create/Edit Form */}
        {(isCreating || editingNote) && (
          <div className="mb-8 p-6 border border-gray-200 rounded-lg bg-gray-50">
            <h2 className="text-lg font-semibold text-black mb-4">
              {editingNote ? 'Edit Note' : 'Create New Note'}
            </h2>
            <form onSubmit={editingNote ? handleUpdateNote : handleCreateNote}>
              <div className="mb-4">
                <input
                  type="text"
                  placeholder="Title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-black transition-colors bg-white"
                />
              </div>
              <div className="mb-4">
                <textarea
                  placeholder="Write your note..."
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  rows={6}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-black transition-colors resize-none bg-white"
                />
              </div>
              <div className="flex gap-3">
                <button
                  type="submit"
                  className="px-6 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
                >
                  {editingNote ? 'Update' : 'Create'}
                </button>
                <button
                  type="button"
                  onClick={cancelForm}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Add Note Button */}
        {!isCreating && !editingNote && (
          <button
            onClick={() => setIsCreating(true)}
            className="mb-8 flex items-center gap-2 px-6 py-3 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
            </svg>
            New Note
          </button>
        )}

        {/* Notes Grid */}
        {isLoading ? (
          <div className="text-center py-12">
            <div className="inline-block w-8 h-8 border-2 border-gray-300 border-t-black rounded-full animate-spin"></div>
            <p className="mt-4 text-gray-500">Loading notes...</p>
          </div>
        ) : notes.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📝</div>
            <p className="text-gray-500 text-lg">No notes yet. Create your first note!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {notes.map((note) => (
              <div
                key={note._id}
                className={`p-5 border rounded-lg transition-all hover:shadow-md ${
                  note.isPinned 
                    ? 'border-black bg-gray-50' 
                    : 'border-gray-200 bg-white'
                }`}
              >
                {/* Note Header */}
                <div className="flex items-start justify-between mb-3">
                  <h3 className="font-semibold text-black text-lg line-clamp-1">
                    {note.title}
                  </h3>
                  <button
                    onClick={() => handleTogglePin(note)}
                    className={`ml-2 transition-colors ${
                      note.isPinned ? 'text-black' : 'text-gray-300 hover:text-gray-500'
                    }`}
                    title={note.isPinned ? 'Unpin' : 'Pin'}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M5 5a2 2 0 012-2h6a2 2 0 012 2v2H5V5z" />
                      <path fillRule="evenodd" d="M4 7h12v6a2 2 0 01-2 2H6a2 2 0 01-2-2V7zm4 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>

                {/* Note Content */}
                <p className="text-gray-600 text-sm line-clamp-4 mb-4">
                  {note.content}
                </p>

                {/* Note Footer */}
                <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                  <span className="text-xs text-gray-400">
                    {formatDate(note.updatedAt)}
                  </span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => startEditing(note)}
                      className="text-gray-400 hover:text-black transition-colors"
                      title="Edit"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => handleDeleteNote(note._id)}
                      className="text-gray-400 hover:text-black transition-colors"
                      title="Delete"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

export default Notes;
