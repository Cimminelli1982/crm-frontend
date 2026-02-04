import React, { useState } from 'react';
import styled from 'styled-components';
import { FaTasks, FaChevronDown, FaChevronRight, FaCheck, FaExternalLinkAlt, FaSync, FaPlus } from 'react-icons/fa';
import { formatDistanceToNow, isPast, parseISO } from 'date-fns';

// Priority colors
const PRIORITY_COLORS = {
  4: '#DC2626', // Urgent
  3: '#F97316', // High
  2: '#F59E0B', // Medium
  1: '#6B7280', // Normal
};

/**
 * MobileTasksList - Tasks list optimized for mobile
 * Shows tasks grouped by project with checkable items
 */
const MobileTasksList = ({
  tasks = [],
  onTaskComplete,
  onTaskSelect,
  onRefresh,
  onCreateTask,
  loading,
  syncing,
  theme = 'dark',
}) => {
  // Group by project
  const [expandedProjects, setExpandedProjects] = useState({});

  // Group tasks by project
  const tasksByProject = tasks.reduce((acc, task) => {
    const project = task.todoist_project_name || 'No Project';
    if (!acc[project]) {
      acc[project] = [];
    }
    acc[project].push(task);
    return acc;
  }, {});

  // Sort projects: Work, Personal, then others
  const sortedProjects = Object.keys(tasksByProject).sort((a, b) => {
    const order = ['Work', 'Personal', 'Team'];
    const aIdx = order.indexOf(a);
    const bIdx = order.indexOf(b);
    if (aIdx !== -1 && bIdx !== -1) return aIdx - bIdx;
    if (aIdx !== -1) return -1;
    if (bIdx !== -1) return 1;
    return a.localeCompare(b);
  });

  const toggleProject = (project) => {
    setExpandedProjects(prev => ({
      ...prev,
      [project]: prev[project] === false ? true : (prev[project] === undefined ? false : !prev[project]),
    }));
  };

  const isProjectExpanded = (project) => {
    return expandedProjects[project] !== false;
  };

  const formatDueDate = (task) => {
    if (!task.due_date && !task.due_string) return null;
    
    if (task.due_string) {
      return task.due_string;
    }
    
    try {
      const date = parseISO(task.due_date);
      return formatDistanceToNow(date, { addSuffix: true });
    } catch {
      return task.due_date;
    }
  };

  const isOverdue = (task) => {
    if (!task.due_date) return false;
    try {
      return isPast(parseISO(task.due_date));
    } catch {
      return false;
    }
  };

  const getProjectIcon = (project) => {
    switch (project) {
      case 'Work': return '💼';
      case 'Personal': return '🏠';
      case 'Team': return '👥';
      case 'Birthdays 🎂': return '🎂';
      default: return '📋';
    }
  };

  const getProjectColor = (project) => {
    switch (project) {
      case 'Work': return '#3B82F6';
      case 'Personal': return '#EC4899';
      case 'Team': return '#8B5CF6';
      default: return '#6B7280';
    }
  };

  const handleComplete = (e, task) => {
    e.stopPropagation();
    onTaskComplete?.(task.task_id);
  };

  if (loading) {
    return (
      <LoadingState theme={theme}>
        <FaTasks size={32} style={{ opacity: 0.3 }} />
        <span>Loading tasks...</span>
      </LoadingState>
    );
  }

  return (
    <Container>
      {/* Header Actions */}
      <HeaderActions theme={theme}>
        <ActionButton theme={theme} onClick={onRefresh} disabled={syncing}>
          <FaSync size={14} style={{ animation: syncing ? 'spin 1s linear infinite' : 'none' }} />
          <span>{syncing ? 'Syncing...' : 'Sync'}</span>
        </ActionButton>
        <ActionButton theme={theme} $primary onClick={onCreateTask}>
          <FaPlus size={14} />
          <span>New Task</span>
        </ActionButton>
      </HeaderActions>

      {tasks.length === 0 ? (
        <EmptyState theme={theme}>
          <FaTasks size={48} style={{ opacity: 0.3 }} />
          <EmptyTitle theme={theme}>No tasks</EmptyTitle>
          <EmptyText theme={theme}>All caught up!</EmptyText>
        </EmptyState>
      ) : (
        <TasksList>
          {sortedProjects.map(project => {
            const projectTasks = tasksByProject[project];
            const isExpanded = isProjectExpanded(project);
            const overdueCount = projectTasks.filter(isOverdue).length;

            return (
              <ProjectSection key={project}>
                <ProjectHeader
                  theme={theme}
                  onClick={() => toggleProject(project)}
                >
                  <ProjectLeft>
                    <ProjectIcon>{getProjectIcon(project)}</ProjectIcon>
                    <ProjectName theme={theme}>{project}</ProjectName>
                    <TaskCount theme={theme}>
                      {projectTasks.length}
                      {overdueCount > 0 && (
                        <OverdueIndicator> • {overdueCount} overdue</OverdueIndicator>
                      )}
                    </TaskCount>
                  </ProjectLeft>
                  <ChevronIcon theme={theme}>
                    {isExpanded ? <FaChevronDown size={12} /> : <FaChevronRight size={12} />}
                  </ChevronIcon>
                </ProjectHeader>

                {isExpanded && (
                  <TasksContainer>
                    {projectTasks.map(task => (
                      <TaskItem
                        key={task.task_id}
                        theme={theme}
                        onClick={() => onTaskSelect?.(task)}
                      >
                        <CheckCircle
                          theme={theme}
                          $priority={task.priority}
                          onClick={(e) => handleComplete(e, task)}
                        />
                        <TaskContent>
                          <TaskTitle theme={theme}>{task.content}</TaskTitle>
                          <TaskMeta>
                            {task.todoist_section_name && (
                              <SectionBadge theme={theme}>
                                {task.todoist_section_name}
                              </SectionBadge>
                            )}
                            {formatDueDate(task) && (
                              <DueBadge theme={theme} $overdue={isOverdue(task)}>
                                {formatDueDate(task)}
                              </DueBadge>
                            )}
                          </TaskMeta>
                          {task.description && (
                            <TaskDescription theme={theme}>
                              {task.description.length > 60 
                                ? task.description.substring(0, 60) + '...' 
                                : task.description}
                            </TaskDescription>
                          )}
                        </TaskContent>
                        {task.todoist_url && (
                          <ExternalLink
                            theme={theme}
                            onClick={(e) => {
                              e.stopPropagation();
                              window.open(task.todoist_url, '_blank');
                            }}
                          >
                            <FaExternalLinkAlt size={12} />
                          </ExternalLink>
                        )}
                      </TaskItem>
                    ))}
                  </TasksContainer>
                )}
              </ProjectSection>
            );
          })}
        </TasksList>
      )}

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </Container>
  );
};

// Styled Components
const Container = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
`;

const HeaderActions = styled.div`
  display: flex;
  gap: 8px;
  padding: 12px 16px;
  background: ${props => props.theme === 'light' ? '#FFFFFF' : '#1F2937'};
  border-bottom: 1px solid ${props => props.theme === 'light' ? '#E5E7EB' : '#374151'};
`;

const ActionButton = styled.button`
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 10px 16px;
  border-radius: 8px;
  border: none;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  min-height: 44px;
  background: ${props => props.$primary
    ? '#10B981'
    : (props.theme === 'light' ? '#F3F4F6' : '#374151')};
  color: ${props => props.$primary
    ? '#FFFFFF'
    : (props.theme === 'light' ? '#374151' : '#D1D5DB')};

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  &:active:not(:disabled) {
    opacity: 0.9;
  }
`;

const TasksList = styled.div`
  flex: 1;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
`;

const ProjectSection = styled.div`
  margin-bottom: 4px;
`;

const ProjectHeader = styled.button`
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 16px;
  background: ${props => props.theme === 'light' ? '#F3F4F6' : '#1F2937'};
  border: none;
  cursor: pointer;
`;

const ProjectLeft = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
`;

const ProjectIcon = styled.span`
  font-size: 16px;
`;

const ProjectName = styled.span`
  font-size: 15px;
  font-weight: 600;
  color: ${props => props.theme === 'light' ? '#111827' : '#F9FAFB'};
`;

const TaskCount = styled.span`
  font-size: 13px;
  color: ${props => props.theme === 'light' ? '#6B7280' : '#9CA3AF'};
`;

const OverdueIndicator = styled.span`
  color: #EF4444;
`;

const ChevronIcon = styled.span`
  color: ${props => props.theme === 'light' ? '#6B7280' : '#9CA3AF'};
`;

const TasksContainer = styled.div``;

const TaskItem = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 14px 16px;
  background: ${props => props.theme === 'light' ? '#FFFFFF' : '#111827'};
  border-bottom: 1px solid ${props => props.theme === 'light' ? '#E5E7EB' : '#1F2937'};
  cursor: pointer;
  min-height: 56px;

  &:active {
    background: ${props => props.theme === 'light' ? '#F9FAFB' : '#1F2937'};
  }
`;

const CheckCircle = styled.button`
  width: 22px;
  height: 22px;
  border-radius: 50%;
  border: 2px solid ${props => PRIORITY_COLORS[props.$priority] || PRIORITY_COLORS[1]};
  background: transparent;
  cursor: pointer;
  flex-shrink: 0;
  margin-top: 2px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${props => PRIORITY_COLORS[props.$priority] || PRIORITY_COLORS[1]};

  &:active {
    background: ${props => props.theme === 'light' ? '#F3F4F6' : '#374151'};
  }
`;

const TaskContent = styled.div`
  flex: 1;
  min-width: 0;
`;

const TaskTitle = styled.div`
  font-size: 15px;
  font-weight: 500;
  color: ${props => props.theme === 'light' ? '#111827' : '#F9FAFB'};
  margin-bottom: 4px;
`;

const TaskMeta = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
`;

const SectionBadge = styled.span`
  font-size: 11px;
  padding: 2px 8px;
  border-radius: 10px;
  background: ${props => props.theme === 'light' ? '#E5E7EB' : '#374151'};
  color: ${props => props.theme === 'light' ? '#6B7280' : '#9CA3AF'};
`;

const DueBadge = styled.span`
  font-size: 11px;
  padding: 2px 8px;
  border-radius: 10px;
  background: ${props => props.$overdue
    ? '#FEE2E2'
    : (props.theme === 'light' ? '#DBEAFE' : '#1E3A5F')};
  color: ${props => props.$overdue
    ? '#DC2626'
    : (props.theme === 'light' ? '#2563EB' : '#60A5FA')};
`;

const TaskDescription = styled.div`
  font-size: 13px;
  color: ${props => props.theme === 'light' ? '#6B7280' : '#9CA3AF'};
  margin-top: 4px;
  line-height: 1.4;
`;

const ExternalLink = styled.button`
  width: 32px;
  height: 32px;
  border-radius: 6px;
  border: none;
  background: transparent;
  color: ${props => props.theme === 'light' ? '#9CA3AF' : '#6B7280'};
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;

  &:active {
    background: ${props => props.theme === 'light' ? '#F3F4F6' : '#374151'};
  }
`;

const LoadingState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 48px 24px;
  gap: 12px;
  color: ${props => props.theme === 'light' ? '#6B7280' : '#9CA3AF'};
  height: 100%;
`;

const EmptyState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 48px 24px;
  color: ${props => props.theme === 'light' ? '#6B7280' : '#9CA3AF'};
  height: 100%;
`;

const EmptyTitle = styled.h3`
  font-size: 18px;
  font-weight: 600;
  color: ${props => props.theme === 'light' ? '#111827' : '#F9FAFB'};
  margin: 16px 0 8px;
`;

const EmptyText = styled.p`
  font-size: 14px;
  color: ${props => props.theme === 'light' ? '#6B7280' : '#9CA3AF'};
  margin: 0;
`;

export default MobileTasksList;
