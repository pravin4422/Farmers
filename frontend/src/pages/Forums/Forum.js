import React, { useState, useEffect } from 'react';
import ForumForm from '../../components/ForumForm';
import ForumPost from '../../components/ForumPost';
import '../../css/Forums/Forum.css';

const BACKEND_URL = 'http://localhost:5000'; // Backend URL

function Forum() {
  const [posts, setPosts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('all');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [language, setLanguage] = useState('en');

  // Translations
  const translations = {
    en: {
      title: 'Farmer Forum',
      searchPlaceholder: 'Search posts...',
      filterByDate: 'Filter by Date:',
      allTime: 'All Time',
      today: 'Today',
      pastWeek: 'Past Week',
      pastMonth: 'Past Month',
      pastYear: 'Past Year',
      customRange: 'Custom Range',
      to: 'to',
      loading: 'Loading posts...',
      noPosts: 'No posts found.',
      error: 'Error:',
      startDate: 'Start Date',
      endDate: 'End Date',
    },
    ta: {
      title: '👨‍🌾 விவசாயி மன்றம்',
      searchPlaceholder: 'இடுகைகளைத் தேடுங்கள்...',
      filterByDate: 'தேதி வாரியாக வடிகட்டவும்:',
      allTime: 'அனைத்து காலம்',
      today: 'இன்று',
      pastWeek: 'கடந்த வாரம்',
      pastMonth: 'கடந்த மாதம்',
      pastYear: 'கடந்த ஆண்டு',
      customRange: 'தனிப்பயன் வரம்பு',
      to: 'முதல்',
      loading: 'இடுகைகளை ஏற்றுகிறது...',
      noPosts: 'இடுகைகள் இல்லை.',
      error: 'பிழை:',
      startDate: 'தொடக்க தேதி',
      endDate: 'முடிவு தேதி',
    }
  };

  const t = translations[language];

  // Fetch posts on mount
  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${BACKEND_URL}/api/posts`);
      if (!response.ok) throw new Error('Failed to fetch posts');
      const data = await response.json();
      setPosts(data);
    } catch (err) {
      setError(err.message);
      console.error('Error fetching posts:', err);
    } finally {
      setLoading(false);
    }
  };

  const addPost = async (newPost) => {
    const postData = {
      ...newPost,
      likes: 0,
      createdAt: new Date().toISOString(),
      user: {
        username: 'Guest User',
        photoURL: '',
      },
    };

    try {
      const response = await fetch(`${BACKEND_URL}/api/posts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(postData),
      });

      if (!response.ok) throw new Error('Failed to create post');
      const savedPost = await response.json();
      setPosts((prev) => [savedPost, ...prev]);
    } catch (err) {
      setError(err.message);
      console.error('Error creating post:', err);
    }
  };

  const updatePost = async (id, updatedData) => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/posts/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedData),
      });

      if (!response.ok) throw new Error('Failed to update post');
      const updated = await response.json();

      setPosts((prev) =>
        prev.map((post) => (post._id === id ? { ...updated, editable: false } : post))
      );
    } catch (err) {
      setError(err.message);
      console.error('Error updating post:', err);
    }
  };

  const deletePost = async (id) => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/posts/${id}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Failed to delete post');

      setPosts((prev) => prev.filter((post) => post._id !== id));
    } catch (err) {
      setError(err.message);
      console.error('Error deleting post:', err);
    }
  };

  const toggleEditPost = (id) => {
    setPosts((prev) =>
      prev.map((post) => (post._id === id ? { ...post, editable: !post.editable } : post))
    );
  };

  const likePost = async (id) => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/posts/${id}/like`, { method: 'POST' });
      if (!response.ok) throw new Error('Failed to like post');

      const updated = await response.json();
      setPosts((prev) =>
        prev.map((post) => (post._id === id ? { ...post, likes: updated.likes } : post))
      );
    } catch (err) {
      setError(err.message);
      console.error('Error liking post:', err);
    }
  };

  const filterByDate = (post) => {
    const postDate = new Date(post.createdAt);
    const now = new Date();

    switch (dateFilter) {
      case 'today':
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        return postDate >= today;
      case 'week':
        return postDate >= new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      case 'month':
        return postDate >= new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
      case 'year':
        return postDate >= new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
      case 'custom':
        const start = customStartDate ? new Date(customStartDate) : new Date(0);
        const end = customEndDate ? new Date(customEndDate + 'T23:59:59') : new Date();
        return postDate >= start && postDate <= end;
      default:
        return true;
    }
  };

  const filteredPosts = posts
    .filter((post) =>
      post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      post.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (post.tags || []).some((tag) => tag.toLowerCase().includes(searchTerm.toLowerCase()))
    )
    .filter(filterByDate);

  return (
    <div className="forum-container">
      <div className="forum-header">
        <h1 className="forum-title">{t.title}</h1>
        <div className="language-toggle">
          <button className={`lang-btn ${language === 'en' ? 'active' : ''}`} onClick={() => setLanguage('en')}>English</button>
          <button className={`lang-btn ${language === 'ta' ? 'active' : ''}`} onClick={() => setLanguage('ta')}>தமிழ்</button>
        </div>
      </div>

      {error && <div className="error-message">{t.error} {error}</div>}

      <ForumForm onPost={addPost} language={language} />

      <div className="forum-filters">
        <input
          type="text"
          placeholder={t.searchPlaceholder}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="forum-search"
        />

        <div className="date-filter">
          <label>{t.filterByDate}</label>
          <select value={dateFilter} onChange={(e) => setDateFilter(e.target.value)} className="date-filter-select">
            <option value="all">{t.allTime}</option>
            <option value="today">{t.today}</option>
            <option value="week">{t.pastWeek}</option>
            <option value="month">{t.pastMonth}</option>
            <option value="year">{t.pastYear}</option>
            <option value="custom">{t.customRange}</option>
          </select>

          {dateFilter === 'custom' && (
            <div className="custom-date-range">
              <input type="date" value={customStartDate} onChange={(e) => setCustomStartDate(e.target.value)} placeholder={t.startDate} className="date-input" />
              <span className="date-separator">{t.to}</span>
              <input type="date" value={customEndDate} onChange={(e) => setCustomEndDate(e.target.value)} placeholder={t.endDate} className="date-input" />
            </div>
          )}
        </div>
      </div>

      {loading ? (
        <p className="loading-text">{t.loading}</p>
      ) : (
        <div className="forum-posts">
          {filteredPosts.length === 0 ? (
            <p className="no-posts-text">{t.noPosts}</p>
          ) : (
            filteredPosts.map((post) => (
              <ForumPost
                key={post._id}
                post={post}
                onDelete={deletePost}
                onEditToggle={toggleEditPost}
                onUpdate={updatePost}
                onLike={likePost}
                language={language}
              />
            ))
          )}
        </div>
      )}
    </div>
  );
}

export default Forum;
