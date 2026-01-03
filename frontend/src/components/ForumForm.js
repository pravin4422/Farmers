import React, { useState, useRef } from 'react';
import '../css/Forums/Forum.css';

function ForumForm({ onPost, language = 'en' }) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tags, setTags] = useState('');
  const [files, setFiles] = useState([]);
  const [voiceBlob, setVoiceBlob] = useState(null);
  const [titleVoiceBlob, setTitleVoiceBlob] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isTitleRecording, setIsTitleRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [titleRecordingTime, setTitleRecordingTime] = useState(0);
  const mediaRecorderRef = useRef(null);
  const titleMediaRecorderRef = useRef(null);
  const timerRef = useRef(null);
  const titleTimerRef = useRef(null);

  // Translations
  const translations = {
    en: {
      titlePlaceholder: 'Post Title (Optional)',
      contentPlaceholder: 'Write your content here...',
      tagsPlaceholder: 'Tags (comma separated)',
      addPost: '➕ Add Post',
      startRecording: '🎤 Voice',
      stopRecording: '⏹️ Stop',
      deleteVoice: '🗑️'
    },
    ta: {
      titlePlaceholder: 'இடுகை தலைப்பு (விருப்பமானது)',
      contentPlaceholder: 'உங்கள் உள்ளடக்கத்தை இங்கே எழுதுங்கள்...',
      tagsPlaceholder: 'குறிச்சொற்கள் (காற்புள்ளியால் பிரிக்கப்பட்டது)',
      addPost: '➕ இடுகையைச் சேர்க்கவும்',
      startRecording: '🎤 குரல்',
      stopRecording: '⏹️ நிறுத்து',
      deleteVoice: '🗑️'
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

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      const chunks = [];

      mediaRecorder.ondataavailable = (e) => chunks.push(e.data);
      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/webm' });
        setVoiceBlob(blob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => {
          if (prev >= 179) { // 3 minutes = 180 seconds, stop at 179
            stopRecording();
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

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      clearInterval(timerRef.current);
    }
  };

  const deleteVoice = () => {
    setVoiceBlob(null);
    setRecordingTime(0);
  };

  const startTitleRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      titleMediaRecorderRef.current = mediaRecorder;
      const chunks = [];

      mediaRecorder.ondataavailable = (e) => chunks.push(e.data);
      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/webm' });
        setTitleVoiceBlob(blob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsTitleRecording(true);
      setTitleRecordingTime(0);
      titleTimerRef.current = setInterval(() => {
        setTitleRecordingTime(prev => {
          if (prev >= 179) { // 3 minutes = 180 seconds, stop at 179
            stopTitleRecording();
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

  const stopTitleRecording = () => {
    if (titleMediaRecorderRef.current && isTitleRecording) {
      titleMediaRecorderRef.current.stop();
      setIsTitleRecording(false);
      clearInterval(titleTimerRef.current);
    }
  };

  const deleteTitleVoice = () => {
    setTitleVoiceBlob(null);
    setTitleRecordingTime(0);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Only content is required (title is optional)
    const hasContentData = content.trim() || voiceBlob;
    
    if (!hasContentData) {
      alert('Please provide content (either by typing or voice recording)');
      return;
    }

    let voiceData = null;
    if (voiceBlob) {
      const reader = new FileReader();
      voiceData = await new Promise((resolve) => {
        reader.onloadend = () => resolve(reader.result);
        reader.readAsDataURL(voiceBlob);
      });
    }

    let titleVoiceData = null;
    if (titleVoiceBlob) {
      const reader = new FileReader();
      titleVoiceData = await new Promise((resolve) => {
        reader.onloadend = () => resolve(reader.result);
        reader.readAsDataURL(titleVoiceBlob);
      });
    }

    const newPost = {
      title: title.trim() || 'Untitled',
      content: content.trim() || 'Voice Message',
      tags: tags
        .split(',')
        .map((tag) => tag.trim())
        .filter((tag) => tag),
      files: files.length > 0 ? files : [],
      voiceMessage: voiceData,
      titleVoiceMessage: titleVoiceData,
      comments: [],
    };

    // Send new post to parent (Forum.js)
    onPost(newPost);

    // Clear form inputs
    setTitle('');
    setContent('');
    setTags('');
    setFiles([]);
    setVoiceBlob(null);
    setTitleVoiceBlob(null);
    setRecordingTime(0);
    setTitleRecordingTime(0);
    e.target.reset(); // clears file input visually
  };

  return (
    <form className="forum-form" onSubmit={handleSubmit}>
      <div className="title-input-wrapper">
        <input
          type="text"
          placeholder={t.titlePlaceholder}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="forum-input"
        />
        <div className="title-voice-controls">
          {!titleVoiceBlob && !isTitleRecording && (
            <button
              type="button"
              onClick={startTitleRecording}
              className="voice-record-btn-small"
            >
              {t.startRecording}
            </button>
          )}
          {isTitleRecording && (
            <>
              <button
                type="button"
                onClick={stopTitleRecording}
                className="voice-record-btn-small recording"
              >
                {t.stopRecording}
              </button>
              <span className="voice-timer-small">{formatTime(titleRecordingTime)}</span>
            </>
          )}
          {titleVoiceBlob && !isTitleRecording && (
            <button type="button" onClick={deleteTitleVoice} className="voice-delete-btn-small">
              {t.deleteVoice}
            </button>
          )}
        </div>
      </div>
      {titleVoiceBlob && (
        <audio controls style={{ width: '100%', marginBottom: '12px', height: '35px' }} src={URL.createObjectURL(titleVoiceBlob)} />
      )}
      
      <div className="content-input-wrapper">
        <textarea
          placeholder={t.contentPlaceholder}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows="5"
          className="forum-textarea"
        />
        <div className="voice-controls">
          <button
            type="button"
            onClick={isRecording ? stopRecording : startRecording}
            className={`voice-record-btn-small ${isRecording ? 'recording' : ''}`}
          >
            {isRecording ? t.stopRecording : t.startRecording}
          </button>
          {isRecording && <span className="voice-timer-small">{formatTime(recordingTime)}</span>}
          {voiceBlob && !isRecording && (
            <>
              <audio controls className="voice-preview-small" src={URL.createObjectURL(voiceBlob)} />
              <button type="button" onClick={deleteVoice} className="voice-delete-btn-small">
                {t.deleteVoice}
              </button>
            </>
          )}
        </div>
      </div>

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