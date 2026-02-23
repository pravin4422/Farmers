import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../css/Forums/Forum.css';

function ForumPost({ post, onDelete, onEditToggle, onUpdate, onLike, onValidate, language = 'en' }) {
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
  const [commentLikes, setCommentLikes] = useState({});
  const [likedComments, setLikedComments] = useState(new Set());
  const [editTitleVoiceBlob, setEditTitleVoiceBlob] = useState(null);
  const [editContentVoiceBlob, setEditContentVoiceBlob] = useState(null);
  const [isEditTitleRecording, setIsEditTitleRecording] = useState(false);
  const [isEditContentRecording, setIsEditContentRecording] = useState(false);
  const [editTitleRecordingTime, setEditTitleRecordingTime] = useState(0);
  const [editContentRecordingTime, setEditContentRecordingTime] = useState(0);
  const editTitleMediaRecorderRef = React.useRef(null);
  const editContentMediaRecorderRef = React.useRef(null);
  const editTitleTimerRef = React.useRef(null);
  const editContentTimerRef = React.useRef(null);
  const [replyingTo, setReplyingTo] = useState(null);
  const [replyText, setReplyText] = useState('');

  React.useEffect(() => {
    setComments(post.comments || []);
    const likes = {};
    const currentUserId = localStorage.getItem('userId');
    const liked = new Set();
    (post.comments || []).forEach((comment, index) => {
      likes[index] = comment.likes || 0;
      if (comment.likedBy && comment.likedBy.includes(currentUserId)) {
        liked.add(index);
      }
    });
    setCommentLikes(likes);
    setLikedComments(liked);
  }, [post.comments]);

  const translations = {
    en: {
      save: '✅ Save',
      cancel: '❌ Cancel',
      edit: 'Edit',
      delete: ' Delete',
      comments: '💬 Comments',
      noComments: 'No comments yet.',
      writeComment: 'Write a comment...',
      addComment: ' Comment',
      reply: 'Reply',
      replyTo: 'Replying to',
      attachment: ' Attachment:',
      download: '📄 Download/View',
      voiceMessage: '🎤 Voice Message:',
      titleVoice: '🎤 Title:',
      contentVoice: '🎤 Content:',
      aiCheck: '🤖 AI Check',
      validating: 'Validating...',
      aiValidation: 'AI Validation'
    },
    ta: {
      save: '✅ சேமி',
      cancel: '❌ ரத்து',
      edit: 'திருத்து',
      delete: 'அழி',
      comments: '💬 கருத்துகள்',
      noComments: 'இதுவரை கருத்துகள் இல்லை.',
      writeComment: 'கருத்து எழுதுங்கள்...',
      addComment: ' கருத்து',
      reply: 'பதிலளி',
      replyTo: 'பதிலளிக்கிறது',
      attachment: ' இணைப்பு:',
      download: '📄 பதிவிறக்கு/காண்க',
      voiceMessage: '🎤 குரல் செய்தி:',
      titleVoice: '🎤 தலைப்பு:',
      contentVoice: '🎤 உள்ளடக்கம்:',
      aiCheck: '🤖 AI சரிபார்ப்பு',
      validating: 'சரிபார்க்கிறது...',
      aiValidation: 'AI சரிபார்ப்பு'
    }
  };

  const t = translations[language];

  const handleUpdate = () => {
    if (!editedTitle.trim() || !editedContent.trim()) return;

    const updateData = {
      title: editedTitle,
      content: editedContent,
    };

    // Add title voice if recorded
    if (editTitleVoiceBlob) {
      const reader = new FileReader();
      reader.onloadend = () => {
        updateData.titleVoiceMessage = reader.result;
        // Add content voice if recorded
        if (editContentVoiceBlob) {
          const reader2 = new FileReader();
          reader2.onloadend = () => {
            updateData.voiceMessage = reader2.result;
            onUpdate(post._id, updateData);
          };
          reader2.readAsDataURL(editContentVoiceBlob);
        } else {
          onUpdate(post._id, updateData);
        }
      };
      reader.readAsDataURL(editTitleVoiceBlob);
    } else if (editContentVoiceBlob) {
      const reader = new FileReader();
      reader.onloadend = () => {
        updateData.voiceMessage = reader.result;
        onUpdate(post._id, updateData);
      };
      reader.readAsDataURL(editContentVoiceBlob);
    } else {
      onUpdate(post._id, updateData);
    }
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

  const startEditTitleRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      editTitleMediaRecorderRef.current = mediaRecorder;
      const chunks = [];
      mediaRecorder.ondataavailable = (e) => chunks.push(e.data);
      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/webm' });
        setEditTitleVoiceBlob(blob);
        stream.getTracks().forEach(track => track.stop());
      };
      mediaRecorder.start();
      setIsEditTitleRecording(true);
      setEditTitleRecordingTime(0);
      editTitleTimerRef.current = setInterval(() => {
        setEditTitleRecordingTime(prev => prev >= 179 ? 180 : prev + 1);
      }, 1000);
    } catch (err) {
      alert('Could not access microphone.');
    }
  };

  const stopEditTitleRecording = () => {
    if (editTitleMediaRecorderRef.current && isEditTitleRecording) {
      editTitleMediaRecorderRef.current.stop();
      setIsEditTitleRecording(false);
      clearInterval(editTitleTimerRef.current);
    }
  };

  const startEditContentRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      editContentMediaRecorderRef.current = mediaRecorder;
      const chunks = [];
      mediaRecorder.ondataavailable = (e) => chunks.push(e.data);
      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/webm' });
        setEditContentVoiceBlob(blob);
        stream.getTracks().forEach(track => track.stop());
      };
      mediaRecorder.start();
      setIsEditContentRecording(true);
      setEditContentRecordingTime(0);
      editContentTimerRef.current = setInterval(() => {
        setEditContentRecordingTime(prev => prev >= 179 ? 180 : prev + 1);
      }, 1000);
    } catch (err) {
      alert('Could not access microphone.');
    }
  };

  const stopEditContentRecording = () => {
    if (editContentMediaRecorderRef.current && isEditContentRecording) {
      editContentMediaRecorderRef.current.stop();
      setIsEditContentRecording(false);
      clearInterval(editContentTimerRef.current);
    }
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
      photoURL: '',
      likes: 0,
      likedBy: [],
      replies: []
    };
    
    console.log('Adding comment:', newComment);
    console.log('Current comments:', comments);
    
    const newComments = [...comments, newComment];
    console.log('New comments array:', newComments);
    
    setComments(newComments);
    setCommentText('');
    setCommentVoiceBlob(null);
    setCommentRecordingTime(0);

    // Reset textarea height
    const textarea = document.querySelector('.comment-input');
    if (textarea) textarea.style.height = 'auto';

    await onUpdate(post._id, {
      comments: newComments,
    });
  };

  const handleAddReply = async (commentIndex) => {
    if (!replyText.trim()) return;
    
    const displayName = localStorage.getItem('displayName');
    const userEmail = localStorage.getItem('userEmail');
    const userId = localStorage.getItem('userId');
    
    const newReply = {
      text: replyText.trim(),
      userId: userId || 'guest',
      username: displayName || userEmail || 'Guest User',
      photoURL: '',
      likes: 0,
      likedBy: []
    };
    
    const updatedComments = comments.map((c, index) => {
      if (index === commentIndex) {
        const comment = typeof c === 'string' ? { text: c, replies: [] } : c;
        return { ...comment, replies: [...(comment.replies || []), newReply] };
      }
      return c;
    });
    
    setComments(updatedComments);
    setReplyText('');
    setReplyingTo(null);
    await onUpdate(post._id, { comments: updatedComments });
  };

  const handleCommentLike = async (commentIndex) =>{
    const currentUserId = localStorage.getItem('userId');
    if (!currentUserId) {
      alert('Please login to like comments');
      return;
    }

    const comment = comments[commentIndex];
    const isOldComment = typeof comment === 'string';
    const likedBy = isOldComment ? [] : (comment.likedBy || []);
    const hasLiked = likedBy.includes(currentUserId);
    
    let newLikedBy, newLikes;
    if (hasLiked) {
      // Unlike
      newLikedBy = likedBy.filter(id => id !== currentUserId);
      newLikes = Math.max(0, (comment.likes || 0) - 1);
      const newLikedComments = new Set(likedComments);
      newLikedComments.delete(commentIndex);
      setLikedComments(newLikedComments);
    } else {
      // Like
      newLikedBy = [...likedBy, currentUserId];
      newLikes = (comment.likes || 0) + 1;
      setLikedComments(new Set([...likedComments, commentIndex]));
    }
    
    const updatedComments = comments.map((c, index) => {
      if (index === commentIndex) {
        return typeof c === 'string' 
          ? { text: c, likes: newLikes, likedBy: newLikedBy }
          : { ...c, likes: newLikes, likedBy: newLikedBy };
      }
      return c;
    });
    
    setComments(updatedComments);
    await onUpdate(post._id, { comments: updatedComments });
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
          <div style={{ marginTop: '8px', marginBottom: '8px' }}>
            {post.titleVoiceMessage && !editTitleVoiceBlob && (
              <div className="forum-voice-message">
                <p><strong>{t.titleVoice}</strong></p>
                <audio controls src={post.titleVoiceMessage} style={{ height: '35px' }} />
                <button 
                  onClick={() => onUpdate(post._id, { titleVoiceMessage: null })} 
                  style={{ marginLeft: '10px', padding: '4px 8px', fontSize: '12px', background: '#dc3545', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                >
                  Delete Voice
                </button>
              </div>
            )}
            {!isEditTitleRecording && !editTitleVoiceBlob && (
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  startEditTitleRecording();
                }} 
                style={{ padding: '6px 12px', background: '#28a745', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
              >
                🎤 Record Title Voice
              </button>
            )}
            {isEditTitleRecording && (
              <>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    stopEditTitleRecording();
                  }} 
                  style={{ padding: '6px 12px', background: '#dc3545', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                >
                  ⏹️ Stop
                </button>
                <span style={{ marginLeft: '10px' }}>{formatTime(editTitleRecordingTime)}</span>
              </>
            )}
            {editTitleVoiceBlob && (
              <div style={{ marginTop: '8px' }}>
                <audio controls src={URL.createObjectURL(editTitleVoiceBlob)} style={{ height: '35px' }} />
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    setEditTitleVoiceBlob(null);
                  }} 
                  style={{ marginLeft: '10px', padding: '4px 8px', fontSize: '12px', background: '#dc3545', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                >
                  Delete
                </button>
              </div>
            )}
          </div>
          <textarea
            className="forum-edit-content"
            value={editedContent}
            onChange={(e) => setEditedContent(e.target.value)}
            placeholder="Content"
            rows="5"
          />
          <div style={{ marginTop: '8px', marginBottom: '8px' }}>
            {post.voiceMessage && !editContentVoiceBlob && (
              <div className="forum-voice-message">
                <p><strong>{t.contentVoice}</strong></p>
                <audio controls src={post.voiceMessage} />
                <button 
                  onClick={() => onUpdate(post._id, { voiceMessage: null })} 
                  style={{ marginLeft: '10px', padding: '4px 8px', fontSize: '12px', background: '#dc3545', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                >
                  Delete Voice
                </button>
              </div>
            )}
            {!isEditContentRecording && !editContentVoiceBlob && (
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  startEditContentRecording();
                }} 
                style={{ padding: '6px 12px', background: '#28a745', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
              >
                🎤 Record Content Voice
              </button>
            )}
            {isEditContentRecording && (
              <>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    stopEditContentRecording();
                  }} 
                  style={{ padding: '6px 12px', background: '#dc3545', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                >
                  ⏹️ Stop
                </button>
                <span style={{ marginLeft: '10px' }}>{formatTime(editContentRecordingTime)}</span>
              </>
            )}
            {editContentVoiceBlob && (
              <div style={{ marginTop: '8px' }}>
                <audio controls src={URL.createObjectURL(editContentVoiceBlob)} />
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    setEditContentVoiceBlob(null);
                  }} 
                  style={{ marginLeft: '10px', padding: '4px 8px', fontSize: '12px', background: '#dc3545', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                >
                  Delete
                </button>
              </div>
            )}
          </div>
          <div className="forum-buttons">
            <button onClick={handleUpdate}>{t.save}</button>
            <button onClick={() => onEditToggle(post._id)}>{t.cancel}</button>
          </div>
        </>
      ) : (
        <>
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
            <button 
              onClick={() => onLike(post._id)} 
              className="like-btn"
              style={{
                background: (post.likedBy || []).includes(localStorage.getItem('userId')) ? '#28a745' : '#f8f9fa',
                border: (post.likedBy || []).includes(localStorage.getItem('userId')) ? '2px solid #28a745' : '2px solid #ddd',
                borderRadius: '8px',
                padding: '5px 12px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                color: (post.likedBy || []).includes(localStorage.getItem('userId')) ? '#fff' : '#333',
                fontWeight: 'bold',
                transition: 'all 0.2s'
              }}
            >
              <span style={{ fontSize: '18px' }}>🌿</span>
              <span style={{ fontSize: '14px' }}>{post.likes || 0}</span>
            </button>
            <button 
              onClick={() => onValidate(post._id)} 
              disabled={post.validating}
              style={{
                background: '#007bff',
                color: '#fff',
                border: '2px solid #007bff',
                borderRadius: '8px',
                padding: '5px 12px',
                cursor: post.validating ? 'not-allowed' : 'pointer',
                opacity: post.validating ? 0.6 : 1
              }}
            >
              {post.validating ? t.validating : t.aiCheck}
            </button>
            {(() => {
              const currentUserId = String(localStorage.getItem('userId') || '').trim();
              const postOwnerId = String(post.userId || post.user?._id || '').trim();
              const isOwner = currentUserId && postOwnerId && currentUserId === postOwnerId;
              
              if (isOwner) {
                return (
                  <>
                    <button 
                      onClick={() => onEditToggle(post._id)} 
                      className="edit-btn"
                      style={{
                        background: '#fff',
                        color: '#856404',
                        border: '2px solid #ffc107'
                      }}
                    >
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

          {/* AI Validation Results - Simplified */}
          {post.aiValidation && (
            <div style={{
              marginTop: '20px',
              padding: '20px',
              background: '#f8f9fa',
              borderRadius: '12px',
              border: '2px solid #e9ecef'
            }}>
              {/* Header */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '20px',
                paddingBottom: '15px',
                borderBottom: '2px solid #dee2e6'
              }}>
                <span style={{ fontSize: '24px', marginRight: '10px' }}>🤖</span>
                <h4 style={{ margin: 0, fontSize: '20px', color: '#495057' }}>AI Solution Analysis</h4>
              </div>

              {/* Best Solution Card */}
              {post.aiValidation.bestSolution ? (
                <div style={{
                  background: '#fff',
                  padding: '20px',
                  borderRadius: '10px',
                  border: '3px solid #28a745',
                  marginBottom: '20px',
                  boxShadow: '0 2px 8px rgba(40, 167, 69, 0.15)'
                }}>
                  {/* Success Badge */}
                  <div style={{
                    display: 'inline-block',
                    background: '#28a745',
                    color: '#fff',
                    padding: '8px 16px',
                    borderRadius: '20px',
                    fontSize: '14px',
                    fontWeight: 'bold',
                    marginBottom: '15px'
                  }}>
                    ✅ Best Solution Found
                  </div>

                  {/* Solution Details */}
                  <div style={{ marginBottom: '15px' }}>
                    <div style={{ fontSize: '16px', color: '#6c757d', marginBottom: '8px' }}>
                      Recommended by <strong style={{ color: '#28a745' }}>{post.aiValidation.bestSolution.username}</strong>
                    </div>
                    <div style={{
                      background: '#f8f9fa',
                      padding: '15px',
                      borderRadius: '8px',
                      fontSize: '15px',
                      lineHeight: '1.6',
                      color: '#212529',
                      border: '1px solid #e9ecef'
                    }}>
                      {post.aiValidation.bestSolution.text}
                    </div>
                  </div>

                  {/* Verified Badge */}
                  <div style={{
                    background: '#e7f5ec',
                    color: '#28a745',
                    padding: '6px 12px',
                    borderRadius: '6px',
                    fontSize: '14px',
                    fontWeight: 'bold',
                    display: 'inline-block'
                  }}>
                    ✓ Verified
                  </div>
                </div>
              ) : (
                <div style={{
                  background: '#fff3cd',
                  padding: '20px',
                  borderRadius: '10px',
                  border: '2px solid #ffc107',
                  marginBottom: '20px',
                  textAlign: 'center'
                }}>
                  <div style={{ fontSize: '40px', marginBottom: '10px' }}>⚠️</div>
                  <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#856404', marginBottom: '8px' }}>
                    No Reliable Solution Found
                  </div>
                  <div style={{ fontSize: '14px', color: '#856404' }}>
                    {post.aiValidation.decision?.recommendation || 'Please consult an agricultural expert'}
                  </div>
                </div>
              )}

              {/* Footer Info */}
              <div style={{
                marginTop: '15px',
                paddingTop: '15px',
                borderTop: '1px solid #dee2e6',
                fontSize: '12px',
                color: '#6c757d',
                textAlign: 'center'
              }}>
                <div>✅ Analyzed {post.aiValidation.totalSolutions} solution{post.aiValidation.totalSolutions !== 1 ? 's' : ''}</div>
                {post.aiValidation.timestamp && (
                  <div style={{ marginTop: '4px' }}>
                    {new Date(post.aiValidation.timestamp).toLocaleString()}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Comments */}
          <div className="forum-comments">
            <h4>{t.comments}</h4>
            {comments.length === 0 && <p className="no-comment">{t.noComments}</p>}
            <ul>
              {comments.map((comment, index) => {
                const isOldComment = typeof comment === 'string';
                const likeCount = isOldComment ? 0 : (comment.likes || 0);
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
                      <button 
                        onClick={() => handleCommentLike(index)} 
                        className="comment-like-btn"
                        style={{ 
                          background: likedComments.has(index) ? '#28a745' : '#f8f9fa', 
                          border: likedComments.has(index) ? '2px solid #28a745' : '2px solid #ddd', 
                          borderRadius: '8px', 
                          padding: '5px 10px', 
                          cursor: 'pointer', 
                          fontSize: '12px', 
                          marginLeft: '10px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '5px',
                          color: likedComments.has(index) ? '#fff' : '#333',
                          fontWeight: 'bold',
                          transition: 'all 0.2s'
                        }}
                      >
                        <span style={{ fontSize: '16px' }}>🌿</span>
                        <span style={{ fontSize: '13px' }}>{likeCount}</span>
                      </button>
                    </div>
                    <span className="comment-text">🗨️ {isOldComment ? comment : comment.text}</span>
                    {!isOldComment && comment.voiceMessage && (
                      <div className="comment-voice">
                        <audio controls src={comment.voiceMessage} />
                      </div>
                    )}
                    <div style={{ display: 'flex', justifyContent: 'flex-start', marginTop: '5px' }}>
                      <button 
                        onClick={() => setReplyingTo(index)} 
                        style={{ 
                          background: 'transparent', 
                          border: 'none', 
                          color: '#007bff', 
                          cursor: 'pointer', 
                          fontSize: '10px',
                          padding: '1px 3px'
                        }}
                      >
                        ↩️ {t.reply}
                      </button>
                    </div>
                    {replyingTo === index && (
                      <div style={{ marginTop: '10px', marginLeft: '20px', borderLeft: '2px solid #ddd', paddingLeft: '10px' }}>
                        <input
                          value={replyText}
                          onChange={(e) => setReplyText(e.target.value)}
                          placeholder={`${t.replyTo} ${isOldComment ? 'Anonymous' : comment.username}...`}
                          style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleAddReply(index);
                            }
                          }}
                        />
                        <div style={{ marginTop: '5px' }}>
                          <button onClick={() => handleAddReply(index)} style={{ padding: '5px 10px', marginRight: '5px', background: '#28a745', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}>
                            {t.addComment}
                          </button>
                          <button onClick={() => { setReplyingTo(null); setReplyText(''); }} style={{ padding: '5px 10px', background: '#dc3545', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}>
                            {t.cancel}
                          </button>
                        </div>
                      </div>
                    )}
                    {!isOldComment && comment.replies && comment.replies.length > 0 && (
                      <ul style={{ marginTop: '10px', marginLeft: '30px', borderLeft: '2px solid #e0e0e0', paddingLeft: '10px' }}>
                        {comment.replies.map((reply, rIdx) => (
                          <li key={rIdx} style={{ marginBottom: '8px', listStyle: 'none' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                              <div className="comment-avatar-placeholder" style={{ width: '24px', height: '24px', fontSize: '12px' }}>👤</div>
                              <strong style={{ fontSize: '13px' }}>{reply.username}</strong>
                            </div>
                            <span style={{ fontSize: '13px', color: '#555' }}>↩️ {reply.text}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </li>
                );
              })}
            </ul>
            <div className="comment-form">
              <div className="comment-input-wrapper">
                <textarea
                  value={commentText}
                  onChange={(e) => {
                    setCommentText(e.target.value);
                    e.target.style.height = 'auto';
                    const lineHeight = 24;
                    const maxHeight = lineHeight * 4;
                    const newHeight = Math.min(e.target.scrollHeight, maxHeight);
                    e.target.style.height = newHeight + 'px';
                  }}
                  placeholder={t.writeComment}
                  className="comment-input"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleAddComment();
                    }
                  }}
                  rows="1"
                  style={{ resize: 'none', overflowY: 'auto', maxHeight: '96px' }}
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