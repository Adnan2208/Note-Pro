import { useState, useRef, useCallback, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

function NoteEditor({ note, onSave, onClose, accessCode }) {
  const [title, setTitle] = useState(note?.title || '');
  const [content, setContent] = useState(note?.content || '');
  const [images, setImages] = useState(note?.images || []);
  const [isPreview, setIsPreview] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const textareaRef = useRef(null);

  useEffect(() => {
    if (note) {
      setTitle(note.title || '');
      setContent(note.content || '');
      setImages(note.images || []);
    }
  }, [note]);

  const handleContentChange = (e) => {
    setContent(e.target.value);
    setHasChanges(true);
  };

  const handleTitleChange = (e) => {
    setTitle(e.target.value);
    setHasChanges(true);
  };

  const generateImageId = () => {
    return `img_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  };

  const handlePaste = useCallback(async (e) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    for (const item of items) {
      if (item.type.startsWith('image/')) {
        e.preventDefault();
        const file = item.getAsFile();
        if (file) {
          const reader = new FileReader();
          reader.onload = (event) => {
            const base64Data = event.target.result;
            const imageId = generateImageId();
            const newImage = {
              id: imageId,
              data: base64Data,
              mimeType: file.type,
              name: file.name || `image_${imageId}`
            };
            
            setImages(prev => [...prev, newImage]);
            
            // Insert markdown image reference at cursor position
            const textarea = textareaRef.current;
            if (textarea) {
              const start = textarea.selectionStart;
              const end = textarea.selectionEnd;
              const imageMarkdown = `![${newImage.name}](image:${imageId})`;
              const newContent = content.substring(0, start) + imageMarkdown + content.substring(end);
              setContent(newContent);
              setHasChanges(true);
              
              // Set cursor position after the inserted text
              setTimeout(() => {
                textarea.selectionStart = textarea.selectionEnd = start + imageMarkdown.length;
                textarea.focus();
              }, 0);
            }
          };
          reader.readAsDataURL(file);
        }
      }
    }
  }, [content]);

  const handleSave = async () => {
    if (!title.trim() || !content.trim()) {
      alert('Title and content are required');
      return;
    }

    setIsSaving(true);
    try {
      await onSave({
        title: title.trim(),
        content,
        images
      });
      setHasChanges(false);
    } catch (err) {
      console.error('Failed to save note:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleClose = () => {
    if (hasChanges) {
      if (confirm('You have unsaved changes. Are you sure you want to close?')) {
        onClose();
      }
    } else {
      onClose();
    }
  };

  // Custom image renderer for markdown
  const ImageRenderer = ({ src, alt }) => {
    if (src?.startsWith('image:')) {
      const imageId = src.replace('image:', '');
      const image = images.find(img => img.id === imageId);
      if (image) {
        return (
          <img 
            src={image.data} 
            alt={alt || image.name} 
            className="max-w-full h-auto rounded-lg my-2"
          />
        );
      }
    }
    return <img src={src} alt={alt} className="max-w-full h-auto rounded-lg my-2" />;
  };

  const insertMarkdown = (prefix, suffix = '') => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = content.substring(start, end);
    const newContent = content.substring(0, start) + prefix + selectedText + suffix + content.substring(end);
    setContent(newContent);
    setHasChanges(true);

    setTimeout(() => {
      textarea.focus();
      if (selectedText) {
        textarea.selectionStart = start + prefix.length;
        textarea.selectionEnd = end + prefix.length;
      } else {
        textarea.selectionStart = textarea.selectionEnd = start + prefix.length;
      }
    }, 0);
  };

  return (
    <div className="fixed inset-0 bg-white z-50 flex flex-col">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={handleClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            title="Close"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
            </svg>
          </button>
          <input
            type="text"
            value={title}
            onChange={handleTitleChange}
            placeholder="Untitled Note"
            className="text-xl font-semibold bg-transparent border-none outline-none focus:ring-0 w-96"
          />
          {hasChanges && (
            <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded">Unsaved</span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Markdown toolbar */}
          <div className="flex items-center gap-1 border-r border-gray-200 pr-2 mr-2">
            <button
              onClick={() => insertMarkdown('**', '**')}
              className="p-2 hover:bg-gray-100 rounded transition-colors font-bold text-sm"
              title="Bold"
            >
              B
            </button>
            <button
              onClick={() => insertMarkdown('*', '*')}
              className="p-2 hover:bg-gray-100 rounded transition-colors italic text-sm"
              title="Italic"
            >
              I
            </button>
            <button
              onClick={() => insertMarkdown('# ')}
              className="p-2 hover:bg-gray-100 rounded transition-colors text-sm"
              title="Heading"
            >
              H
            </button>
            <button
              onClick={() => insertMarkdown('- ')}
              className="p-2 hover:bg-gray-100 rounded transition-colors text-sm"
              title="List"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
              </svg>
            </button>
            <button
              onClick={() => insertMarkdown('`', '`')}
              className="p-2 hover:bg-gray-100 rounded transition-colors text-sm font-mono"
              title="Code"
            >
              {'</>'}
            </button>
            <button
              onClick={() => insertMarkdown('[', '](url)')}
              className="p-2 hover:bg-gray-100 rounded transition-colors text-sm"
              title="Link"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M12.586 4.586a2 2 0 112.828 2.828l-3 3a2 2 0 01-2.828 0 1 1 0 00-1.414 1.414 4 4 0 005.656 0l3-3a4 4 0 00-5.656-5.656l-1.5 1.5a1 1 0 101.414 1.414l1.5-1.5zm-5 5a2 2 0 012.828 0 1 1 0 101.414-1.414 4 4 0 00-5.656 0l-3 3a4 4 0 105.656 5.656l1.5-1.5a1 1 0 10-1.414-1.414l-1.5 1.5a2 2 0 11-2.828-2.828l3-3z" clipRule="evenodd" />
              </svg>
            </button>
          </div>

          {/* View toggle */}
          <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden">
            <button
              onClick={() => setIsPreview(false)}
              className={`px-3 py-1.5 text-sm transition-colors ${!isPreview ? 'bg-black text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
            >
              Edit
            </button>
            <button
              onClick={() => setIsPreview(true)}
              className={`px-3 py-1.5 text-sm transition-colors ${isPreview ? 'bg-black text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
            >
              Preview
            </button>
          </div>

          {/* Save button */}
          <button
            onClick={handleSave}
            disabled={isSaving || !title.trim() || !content.trim()}
            className="ml-2 px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 disabled:bg-gray-400 transition-colors text-sm flex items-center gap-2"
          >
            {isSaving ? (
              <>
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Saving...
              </>
            ) : (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M7.707 10.293a1 1 0 10-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 11.586V6h5a2 2 0 012 2v7a2 2 0 01-2 2H4a2 2 0 01-2-2V8a2 2 0 012-2h5v5.586l-1.293-1.293zM9 4a1 1 0 012 0v2H9V4z" />
                </svg>
                Save
              </>
            )}
          </button>
        </div>
      </header>

      {/* Editor / Preview */}
      <div className="flex-1 overflow-hidden">
        {isPreview ? (
          <div className="h-full overflow-y-auto p-8 max-w-4xl mx-auto">
            <article className="prose prose-lg max-w-none">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  img: ImageRenderer,
                  h1: ({ children }) => <h1 className="text-3xl font-bold mt-8 mb-4 text-black">{children}</h1>,
                  h2: ({ children }) => <h2 className="text-2xl font-bold mt-6 mb-3 text-black">{children}</h2>,
                  h3: ({ children }) => <h3 className="text-xl font-bold mt-4 mb-2 text-black">{children}</h3>,
                  p: ({ children }) => <p className="my-3 text-gray-700 leading-relaxed">{children}</p>,
                  ul: ({ children }) => <ul className="my-3 ml-6 list-disc text-gray-700">{children}</ul>,
                  ol: ({ children }) => <ol className="my-3 ml-6 list-decimal text-gray-700">{children}</ol>,
                  li: ({ children }) => <li className="my-1">{children}</li>,
                  code: ({ inline, children }) => 
                    inline 
                      ? <code className="bg-gray-100 px-1.5 py-0.5 rounded text-sm font-mono text-gray-800">{children}</code>
                      : <code className="block bg-gray-100 p-4 rounded-lg text-sm font-mono text-gray-800 overflow-x-auto my-3">{children}</code>,
                  pre: ({ children }) => <pre className="bg-gray-100 p-4 rounded-lg overflow-x-auto my-3">{children}</pre>,
                  blockquote: ({ children }) => <blockquote className="border-l-4 border-gray-300 pl-4 my-3 italic text-gray-600">{children}</blockquote>,
                  a: ({ href, children }) => <a href={href} className="text-black underline hover:no-underline" target="_blank" rel="noopener noreferrer">{children}</a>,
                  table: ({ children }) => <table className="w-full border-collapse my-4">{children}</table>,
                  th: ({ children }) => <th className="border border-gray-300 px-4 py-2 bg-gray-50 font-semibold text-left">{children}</th>,
                  td: ({ children }) => <td className="border border-gray-300 px-4 py-2">{children}</td>,
                  hr: () => <hr className="my-6 border-gray-200" />,
                }}
              >
                {content}
              </ReactMarkdown>
            </article>
          </div>
        ) : (
          <div className="h-full flex">
            <textarea
              ref={textareaRef}
              value={content}
              onChange={handleContentChange}
              onPaste={handlePaste}
              placeholder="Start writing your note...

You can use Markdown formatting:
# Heading 1
## Heading 2
**bold** and *italic*
- bullet points
1. numbered lists
`inline code`
[links](url)

Paste images directly with Ctrl+V / Cmd+V"
              className="flex-1 p-8 text-lg leading-relaxed resize-none outline-none font-mono bg-white"
              style={{ minHeight: '100%' }}
            />
          </div>
        )}
      </div>

      {/* Footer status bar */}
      <footer className="border-t border-gray-200 bg-gray-50 px-4 py-2 flex items-center justify-between text-xs text-gray-500">
        <div className="flex items-center gap-4">
          <span>{content.length} characters</span>
          <span>{content.split(/\s+/).filter(Boolean).length} words</span>
          <span>{images.length} images</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="bg-gray-200 px-2 py-0.5 rounded">Markdown supported</span>
          <span>Paste images with Ctrl+V</span>
        </div>
      </footer>
    </div>
  );
}

export default NoteEditor;
