import React, { useState, useEffect } from 'react';
import { Trash2, Check, Plus, Calendar, CheckCircle, Clock, Filter } from 'lucide-react';
import '../../css/Remainders/remainders.css';

function Reminder() {
  const [tasks, setTasks] = useState([]);
  const [newTask, setNewTask] = useState('');
  const [filter, setFilter] = useState('today');
  const [dateFilter, setDateFilter] = useState('all');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [language, setLanguage] = useState('english');
  const [userId, setUserId] = useState(null);

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
      selectMonth: 'Select Month'
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
      selectMonth: 'மாதத்தைத் தேர்ந்தெடுக்கவும்'
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
    let storedUserId = sessionStorage.getItem('userId');
    if (!storedUserId) {
      storedUserId = 'user_' + Date.now();
      sessionStorage.setItem('userId', storedUserId);
    }
    setUserId(storedUserId);
    fetchTasks(storedUserId);
  }, []);

  const fetchTasks = async (uid) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/tasks/${uid}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setTasks(data);
      }
    } catch (err) {
      console.error('Error fetching tasks:', err);
      setTasks([]);
    }
  };

  const addTask = async () => {
    if (!newTask.trim()) return;
    
    try {
      const token = localStorage.getItem('token');
      const taskData = {
        userId,
        text: newTask,
        date: new Date().toISOString(),
        completed: false
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
      }
    } catch (err) {
      console.error('Error adding task:', err);
    }
  };

  const toggleComplete = async (taskId) => {
    try {
      const token = localStorage.getItem('token');
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
      }
    } catch (err) {
      console.error('Error updating task:', err);
    }
  };

  const deleteTask = async (taskId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/tasks/${taskId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (response.ok) {
        setTasks(tasks.filter(t => t._id !== taskId));
      }
    } catch (err) {
      console.error('Error deleting task:', err);
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

    // Apply status filter
    if (filter === 'today') {
      filtered = filtered.filter(t => isToday(t.date) && !t.completed);
    } else if (filter === 'completed') {
      filtered = filtered.filter(t => t.completed);
    } else if (filter === 'past') {
      filtered = filtered.filter(t => isPast(t.date) && !t.completed);
    }

    // Apply date filter
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
        {/* Header */}
        <div className="header-card">
          <div className="header-top">
            <h1 className="main-title">{t.title}</h1>
            <button
              onClick={() => setLanguage(language === 'english' ? 'tamil' : 'english')}
              className="lang-btn active"
            >
              {language === 'english' ? 'தமிழ்' : 'English'}
            </button>
          </div>

          {/* Add Task Input */}
          <div className="add-task-section">
            <input
              type="text"
              value={newTask}
              onChange={(e) => setNewTask(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && addTask()}
              placeholder={t.placeholder}
              className="task-input"
            />
            <button onClick={addTask} className="add-btn">
              <Plus size={20} />
              {t.addTask}
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="filter-card">
          {/* Status Filter */}
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

          {/* Date Filter */}
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

              {/* Year and Month Selectors */}
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

        {/* Task Summary Cards */}
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

        {/* Tasks List */}
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