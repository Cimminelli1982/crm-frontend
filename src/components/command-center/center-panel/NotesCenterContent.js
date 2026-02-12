import React from 'react';
import {
  EmailContentPanel,
  EmptyState,
} from '../../../pages/CommandCenterPage.styles';
import {
  FaStickyNote, FaSave, FaTrash, FaUser, FaBuilding,
  FaDollarSign, FaTimes, FaEdit, FaEye, FaPen, FaHandshake,
} from 'react-icons/fa';
import MDEditor from '@uiw/react-md-editor';
import remarkBreaks from 'remark-breaks';

const NotesCenterContent = ({ theme, notesHook }) => {
  const {
    selectedNote, isEditing, setIsEditing,
    editTitle, setEditTitle, editContent, setEditContent,
    editFolderPath, setEditFolderPath,
    saving, viewMode, setViewMode,
    isCreating, setIsCreating, setSelectedNote,
    linkedContacts, linkedCompanies, linkedDeals, linkedIntroductions,
    showLinkModal, setShowLinkModal, linkType, setLinkType,
    linkSearchQuery, setLinkSearchQuery, linkSearchResults, linkSearching,
    uniqueFolders, FOLDER_CONFIG,
    handleCreateNew, handleSave, handleDelete,
    searchEntities, handleLinkEntity, handleUnlinkEntity,
  } = notesHook;

  const buttonStyle = {
    padding: '8px 12px',
    borderRadius: '8px',
    border: 'none',
    background: '#8B5CF6',
    color: 'white',
    fontSize: '13px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  };

  const viewModeButtonStyle = (active) => ({
    padding: '6px 10px',
    borderRadius: '6px',
    border: 'none',
    background: active ? (theme === 'dark' ? '#4B5563' : '#E5E7EB') : 'transparent',
    color: theme === 'dark' ? '#F9FAFB' : '#111827',
    fontSize: '12px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
  });

  const searchInputStyle = {
    flex: 1,
    padding: '8px 12px',
    borderRadius: '8px',
    border: `1px solid ${theme === 'dark' ? '#4B5563' : '#D1D5DB'}`,
    background: theme === 'dark' ? '#374151' : '#F9FAFB',
    color: theme === 'dark' ? '#F9FAFB' : '#111827',
    fontSize: '13px',
    outline: 'none',
  };

  const linkButtonStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '8px 12px',
    borderRadius: '6px',
    border: `1px solid ${theme === 'dark' ? '#374151' : '#E5E7EB'}`,
    background: theme === 'dark' ? '#374151' : '#F3F4F6',
    color: theme === 'dark' ? '#F9FAFB' : '#374151',
    fontSize: '13px',
    cursor: 'pointer',
  };

  if (!selectedNote && !isCreating) {
    return (
      <EmailContentPanel theme={theme}>
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
          <EmptyState theme={theme}>
            <FaStickyNote size={48} style={{ marginBottom: '16px', opacity: 0.5 }} />
            <div style={{ fontSize: '16px' }}>Select a note or create a new one</div>
          </EmptyState>
        </div>
      </EmailContentPanel>
    );
  }

  return (
    <EmailContentPanel theme={theme}>
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }} data-color-mode={theme}>
        {/* Editor header */}
        <div style={{
          padding: '12px 16px',
          borderBottom: `1px solid ${theme === 'dark' ? '#374151' : '#E5E7EB'}`,
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          background: theme === 'dark' ? '#1F2937' : '#FFFFFF',
        }}>
          {isEditing ? (
            <input
              type="text"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              placeholder="Note title..."
              style={{
                flex: 1,
                padding: '8px 12px',
                borderRadius: '6px',
                border: `1px solid ${theme === 'dark' ? '#4B5563' : '#D1D5DB'}`,
                background: theme === 'dark' ? '#374151' : '#FFFFFF',
                color: theme === 'dark' ? '#F9FAFB' : '#111827',
                fontSize: '16px',
                fontWeight: 600,
                outline: 'none',
              }}
            />
          ) : (
            <h2 style={{
              flex: 1,
              margin: 0,
              fontSize: '18px',
              fontWeight: 600,
              color: theme === 'dark' ? '#F9FAFB' : '#111827',
            }}>
              {selectedNote?.title}
            </h2>
          )}

          {/* View mode toggle */}
          {isEditing && (
            <div style={{ display: 'flex', gap: '4px', background: theme === 'dark' ? '#374151' : '#E5E7EB', borderRadius: '8px', padding: '2px' }}>
              <button style={viewModeButtonStyle(viewMode === 'edit')} onClick={() => setViewMode('edit')}>
                <FaPen size={10} /> Edit
              </button>
              <button style={viewModeButtonStyle(viewMode === 'split')} onClick={() => setViewMode('split')}>
                Split
              </button>
              <button style={viewModeButtonStyle(viewMode === 'preview')} onClick={() => setViewMode('preview')}>
                <FaEye size={10} /> Preview
              </button>
            </div>
          )}

          {/* Folder selector */}
          {isEditing && (
            <select
              value={editFolderPath}
              onChange={(e) => setEditFolderPath(e.target.value)}
              style={{
                padding: '8px 12px',
                borderRadius: '6px',
                border: `1px solid ${theme === 'dark' ? '#4B5563' : '#D1D5DB'}`,
                background: theme === 'dark' ? '#374151' : '#FFFFFF',
                color: theme === 'dark' ? '#F9FAFB' : '#111827',
                fontSize: '12px',
                outline: 'none',
              }}
            >
              {uniqueFolders.map(folder => (
                <option key={folder} value={folder}>
                  {FOLDER_CONFIG[folder]?.emoji || '📁'} {folder}
                </option>
              ))}
              {!uniqueFolders.includes(editFolderPath) && editFolderPath && (
                <option value={editFolderPath}>{editFolderPath} (new)</option>
              )}
            </select>
          )}

          {/* Action buttons */}
          <div style={{ display: 'flex', gap: '8px' }}>
            {isEditing ? (
              <>
                <button
                  onClick={() => {
                    if (isCreating) {
                      setIsCreating(false);
                      setSelectedNote(null);
                    }
                    setIsEditing(false);
                  }}
                  style={{
                    ...buttonStyle,
                    background: theme === 'dark' ? '#4B5563' : '#E5E7EB',
                    color: theme === 'dark' ? '#D1D5DB' : '#374151',
                  }}
                >
                  <FaTimes size={12} />
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  style={{
                    ...buttonStyle,
                    background: '#10B981',
                    opacity: saving ? 0.7 : 1,
                  }}
                >
                  <FaSave size={12} />
                  {saving ? 'Saving...' : 'Save'}
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => setIsEditing(true)}
                  style={{ ...buttonStyle, background: '#3B82F6' }}
                >
                  <FaEdit size={12} />
                  Edit
                </button>
                <button
                  onClick={handleDelete}
                  style={{ ...buttonStyle, background: '#EF4444' }}
                >
                  <FaTrash size={12} />
                </button>
              </>
            )}
          </div>
        </div>

        {/* Markdown Editor Content */}
        <div style={{ flex: 1, padding: '16px', overflow: 'auto' }}>
          {isEditing ? (
            <MDEditor
              value={editContent}
              onChange={(val) => setEditContent(val || '')}
              preview={viewMode === 'edit' ? 'edit' : viewMode === 'preview' ? 'preview' : 'live'}
              height="100%"
              style={{ minHeight: '300px' }}
              visibleDragbar={false}
              previewOptions={{ remarkPlugins: [remarkBreaks] }}
            />
          ) : (
            <div style={{
              background: theme === 'dark' ? '#1F2937' : '#FFFFFF',
              borderRadius: '8px',
              padding: '16px',
            }}>
              <MDEditor.Markdown
                source={selectedNote?.markdown_content || selectedNote?.text || ''}
                remarkPlugins={[remarkBreaks]}
                style={{
                  background: 'transparent',
                  color: theme === 'dark' ? '#F9FAFB' : '#111827',
                }}
              />
            </div>
          )}
        </div>

        {/* Footer Actions Bar */}
        {!isCreating && (
          <div style={{
            padding: '12px 16px',
            borderTop: `1px solid ${theme === 'dark' ? '#374151' : '#E5E7EB'}`,
            background: theme === 'dark' ? '#1F2937' : '#FFFFFF',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            flexWrap: 'wrap',
          }}>
            {/* Link buttons */}
            <button onClick={() => { setLinkType('contact'); setShowLinkModal(true); }} style={linkButtonStyle}>
              <FaUser size={12} />
              Contact {linkedContacts.length > 0 && <span style={{ background: '#3B82F6', color: 'white', padding: '0 6px', borderRadius: '10px', fontSize: '11px' }}>{linkedContacts.length}</span>}
            </button>

            <button onClick={() => { setLinkType('company'); setShowLinkModal(true); }} style={linkButtonStyle}>
              <FaBuilding size={12} />
              Company {linkedCompanies.length > 0 && <span style={{ background: '#8B5CF6', color: 'white', padding: '0 6px', borderRadius: '10px', fontSize: '11px' }}>{linkedCompanies.length}</span>}
            </button>

            <button onClick={() => { setLinkType('deal'); setShowLinkModal(true); }} style={linkButtonStyle}>
              <FaDollarSign size={12} />
              Deal {linkedDeals.length > 0 && <span style={{ background: '#10B981', color: 'white', padding: '0 6px', borderRadius: '10px', fontSize: '11px' }}>{linkedDeals.length}</span>}
            </button>

            <button onClick={() => { setLinkType('introduction'); setShowLinkModal(true); }} style={linkButtonStyle}>
              <FaHandshake size={12} />
              Intro {linkedIntroductions.length > 0 && <span style={{ background: '#EC4899', color: 'white', padding: '0 6px', borderRadius: '10px', fontSize: '11px' }}>{linkedIntroductions.length}</span>}
            </button>

            {/* Linked items chips */}
            <div style={{ flex: 1 }} />

            {linkedContacts.map(c => (
              <span key={c.contact_id} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '4px 10px', borderRadius: '16px', background: '#DBEAFE', color: '#1D4ED8', fontSize: '12px' }}>
                <FaUser size={10} /> {c.first_name}
                <FaTimes size={10} style={{ cursor: 'pointer', marginLeft: '2px' }} onClick={() => handleUnlinkEntity('contact', c.contact_id)} />
              </span>
            ))}
            {linkedCompanies.map(c => (
              <span key={c.company_id} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '4px 10px', borderRadius: '16px', background: '#EDE9FE', color: '#6D28D9', fontSize: '12px' }}>
                <FaBuilding size={10} /> {c.name}
                <FaTimes size={10} style={{ cursor: 'pointer', marginLeft: '2px' }} onClick={() => handleUnlinkEntity('company', c.company_id)} />
              </span>
            ))}
            {linkedDeals.map(d => (
              <span key={d.deal_id} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '4px 10px', borderRadius: '16px', background: '#D1FAE5', color: '#065F46', fontSize: '12px' }}>
                <FaDollarSign size={10} /> {d.opportunity}
                <FaTimes size={10} style={{ cursor: 'pointer', marginLeft: '2px' }} onClick={() => handleUnlinkEntity('deal', d.deal_id)} />
              </span>
            ))}

            {/* Metadata */}
            <div style={{ marginLeft: 'auto', fontSize: '11px', color: theme === 'dark' ? '#6B7280' : '#9CA3AF' }}>
              {selectedNote?.folder_path || 'Inbox'} • {new Date(selectedNote?.last_modified_at || selectedNote?.created_at).toLocaleDateString()}
            </div>
          </div>
        )}

        {/* Link Modal */}
        {showLinkModal && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}>
            <div style={{
              background: theme === 'dark' ? '#1F2937' : '#FFFFFF',
              borderRadius: '12px',
              padding: '20px',
              width: '400px',
              maxHeight: '500px',
              display: 'flex',
              flexDirection: 'column',
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '16px',
              }}>
                <h3 style={{
                  margin: 0,
                  fontSize: '16px',
                  fontWeight: 600,
                  color: theme === 'dark' ? '#F9FAFB' : '#111827',
                }}>
                  Link {linkType}
                </h3>
                <button
                  onClick={() => { setShowLinkModal(false); setLinkSearchQuery(''); }}
                  style={{ background: 'none', border: 'none', color: theme === 'dark' ? '#9CA3AF' : '#6B7280', cursor: 'pointer' }}
                >
                  <FaTimes size={16} />
                </button>
              </div>

              <input
                type="text"
                placeholder={`Search ${linkType}s...`}
                value={linkSearchQuery}
                onChange={(e) => {
                  setLinkSearchQuery(e.target.value);
                  searchEntities(linkType, e.target.value);
                }}
                style={{ ...searchInputStyle, marginBottom: '12px' }}
              />

              <div style={{ flex: 1, overflow: 'auto' }}>
                {linkSearching ? (
                  <div style={{ padding: '20px', textAlign: 'center', color: theme === 'dark' ? '#9CA3AF' : '#6B7280' }}>
                    Searching...
                  </div>
                ) : linkSearchResults.length === 0 ? (
                  <div style={{ padding: '20px', textAlign: 'center', color: theme === 'dark' ? '#9CA3AF' : '#6B7280' }}>
                    {linkSearchQuery ? 'No results' : 'Type to search'}
                  </div>
                ) : (
                  linkSearchResults.map(result => (
                    <div
                      key={result[`${linkType}_id`]}
                      onClick={() => handleLinkEntity(result)}
                      style={{
                        padding: '10px 12px',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        marginBottom: '4px',
                        background: theme === 'dark' ? '#374151' : '#F3F4F6',
                        color: theme === 'dark' ? '#F9FAFB' : '#111827',
                        fontSize: '13px',
                      }}
                    >
                      {linkType === 'contact' && `${result.first_name} ${result.last_name}`}
                      {linkType === 'company' && result.name}
                      {linkType === 'deal' && result.opportunity}
                      {linkType === 'introduction' && `${result.status} - ${new Date(result.introduction_date).toLocaleDateString()}`}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </EmailContentPanel>
  );
};

export default NotesCenterContent;
