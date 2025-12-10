import React from 'react';
import { FaTasks, FaChevronDown, FaEdit, FaExternalLinkAlt, FaCheck, FaTrash } from 'react-icons/fa';
import { ActionCard, ActionCardHeader, ActionCardContent, ActionCardButtons, SmallBtn } from '../../pages/CommandCenterPage.styles';

const TasksTab = ({
  theme,
  todoistTasks,
  todoistProjects,
  loadingTasks,
  expandedProjects,
  setExpandedProjects,
  expandedSections,
  setExpandedSections,
  getProjectColor,
  resetTaskForm,
  setTaskModalOpen,
  onCompleteTask,
  onDeleteTask,
  openEditTask,
}) => {
  return (
    <>
      {/* Add New Task Button - matches Introduction style */}
      <ActionCard theme={theme} style={{ cursor: 'pointer' }} onClick={() => {
        resetTaskForm();
        setTaskModalOpen(true);
      }}>
        <ActionCardContent theme={theme} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '12px' }}>
          <FaTasks style={{ color: '#10B981' }} />
          <span style={{ fontWeight: 600 }}>Add New Task</span>
        </ActionCardContent>
      </ActionCard>

      {/* Loading State */}
      {loadingTasks && (
        <ActionCard theme={theme}>
          <ActionCardContent theme={theme} style={{ textAlign: 'center', padding: '24px' }}>
            Loading tasks...
          </ActionCardContent>
        </ActionCard>
      )}

      {/* Tasks List */}
      {!loadingTasks && todoistTasks.length === 0 && (
        <ActionCard theme={theme}>
          <ActionCardContent theme={theme} style={{ textAlign: 'center', opacity: 0.6 }}>
            No tasks yet
          </ActionCardContent>
        </ActionCard>
      )}

      {/* Grouped Tasks by Project > Section */}
      {!loadingTasks && todoistProjects.map(project => {
        const projectTasks = todoistTasks.filter(t => t.project_id === project.id);
        if (projectTasks.length === 0) return null;

        const isProjectExpanded = expandedProjects[project.id] === true; // default collapsed
        const projectColor = getProjectColor(project.id);

        // Group tasks by section
        const tasksBySection = {};
        const noSectionTasks = [];
        projectTasks.forEach(task => {
          if (task.section_id) {
            if (!tasksBySection[task.section_id]) tasksBySection[task.section_id] = [];
            tasksBySection[task.section_id].push(task);
          } else {
            noSectionTasks.push(task);
          }
        });

        return (
          <div key={project.id} style={{ marginBottom: '8px' }}>
            {/* Project Header */}
            <div
              onClick={() => setExpandedProjects(prev => ({ ...prev, [project.id]: !isProjectExpanded }))}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 16px',
                background: theme === 'light' ? '#F3F4F6' : '#374151',
                cursor: 'pointer',
                borderRadius: '6px',
                marginBottom: isProjectExpanded ? '4px' : '0',
              }}
            >
              <FaChevronDown
                style={{
                  transform: isProjectExpanded ? 'rotate(0deg)' : 'rotate(-90deg)',
                  transition: 'transform 0.2s',
                  fontSize: '10px',
                  color: theme === 'light' ? '#6B7280' : '#9CA3AF'
                }}
              />
              <span style={{
                width: '10px',
                height: '10px',
                borderRadius: '50%',
                background: projectColor,
                flexShrink: 0
              }} />
              <span style={{
                fontWeight: 600,
                fontSize: '14px',
                color: theme === 'light' ? '#111827' : '#F9FAFB'
              }}>
                {project.name}
              </span>
              <span style={{
                fontSize: '12px',
                color: theme === 'light' ? '#6B7280' : '#9CA3AF',
                marginLeft: 'auto'
              }}>
                {projectTasks.length}
              </span>
            </div>

            {/* Project Content */}
            {isProjectExpanded && (
              <div style={{ paddingLeft: '8px' }}>
                {/* No-section tasks */}
                {noSectionTasks.map(task => (
                  <ActionCard key={task.id} theme={theme} style={{ marginLeft: '8px' }}>
                    <ActionCardHeader theme={theme} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                      <div
                        style={{
                          width: '16px',
                          height: '16px',
                          borderRadius: '50%',
                          border: `2px solid ${task.priority === 4 ? '#dc3545' : task.priority === 3 ? '#fd7e14' : task.priority === 2 ? '#ffc107' : '#6c757d'}`,
                          flexShrink: 0,
                          marginTop: '2px',
                          cursor: 'pointer',
                        }}
                        onClick={() => onCompleteTask(task.id)}
                        title="Complete task"
                      />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 500 }}>{task.content}</div>
                        {task.description && (
                          <div style={{ fontSize: '12px', opacity: 0.7, marginTop: '4px' }}>
                            {task.description.substring(0, 100)}{task.description.length > 100 ? '...' : ''}
                          </div>
                        )}
                      </div>
                    </ActionCardHeader>
                    <ActionCardContent theme={theme} style={{ padding: '8px 16px', display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                      {task.due && (
                        <span style={{
                          padding: '2px 8px',
                          borderRadius: '12px',
                          fontSize: '11px',
                          background: new Date(task.due.date) < new Date() ? '#dc354520' : '#6c757d20',
                          color: new Date(task.due.date) < new Date() ? '#dc3545' : (theme === 'light' ? '#6c757d' : '#9CA3AF'),
                        }}>
                          {task.due.string || task.due.date}
                        </span>
                      )}
                    </ActionCardContent>
                    <ActionCardButtons>
                      <SmallBtn theme={theme} onClick={() => openEditTask(task)}><FaEdit /></SmallBtn>
                      <SmallBtn theme={theme} onClick={() => window.open(task.url, '_blank')} title="Open in Todoist"><FaExternalLinkAlt /></SmallBtn>
                      <SmallBtn theme={theme} $variant="success" onClick={() => onCompleteTask(task.id)} title="Complete"><FaCheck /></SmallBtn>
                      <SmallBtn theme={theme} $variant="danger" onClick={() => onDeleteTask(task.id)} title="Delete"><FaTrash /></SmallBtn>
                    </ActionCardButtons>
                  </ActionCard>
                ))}

                {/* Sections - sorted with Recurring always last */}
                {project.sections && [...project.sections].sort((a, b) => {
                  if (a.name === 'Recurring') return 1;
                  if (b.name === 'Recurring') return -1;
                  return a.order - b.order;
                }).map(section => {
                  const sectionTasks = tasksBySection[section.id] || [];
                  if (sectionTasks.length === 0) return null;

                  const isSectionExpanded = expandedSections[section.id] === true; // default collapsed

                  return (
                    <div key={section.id} style={{ marginTop: '4px' }}>
                      {/* Section Header */}
                      <div
                        onClick={() => setExpandedSections(prev => ({ ...prev, [section.id]: !isSectionExpanded }))}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          padding: '8px 16px',
                          marginLeft: '8px',
                          background: theme === 'light' ? '#F9FAFB' : '#1F2937',
                          cursor: 'pointer',
                          borderRadius: '4px',
                          borderLeft: `3px solid ${projectColor}40`,
                        }}
                      >
                        <FaChevronDown
                          style={{
                            transform: isSectionExpanded ? 'rotate(0deg)' : 'rotate(-90deg)',
                            transition: 'transform 0.2s',
                            fontSize: '9px',
                            color: theme === 'light' ? '#9CA3AF' : '#6B7280'
                          }}
                        />
                        <span style={{
                          fontWeight: 500,
                          fontSize: '13px',
                          color: theme === 'light' ? '#374151' : '#D1D5DB'
                        }}>
                          {section.name}
                        </span>
                        <span style={{
                          fontSize: '11px',
                          color: theme === 'light' ? '#9CA3AF' : '#6B7280',
                          marginLeft: 'auto'
                        }}>
                          {sectionTasks.length}
                        </span>
                      </div>

                      {/* Section Tasks */}
                      {isSectionExpanded && sectionTasks.map(task => (
                        <ActionCard key={task.id} theme={theme} style={{ marginLeft: '16px' }}>
                          <ActionCardHeader theme={theme} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                            <div
                              style={{
                                width: '16px',
                                height: '16px',
                                borderRadius: '50%',
                                border: `2px solid ${task.priority === 4 ? '#dc3545' : task.priority === 3 ? '#fd7e14' : task.priority === 2 ? '#ffc107' : '#6c757d'}`,
                                flexShrink: 0,
                                marginTop: '2px',
                                cursor: 'pointer',
                              }}
                              onClick={() => onCompleteTask(task.id)}
                              title="Complete task"
                            />
                            <div style={{ flex: 1 }}>
                              <div style={{ fontWeight: 500 }}>{task.content}</div>
                              {task.description && (
                                <div style={{ fontSize: '12px', opacity: 0.7, marginTop: '4px' }}>
                                  {task.description.substring(0, 100)}{task.description.length > 100 ? '...' : ''}
                                </div>
                              )}
                            </div>
                          </ActionCardHeader>
                          <ActionCardContent theme={theme} style={{ padding: '8px 16px', display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                            {task.due && (
                              <span style={{
                                padding: '2px 8px',
                                borderRadius: '12px',
                                fontSize: '11px',
                                background: new Date(task.due.date) < new Date() ? '#dc354520' : '#6c757d20',
                                color: new Date(task.due.date) < new Date() ? '#dc3545' : (theme === 'light' ? '#6c757d' : '#9CA3AF'),
                              }}>
                                {task.due.string || task.due.date}
                              </span>
                            )}
                          </ActionCardContent>
                          <ActionCardButtons>
                            <SmallBtn theme={theme} onClick={() => openEditTask(task)}><FaEdit /></SmallBtn>
                            <SmallBtn theme={theme} onClick={() => window.open(task.url, '_blank')} title="Open in Todoist"><FaExternalLinkAlt /></SmallBtn>
                            <SmallBtn theme={theme} $variant="success" onClick={() => onCompleteTask(task.id)} title="Complete"><FaCheck /></SmallBtn>
                            <SmallBtn theme={theme} $variant="danger" onClick={() => onDeleteTask(task.id)} title="Delete"><FaTrash /></SmallBtn>
                          </ActionCardButtons>
                        </ActionCard>
                      ))}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </>
  );
};

export default TasksTab;
