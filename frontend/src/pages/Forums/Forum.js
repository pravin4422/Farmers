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
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [selectedDate, setSelectedDate] = useState(null);

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
      title: ' விவசாயி மன்றம்',
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
    const token = localStorage.getItem('token');
    const userEmail = localStorage.getItem('userEmail');
    const displayName = localStorage.getItem('displayName');
    let userId = localStorage.getItem('userId');
    
    if (!token) {
      alert('Please login to create a post');
      window.location.href = '/login';
      return;
    }
    
    if (!userId && token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        userId = payload.userId || payload.id || payload._id || payload.sub;
        if (userId) localStorage.setItem('userId', String(userId));
      } catch (e) {
        console.error('Error decoding token:', e);
      }
    }
    
    const postData = {
      ...newPost,
      likes: 0,
      createdAt: new Date().toISOString(),
      userId: String(userId),
      user: {
        _id: String(userId),
        username: displayName || userEmail || 'Anonymous',
        photoURL: '',
      },
    };

    try {
      let response;
      try {
        response = await fetch(`${BACKEND_URL}/api/posts`, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(postData),
        });
      } catch (fetchError) {
        throw new Error('Cannot connect to server. Please make sure the backend server is running on http://localhost:5000');
      }

      if (!response.ok) {
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const errorData = await response.json();
          
          // Handle token expiration
          if (errorData.message === 'Token expired' || response.status === 401) {
            localStorage.clear();
            alert('Your session has expired. Please login again.');
            window.location.href = '/login';
            return;
          }
          
          throw new Error(errorData.message || errorData.error || 'Failed to create post');
        } else {
          throw new Error(`Server error: ${response.status}. Please make sure the backend server is running.`);
        }
      }
      const savedPost = await response.json();
      
      const finalPost = {
        ...savedPost,
        userId: String(savedPost.userId || userId),
        user: savedPost.user || postData.user
      };
      
      setPosts((prev) => [finalPost, ...prev]);
    } catch (err) {
      setError(err.message);
      console.error('Error creating post:', err);
      alert(`Failed to create post: ${err.message}`);
    }
  };

  const updatePost = async (id, updatedData) => {
    try {
      console.log('Updating post:', id);
      console.log('Update data:', updatedData);
      
      const currentUserId = localStorage.getItem('userId');
      const response = await fetch(`${BACKEND_URL}/api/posts/${id}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'x-user-id': currentUserId
        },
        body: JSON.stringify({ ...updatedData, currentUserId }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Update failed:', errorData);
        throw new Error(errorData.message || 'Failed to update post');
      }
      const updated = await response.json();
      console.log('Updated post from server:', updated);

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
      const currentUserId = localStorage.getItem('userId');
      const response = await fetch(`${BACKEND_URL}/api/posts/${id}`, { 
        method: 'DELETE',
        headers: {
          'x-user-id': currentUserId
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete post');
      }

      setPosts((prev) => prev.filter((post) => post._id !== id));
    } catch (err) {
      setError(err.message);
      console.error('Error deleting post:', err);
    }
  };

  const deletePostsByDate = async (dateKey) => {
    if (!window.confirm(`Are you sure you want to delete all posts from ${dateKey}?`)) {
      return;
    }

    const postsToDelete = postsByDate[dateKey];
    const currentUserId = localStorage.getItem('userId');

    try {
      await Promise.all(
        postsToDelete.map(post =>
          fetch(`${BACKEND_URL}/api/posts/${post._id}`, {
            method: 'DELETE',
            headers: { 'x-user-id': currentUserId }
          })
        )
      );

      setPosts((prev) => prev.filter((post) => getDateString(post.createdAt) !== dateKey));
      
      if (selectedDate === dateKey) {
        const remainingDates = dateKeys.filter(d => d !== dateKey);
        setSelectedDate(remainingDates.length > 0 ? remainingDates[0] : null);
      }
    } catch (err) {
      setError('Failed to delete posts');
      console.error('Error deleting posts by date:', err);
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

  const scrollToPost = (postId) => {
    const element = document.getElementById(`post-${postId}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      element.style.backgroundColor = 'var(--tag-bg)';
      setTimeout(() => {
        element.style.backgroundColor = '';
      }, 2000);
    }
  };

  // Get date string from post
  const getDateString = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  // Group posts by exact date
  const groupPostsByDate = () => {
    const groups = {};
    posts.forEach(post => {
      const dateKey = getDateString(post.createdAt);
      if (!groups[dateKey]) groups[dateKey] = [];
      groups[dateKey].push(post);
    });
    return groups;
  };

  const postsByDate = groupPostsByDate();
  const dateKeys = Object.keys(postsByDate).sort((a, b) => new Date(b) - new Date(a));

  // Set initial selected date
  useEffect(() => {
    if (!selectedDate && dateKeys.length > 0) {
      setSelectedDate(dateKeys[0]);
    }
  }, [dateKeys, selectedDate]);

  // Filter posts by selected date
  const filteredPosts = selectedDate
    ? posts
        .filter((post) => getDateString(post.createdAt) === selectedDate)
        .filter((post) =>
          post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          post.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (post.tags || []).some((tag) => tag.toLowerCase().includes(searchTerm.toLowerCase()))
        )
        .filter(filterByDate)
    : [];

  return (
    <>
      {/* Language Toggle - Fixed Position */}
      <div className="language-toggle">
        <button 
          className="lang-btn active" 
          onClick={() => setLanguage(language === 'en' ? 'ta' : 'en')}
        >
          {language === 'en' ? 'EN' : 'தமிழ்'}
        </button>
      </div>

      <div className="forum-wrapper">
      {/* Toggle Button */}
      <button 
        className={`sidebar-toggle-btn ${sidebarOpen ? 'hidden' : ''}`}
        onClick={() => setSidebarOpen(!sidebarOpen)}
        aria-label="Toggle Sidebar"
      >
        {sidebarOpen ? '✕' : '☰'}
      </button>

      {/* Sidebar */}
      <aside className={`forum-sidebar ${!sidebarOpen ? 'closed' : ''}`}>
        <button 
          className="sidebar-close-btn" 
          onClick={() => setSidebarOpen(false)}
          aria-label="Close Sidebar"
        >
          ✕
        </button>
        {/* Date List */}
        {dateKeys.map(dateKey => (
          <div key={dateKey} className="sidebar-section">
            <div 
              className="section-title" 
              style={{ 
                cursor: 'pointer', 
                color: selectedDate === dateKey ? 'var(--primary)' : 'var(--text-muted)',
                fontSize: '13px'
              }}
            >
              <span onClick={() => setSelectedDate(dateKey)}>
                📅 {dateKey} ({postsByDate[dateKey].length})
              </span>
              <button 
                className="date-delete-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  deletePostsByDate(dateKey);
                }}
                title="Delete all posts from this date"
              >
                ❌
              </button>
            </div>
          </div>
        ))}

        {/* User Info */}
        <div className="sidebar-footer">
          <div className="user-info">
            <div className="user-avatar">👤</div>
            <div className="user-details">
              <div className="user-name">{localStorage.getItem('displayName') || 'User'}</div>
              <div className="user-plan">Farmer</div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className={`forum-container ${sidebarOpen ? 'sidebar-open' : ''}`}>
      <div className="forum-header">
        <h1 className="forum-title">{t.title}</h1>
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
    </div>
    </>
  );
}

export default Forum;
