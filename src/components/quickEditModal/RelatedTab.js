import React from 'react';
import { FaMapMarkerAlt, FaTag, FaPlus, FaTrash } from 'react-icons/fa';
import {
  Section,
  SectionHeader,
  SectionLabel,
  AddButton,
  ListContainer,
  ListItem,
  ItemText,
  DeleteButton,
  EmptyState,
  TagsContainer,
  TagItem,
  TagDeleteButton
} from './StyledComponents';

const RelatedTab = ({
  cities,
  tags,
  setCityModalOpen,
  setTagModalOpen,
  handleRemoveCity,
  handleRemoveTag,
  theme,
  shouldShowField
}) => {
  return (
    <>
      {/* Cities Section */}
      {shouldShowField('cities') && (
        <Section>
          <SectionHeader>
            <SectionLabel theme={theme}>
              <FaMapMarkerAlt style={{ fontSize: '14px', color: '#3B82F6' }} />
              Cities
            </SectionLabel>
            <AddButton
              onClick={() => setCityModalOpen(true)}
              style={{ padding: '6px 12px', fontSize: '12px' }}
            >
              <FaPlus style={{ fontSize: '10px' }} />
              Add Cities
            </AddButton>
          </SectionHeader>

          <ListContainer theme={theme}>
            {cities?.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1px' }}>
                {cities.map((cityData, index) => (
                  <ListItem
                    key={cityData.entry_id}
                    theme={theme}
                    $first={index === 0}
                    $last={index === cities.length - 1}
                  >
                    <FaMapMarkerAlt style={{ fontSize: '14px', color: '#3B82F6' }} />
                    <div style={{ flex: 1 }}>
                      <ItemText theme={theme}>
                        {cityData.cities?.name || 'Unknown City'}
                        {cityData.cities?.country && cityData.cities.country !== 'Unknown' && (
                          <span style={{
                            fontSize: '12px',
                            color: theme === 'light' ? '#6B7280' : '#9CA3AF',
                            fontWeight: 'normal',
                            marginLeft: '8px'
                          }}>
                            {cityData.cities.country}
                          </span>
                        )}
                      </ItemText>
                    </div>
                    <DeleteButton
                      onClick={() => handleRemoveCity(cityData.entry_id)}
                    >
                      <FaTrash />
                    </DeleteButton>
                  </ListItem>
                ))}
              </div>
            ) : (
              <EmptyState theme={theme}>
                <FaMapMarkerAlt style={{ fontSize: '24px', opacity: 0.5 }} />
                <span>No cities associated</span>
              </EmptyState>
            )}
          </ListContainer>
        </Section>
      )}

      {/* Tags Section */}
      {shouldShowField('tags') && (
        <Section>
          <SectionHeader>
            <SectionLabel theme={theme}>
              <FaTag style={{ fontSize: '14px', color: '#3B82F6' }} />
              Tags
            </SectionLabel>
            <AddButton
              onClick={() => setTagModalOpen(true)}
              style={{ padding: '6px 12px', fontSize: '12px' }}
            >
              <FaPlus style={{ fontSize: '10px' }} />
              Add Tags
            </AddButton>
          </SectionHeader>

          <TagsContainer theme={theme}>
            {tags?.length > 0 ? (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {tags.map((tagData) => (
                  <TagItem
                    key={tagData.entry_id}
                    theme={theme}
                  >
                    <FaTag style={{ fontSize: '10px', color: '#3B82F6' }} />
                    <span>{tagData.tags?.name || 'Unknown Tag'}</span>
                    <TagDeleteButton
                      onClick={() => handleRemoveTag(tagData.entry_id)}
                    >
                      <FaTrash />
                    </TagDeleteButton>
                  </TagItem>
                ))}
              </div>
            ) : (
              <EmptyState theme={theme} style={{ height: '68px' }}>
                <FaTag style={{ fontSize: '24px', opacity: 0.5 }} />
                <span>No tags associated</span>
              </EmptyState>
            )}
          </TagsContainer>
        </Section>
      )}
    </>
  );
};

export default RelatedTab;