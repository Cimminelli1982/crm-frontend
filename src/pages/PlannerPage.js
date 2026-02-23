import React, { useState, useMemo } from 'react';
import styled from 'styled-components';
import {
  FaChevronLeft, FaChevronRight, FaChevronDown, FaCheck, FaTimes, FaPlus, FaTrash,
  FaCalendarAlt, FaClock, FaMapMarkerAlt, FaTasks, FaSearch,
} from 'react-icons/fa';
import usePlannerData from '../hooks/command-center/usePlannerData';

const SCOPE_TABS = [
  { id: 'daily', label: 'Day' },
  { id: 'weekly', label: 'Week' },
  { id: 'monthly', label: 'Month' },
  { id: 'yearly', label: 'Year' },
];

const PlannerPage = ({ theme }) => {
  const planner = usePlannerData();
  const {
    scope, setScope, scopeDate, getScopeDate, getScopeDateLabel,
    navigateScopeDate, goToToday, normalizedScopeDate,
    prioritiesForScope, prioritiesLoading, addPriority, togglePriority, deletePriority,
    tasksByProject, todoistLoading, todoistProjects, allTodoistTasks,
    completeTask, deleteTask, setTaskDueToday, handleSaveTask, resetTaskForm,
    taskModalOpen, setTaskModalOpen,
    newTaskContent, setNewTaskContent, newTaskDescription, setNewTaskDescription,
    newTaskDueString, setNewTaskDueString, newTaskProjectId, setNewTaskProjectId,
    newTaskSectionId, setNewTaskSectionId, newTaskPriority, setNewTaskPriority,
    creatingTask,
    calendarEvents, calendarLoading,
    weeklyPlans, weeklyPlansLoading, currentWeekNumber, updateWeeklyPlanLabel,
  } = planner;

  const isDark = theme === 'dark';
  const textPrimary = isDark ? '#F9FAFB' : '#111827';
  const textSecondary = isDark ? '#D1D5DB' : '#374151';
  const textMuted = isDark ? '#6B7280' : '#9CA3AF';
  const borderColor = isDark ? '#374151' : '#E5E7EB';
  const bgCard = isDark ? '#111827' : '#fff';

  const [newPriorityTitle, setNewPriorityTitle] = useState('');
  const [editingPlanId, setEditingPlanId] = useState(null);
  const [editingLabel, setEditingLabel] = useState('');

  // Browse Tasks state
  const [browserOpen, setBrowserOpen] = useState(false);
  const [browserProject, setBrowserProject] = useState('');
  const [browserSection, setBrowserSection] = useState('');
  const [browserTimeRange, setBrowserTimeRange] = useState('all');
  const [browserSearch, setBrowserSearch] = useState('');

  const handleAddPriority = async () => {
    if (!newPriorityTitle.trim()) return;
    const sd = getScopeDate(scope, scopeDate);
    await addPriority({
      title: newPriorityTitle.trim(),
      scope,
      scope_date: sd,
      sort_order: prioritiesForScope.length,
    });
    setNewPriorityTitle('');
  };

  const handleSaveLabel = async (id) => {
    await updateWeeklyPlanLabel(id, editingLabel);
    setEditingPlanId(null);
    setEditingLabel('');
  };

  const formatEventTime = (event) => {
    if (event.start?.dateTime) {
      const start = new Date(event.start.dateTime);
      const end = event.end?.dateTime ? new Date(event.end.dateTime) : null;
      const fmt = (d) => d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
      return end ? `${fmt(start)} - ${fmt(end)}` : fmt(start);
    }
    const summary = event.summary || '';
    if (summary.startsWith('✓')) return 'Task Completed';
    return 'All day';
  };

  const formatTaskDue = (task) => {
    if (!task.due || !task.due.date) return '';
    const d = new Date(task.due.date + (task.due.date.includes('T') ? '' : 'T12:00:00'));
    return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
  };

  // Filtered tasks for the browser (excluding already-visible scope tasks)
  const filteredTaskIds = useMemo(() => {
    const todoist = planner.todoistTasks || [];
    return new Set(todoist.map(t => t.id));
  }, [planner.todoistTasks]);

  const birthdayProjectIds = useMemo(() => new Set(
    todoistProjects.filter(p => p.name.toLowerCase().includes('birthday')).map(p => p.id)
  ), [todoistProjects]);

  const browserTasks = useMemo(() => {
    let tasks = (allTodoistTasks || []).filter(t =>
      !filteredTaskIds.has(t.id) && !birthdayProjectIds.has(t.project_id)
    );

    if (browserProject) {
      tasks = tasks.filter(t => t.project_id === browserProject);
    }
    if (browserSection) {
      tasks = tasks.filter(t => t.section_id === browserSection);
    }

    if (browserTimeRange !== 'all') {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayStr = today.toISOString().split('T')[0];

      tasks = tasks.filter(task => {
        if (browserTimeRange === 'no_due') return !task.due;
        if (!task.due || !task.due.date) return false;
        const dueStr = task.due.date.split('T')[0];

        if (browserTimeRange === 'overdue') {
          return dueStr < todayStr;
        }
        if (browserTimeRange === 'this_week') {
          const day = today.getDay();
          const diff = day === 0 ? -6 : 1 - day;
          const monday = new Date(today);
          monday.setDate(today.getDate() + diff);
          const sunday = new Date(monday);
          sunday.setDate(monday.getDate() + 6);
          return dueStr >= monday.toISOString().split('T')[0] && dueStr <= sunday.toISOString().split('T')[0];
        }
        if (browserTimeRange === 'this_month') {
          const monthStart = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-01`;
          const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);
          const monthEnd = lastDay.toISOString().split('T')[0];
          return dueStr >= monthStart && dueStr <= monthEnd;
        }
        if (browserTimeRange === 'this_quarter') {
          const qMonth = Math.floor(today.getMonth() / 3) * 3;
          const qStart = `${today.getFullYear()}-${String(qMonth + 1).padStart(2, '0')}-01`;
          const qEndDate = new Date(today.getFullYear(), qMonth + 3, 0);
          const qEnd = qEndDate.toISOString().split('T')[0];
          return dueStr >= qStart && dueStr <= qEnd;
        }
        return true;
      });
    }

    if (browserSearch.trim()) {
      const search = browserSearch.toLowerCase();
      tasks = tasks.filter(t => t.content.toLowerCase().includes(search));
    }

    return tasks;
  }, [allTodoistTasks, filteredTaskIds, birthdayProjectIds, browserProject, browserSection, browserTimeRange, browserSearch]);

  const browserTasksByProject = useMemo(() => {
    const groups = {};
    browserTasks.forEach(task => {
      const projectId = task.project_id;
      if (!groups[projectId]) {
        const project = todoistProjects.find(p => p.id === projectId);
        groups[projectId] = {
          projectName: project ? project.name : 'Unknown',
          sections: {},
          tasks: [],
        };
      }
      const sectionId = task.section_id || '';
      if (!groups[projectId].sections[sectionId]) {
        const section = sectionId
          ? (todoistProjects.find(p => p.id === projectId)?.sections || []).find(s => s.id === sectionId)
          : null;
        groups[projectId].sections[sectionId] = {
          sectionName: section ? section.name : null,
          tasks: [],
        };
      }
      groups[projectId].sections[sectionId].tasks.push(task);
      groups[projectId].tasks.push(task);
    });
    return groups;
  }, [browserTasks, todoistProjects]);

  const browserSections = useMemo(() => {
    if (!browserProject) return [];
    const project = todoistProjects.find(p => p.id === browserProject);
    return project?.sections || [];
  }, [browserProject, todoistProjects]);

  // Filter agenda events: exclude all-day events that duplicate visible tasks
  const taskContentSet = useMemo(() => {
    const set = new Set();
    const todoist = planner.todoistTasks || [];
    todoist.forEach(t => set.add(t.content.toLowerCase().trim()));
    return set;
  }, [planner.todoistTasks]);

  const filteredCalendarEvents = useMemo(() => {
    return calendarEvents.filter(event => {
      // Keep timed events (not all-day)
      if (event.start?.dateTime) return true;
      // For all-day events, hide if summary matches a visible task
      const summary = (event.summary || '').toLowerCase().trim();
      if (taskContentSet.has(summary)) return false;
      return true;
    });
  }, [calendarEvents, taskContentSet]);

  return (
    <PageContainer theme={theme}>
      {/* ===== TOP MENU BAR ===== */}
      <Header theme={theme}>
        <HeaderLeft>
          {/* Scope tabs */}
          <ScopeTabsContainer theme={theme}>
            {SCOPE_TABS.map(tab => (
              <ScopeTab
                key={tab.id}
                $active={scope === tab.id}
                theme={theme}
                onClick={() => setScope(tab.id)}
              >
                {tab.label}
              </ScopeTab>
            ))}
          </ScopeTabsContainer>

          {/* Date navigation */}
          <DateNav>
            <NavButton theme={theme} onClick={() => navigateScopeDate(-1)}>
              <FaChevronLeft size={10} />
            </NavButton>
            <DateLabel style={{ color: textPrimary }}>
              {getScopeDateLabel(scope, scopeDate)}
            </DateLabel>
            <NavButton theme={theme} onClick={() => navigateScopeDate(1)}>
              <FaChevronRight size={10} />
            </NavButton>
            <TodayButton onClick={goToToday}>Today</TodayButton>
          </DateNav>
        </HeaderLeft>
      </Header>

      {/* ===== MAIN CONTENT ===== */}
      <MainContent>
        {/* ===== LEFT COLUMN: Tasks + Agenda ===== */}
        <LeftColumn theme={theme}>
          <div style={{ padding: '20px', overflow: 'auto', flex: 1 }}>
            {/* TASKS SECTION */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
              <SectionTitle style={{ color: textSecondary, marginBottom: 0 }}>
                <FaTasks size={12} style={{ color: '#3B82F6' }} />
                Tasks
                {todoistLoading && <LoadingDot />}
              </SectionTitle>
              <button
                onClick={() => { resetTaskForm(); setTaskModalOpen(true); }}
                style={{
                  display: 'flex', alignItems: 'center', gap: '4px',
                  padding: '4px 10px', borderRadius: '6px', border: 'none',
                  backgroundColor: '#10B981', color: '#fff', cursor: 'pointer',
                  fontSize: '11px', fontWeight: 500,
                }}
              >
                <FaPlus size={9} /> New
              </button>
            </div>

            {Object.keys(tasksByProject).length === 0 && !todoistLoading && (
              <EmptyMessage style={{ color: textMuted }}>
                No tasks due in this {scope === 'daily' ? 'day' : scope === 'weekly' ? 'week' : scope === 'monthly' ? 'month' : 'year'}
              </EmptyMessage>
            )}

            {Object.entries(tasksByProject).map(([projectId, group]) => (
              <ProjectGroup key={projectId}>
                <ProjectHeader style={{ color: textSecondary, borderColor }}>
                  {group.projectName}
                  <span style={{ fontSize: '11px', color: textMuted, marginLeft: '8px' }}>
                    {group.tasks.length}
                  </span>
                </ProjectHeader>
                {group.tasks.map(task => (
                  <TaskItem key={task.id} theme={theme}>
                    <TaskCheckbox
                      onClick={() => completeTask(task.id)}
                      title="Complete task"
                    >
                      <FaCheck size={8} />
                    </TaskCheckbox>
                    <TaskContent style={{ color: textPrimary }}>
                      {task.content}
                    </TaskContent>
                    {task.due && (
                      <TaskDue style={{ color: textMuted }}>
                        {formatTaskDue(task)}
                      </TaskDue>
                    )}
                    <TaskDeleteBtn onClick={() => deleteTask(task.id)} title="Delete task">
                      <FaTimes size={9} />
                    </TaskDeleteBtn>
                  </TaskItem>
                ))}
              </ProjectGroup>
            ))}

            {/* BROWSE ALL TASKS */}
            <BrowserToggle
              theme={theme}
              onClick={() => setBrowserOpen(prev => !prev)}
              style={{ marginTop: '16px' }}
            >
              <FaChevronDown
                size={10}
                style={{
                  transform: browserOpen ? 'rotate(0deg)' : 'rotate(-90deg)',
                  transition: 'transform 0.2s',
                }}
              />
              <span>Browse all tasks</span>
              <span style={{ fontSize: '11px', color: textMuted, marginLeft: 'auto' }}>
                {browserTasks.length}
              </span>
            </BrowserToggle>

            {browserOpen && (
              <BrowserContainer theme={theme}>
                <BrowserFilters>
                  <BrowserSelect
                    theme={theme}
                    value={browserProject}
                    onChange={e => { setBrowserProject(e.target.value); setBrowserSection(''); }}
                  >
                    <option value="">All projects</option>
                    {todoistProjects.filter(p => !p.name.toLowerCase().includes('birthday')).map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </BrowserSelect>
                  <BrowserSelect
                    theme={theme}
                    value={browserSection}
                    onChange={e => setBrowserSection(e.target.value)}
                    disabled={!browserProject}
                  >
                    <option value="">All sections</option>
                    {browserSections.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </BrowserSelect>
                  <BrowserSelect
                    theme={theme}
                    value={browserTimeRange}
                    onChange={e => setBrowserTimeRange(e.target.value)}
                  >
                    <option value="all">All</option>
                    <option value="overdue">Overdue</option>
                    <option value="this_week">This week</option>
                    <option value="this_month">This month</option>
                    <option value="this_quarter">This quarter</option>
                    <option value="no_due">No due date</option>
                  </BrowserSelect>
                </BrowserFilters>
                <BrowserSearchWrap theme={theme}>
                  <FaSearch size={10} style={{ color: textMuted, flexShrink: 0 }} />
                  <BrowserSearchInput
                    theme={theme}
                    placeholder="Search tasks..."
                    value={browserSearch}
                    onChange={e => setBrowserSearch(e.target.value)}
                  />
                </BrowserSearchWrap>

                {Object.keys(browserTasksByProject).length === 0 && (
                  <EmptyMessage style={{ color: textMuted }}>No tasks found</EmptyMessage>
                )}

                {Object.entries(browserTasksByProject).map(([projectId, group]) => (
                  <ProjectGroup key={projectId}>
                    <ProjectHeader style={{ color: textSecondary, borderColor }}>
                      {group.projectName}
                      <span style={{ fontSize: '11px', color: textMuted, marginLeft: '8px' }}>
                        {group.tasks.length}
                      </span>
                    </ProjectHeader>
                    {Object.entries(group.sections).map(([sectionId, section]) => (
                      <div key={sectionId || '_nosection'}>
                        {section.sectionName && (
                          <BrowserSectionHeader style={{ color: textMuted }}>
                            {section.sectionName}
                          </BrowserSectionHeader>
                        )}
                        {section.tasks.map(task => (
                          <TaskItem key={task.id} theme={theme}>
                            <TaskCheckbox
                              onClick={() => completeTask(task.id)}
                              title="Complete task"
                            >
                              <FaCheck size={8} />
                            </TaskCheckbox>
                            <TaskContent style={{ color: textPrimary }}>
                              {task.content}
                            </TaskContent>
                            {task.due && (
                              <TaskDue style={{ color: textMuted }}>
                                {formatTaskDue(task)}
                              </TaskDue>
                            )}
                            <TaskTodayBtn onClick={() => setTaskDueToday(task.id)} title="Set due today">
                              📌
                            </TaskTodayBtn>
                            <TaskDeleteBtn onClick={() => deleteTask(task.id)} title="Delete task">
                              <FaTimes size={9} />
                            </TaskDeleteBtn>
                          </TaskItem>
                        ))}
                      </div>
                    ))}
                  </ProjectGroup>
                ))}
              </BrowserContainer>
            )}

            {/* AGENDA SECTION */}
            <SectionTitle style={{ color: textSecondary, marginTop: '24px' }}>
              <FaClock size={12} style={{ color: '#8B5CF6' }} />
              Agenda
              {(calendarLoading || weeklyPlansLoading) && <LoadingDot />}
            </SectionTitle>

            {/* Day view: calendar events */}
            {scope === 'daily' && (
              <>
                {filteredCalendarEvents.length === 0 && !calendarLoading && (
                  <EmptyMessage style={{ color: textMuted }}>No events today</EmptyMessage>
                )}
                {filteredCalendarEvents.map((event, idx) => {
                  const eventColor = event._color || '#8B5CF6';
                  return (
                  <EventItem key={event.id || idx} theme={theme} style={{ borderLeftColor: eventColor, background: isDark ? '#1F2937' : `${eventColor}12` }}>
                    <EventTime style={{ color: eventColor }}>
                      {formatEventTime(event)}
                    </EventTime>
                    <EventTitle style={{ color: textPrimary }}>
                      {event.summary || 'Untitled event'}
                    </EventTitle>
                    {event.location && (
                      <EventLocation style={{ color: textMuted }}>
                        <FaMapMarkerAlt size={9} /> {event.location}
                      </EventLocation>
                    )}
                  </EventItem>
                  );
                })}
              </>
            )}

            {/* Week/Month/Year view: weekly plans */}
            {scope !== 'daily' && (
              <>
                {weeklyPlans.length === 0 && !weeklyPlansLoading && (
                  <EmptyMessage style={{ color: textMuted }}>No upcoming weekly plans</EmptyMessage>
                )}
                {weeklyPlans.map(wp => {
                  const isCurrent = wp.week_number === currentWeekNumber;
                  return (
                    <WeekPlanItem key={wp.id} theme={theme} $isCurrent={isCurrent}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1 }}>
                        <WeekBadge $isCurrent={isCurrent}>
                          W{String(wp.week_number).padStart(2, '0')}
                        </WeekBadge>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: '12px', color: textMuted }}>
                            {wp.date_start && new Date(wp.date_start).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                            {wp.date_end && ` - ${new Date(wp.date_end).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}`}
                          </div>
                          {editingPlanId === wp.id ? (
                            <input
                              value={editingLabel}
                              onChange={(e) => setEditingLabel(e.target.value)}
                              onBlur={() => handleSaveLabel(wp.id)}
                              onKeyDown={(e) => e.key === 'Enter' && handleSaveLabel(wp.id)}
                              autoFocus
                              style={{
                                fontSize: '12px', border: 'none', outline: 'none',
                                backgroundColor: 'transparent', color: textPrimary,
                                padding: '2px 0', width: '100%',
                                borderBottom: `1px solid ${borderColor}`,
                              }}
                            />
                          ) : (
                            <div
                              onClick={() => { setEditingPlanId(wp.id); setEditingLabel(wp.label || ''); }}
                              style={{
                                fontSize: '12px', color: wp.label ? textSecondary : textMuted,
                                cursor: 'pointer', fontStyle: wp.label ? 'normal' : 'italic',
                              }}
                            >
                              {wp.label || 'Add location...'}
                            </div>
                          )}
                        </div>
                      </div>
                      {isCurrent && <FaCheck size={10} style={{ color: '#10B981' }} />}
                    </WeekPlanItem>
                  );
                })}
              </>
            )}
          </div>
        </LeftColumn>

        {/* ===== RIGHT COLUMN: Priorities ===== */}
        <RightColumn theme={theme}>
          <div style={{ padding: '20px' }}>
            <SectionTitle style={{ color: textSecondary }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#EC4899' }} />
              Priorities
              {prioritiesLoading && <LoadingDot />}
            </SectionTitle>

            {/* Priority list */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '12px' }}>
              {prioritiesForScope.length === 0 && !prioritiesLoading && (
                <EmptyMessage style={{ color: textMuted }}>
                  No priorities for this {scope === 'daily' ? 'day' : scope === 'weekly' ? 'week' : scope === 'monthly' ? 'month' : 'year'}
                </EmptyMessage>
              )}
              {prioritiesForScope.map((p, idx) => (
                <PriorityItem key={p.id} theme={theme}>
                  <PriorityCheckbox
                    $checked={p.is_completed}
                    onClick={() => togglePriority(p.id, p.is_completed)}
                  >
                    {p.is_completed && <FaCheck size={10} style={{ color: '#fff' }} />}
                  </PriorityCheckbox>
                  <span style={{ fontSize: '11px', color: textMuted, fontWeight: 600, minWidth: '18px' }}>
                    {idx + 1}.
                  </span>
                  <span style={{
                    flex: 1, fontSize: '13px',
                    color: p.is_completed ? textMuted : textPrimary,
                    textDecoration: p.is_completed ? 'line-through' : 'none',
                  }}>
                    {p.title}
                  </span>
                  <button
                    onClick={() => deletePriority(p.id)}
                    style={{ padding: '2px', border: 'none', backgroundColor: 'transparent', color: '#EF4444', cursor: 'pointer' }}
                  >
                    <FaTimes size={10} />
                  </button>
                </PriorityItem>
              ))}
            </div>

            {/* Add priority input */}
            <div style={{ display: 'flex', gap: '6px' }}>
              <input
                type="text"
                value={newPriorityTitle}
                onChange={(e) => setNewPriorityTitle(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddPriority()}
                placeholder={`Add ${scope === 'daily' ? 'daily' : scope === 'weekly' ? 'weekly' : scope === 'monthly' ? 'monthly' : 'yearly'} priority...`}
                style={{
                  flex: 1, padding: '8px 12px', borderRadius: '8px',
                  border: `1px solid ${borderColor}`,
                  backgroundColor: bgCard,
                  color: textPrimary, fontSize: '13px', outline: 'none',
                }}
              />
              <button onClick={handleAddPriority} style={{
                padding: '8px 14px', borderRadius: '8px', border: 'none',
                backgroundColor: '#EC4899', color: '#fff', cursor: 'pointer', fontSize: '13px',
                display: 'flex', alignItems: 'center',
              }}>
                <FaPlus size={10} />
              </button>
            </div>

            {/* PLANNER: Weekly Plans */}
            <div style={{ marginTop: '28px' }}>
              <SectionTitle style={{ color: textSecondary }}>
                <FaCalendarAlt size={12} style={{ color: '#3B82F6' }} />
                Planner
                {weeklyPlansLoading && <LoadingDot />}
              </SectionTitle>

              {weeklyPlans.length === 0 && !weeklyPlansLoading && (
                <EmptyMessage style={{ color: textMuted }}>No weekly plans</EmptyMessage>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {weeklyPlans.map(wp => {
                  const isCurrent = wp.week_number === currentWeekNumber;
                  return (
                    <WeekPlanRow key={wp.id} theme={theme} $isCurrent={isCurrent}>
                      <WeekBadge $isCurrent={isCurrent}>
                        W{String(wp.week_number).padStart(2, '0')}
                      </WeekBadge>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: '11px', color: textMuted }}>
                          {wp.date_start && new Date(wp.date_start).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                          {wp.date_end && ` – ${new Date(wp.date_end).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}`}
                        </div>
                        {editingPlanId === wp.id ? (
                          <input
                            value={editingLabel}
                            onChange={(e) => setEditingLabel(e.target.value)}
                            onBlur={() => handleSaveLabel(wp.id)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSaveLabel(wp.id)}
                            autoFocus
                            style={{
                              fontSize: '12px', border: 'none', outline: 'none',
                              backgroundColor: 'transparent', color: textPrimary,
                              padding: '2px 0', width: '100%',
                              borderBottom: `1px solid ${borderColor}`,
                            }}
                          />
                        ) : (
                          <div
                            onClick={() => { setEditingPlanId(wp.id); setEditingLabel(wp.label || ''); }}
                            style={{
                              fontSize: '12px',
                              color: wp.label ? textPrimary : textMuted,
                              cursor: 'pointer',
                              fontStyle: wp.label ? 'normal' : 'italic',
                              marginTop: '1px',
                            }}
                          >
                            {wp.label || 'Add label...'}
                          </div>
                        )}
                      </div>
                      {isCurrent && (
                        <span style={{ fontSize: '9px', padding: '2px 6px', borderRadius: '4px', backgroundColor: '#3B82F6', color: '#fff', fontWeight: 600 }}>
                          NOW
                        </span>
                      )}
                    </WeekPlanRow>
                  );
                })}
              </div>
            </div>
          </div>
        </RightColumn>
      </MainContent>

      {/* ===== TASK MODAL ===== */}
      {taskModalOpen && (
        <ModalOverlay onClick={() => { setTaskModalOpen(false); resetTaskForm(); }}>
          <ModalBox theme={theme} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '16px', fontWeight: 600, color: textPrimary }}>
                <FaTasks style={{ color: '#3B82F6' }} /> Add Task
              </div>
              <button onClick={() => { setTaskModalOpen(false); resetTaskForm(); }} style={{ border: 'none', background: 'transparent', color: textMuted, cursor: 'pointer', padding: '4px' }}>
                <FaTimes size={16} />
              </button>
            </div>

            {/* Task Content */}
            <ModalField>
              <ModalLabel style={{ color: textSecondary }}>Task *</ModalLabel>
              <ModalInput theme={theme} value={newTaskContent} onChange={e => setNewTaskContent(e.target.value)} placeholder="What needs to be done?" autoFocus />
            </ModalField>

            {/* Description */}
            <ModalField>
              <ModalLabel style={{ color: textSecondary }}>Description</ModalLabel>
              <ModalTextarea theme={theme} value={newTaskDescription} onChange={e => setNewTaskDescription(e.target.value)} placeholder="Add more details..." rows={2} />
            </ModalField>

            {/* Project + Section */}
            <div style={{ display: 'flex', gap: '12px' }}>
              <ModalField style={{ flex: 1 }}>
                <ModalLabel style={{ color: textSecondary }}>Project</ModalLabel>
                <ModalSelect theme={theme} value={newTaskProjectId} onChange={e => { setNewTaskProjectId(e.target.value); setNewTaskSectionId(''); }}>
                  {todoistProjects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </ModalSelect>
              </ModalField>
              <ModalField style={{ flex: 1 }}>
                <ModalLabel style={{ color: textSecondary }}>Section</ModalLabel>
                <ModalSelect theme={theme} value={newTaskSectionId} onChange={e => setNewTaskSectionId(e.target.value)}>
                  <option value="">None</option>
                  {todoistProjects.find(p => p.id === newTaskProjectId)?.sections?.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </ModalSelect>
              </ModalField>
            </div>

            {/* Due + Priority */}
            <div style={{ display: 'flex', gap: '12px' }}>
              <ModalField style={{ flex: 1 }}>
                <ModalLabel style={{ color: textSecondary }}>Due Date</ModalLabel>
                <ModalInput theme={theme} value={newTaskDueString} onChange={e => setNewTaskDueString(e.target.value)} placeholder="tomorrow, next week..." />
              </ModalField>
              <ModalField style={{ flex: 1 }}>
                <ModalLabel style={{ color: textSecondary }}>Priority</ModalLabel>
                <ModalSelect theme={theme} value={newTaskPriority} onChange={e => setNewTaskPriority(Number(e.target.value))}>
                  <option value={1}>Normal</option>
                  <option value={2}>Medium</option>
                  <option value={3}>High</option>
                  <option value={4}>Urgent</option>
                </ModalSelect>
              </ModalField>
            </div>

            <button
              disabled={creatingTask || !newTaskContent.trim()}
              onClick={handleSaveTask}
              style={{
                width: '100%', padding: '10px', borderRadius: '8px', border: 'none',
                backgroundColor: creatingTask || !newTaskContent.trim() ? (isDark ? '#374151' : '#D1D5DB') : '#3B82F6',
                color: '#fff', fontSize: '14px', fontWeight: 500, cursor: creatingTask ? 'wait' : 'pointer',
                marginTop: '8px',
              }}
            >
              {creatingTask ? 'Creating...' : 'Create Task'}
            </button>
          </ModalBox>
        </ModalOverlay>
      )}
    </PageContainer>
  );
};

// ==================== STYLED COMPONENTS ====================

const PageContainer = styled.div`
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: ${props => props.theme === 'light' ? '#F9FAFB' : '#111827'};
`;

const Header = styled.div`
  background: ${props => props.theme === 'light' ? '#FFFFFF' : '#1F2937'};
  border-bottom: 1px solid ${props => props.theme === 'light' ? '#E5E7EB' : '#374151'};
  padding: 12px 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-shrink: 0;
`;

const HeaderLeft = styled.div`
  display: flex;
  align-items: center;
  gap: 24px;
  flex-wrap: wrap;
`;

const ScopeTabsContainer = styled.div`
  display: flex;
  gap: 2px;
  background: ${props => props.theme === 'light' ? '#F3F4F6' : '#111827'};
  border-radius: 8px;
  padding: 3px;
`;

const ScopeTab = styled.button`
  padding: 8px 16px;
  border-radius: 6px;
  border: none;
  font-size: 13px;
  font-weight: ${props => props.$active ? 600 : 400};
  cursor: pointer;
  transition: all 0.15s;
  background: ${props => props.$active ? '#3B82F6' : 'transparent'};
  color: ${props => props.$active ? '#fff' : (props.theme === 'light' ? '#6B7280' : '#9CA3AF')};

  &:hover {
    background: ${props => props.$active ? '#2563EB' : (props.theme === 'light' ? '#E5E7EB' : '#374151')};
  }
`;

const DateNav = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const NavButton = styled.button`
  padding: 6px 8px;
  border-radius: 6px;
  border: 1px solid ${props => props.theme === 'light' ? '#E5E7EB' : '#374151'};
  background: ${props => props.theme === 'light' ? '#fff' : '#111827'};
  color: ${props => props.theme === 'light' ? '#374151' : '#D1D5DB'};
  cursor: pointer;
  display: flex;
  align-items: center;

  &:hover {
    background: ${props => props.theme === 'light' ? '#F3F4F6' : '#1F2937'};
  }
`;

const DateLabel = styled.div`
  font-size: 14px;
  font-weight: 600;
  min-width: 180px;
  text-align: center;
`;

const TodayButton = styled.button`
  padding: 5px 12px;
  border-radius: 6px;
  border: none;
  background: #3B82F6;
  color: #fff;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;

  &:hover {
    background: #2563EB;
  }
`;

const MainContent = styled.div`
  display: flex;
  flex: 1;
  overflow: hidden;
`;

const LeftColumn = styled.div`
  flex: 1;
  border-right: 1px solid ${props => props.theme === 'light' ? '#E5E7EB' : '#374151'};
  background: ${props => props.theme === 'light' ? '#FFFFFF' : '#1F2937'};
  display: flex;
  flex-direction: column;
  overflow: hidden;
`;

const RightColumn = styled.div`
  width: 380px;
  min-width: 380px;
  background: ${props => props.theme === 'light' ? '#FDF2F8' : '#1F2937'};
  border-left: 3px solid #EC4899;
  overflow: auto;
`;

const SectionTitle = styled.h3`
  font-size: 13px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 12px;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const EmptyMessage = styled.div`
  padding: 12px;
  text-align: center;
  font-size: 12px;
  font-style: italic;
`;

const LoadingDot = styled.div`
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #3B82F6;
  animation: pulse 1.2s infinite;
  @keyframes pulse {
    0%, 100% { opacity: 0.3; }
    50% { opacity: 1; }
  }
`;

// Tasks
const ProjectGroup = styled.div`
  margin-bottom: 16px;
`;

const ProjectHeader = styled.div`
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  padding: 6px 0;
  border-bottom: 1px solid;
  margin-bottom: 6px;
  display: flex;
  align-items: center;
`;

const TaskItem = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 10px;
  border-radius: 6px;
  transition: background 0.1s;

  &:hover {
    background: ${props => props.theme === 'light' ? '#F9FAFB' : '#111827'};
  }
`;

const TaskCheckbox = styled.button`
  width: 18px;
  height: 18px;
  border-radius: 50%;
  border: 2px solid #D1D5DB;
  background: transparent;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  padding: 0;
  color: transparent;
  transition: all 0.15s;

  &:hover {
    border-color: #10B981;
    color: #10B981;
    background: #ECFDF5;
  }
`;

const TaskTodayBtn = styled.button`
  padding: 2px;
  border: none;
  background: transparent;
  cursor: pointer;
  flex-shrink: 0;
  font-size: 12px;
  opacity: 0;
  transition: opacity 0.1s;

  ${TaskItem}:hover & {
    opacity: 1;
  }

  &:hover {
    transform: scale(1.2);
  }
`;

const TaskDeleteBtn = styled.button`
  padding: 2px;
  border: none;
  background: transparent;
  color: transparent;
  cursor: pointer;
  flex-shrink: 0;
  transition: color 0.1s;

  ${TaskItem}:hover & {
    color: #EF4444;
  }
`;

const TaskContent = styled.span`
  flex: 1;
  font-size: 13px;
`;

const TaskDue = styled.span`
  font-size: 11px;
  flex-shrink: 0;
`;

// Browse Tasks
const BrowserToggle = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 4px;
  cursor: pointer;
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: ${props => props.theme === 'light' ? '#6B7280' : '#9CA3AF'};
  user-select: none;

  &:hover {
    color: ${props => props.theme === 'light' ? '#374151' : '#D1D5DB'};
  }
`;

const BrowserContainer = styled.div`
  margin-bottom: 16px;
  padding: 10px;
  border-radius: 8px;
  border: 1px solid ${props => props.theme === 'light' ? '#E5E7EB' : '#374151'};
  background: ${props => props.theme === 'light' ? '#F9FAFB' : '#111827'};
`;

const BrowserFilters = styled.div`
  display: flex;
  gap: 6px;
  margin-bottom: 8px;
`;

const BrowserSelect = styled.select`
  flex: 1;
  padding: 5px 8px;
  border-radius: 6px;
  border: 1px solid ${props => props.theme === 'light' ? '#E5E7EB' : '#374151'};
  background: ${props => props.theme === 'light' ? '#fff' : '#1F2937'};
  color: ${props => props.theme === 'light' ? '#111827' : '#F9FAFB'};
  font-size: 11px;
  outline: none;
  min-width: 0;

  &:focus {
    border-color: #3B82F6;
  }

  &:disabled {
    opacity: 0.5;
  }
`;

const BrowserSearchWrap = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 5px 8px;
  border-radius: 6px;
  border: 1px solid ${props => props.theme === 'light' ? '#E5E7EB' : '#374151'};
  background: ${props => props.theme === 'light' ? '#fff' : '#1F2937'};
  margin-bottom: 10px;
`;

const BrowserSearchInput = styled.input`
  flex: 1;
  border: none;
  outline: none;
  background: transparent;
  color: ${props => props.theme === 'light' ? '#111827' : '#F9FAFB'};
  font-size: 12px;

  &::placeholder {
    color: ${props => props.theme === 'light' ? '#9CA3AF' : '#6B7280'};
  }
`;

const BrowserSectionHeader = styled.div`
  font-size: 11px;
  font-weight: 600;
  padding: 6px 10px 2px;
  margin-top: 4px;
  opacity: 0.7;
`;

// Calendar events
const EventItem = styled.div`
  padding: 10px 12px;
  border-radius: 8px;
  margin-bottom: 6px;
  border-left: 3px solid;
`;

const EventTime = styled.div`
  font-size: 11px;
  font-weight: 600;
  font-family: monospace;
  margin-bottom: 2px;
`;

const EventTitle = styled.div`
  font-size: 13px;
  font-weight: 500;
`;

const EventLocation = styled.div`
  font-size: 11px;
  margin-top: 2px;
  display: flex;
  align-items: center;
  gap: 4px;
`;

// Weekly plans
const WeekPlanItem = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border-radius: 8px;
  margin-bottom: 4px;
  background: ${props => props.$isCurrent
    ? (props.theme === 'light' ? '#EFF6FF' : '#1E3A5F')
    : (props.theme === 'light' ? '#F9FAFB' : '#111827')
  };
  border: 1px solid ${props => props.$isCurrent ? '#3B82F6' : (props.theme === 'light' ? '#E5E7EB' : '#374151')};
`;

const WeekBadge = styled.span`
  font-size: 12px;
  font-weight: 700;
  color: ${props => props.$isCurrent ? '#3B82F6' : '#6B7280'};
  min-width: 30px;
`;

const WeekPlanRow = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 10px;
  border-radius: 6px;
  background: ${props => props.$isCurrent
    ? (props.theme === 'light' ? '#EFF6FF' : '#1E3A5F')
    : (props.theme === 'light' ? '#fff' : '#111827')
  };
  border: 1px solid ${props => props.$isCurrent ? '#3B82F6' : (props.theme === 'light' ? '#FBCFE8' : '#374151')};
`;

// Priorities
const PriorityItem = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  border-radius: 8px;
  background: ${props => props.theme === 'light' ? '#fff' : '#111827'};
  border: 1px solid ${props => props.theme === 'light' ? '#FBCFE8' : '#374151'};
`;

const PriorityCheckbox = styled.button`
  width: 20px;
  height: 20px;
  border-radius: 4px;
  border: 2px solid ${props => props.$checked ? '#EC4899' : '#D1D5DB'};
  background: ${props => props.$checked ? '#EC4899' : 'transparent'};
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  padding: 0;
`;

// Task Modal
const ModalOverlay = styled.div`
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
`;

const ModalBox = styled.div`
  background: ${props => props.theme === 'light' ? '#FFFFFF' : '#1F2937'};
  border-radius: 12px;
  padding: 24px;
  width: 100%;
  max-width: 480px;
  max-height: 90vh;
  overflow: auto;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
`;

const ModalField = styled.div`
  margin-bottom: 12px;
`;

const ModalLabel = styled.div`
  font-size: 12px;
  font-weight: 500;
  margin-bottom: 4px;
`;

const ModalInput = styled.input`
  width: 100%;
  padding: 8px 12px;
  border-radius: 8px;
  border: 1px solid ${props => props.theme === 'light' ? '#E5E7EB' : '#374151'};
  background: ${props => props.theme === 'light' ? '#F9FAFB' : '#111827'};
  color: ${props => props.theme === 'light' ? '#111827' : '#F9FAFB'};
  font-size: 13px;
  outline: none;
  box-sizing: border-box;

  &:focus {
    border-color: #3B82F6;
  }
`;

const ModalTextarea = styled.textarea`
  width: 100%;
  padding: 8px 12px;
  border-radius: 8px;
  border: 1px solid ${props => props.theme === 'light' ? '#E5E7EB' : '#374151'};
  background: ${props => props.theme === 'light' ? '#F9FAFB' : '#111827'};
  color: ${props => props.theme === 'light' ? '#111827' : '#F9FAFB'};
  font-size: 13px;
  outline: none;
  resize: vertical;
  font-family: inherit;
  box-sizing: border-box;

  &:focus {
    border-color: #3B82F6;
  }
`;

const ModalSelect = styled.select`
  width: 100%;
  padding: 8px 12px;
  border-radius: 8px;
  border: 1px solid ${props => props.theme === 'light' ? '#E5E7EB' : '#374151'};
  background: ${props => props.theme === 'light' ? '#F9FAFB' : '#111827'};
  color: ${props => props.theme === 'light' ? '#111827' : '#F9FAFB'};
  font-size: 13px;
  outline: none;
  box-sizing: border-box;

  &:focus {
    border-color: #3B82F6;
  }
`;

export default PlannerPage;
