import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../css/Forums/Forum.css';

function ForumPost({ post, onDelete, onEditToggle, onUpdate, onLike, language = 'en' }) {
  const navigate = useNavigate();
  const [editedTitle, setEditedTitle] = useState(post.title);
  const [editedContent, setEditedContent] = useState(post.content);
  const [commentText, setCommentText] = useState('');
  const [comments, setComments] = useState(post.comments || []);

  // Translations
  const translations = {
    en: {
      save: '✅ Save',
      cancel: '❌ Cancel',
      edit: '✏️ Edit',
      delete: '🗑️ Delete',
      comments: '💬 Comments',
      noComments: 'No comments yet.',
      writeComment: 'Write a comment...',
      addComment: '➕ Comment',
      attachment: '📎 Attachment:',
      download: '📄 Download/View'
    },
    ta: {
      save: '✅ சேமி',
      cancel: '❌ ரத்து',
      edit: '✏️ திருத்து',
      delete: '🗑️ அழி',
      comments: '💬 கருத்துகள்',
      noComments: 'இதுவரை கருத்துகள் இல்லை.',
      writeComment: 'கருத்து எழுதுங்கள்...',
      addComment: '➕ கருத்து',
      attachment: '📎 இணைப்பு:',
      download: '📄 பதிவிறக்கு/காண்க'
    }
  };

  const t = translations[language];

  const handleUpdate = () => {
    if (!editedTitle.trim() || !editedContent.trim()) return;

    onUpdate(post._id, {
      title: editedTitle,
      content: editedContent,
    });
  };

  const handleAddComment = () => {
    if (!commentText.trim()) return;
    const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
    const newComment = {
      text: commentText.trim(),
      userId: currentUser._id || 'guest',
      username: currentUser.username || 'Guest User',
      photoURL: currentUser.photoURL || ''
    };
    const newComments = [...comments, newComment];
    setComments(newComments);
    setCommentText('');

    onUpdate(post._id, {
      ...post,
      comments: newComments,
    });
  };

  const handleUserClick = (userId) => {
    console.log('=== handleUserClick ===');
    console.log('Clicked userId:', userId);
    console.log('Current logged in userId:', localStorage.getItem('userId'));
    console.log('=====================');
    if (!userId || userId === 'guest') return;
    navigate(`/view-profile/${userId}`);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const options = { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };
    return date.toLocaleDateString(language === 'ta' ? 'ta-IN' : 'en-US', options);
  };

  const renderFiles = (files) => {
    if (!files || files.length === 0) return null;

    return files.map((file, index) => {
      const { type, name, data } = file;

      if (type.startsWith('image/')) {
        return (
          <img
            key={index}
            src={data}
            alt={`Uploaded-${index}`}
            className="forum-image"
          />
        );
      }

      const isPDF = type === 'application/pdf';

      return (
        <div key={index} className="forum-file-preview">
          <p><strong>{t.attachment}</strong> {name}</p>
          {isPDF ? (
            <iframe
              src={data}
              title={name}
              className="forum-file-iframe"
              frameBorder="0"
            />
          ) : (
            <a
              href={data}
              download={name}
              target="_blank"
              rel="noopener noreferrer"
              className="forum-file-link"
            >
              {t.download} - {name}
            </a>
          )}
        </div>
      );
    });
  };

  return (
    <div className="forum-post">
      {post.editable ? (
        <>
          <input
            className="forum-edit-title"
            value={editedTitle}
            onChange={(e) => setEditedTitle(e.target.value)}
            placeholder="Title"
          />
          <textarea
            className="forum-edit-content"
            value={editedContent}
            onChange={(e) => setEditedContent(e.target.value)}
            placeholder="Content"
            rows="5"
          />
          <div className="forum-buttons">
            <button onClick={handleUpdate}>{t.save}</button>
            <button onClick={() => onEditToggle(post._id)}>{t.cancel}</button>
          </div>
        </>
      ) : (
        <>
          {/* Header with user info and date */}
          <div className="forum-post-header">
            <div 
              className="forum-user-avatar-container" 
              onClick={() => handleUserClick(post.user?._id || post.userId)}
              style={{ cursor: 'pointer' }}
            >
              {post.user?.photoURL ? (
                <img
                  src={post.user.photoURL}
                  alt="User Avatar"
                  className="forum-user-avatar"
                />
              ) : (
                <div className="forum-user-avatar-placeholder">👤</div>
              )}
            </div>
            <div className="forum-user-info">
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <strong 
                  className="forum-username" 
                  onClick={() => handleUserClick(post.user?._id || post.userId)}
                  style={{ cursor: 'pointer' }}
                >
                  {post.user?.username || 'Anonymous'}
                </strong>
                {(() => {
                  const currentUserId = localStorage.getItem('userId');
                  const isOwner = currentUserId && (post.userId === currentUserId || post.user?._id === currentUserId);
                  return isOwner ? <span className="post-owner-indicator">Your Post</span> : null;
                })()}
              </div>
              <div className="forum-meta">📅 {formatDate(post.createdAt)}</div>
            </div>
          </div>

          <h3 className="forum-post-title">{post.title}</h3>
          <p className="forum-post-content">{post.content}</p>

          {/* Files */}
          {renderFiles(post.files)}

          {/* Tags */}
          {post.tags?.length > 0 && (
            <div className="forum-tags">
              {post.tags.map((tag, index) => (
                <span key={index} className="forum-tag">#{tag}</span>
              ))}
            </div>
          )}

          {/* Action Buttons */}
          <div className="forum-actions">
            <button onClick={() => onLike(post._id)} className="like-btn">
              👍 {post.likes || 0}
            </button>
            {/* Only show edit/delete buttons if user owns the post */}
            {(() => {
              const currentUserId = localStorage.getItem('userId');
              const isOwner = currentUserId && (post.userId === currentUserId || post.user?._id === currentUserId);
              return isOwner ? (
                <>
                  <button onClick={() => onEditToggle(post._id)} className="edit-btn">
                    {t.edit}
                  </button>
                  <button onClick={() => onDelete(post._id)} className="delete-btn">
                    {t.delete}
                  </button>
                </>
              ) : null;
            })()} 
          </div>

          {/* Comments */}
          <div className="forum-comments">
            <h4>{t.comments}</h4>
            {comments.length === 0 && <p className="no-comment">{t.noComments}</p>}
            <ul>
              {comments.map((comment, index) => {
                const isOldComment = typeof comment === 'string';
                return (
                  <li key={index} className="forum-comment-item">
                    {!isOldComment && (
                      <div className="comment-user-info">
                        <div 
                          className="comment-avatar-container"
                          onClick={() => handleUserClick(comment.userId)}
                          style={{ cursor: comment.userId !== 'guest' ? 'pointer' : 'default' }}
                        >
                          {comment.photoURL ? (
                            <img src={comment.photoURL} alt="avatar" className="comment-avatar" />
                          ) : (
                            <div className="comment-avatar-placeholder">👤</div>
                          )}
                        </div>
                        <strong 
                          className="comment-username"
                          onClick={() => handleUserClick(comment.userId)}
                          style={{ cursor: comment.userId !== 'guest' ? 'pointer' : 'default' }}
                        >
                          {comment.username}
                        </strong>
                      </div>
                    )}
                    <span className="comment-text">🗨️ {isOldComment ? comment : comment.text}</span>
                  </li>
                );
              })}
            </ul>
            <div className="comment-form">
              <input
                type="text"
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder={t.writeComment}
                className="comment-input"
                onKeyPress={(e) => e.key === 'Enter' && handleAddComment()}
              />
              <button onClick={handleAddComment} className="comment-btn">
                {t.addComment}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default ForumPost;