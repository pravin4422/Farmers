import React, { useState, useEffect } from 'react';
import { Trash2, Check, Plus, Calendar, CheckCircle, Clock, Filter, Bell, BellOff } from 'lucide-react';
import '../../css/Remainders/remainders.css';
import { requestNotificationPermission, subscribeUserToPush, unsubscribeUserFromPush, checkNotificationSubscription } from '../../utils/notificationUtils';

function Reminder() {
  const [tasks, setTasks] = useState([]);
  const [newTask, setNewTask] = useState('');
  const [filter, setFilter] = useState('today');
  const [dateFilter, setDateFilter] = useState('all');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [language, setLanguage] = useState('english');
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [taskDate, setTaskDate] = useState('');
  const [taskTime, setTaskTime] = useState('');

  const translations = {
    english: {
      title: 'Task Manager',
      addTask: 'Add Task',
      placeholder: 'Enter your task...',
      today: 'Today',
      completed: 'Completed',
      past: 'Past Tasks',
      all: 'All',
      filterBy: 'Filter by Status:',
      dateFilter: 'Filter by Date:',
      noTasks: 'No tasks found',
      todayTasks: "Today's Tasks",
      completedTasks: 'Completed Tasks',
      pastTasks: 'Past Tasks',
      markComplete: 'Mark as complete',
      delete: 'Delete task',
      year: 'Year',
      month: 'Month',
      allTime: 'All Time',
      thisYear: 'This Year',
      thisMonth: 'This Month',
      selectYear: 'Select Year',
      selectMonth: 'Select Month',
      enableNotifications: 'Enable Notifications',
      disableNotifications: 'Disable Notifications',
      selectDate: 'Select Date',
      selectTime: 'Select Time'
    },
    tamil: {
      title: 'பணி மேலாளர்',
      addTask: 'பணியைச் சேர்க்கவும்',
      placeholder: 'உங்கள் பணியை உள்ளிடவும்...',
      today: 'இன்று',
      completed: 'முடிந்தது',
      past: 'கடந்த பணிகள்',
      all: 'அனைத்தும்',
      filterBy: 'நிலைப்படி வடிகட்டு:',
      dateFilter: 'தேதிப்படி வடிகட்டு:',
      noTasks: 'பணிகள் இல்லை',
      todayTasks: 'இன்றைய பணிகள்',
      completedTasks: 'முடிந்த பணிகள்',
      pastTasks: 'கடந்த பணிகள்',
      markComplete: 'முடிந்ததாகக் குறிக்கவும்',
      delete: 'பணியை நீக்கவும்',
      year: 'வருடம்',
      month: 'மாதம்',
      allTime: 'எல்லா நேரமும்',
      thisYear: 'இந்த ஆண்டு',
      thisMonth: 'இந்த மாதம்',
      selectYear: 'வருடத்தைத் தேர்ந்தெடுக்கவும்',
      selectMonth: 'மாதத்தைத் தேர்ந்தெடுக்கவும்',
      enableNotifications: 'அறிவிப்புகளை இயக்கு',
      disableNotifications: 'அறிவிப்புகளை முடக்கு',
      selectDate: 'தேதியைத் தேர்ந்தெடுக்கவும்',
      selectTime: 'நேரத்தைத் தேர்ந்தெடுக்கவும்'
    }
  };

  const months = {
    english: [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ],
    tamil: [
      'ஜனவரி', 'பிப்ரவரி', 'மார்ச்', 'ஏப்ரல்', 'மே', 'ஜூன்',
      'ஜூலை', 'ஆகஸ்ட்', 'செப்டம்பர்', 'அக்டோபர்', 'நவம்பர்', 'டிசம்பர்'
    ]
  };

  const t = translations[language];

  useEffect(() => {
    fetchTasks();
    checkNotificationStatus();
    registerServiceWorker();
  }, []);

  const registerServiceWorker = async () => {
    if ('serviceWorker' in navigator) {
      try {
        await navigator.serviceWorker.register('/service-worker.js');
      } catch (error) {
        console.error('Service worker registration failed:', error);
      }
    }
  };

  const checkNotificationStatus = async () => {
    const isSubscribed = await checkNotificationSubscription();
    setNotificationsEnabled(isSubscribed);
  };

  const toggleNotifications = async () => {
    if (notificationsEnabled) {
      await unsubscribeUserFromPush();
      setNotificationsEnabled(false);
    } else {
      const granted = await requestNotificationPermission();
      if (granted) {
        const subscribed = await subscribeUserToPush();
        setNotificationsEnabled(subscribed);
      }
    }
  };

  const fetchTasks = async () => {
    try {
      let token = localStorage.getItem('token');
      if (!token) {
        console.log('No token found, redirecting to login');
        window.location.href = '/login';
        return;
      }
      
      // Extract userId from token if not in localStorage
      let userId = localStorage.getItem('userId');
      if (!userId && token) {
        try {
          const payload = JSON.parse(atob(token.split('.')[1]));
          userId = payload.userId || payload.id || payload._id || payload.sub;
          if (userId) localStorage.setItem('userId', String(userId));
        } catch (e) {
          console.error('Error decoding token:', e);
        }
      }
      
      const response = await fetch('http://localhost:5000/api/tasks', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setTasks(data);
      } else if (response.status === 401) {
        alert('Session expired. Please login again.');
        localStorage.clear();
        window.location.href = '/login';
      } else {
        throw new Error('Failed to fetch tasks');
      }
    } catch (err) {
      console.error('Error fetching tasks:', err);
      setTasks([]);
    }
  };

  const addTask = async () => {
    if (!newTask.trim()) {
      alert('Please enter a task');
      return;
    }
    
    try {
      let token = localStorage.getItem('token');
      if (!token) {
        alert('Please login to add tasks');
        window.location.href = '/login';
        return;
      }
      
      // Extract userId from token if not in localStorage
      let userId = localStorage.getItem('userId');
      if (!userId && token) {
        try {
          const payload = JSON.parse(atob(token.split('.')[1]));
          userId = payload.userId || payload.id || payload._id || payload.sub;
          if (userId) localStorage.setItem('userId', String(userId));
        } catch (e) {
          console.error('Error decoding token:', e);
        }
      }
      
      let taskDateTime;
      
      if (taskDate && taskTime) {
        taskDateTime = new Date(`${taskDate}T${taskTime}`);
      } else {
        taskDateTime = new Date();
      }
      
      const taskData = {
        text: newTask,
        date: taskDateTime.toISOString(),
        completed: false,
        userId
      };
      
      const response = await fetch('http://localhost:5000/api/tasks', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(taskData)
      });
      
      if (response.ok) {
        const data = await response.json();
        setTasks([...tasks, data]);
        setNewTask('');
        setTaskDate('');
        setTaskTime('');
        alert('Task added successfully!');
      } else if (response.status === 401) {
        alert('Session expired. Please login again.');
        localStorage.clear();
        window.location.href = '/login';
      } else {
        const error = await response.json();
        alert('Failed to add task: ' + (error.message || 'Unknown error'));
      }
    } catch (err) {
      console.error('Error adding task:', err);
      alert('Error adding task: ' + err.message);
    }
  };

  const toggleComplete = async (taskId) => {
    try {
      let token = localStorage.getItem('token');
      if (!token) {
        alert('Please login to update tasks');
        window.location.href = '/login';
        return;
      }
      
      const task = tasks.find(t => t._id === taskId);
      const response = await fetch(`http://localhost:5000/api/tasks/${taskId}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ completed: !task.completed })
      });
      
      if (response.ok) {
        const data = await response.json();
        setTasks(tasks.map(t => t._id === taskId ? data : t));
      } else if (response.status === 401) {
        alert('Session expired. Please login again.');
        localStorage.clear();
        window.location.href = '/login';
      } else {
        const error = await response.json();
        alert('Failed to update task: ' + (error.message || 'Unknown error'));
      }
    } catch (err) {
      console.error('Error updating task:', err);
      alert('Error updating task: ' + err.message);
    }
  };

  const deleteTask = async (taskId) => {
    if (!window.confirm('Are you sure you want to delete this task?')) return;
    
    try {
      let token = localStorage.getItem('token');
      if (!token) {
        alert('Please login to delete tasks');
        window.location.href = '/login';
        return;
      }
      
      const response = await fetch(`http://localhost:5000/api/tasks/${taskId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (response.ok) {
        setTasks(tasks.filter(t => t._id !== taskId));
        alert('Task deleted successfully!');
      } else if (response.status === 401) {
        alert('Session expired. Please login again.');
        localStorage.clear();
        window.location.href = '/login';
      } else {
        const error = await response.json();
        alert('Failed to delete task: ' + (error.message || 'Unknown error'));
      }
    } catch (err) {
      console.error('Error deleting task:', err);
      alert('Error deleting task: ' + err.message);
    }
  };

  const isToday = (date) => {
    const today = new Date();
    const taskDate = new Date(date);
    return taskDate.toDateString() === today.toDateString();
  };

  const isPast = (date) => {
    const today = new Date();
    const taskDate = new Date(date);
    today.setHours(0, 0, 0, 0);
    taskDate.setHours(0, 0, 0, 0);
    return taskDate < today;
  };

  const filterByDate = (task) => {
    const taskDate = new Date(task.date);
    const taskYear = taskDate.getFullYear();
    const taskMonth = taskDate.getMonth();

    if (dateFilter === 'all') return true;
    if (dateFilter === 'year') return taskYear === selectedYear;
    if (dateFilter === 'month') return taskYear === selectedYear && taskMonth === selectedMonth;
    return true;
  };

  const getFilteredTasks = () => {
    let filtered = tasks;

    if (filter === 'today') {
      filtered = filtered.filter(t => isToday(t.date) && !t.completed);
    } else if (filter === 'completed') {
      filtered = filtered.filter(t => t.completed);
    } else if (filter === 'past') {
      filtered = filtered.filter(t => isPast(t.date) && !t.completed);
    }

    filtered = filtered.filter(filterByDate);

    return filtered;
  };

  const todayTasks = tasks.filter(t => isToday(t.date) && !t.completed && filterByDate(t));
  const completedTasks = tasks.filter(t => t.completed && filterByDate(t));
  const pastTasks = tasks.filter(t => isPast(t.date) && !t.completed && filterByDate(t));

  const getAvailableYears = () => {
    const years = [...new Set(tasks.map(t => new Date(t.date).getFullYear()))];
    return years.sort((a, b) => b - a);
  };

  return (
    <div className="task-manager-container">
      <div className="task-manager-wrapper">
        <div className="header-card">
          <div className="header-top">
            <h1 className="main-title">{t.title}</h1>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={toggleNotifications}
                className={`lang-btn ${notificationsEnabled ? 'active' : ''}`}
                title={notificationsEnabled ? t.disableNotifications : t.enableNotifications}
              >
                {notificationsEnabled ? <Bell size={20} /> : <BellOff size={20} />}
              </button>
              <button
                onClick={() => setLanguage(language === 'english' ? 'tamil' : 'english')}
                className="lang-btn active"
              >
                {language === 'english' ? 'தமிழ்' : 'English'}
              </button>
            </div>
          </div>

          <div className="add-task-section">
            <input
              type="text"
              value={newTask}
              onChange={(e) => setNewTask(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && addTask()}
              placeholder={t.placeholder}
              className="task-input"
            />
            <input
              type="date"
              value={taskDate}
              onChange={(e) => setTaskDate(e.target.value)}
              className="task-input"
              style={{ width: '150px' }}
            />
            <input
              type="time"
              value={taskTime}
              onChange={(e) => setTaskTime(e.target.value)}
              className="task-input"
              style={{ width: '120px' }}
            />
            <button onClick={addTask} className="add-btn">
              <Plus size={20} />
              {t.addTask}
            </button>
          </div>
        </div>

        <div className="filter-card">
          <div className="filter-section">
            <label className="filter-label">{t.filterBy}</label>
            <div className="filter-buttons">
              {['today', 'completed', 'past', 'all'].map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`filter-btn ${filter === f ? 'active' : ''}`}
                >
                  {t[f]}
                </button>
              ))}
            </div>
          </div>

          <div className="filter-section">
            <label className="filter-label">
              <Filter size={16} />
              {t.dateFilter}
            </label>
            <div className="date-filter-group">
              <div className="date-filter-buttons">
                <button
                  onClick={() => setDateFilter('all')}
                  className={`filter-btn ${dateFilter === 'all' ? 'active' : ''}`}
                >
                  {t.allTime}
                </button>
                <button
                  onClick={() => {
                    setDateFilter('year');
                    setSelectedYear(new Date().getFullYear());
                  }}
                  className={`filter-btn ${dateFilter === 'year' ? 'active' : ''}`}
                >
                  {t.thisYear}
                </button>
                <button
                  onClick={() => {
                    setDateFilter('month');
                    setSelectedYear(new Date().getFullYear());
                    setSelectedMonth(new Date().getMonth());
                  }}
                  className={`filter-btn ${dateFilter === 'month' ? 'active' : ''}`}
                >
                  {t.thisMonth}
                </button>
              </div>

              {(dateFilter === 'year' || dateFilter === 'month') && (
                <div className="date-selectors">
                  <select
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(Number(e.target.value))}
                    className="date-select"
                  >
                    {getAvailableYears().map(year => (
                      <option key={year} value={year}>{year}</option>
                    ))}
                  </select>

                  {dateFilter === 'month' && (
                    <select
                      value={selectedMonth}
                      onChange={(e) => setSelectedMonth(Number(e.target.value))}
                      className="date-select"
                    >
                      {months[language].map((month, index) => (
                        <option key={index} value={index}>{month}</option>
                      ))}
                    </select>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="summary-grid">
          <div className="summary-card today-card">
            <div className="summary-content">
              <div className="summary-text">
                <p className="summary-label">{t.todayTasks}</p>
                <p className="summary-count">{todayTasks.length}</p>
              </div>
              <Calendar size={40} className="summary-icon" />
            </div>
          </div>
          
          <div className="summary-card completed-card">
            <div className="summary-content">
              <div className="summary-text">
                <p className="summary-label">{t.completedTasks}</p>
                <p className="summary-count">{completedTasks.length}</p>
              </div>
              <CheckCircle size={40} className="summary-icon" />
            </div>
          </div>
          
          <div className="summary-card past-card">
            <div className="summary-content">
              <div className="summary-text">
                <p className="summary-label">{t.pastTasks}</p>
                <p className="summary-count">{pastTasks.length}</p>
              </div>
              <Clock size={40} className="summary-icon" />
            </div>
          </div>
        </div>

        <div className="tasks-card">
          <h2 className="tasks-title">
            {filter === 'today' && <Calendar className="title-icon today-icon" />}
            {filter === 'completed' && <CheckCircle className="title-icon completed-icon" />}
            {filter === 'past' && <Clock className="title-icon past-icon" />}
            {t[filter + 'Tasks'] || t.all}
          </h2>
          
          {getFilteredTasks().length === 0 ? (
            <div className="no-tasks">
              <p className="no-tasks-text">{t.noTasks}</p>
            </div>
          ) : (
            <div className="tasks-list">
              {getFilteredTasks().map((task) => (
                <TaskItem
                  key={task._id}
                  task={task}
                  onToggle={toggleComplete}
                  onDelete={deleteTask}
                  t={t}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function TaskItem({ task, onToggle, onDelete, t }) {
  return (
    <div className={`task-item ${task.completed ? 'completed' : ''}`}>
      <button
        onClick={() => onToggle(task._id)}
        className={`check-btn ${task.completed ? 'checked' : ''}`}
        title={t.markComplete}
      >
        {task.completed && <Check size={18} className="check-icon" />}
      </button>
      
      <div className="task-content">
        <p className={`task-text ${task.completed ? 'strikethrough' : ''}`}>
          {task.text}
        </p>
        <p className="task-date">
          {new Date(task.date).toLocaleString()}
        </p>
      </div>
      
      <button
        onClick={() => onDelete(task._id)}
        className="delete-btn"
        title={t.delete}
      >
        <Trash2 size={18} />
      </button>
    </div>
  );
}

export default Reminder;