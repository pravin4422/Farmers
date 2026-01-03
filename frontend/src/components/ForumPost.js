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
  const [commentVoiceBlob, setCommentVoiceBlob] = useState(null);
  const [isCommentRecording, setIsCommentRecording] = useState(false);
  const [commentRecordingTime, setCommentRecordingTime] = useState(0);
  const commentMediaRecorderRef = React.useRef(null);
  const commentTimerRef = React.useRef(null);

  // Update comments when post changes (after refresh)
  React.useEffect(() => {
    setComments(post.comments || []);
  }, [post.comments]);

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
      download: '📄 Download/View',
      voiceMessage: '🎤 Voice Message:',
      titleVoice: '🎤 Title:',
      contentVoice: '🎤 Content:'
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
      download: '📄 பதிவிறக்கு/காண்க',
      voiceMessage: '🎤 குரல் செய்தி:',
      titleVoice: '🎤 தலைப்பு:',
      contentVoice: '🎤 உள்ளடக்கம்:'
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

  const startCommentRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      commentMediaRecorderRef.current = mediaRecorder;
      const chunks = [];

      mediaRecorder.ondataavailable = (e) => chunks.push(e.data);
      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/webm' });
        setCommentVoiceBlob(blob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsCommentRecording(true);
      setCommentRecordingTime(0);
      commentTimerRef.current = setInterval(() => {
        setCommentRecordingTime(prev => {
          if (prev >= 179) {
            stopCommentRecording();
            return 180;
          }
          return prev + 1;
        });
      }, 1000);
    } catch (err) {
      console.error('Error accessing microphone:', err);
      alert('Could not access microphone. Please check permissions.');
    }
  };

  const stopCommentRecording = () => {
    if (commentMediaRecorderRef.current && isCommentRecording) {
      commentMediaRecorderRef.current.stop();
      setIsCommentRecording(false);
      clearInterval(commentTimerRef.current);
    }
  };

  const deleteCommentVoice = () => {
    setCommentVoiceBlob(null);
    setCommentRecordingTime(0);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleAddComment = async () => {
    if (!commentText.trim() && !commentVoiceBlob) return;
    
    // Get current user info from localStorage
    const displayName = localStorage.getItem('displayName');
    const userEmail = localStorage.getItem('userEmail');
    const userId = localStorage.getItem('userId');
    
    let voiceData = null;
    if (commentVoiceBlob) {
      const reader = new FileReader();
      voiceData = await new Promise((resolve) => {
        reader.onloadend = () => resolve(reader.result);
        reader.readAsDataURL(commentVoiceBlob);
      });
    }
    
    const newComment = {
      text: commentText.trim() || 'Voice Comment',
      voiceMessage: voiceData,
      userId: userId || 'guest',
      username: displayName || userEmail || 'Guest User',
      photoURL: ''
    };
    
    console.log('Adding comment:', newComment);
    console.log('Current comments:', comments);
    
    const newComments = [...comments, newComment];
    console.log('New comments array:', newComments);
    
    setComments(newComments);
    setCommentText('');
    setCommentVoiceBlob(null);
    setCommentRecordingTime(0);

    // Update the post with new comments
    await onUpdate(post._id, {
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
                  const currentUserId = String(localStorage.getItem('userId') || '').trim();
                  const postOwnerId = String(post.userId || post.user?._id || '').trim();
                  const isOwner = currentUserId && postOwnerId && currentUserId === postOwnerId;
                  return isOwner ? <span className="post-owner-indicator">Your Post</span> : null;
                })()}
              </div>
              <div className="forum-meta">📅 {formatDate(post.createdAt)}</div>
            </div>
          </div>

          <h3 className="forum-post-title">{post.title}</h3>
          {post.titleVoiceMessage && (
            <div className="forum-voice-message" style={{ marginTop: '8px', marginBottom: '8px' }}>
              <p><strong>{t.titleVoice}</strong></p>
              <audio controls src={post.titleVoiceMessage} style={{ height: '35px' }} />
            </div>
          )}
          <p className="forum-post-content">{post.content}</p>

          {/* Files */}
          {renderFiles(post.files)}

          {/* Voice Message */}
          {post.voiceMessage && (
            <div className="forum-voice-message">
              <p><strong>{t.contentVoice}</strong></p>
              <audio controls src={post.voiceMessage} />
            </div>
          )}

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
            {(() => {
              const currentUserId = String(localStorage.getItem('userId') || '').trim();
              const postOwnerId = String(post.userId || post.user?._id || '').trim();
              const isOwner = currentUserId && postOwnerId && currentUserId === postOwnerId;
              
              if (isOwner) {
                return (
                  <>
                    <button onClick={() => onEditToggle(post._id)} className="edit-btn">
                      {t.edit}
                    </button>
                    <button onClick={() => onDelete(post._id)} className="delete-btn">
                      {t.delete}
                    </button>
                  </>
                );
              }
              return null;
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
                    <div className="comment-user-info">
                      <div 
                        className="comment-avatar-container"
                        onClick={() => !isOldComment && handleUserClick(comment.userId)}
                        style={{ cursor: !isOldComment && comment.userId !== 'guest' ? 'pointer' : 'default' }}
                      >
                        {!isOldComment && comment.photoURL ? (
                          <img src={comment.photoURL} alt="avatar" className="comment-avatar" />
                        ) : (
                          <div className="comment-avatar-placeholder">👤</div>
                        )}
                      </div>
                      <strong 
                        className="comment-username"
                        onClick={() => !isOldComment && handleUserClick(comment.userId)}
                        style={{ cursor: !isOldComment && comment.userId !== 'guest' ? 'pointer' : 'default' }}
                      >
                        {isOldComment ? 'Anonymous' : comment.username}
                      </strong>
                    </div>
                    <span className="comment-text">🗨️ {isOldComment ? comment : comment.text}</span>
                    {!isOldComment && comment.voiceMessage && (
                      <div className="comment-voice">
                        <audio controls src={comment.voiceMessage} />
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
            <div className="comment-form">
              <div className="comment-input-wrapper">
                <input
                  type="text"
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder={t.writeComment}
                  className="comment-input"
                  onKeyPress={(e) => e.key === 'Enter' && handleAddComment()}
                />
                <div className="comment-voice-controls">
                  {!commentVoiceBlob && !isCommentRecording && (
                    <button
                      type="button"
                      onClick={startCommentRecording}
                      className="voice-record-btn-small"
                    >
                      🎤
                    </button>
                  )}
                  {isCommentRecording && (
                    <>
                      <button
                        type="button"
                        onClick={stopCommentRecording}
                        className="voice-record-btn-small recording"
                      >
                        ⏹️
                      </button>
                      <span className="voice-timer-small">{formatTime(commentRecordingTime)}</span>
                    </>
                  )}
                  {commentVoiceBlob && !isCommentRecording && (
                    <button type="button" onClick={deleteCommentVoice} className="voice-delete-btn-small">
                      🗑️
                    </button>
                  )}
                </div>
              </div>
              {commentVoiceBlob && (
                <audio controls style={{ width: '100%', height: '30px' }} src={URL.createObjectURL(commentVoiceBlob)} />
              )}
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