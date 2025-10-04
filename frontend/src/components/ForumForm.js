import React, { useState } from 'react';
import '../css/Forums/Forum.css';

function ForumForm({ onPost, language = 'en' }) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tags, setTags] = useState('');
  const [files, setFiles] = useState([]);

  // Translations
  const translations = {
    en: {
      titlePlaceholder: 'Post Title',
      contentPlaceholder: 'Write your content here...',
      tagsPlaceholder: 'Tags (comma separated)',
      addPost: '➕ Add Post'
    },
    ta: {
      titlePlaceholder: 'இடுகை தலைப்பு',
      contentPlaceholder: 'உங்கள் உள்ளடக்கத்தை இங்கே எழுதுங்கள்...',
      tagsPlaceholder: 'குறிச்சொற்கள் (காற்புள்ளியால் பிரிக்கப்பட்டது)',
      addPost: '➕ இடுகையைச் சேர்க்கவும்'
    }
  };

  const t = translations[language];

  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files);

    const readers = selectedFiles.map((file) => {
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          resolve({
            name: file.name,
            type: file.type,
            data: reader.result,
          });
        };
        reader.readAsDataURL(file);
      });
    });

    Promise.all(readers).then((fileData) => {
      setFiles(fileData);
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;

    const newPost = {
      title,
      content,
      tags: tags
        .split(',')
        .map((tag) => tag.trim())
        .filter((tag) => tag),
      files: files.length > 0 ? files : [],
      comments: [],
    };

    // Send new post to parent (Forum.js)
    onPost(newPost);

    // Clear form inputs
    setTitle('');
    setContent('');
    setTags('');
    setFiles([]);
    e.target.reset(); // clears file input visually
  };

  return (
    <form className="forum-form" onSubmit={handleSubmit}>
      <input
        type="text"
        placeholder={t.titlePlaceholder}
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        required
        className="forum-input"
      />
      <textarea
        placeholder={t.contentPlaceholder}
        value={content}
        onChange={(e) => setContent(e.target.value)}
        required
        rows="5"
        className="forum-textarea"
      />
      <input
        type="text"
        placeholder={t.tagsPlaceholder}
        value={tags}
        onChange={(e) => setTags(e.target.value)}
        className="forum-input"
      />
      <input
        type="file"
        multiple
        accept="image/*,application/pdf,.csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
        onChange={handleFileChange}
        className="forum-file-input"
      />
      <button type="submit" className="forum-submit-btn">
        {t.addPost}
      </button>
    </form>
  );
}

export default ForumForm;