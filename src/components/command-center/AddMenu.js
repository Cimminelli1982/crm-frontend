import React from 'react';
import {
  FaUser, FaBuilding, FaHandshake, FaTasks, FaStickyNote,
  FaUsers, FaList, FaPlus
} from 'react-icons/fa';

/**
 * AddMenu - Quick add menu for creating new entities
 *
 * @param {Object} props
 * @param {string} props.theme - 'dark' or 'light'
 * @param {Function} props.onAddContact - Callback to add contact
 * @param {Function} props.onAddCompany - Callback to add company
 * @param {Function} props.onAddDeal - Callback to add deal
 * @param {Function} props.onAddTask - Callback to add task (Todoist)
 * @param {Function} props.onAddNote - Callback to add note
 * @param {Function} props.onAddIntroduction - Callback to add introduction
 * @param {Function} props.onAddToList - Callback to add to list
 */
const AddMenu = ({
  theme,
  onAddContact,
  onAddCompany,
  onAddDeal,
  onAddTask,
  onAddNote,
  onAddIntroduction,
  onAddToList,
}) => {
  const menuItems = [
    { id: 'contact', label: 'Contact', icon: FaUser, color: '#3B82F6', onClick: onAddContact },
    { id: 'company', label: 'Company', icon: FaBuilding, color: '#8B5CF6', onClick: onAddCompany },
    { id: 'deal', label: 'Deal', icon: FaHandshake, color: '#10B981', onClick: onAddDeal },
    { id: 'task', label: 'Task', icon: FaTasks, color: '#F59E0B', onClick: onAddTask },
    { id: 'note', label: 'Note', icon: FaStickyNote, color: '#EC4899', onClick: onAddNote },
    { id: 'introduction', label: 'Introduction', icon: FaUsers, color: '#06B6D4', onClick: onAddIntroduction },
    { id: 'list', label: 'Add to List', icon: FaList, color: '#6366F1', onClick: onAddToList },
  ];

  const itemStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '12px 14px',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
    border: `1px solid ${theme === 'dark' ? '#374151' : '#E5E7EB'}`,
    background: theme === 'dark' ? '#1F2937' : '#FFFFFF',
    marginBottom: '8px',
  };

  const iconContainerStyle = (color) => ({
    width: '36px',
    height: '36px',
    borderRadius: '8px',
    background: `${color}20`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: color,
  });

  return (
    <div style={{ flex: 1, overflow: 'auto', padding: '12px' }}>
      <div style={{
        fontSize: '11px',
        fontWeight: 600,
        color: theme === 'dark' ? '#9CA3AF' : '#6B7280',
        marginBottom: '12px',
        textTransform: 'uppercase',
        letterSpacing: '0.5px',
        display: 'flex',
        alignItems: 'center',
        gap: '6px'
      }}>
        <FaPlus size={10} />
        Quick Add
      </div>

      {menuItems.map((item) => (
        <div
          key={item.id}
          style={{
            ...itemStyle,
            opacity: item.onClick ? 1 : 0.5,
            cursor: item.onClick ? 'pointer' : 'not-allowed',
          }}
          onClick={() => item.onClick?.()}
          onMouseEnter={(e) => {
            if (item.onClick) {
              e.currentTarget.style.background = theme === 'dark' ? '#374151' : '#F3F4F6';
              e.currentTarget.style.borderColor = item.color;
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = theme === 'dark' ? '#1F2937' : '#FFFFFF';
            e.currentTarget.style.borderColor = theme === 'dark' ? '#374151' : '#E5E7EB';
          }}
        >
          <div style={iconContainerStyle(item.color)}>
            <item.icon size={16} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{
              fontSize: '13px',
              fontWeight: 500,
              color: theme === 'dark' ? '#F9FAFB' : '#111827',
            }}>
              {item.label}
            </div>
            {!item.onClick && (
              <div style={{
                fontSize: '11px',
                color: theme === 'dark' ? '#6B7280' : '#9CA3AF',
              }}>
                Coming soon
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default AddMenu;
