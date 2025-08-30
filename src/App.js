import React, { useState, useEffect } from 'react';
import { Moon, Sun, Plus, Check, Circle, Menu, X, Inbox, Calendar, CheckSquare, Trash2, Star, MoreHorizontal } from 'lucide-react';
import './App.css';

function App() {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeSection, setActiveSection] = useState('inbox');
  const [editingTodo, setEditingTodo] = useState(null);
  const [openDropdown, setOpenDropdown] = useState(null);
  const [contextMenu, setContextMenu] = useState({ show: false, x: 0, y: 0, todoId: null });

  // Mock project and todo data
  const [projects] = useState([
    { id: 'work', name: 'Work Projects', color: '#1E3A8A', count: 8 },
    { id: 'personal', name: 'Personal', color: '#059669', count: 3 },
    { id: 'learning', name: 'Learning', color: '#DC2626', count: 5 },
  ]);

  const [todos] = useState([
    { id: 1, text: 'Design the perfect todo app', completed: true, project: 'work', priority: 'high' },
    { id: 2, text: 'Create beautiful animations', completed: false, project: 'work', priority: 'medium' },
    { id: 3, text: 'Add dark mode support', completed: true, project: 'work', priority: 'high' },
    { id: 4, text: 'Polish the user experience', completed: false, project: 'work', priority: 'low' },
    { id: 5, text: 'Ship to production', completed: false, project: 'work', priority: 'high' },
    { id: 6, text: 'Read design principles book', completed: false, project: 'learning', priority: 'medium' },
    { id: 7, text: 'Exercise for 30 minutes', completed: true, project: 'personal', priority: 'medium' },
    { id: 8, text: 'Plan weekend trip', completed: false, project: 'personal', priority: 'low' },
  ]);

  // Navigation items
  const navigationItems = [
    { id: 'inbox', name: 'Inbox', icon: Inbox, count: todos.filter(t => !t.completed).length },
    { id: 'today', name: 'Today', icon: Calendar, count: 4 },
    { id: 'starred', name: 'Starred', icon: Star, count: 2 },
  ];

  const systemItems = [
    { id: 'completed', name: 'Completed', icon: CheckSquare, count: todos.filter(t => t.completed).length },
    { id: 'deleted', name: 'Deleted', icon: Trash2, count: 0 },
  ];

  // Load theme preference from localStorage
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
      setIsDarkMode(savedTheme === 'dark');
    } else {
      // Default to system preference
      setIsDarkMode(window.matchMedia('(prefers-color-scheme: dark)').matches);
    }
  }, []);

  // Handle sidebar state based on screen size
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth <= 768) {
        setSidebarOpen(false);
      } else {
        setSidebarOpen(true);
      }
    };

    // Set initial state
    handleResize();
    
    // Add event listener
    window.addEventListener('resize', handleResize);
    
    // Cleanup
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Apply theme to document
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', isDarkMode ? 'dark' : 'light');
    localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
  }, [isDarkMode]);

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
  };

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  // Filter todos based on active section
  const getFilteredTodos = () => {
    switch (activeSection) {
      case 'completed':
        return todos.filter(todo => todo.completed);
      case 'inbox':
        return todos.filter(todo => !todo.completed);
      case 'starred':
        return todos.filter(todo => todo.priority === 'high');
      case 'today':
        return todos.filter(todo => !todo.completed).slice(0, 4);
      default:
        if (projects.find(p => p.id === activeSection)) {
          return todos.filter(todo => todo.project === activeSection);
        }
        return todos.filter(todo => !todo.completed);
    }
  };

  const filteredTodos = getFilteredTodos();
  const completedCount = filteredTodos.filter(todo => todo.completed).length;
  const totalCount = filteredTodos.length;

  // Get current section name
  const getCurrentSectionName = () => {
    const navItem = navigationItems.find(item => item.id === activeSection);
    if (navItem) return navItem.name;
    
    const systemItem = systemItems.find(item => item.id === activeSection);
    if (systemItem) return systemItem.name;
    
    const project = projects.find(p => p.id === activeSection);
    if (project) return project.name;
    
    return 'Inbox';
  };

  // Handle inline editing
  const startEditing = (todoId) => {
    setEditingTodo(todoId);
    setOpenDropdown(null);
  };

  const stopEditing = () => {
    setEditingTodo(null);
  };

  // Handle dropdown menu
  const toggleDropdown = (todoId) => {
    setOpenDropdown(openDropdown === todoId ? null : todoId);
  };

  // Handle todo deletion (mock function)
  const deleteTodo = (todoId) => {
    console.log('Deleting todo:', todoId);
    setOpenDropdown(null);
    setContextMenu({ show: false, x: 0, y: 0, todoId: null });
    // In a real app, this would remove the todo from state
  };

  // Handle context menu
  const handleContextMenu = (e, todoId) => {
    e.preventDefault();
    setContextMenu({
      show: true,
      x: e.clientX,
      y: e.clientY,
      todoId: todoId
    });
    setOpenDropdown(null);
  };

  const closeContextMenu = () => {
    setContextMenu({ show: false, x: 0, y: 0, todoId: null });
  };

  // Close dropdown and context menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (openDropdown && !event.target.closest('.todo-dropdown')) {
        setOpenDropdown(null);
      }
      if (contextMenu.show && !event.target.closest('.context-menu')) {
        closeContextMenu();
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [openDropdown, contextMenu.show]);

  return (
    <div className="app">
      {/* Sidebar */}
      <aside className={`sidebar ${sidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
        <div className="sidebar-header">
          <div className="sidebar-logo">
            <div className="sidebar-logo-icon">✓</div>
            <span className="sidebar-logo-text">Check</span>
          </div>
          <button 
            className="sidebar-toggle"
            onClick={toggleSidebar}
            aria-label="Toggle sidebar"
          >
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        <nav className="sidebar-nav">
          {/* Main navigation */}
          <div className="sidebar-section">
            {navigationItems.map((item) => {
              const IconComponent = item.icon;
              return (
                <button
                  key={item.id}
                  className={`sidebar-item ${activeSection === item.id ? 'active' : ''}`}
                  onClick={() => setActiveSection(item.id)}
                >
                  <IconComponent size={18} className="sidebar-icon" />
                  <span className="sidebar-text">{item.name}</span>
                  <span className="sidebar-count">{item.count}</span>
                </button>
              );
            })}
          </div>

          {/* Projects section */}
          <div className="sidebar-section">
            <div className="sidebar-section-header">
              <h3>Projects</h3>
              <button className="sidebar-add-button">
                <Plus size={16} />
              </button>
            </div>
            {projects.map((project) => (
              <button
                key={project.id}
                className={`sidebar-item ${activeSection === project.id ? 'active' : ''}`}
                onClick={() => setActiveSection(project.id)}
              >
                <div className="project-color" style={{ backgroundColor: project.color }}></div>
                <span className="sidebar-text">{project.name}</span>
                <span className="sidebar-count">{project.count}</span>
              </button>
            ))}
          </div>

          {/* System items */}
          <div className="sidebar-section">
            {systemItems.map((item) => {
              const IconComponent = item.icon;
              return (
                <button
                  key={item.id}
                  className={`sidebar-item ${activeSection === item.id ? 'active' : ''}`}
                  onClick={() => setActiveSection(item.id)}
                >
                  <IconComponent size={18} className="sidebar-icon" />
                  <span className="sidebar-text">{item.name}</span>
                  <span className="sidebar-count">{item.count}</span>
                </button>
              );
            })}
          </div>
        </nav>
      </aside>

      {/* Main content */}
      <main className="main-content">
        <div className="container">
          {/* Header */}
          <header className="header">
            <div className="header-content">
              <div className="header-left">
                <button 
                  className="mobile-sidebar-toggle"
                  onClick={toggleSidebar}
                  aria-label="Toggle sidebar"
                >
                  <Menu size={20} />
                </button>
                <div className="title-section">
                  <h1>{getCurrentSectionName()}</h1>
                  <p className="subtitle">Organized productivity at your fingertips</p>
                </div>
              </div>
              <button 
                className="theme-toggle"
                onClick={toggleTheme}
                aria-label="Toggle theme"
              >
                {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
              </button>
            </div>
            
            {/* Progress indicator */}
            {totalCount > 0 && (
              <div className="progress-section">
                <div className="progress-info">
                  <span className="progress-text">
                    {completedCount} of {totalCount} completed
                  </span>
                  <div className="progress-percentage">
                    {Math.round((completedCount / totalCount) * 100)}%
                  </div>
                </div>
                <div className="progress-bar">
                  <div 
                    className="progress-fill"
                    style={{ width: `${(completedCount / totalCount) * 100}%` }}
                  />
                </div>
              </div>
            )}
          </header>

          {/* Add new todo */}
          <div className="add-todo">
            <div className="add-todo-container">
              <Plus size={20} className="add-icon" />
              <input 
                type="text" 
                placeholder="Add a new task..."
                className="add-input"
              />
              <button className="add-button">Add</button>
            </div>
          </div>

          {/* Todo list */}
          <div className="todo-list">
            {filteredTodos.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">📝</div>
                <h3>No tasks yet</h3>
                <p>Add a task to get started on your productivity journey!</p>
              </div>
            ) : (
              filteredTodos.map((todo) => (
                <div 
                  key={todo.id} 
                  className={`todo-item ${todo.completed ? 'completed' : ''} priority-${todo.priority}`}
                  onContextMenu={(e) => handleContextMenu(e, todo.id)}
                >
                  <button className="todo-checkbox">
                    {todo.completed ? (
                      <Check size={16} className="check-icon" />
                    ) : (
                      <Circle size={16} className="circle-icon" />
                    )}
                  </button>
                  
                  <div className="todo-content">
                    {editingTodo === todo.id ? (
                      <input
                        type="text"
                        defaultValue={todo.text}
                        className="todo-edit-input"
                        autoFocus
                        onBlur={stopEditing}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === 'Escape') {
                            stopEditing();
                          }
                        }}
                      />
                    ) : (
                      <span 
                        className="todo-text"
                        onClick={() => startEditing(todo.id)}
                      >
                        {todo.text}
                      </span>
                    )}
                    
                    <div className="todo-meta">
                      {todo.project && (
                        <span className="todo-project">
                          {projects.find(p => p.id === todo.project)?.name}
                        </span>
                      )}
                      <span className={`todo-priority priority-${todo.priority}`}>
                        {todo.priority}
                      </span>
                    </div>
                  </div>
                  
                  <div className="todo-actions">
                    <div className="todo-dropdown">
                      <button 
                        className="todo-action-button dropdown-button"
                        onClick={() => toggleDropdown(todo.id)}
                      >
                        <MoreHorizontal size={16} />
                      </button>
                      
                      {openDropdown === todo.id && (
                        <div className="dropdown-menu">
                          <button 
                            className="dropdown-item"
                            onClick={() => startEditing(todo.id)}
                          >
                            <span>Edit</span>
                          </button>
                          <button 
                            className="dropdown-item"
                            onClick={() => console.log('Duplicate todo:', todo.id)}
                          >
                            <span>Duplicate</span>
                          </button>
                          <button 
                            className="dropdown-item"
                            onClick={() => console.log('Move to project:', todo.id)}
                          >
                            <span>Move to project</span>
                          </button>
                        </div>
                      )}
                    </div>
                    
                    <button 
                      className="todo-action-button delete-button"
                      onClick={() => deleteTodo(todo.id)}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Stats footer */}
          {filteredTodos.length > 0 && (
            <footer className="stats">
              <div className="stats-item">
                <span className="stats-number">{totalCount}</span>
                <span className="stats-label">Total tasks</span>
              </div>
              <div className="stats-item">
                <span className="stats-number">{completedCount}</span>
                <span className="stats-label">Completed</span>
              </div>
              <div className="stats-item">
                <span className="stats-number">{totalCount - completedCount}</span>
                <span className="stats-label">Remaining</span>
              </div>
            </footer>
          )}
        </div>
      </main>

      {/* Context Menu */}
      {contextMenu.show && (
        <div 
          className="context-menu"
          style={{
            position: 'fixed',
            left: `${contextMenu.x}px`,
            top: `${contextMenu.y}px`,
            zIndex: 1000
          }}
        >
          <button 
            className="context-menu-item"
            onClick={() => {
              startEditing(contextMenu.todoId);
              closeContextMenu();
            }}
          >
            <span>Edit</span>
          </button>
          <button 
            className="context-menu-item"
            onClick={() => {
              console.log('Duplicate todo:', contextMenu.todoId);
              closeContextMenu();
            }}
          >
            <span>Duplicate</span>
          </button>
          <button 
            className="context-menu-item"
            onClick={() => {
              console.log('Move to project:', contextMenu.todoId);
              closeContextMenu();
            }}
          >
            <span>Move to project</span>
          </button>
          <div className="context-menu-separator"></div>
          <button 
            className="context-menu-item danger"
            onClick={() => {
              deleteTodo(contextMenu.todoId);
              closeContextMenu();
            }}
          >
            <span>Delete</span>
          </button>
        </div>
      )}

      {/* Sidebar overlay for mobile */}
      {sidebarOpen && <div className="sidebar-overlay" onClick={toggleSidebar}></div>}
    </div>
  );
}

export default App;
