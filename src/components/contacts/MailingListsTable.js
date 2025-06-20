import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { FiMail, FiPlus, FiEye, FiRefreshCw, FiTrash2 } from 'react-icons/fi';
import { supabase } from '../../lib/supabaseClient';
import CreateNewListModal from '../modals/CreateNewListModal';
import ViewEmailListModal from '../modals/ViewEmailListModal';

const Container = styled.div`
  height: calc(100vh - 60px);
  width: 100%;
  padding: 0 5px 0 0;
  overflow: hidden;
  box-sizing: border-box;
  max-width: 100%;
  position: relative;
  background-color: #111;
`;

const HeaderSection = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  background-color: #000;
  border-bottom: 1px solid #333;
`;

const Title = styled.h2`
  color: #00ff00;
  font-family: 'Courier New', monospace;
  font-size: 24px;
  font-weight: bold;
  margin: 0;
  text-transform: uppercase;
  letter-spacing: 2px;
  display: flex;
  align-items: center;
  
  svg {
    margin-right: 10px;
  }
`;

const AddNewButton = styled.button`
  background-color: #000;
  border: 2px solid #00ff00;
  color: #00ff00;
  padding: 10px 20px;
  font-family: 'Courier New', monospace;
  font-size: 14px;
  font-weight: bold;
  text-transform: uppercase;
  letter-spacing: 1px;
  cursor: pointer;
  border-radius: 4px;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 8px;
  
  &:hover {
    background-color: #00ff00;
    color: #000;
  }
`;

const TableContainer = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 20px;
  background-color: #111;
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  font-family: 'Courier New', monospace;
`;

const TableHeader = styled.thead`
  background-color: #000;
  border-bottom: 2px solid #333;
`;

const TableHeaderCell = styled.th`
  color: #00ff00;
  padding: 15px 20px;
  text-align: left;
  font-weight: bold;
  text-transform: uppercase;
  letter-spacing: 1px;
  font-size: 14px;
  border-right: 1px solid #333;
  
  &:last-child {
    border-right: none;
  }
`;

const TableBody = styled.tbody``;

const TableRow = styled.tr`
  background-color: ${props => props.$index % 2 === 0 ? '#111' : '#0a0a0a'};
  transition: all 0.2s ease;
  
  &:hover {
    background-color: #1a1a1a;
    border-left: 3px solid #00ff00;
  }
`;

const TableCell = styled.td`
  color: #ffffff;
  padding: 15px 20px;
  border-right: 1px solid #333;
  border-bottom: 1px solid #222;
  font-size: 14px;
  
  &:last-child {
    border-right: none;
  }
`;

const EditableCell = styled.td`
  color: #ffffff;
  padding: 15px 20px;
  border-right: 1px solid #333;
  border-bottom: 1px solid #222;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    background-color: #1a1a1a;
    color: #00ff00;
  }
  
  &:last-child {
    border-right: none;
  }
`;

const EditInput = styled.input`
  background-color: #000;
  border: 2px solid #00ff00;
  color: #00ff00;
  padding: 8px 12px;
  font-family: 'Courier New', monospace;
  font-size: 14px;
  border-radius: 4px;
  outline: none;
  width: 100%;
  box-sizing: border-box;
  
  &::placeholder {
    color: #666;
  }
`;

const ActionButtons = styled.div`
  display: flex;
  gap: 8px;
  align-items: center;
`;

const ActionButton = styled.button`
  background-color: #111;
  border: 1px solid #333;
  color: #ffffff;
  padding: 6px 12px;
  font-family: 'Courier New', monospace;
  font-size: 11px;
  font-weight: bold;
  text-transform: uppercase;
  cursor: pointer;
  border-radius: 4px;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 4px;
  
  &:hover {
    border-color: #00ff00;
    color: #00ff00;
  }
  
  &.open {
    &:hover {
      background-color: #00ff00;
      color: #000;
    }
  }
  
  &.toggle {
    &:hover {
      background-color: #00ff00;
      color: #000;
      border-color: #00ff00;
    }
  }
  
  &.delete {
    &:hover {
      background-color: #00ff00;
      color: #000;
      border-color: #00ff00;
    }
  }
`;

const LoadingContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 300px;
  color: #00ff00;
  font-family: 'Courier New', monospace;
  font-size: 18px;
`;

const EmptyState = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 300px;
  color: #666;
  font-family: 'Courier New', monospace;
  font-size: 16px;
  text-align: center;
`;

const ErrorState = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 300px;
  color: #ff4444;
  font-family: 'Courier New', monospace;
  font-size: 16px;
  text-align: center;
`;

const TypeBadge = styled.span`
  background-color: ${props => 
    props.$type === 'static' ? '#1a4d1a' : 
    props.$type === 'dynamic' ? '#4d1a1a' : 
    '#333'
  };
  color: ${props => 
    props.$type === 'static' ? '#00ff00' : 
    props.$type === 'dynamic' ? '#ff6666' : 
    '#ccc'
  };
  border: 1px solid ${props => 
    props.$type === 'static' ? '#00ff00' : 
    props.$type === 'dynamic' ? '#ff6666' : 
    '#666'
  };
  padding: 4px 8px;
  border-radius: 4px;
  font-family: 'Courier New', monospace;
  font-size: 11px;
  font-weight: bold;
  text-transform: uppercase;
  letter-spacing: 1px;
`;

const MailingListsTable = () => {
  const [emailLists, setEmailLists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedEmailList, setSelectedEmailList] = useState(null);
  const [editingCell, setEditingCell] = useState(null); // { listId, field }
  const [editingValue, setEditingValue] = useState('');

  useEffect(() => {
    fetchEmailLists();
  }, []);

  const fetchEmailLists = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const { data, error } = await supabase
        .from('email_lists')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      setEmailLists(data || []);
      
      // Log the data structure to see available fields
      if (data && data.length > 0) {
        console.log('Email list data structure:', Object.keys(data[0]));
        console.log('Sample email list:', data[0]);
      }
    } catch (err) {
      console.error('Error fetching email lists:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAddNew = () => {
    setIsCreateModalOpen(true);
  };

  const handleOpen = (listId) => {
    // Find the selected email list
    const selectedList = emailLists.find(list => 
      list.list_id === listId || 
      list.email_list_id === listId || 
      list.uuid === listId ||
      list.id === listId
    );

    if (selectedList) {
      setSelectedEmailList(selectedList);
      setIsViewModalOpen(true);
    }
  };

  const handleCellDoubleClick = (listId, field, currentValue) => {
    setEditingCell({ listId, field });
    setEditingValue(currentValue || '');
  };

  const handleEditKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSaveEdit();
    } else if (e.key === 'Escape') {
      handleCancelEdit();
    }
  };

  const handleSaveEdit = async () => {
    if (!editingCell) return;

    try {
      const { listId, field } = editingCell;
      
      // Update the database
      let updateResult;
      const updateData = { [field]: editingValue };
      
      // Try different primary key field names
      updateResult = await supabase
        .from('email_lists')
        .update(updateData)
        .eq('list_id', listId);

      if (updateResult.error && updateResult.error.code === '42703') {
        updateResult = await supabase
          .from('email_lists')
          .update(updateData)
          .eq('email_list_id', listId);
      }

      if (updateResult.error && updateResult.error.code === '42703') {
        updateResult = await supabase
          .from('email_lists')
          .update(updateData)
          .eq('uuid', listId);
      }

      if (updateResult.error) {
        throw updateResult.error;
      }

      // Update local state
      setEmailLists(prev => prev.map(list => {
        const currentListId = list.list_id || list.email_list_id || list.uuid || list.id;
        if (currentListId === listId) {
          return { ...list, [field]: editingValue };
        }
        return list;
      }));

      // Clear editing state
      setEditingCell(null);
      setEditingValue('');
      
      console.log(`Successfully updated ${field} to: ${editingValue}`);

    } catch (err) {
      console.error('Error updating email list:', err);
      alert(`Error updating ${editingCell.field}: ${err.message}`);
    }
  };

  const handleCancelEdit = () => {
    setEditingCell(null);
    setEditingValue('');
  };

  const handleToggleType = async (listId) => {
    try {
      // Find the list to toggle
      const originalList = emailLists.find(list => 
        list.list_id === listId || 
        list.email_list_id === listId || 
        list.uuid === listId ||
        list.id === listId
      );

      if (!originalList) {
        throw new Error('Original list not found');
      }

      const currentType = originalList.list_type;
      const newType = currentType === 'static' ? 'dynamic' : 'static';
      
      // Confirm the action with the user
      const confirmMessage = `Are you sure you want to convert this list from ${currentType} to ${newType}?\n\n` +
        `${currentType === 'static' 
          ? 'Converting to dynamic will remove all manually added contacts and use filters instead.' 
          : 'Converting to static will save current filtered contacts as fixed members.'}`;
      
      if (!window.confirm(confirmMessage)) {
        return;
      }

      console.log(`Converting list from ${currentType} to ${newType}`);

      // Handle conversion based on the target type
      if (newType === 'dynamic') {
        // Converting static to dynamic: Remove members and clear query_filters for now
        await convertStaticToDynamic(listId, originalList);
      } else {
        // Converting dynamic to static: Get current filtered contacts and save as members
        await convertDynamicToStatic(listId, originalList);
      }

      // Count current members after conversion
      let currentMemberCount = 0;
      if (newType === 'static') {
        // For dynamic to static, count any existing members
        try {
          let countResult;
          countResult = await supabase
            .from('email_list_members')
            .select('*', { count: 'exact', head: true })
            .eq('list_id', listId);

          if (countResult.error && countResult.error.code === '42703') {
            countResult = await supabase
              .from('email_list_members')
              .select('*', { count: 'exact', head: true })
              .eq('email_list_uuid', listId);
          }

          if (countResult.error && countResult.error.code === '42703') {
            countResult = await supabase
              .from('email_list_members')
              .select('*', { count: 'exact', head: true })
              .eq('email_list_id', listId);
          }

          currentMemberCount = countResult.count || 0;
        } catch (err) {
          console.warn('Could not count members:', err);
          currentMemberCount = 0;
        }
      }
      // For static to dynamic, count should be 0 since we removed all members

      // Update the list type and contact count in the database
      let updateResult;
      
      // Try different primary key field names
      updateResult = await supabase
        .from('email_lists')
        .update({ 
          list_type: newType,
          total_contacts: currentMemberCount,
          updated_at: new Date().toISOString()
        })
        .eq('list_id', listId);

      if (updateResult.error && updateResult.error.code === '42703') {
        updateResult = await supabase
          .from('email_lists')
          .update({ 
            list_type: newType,
            total_contacts: currentMemberCount,
            updated_at: new Date().toISOString()
          })
          .eq('email_list_id', listId);
      }

      if (updateResult.error && updateResult.error.code === '42703') {
        updateResult = await supabase
          .from('email_lists')
          .update({ 
            list_type: newType,
            total_contacts: currentMemberCount,
            updated_at: new Date().toISOString()
          })
          .eq('uuid', listId);
      }

      if (updateResult.error) {
        throw updateResult.error;
      }

      // Update the local state
      setEmailLists(prev => prev.map(list => {
        const currentListId = list.list_id || list.email_list_id || list.uuid || list.id;
        if (currentListId === listId) {
          return { 
            ...list, 
            list_type: newType,
            total_contacts: currentMemberCount
          };
        }
        return list;
      }));

      console.log(`Successfully converted list to ${newType}`);
      
      // Refresh the email lists to ensure we have the latest data
      await fetchEmailLists();
      
      alert(`List successfully converted to ${newType} type!`);

    } catch (err) {
      console.error('Error converting list type:', err);
      alert(`Error converting list type: ${err.message}`);
    }
  };

  const convertStaticToDynamic = async (listId, originalList) => {
    // Remove all members from the static list
    try {
      // First, count existing members
      let countResult;
      countResult = await supabase
        .from('email_list_members')
        .select('*', { count: 'exact', head: true })
        .eq('list_id', listId);

      if (countResult.error && countResult.error.code === '42703') {
        countResult = await supabase
          .from('email_list_members')
          .select('*', { count: 'exact', head: true })
          .eq('email_list_uuid', listId);
      }

      if (countResult.error && countResult.error.code === '42703') {
        countResult = await supabase
          .from('email_list_members')
          .select('*', { count: 'exact', head: true })
          .eq('email_list_id', listId);
      }

      const memberCount = countResult.count || 0;
      console.log(`Found ${memberCount} members to delete for list ${listId}`);

      // Now delete all members
      let deleteResult;
      
      // Try different field names for deleting members
      deleteResult = await supabase
        .from('email_list_members')
        .delete()
        .eq('list_id', listId);

      if (deleteResult.error && deleteResult.error.code === '42703') {
        deleteResult = await supabase
          .from('email_list_members')
          .delete()
          .eq('email_list_uuid', listId);
      }

      if (deleteResult.error && deleteResult.error.code === '42703') {
        deleteResult = await supabase
          .from('email_list_members')
          .delete()
          .eq('email_list_id', listId);
      }

      if (deleteResult.error) {
        console.warn('Could not delete members (might not exist):', deleteResult.error);
      } else {
        console.log(`Successfully removed ${memberCount} static list members`);
      }

      // Note: For now, we're not setting up dynamic filters automatically
      // The user will need to set up filters through the CreateNewListModal or another interface
      console.log('Converted to dynamic - user will need to set up filters');
      
    } catch (err) {
      console.error('Error converting static to dynamic:', err);
      throw err;
    }
  };

  const convertDynamicToStatic = async (listId, originalList) => {
    // For dynamic to static conversion, we need to get the current filtered contacts
    // and save them as static members
    try {
      // If the list has query_filters, we could potentially use get-filtered-contacts
      // For now, we'll just convert it to static without adding members
      // The user can manually add contacts later
      
      console.log('Converted to static - list is now ready for manual contact addition');
      
      // Future enhancement: Call get-filtered-contacts with the list's query_filters
      // and add the results as static members
      
    } catch (err) {
      console.error('Error converting dynamic to static:', err);
      throw err;
    }
  };

  const handleDelete = async (listId) => {
    if (!window.confirm('Are you sure you want to delete this email list? This action cannot be undone.')) {
      return;
    }

    try {
      // Try common primary key field names
      let deleteResult;
      
      // First try with list_id
      deleteResult = await supabase
        .from('email_lists')
        .delete()
        .eq('list_id', listId);

      if (deleteResult.error && deleteResult.error.code === '42703') {
        // If list_id doesn't exist, try with email_list_id
        deleteResult = await supabase
          .from('email_lists')
          .delete()
          .eq('email_list_id', listId);
      }

      if (deleteResult.error && deleteResult.error.code === '42703') {
        // If email_list_id doesn't exist, try with uuid
        deleteResult = await supabase
          .from('email_lists')
          .delete()
          .eq('uuid', listId);
      }

      if (deleteResult.error) {
        throw deleteResult.error;
      }

      // Remove the deleted list from the local state using the same identifier
      setEmailLists(prev => prev.filter(list => 
        list.list_id !== listId && 
        list.email_list_id !== listId && 
        list.uuid !== listId &&
        list.id !== listId
      ));
      
      console.log('Email list deleted successfully');
    } catch (err) {
      console.error('Error deleting email list:', err);
      alert(`Error deleting email list: ${err.message}`);
    }
  };

  const renderTableContent = () => {
    if (loading) {
      return (
        <tr>
          <td colSpan="5">
            <LoadingContainer>Loading mailing lists...</LoadingContainer>
          </td>
        </tr>
      );
    }

    if (error) {
      return (
        <tr>
          <td colSpan="5">
            <ErrorState>Error loading lists: {error}</ErrorState>
          </td>
        </tr>
      );
    }

    if (emailLists.length === 0) {
      return (
        <tr>
          <td colSpan="5">
            <EmptyState>No mailing lists found</EmptyState>
          </td>
        </tr>
      );
    }

    return emailLists.map((list, index) => {
      // Use the first available primary key field
      const listId = list.list_id || list.email_list_id || list.uuid || list.id;
      const isEditingName = editingCell?.listId === listId && editingCell?.field === 'name';
      const isEditingDescription = editingCell?.listId === listId && editingCell?.field === 'description';
      
      return (
        <TableRow key={listId} $index={index}>
          <EditableCell 
            onDoubleClick={() => handleCellDoubleClick(listId, 'name', list.name)}
            title="Double-click to edit"
          >
            {isEditingName ? (
              <EditInput
                value={editingValue}
                onChange={(e) => setEditingValue(e.target.value)}
                onKeyDown={handleEditKeyPress}
                onBlur={handleSaveEdit}
                autoFocus
                placeholder="Enter list name"
              />
            ) : (
              list.name || 'Unnamed List'
            )}
          </EditableCell>
          <EditableCell 
            onDoubleClick={() => handleCellDoubleClick(listId, 'description', list.description)}
            title="Double-click to edit"
          >
            {isEditingDescription ? (
              <EditInput
                value={editingValue}
                onChange={(e) => setEditingValue(e.target.value)}
                onKeyDown={handleEditKeyPress}
                onBlur={handleSaveEdit}
                autoFocus
                placeholder="Enter description"
              />
            ) : (
              list.description || 'No description'
            )}
          </EditableCell>
          <TableCell>
            <TypeBadge $type={list.list_type}>
              {list.list_type === 'static' ? 'Static' : list.list_type === 'dynamic' ? 'Dynamic' : 'Unknown'}
            </TypeBadge>
          </TableCell>
          <TableCell>{list.total_contacts || 0}</TableCell>
          <TableCell>
            <ActionButtons>
              <ActionButton 
                className="open"
                onClick={() => handleOpen(listId)}
                title="View list contents"
              >
                <FiEye size={12} />
                OPEN
              </ActionButton>
              <ActionButton 
                className="toggle"
                onClick={() => handleToggleType(listId)}
                title={`Convert to ${list.list_type === 'static' ? 'dynamic' : 'static'} list`}
              >
                <FiRefreshCw size={12} />
                TOGGLE TYPE
              </ActionButton>
              <ActionButton 
                className="delete"
                onClick={() => handleDelete(listId)}
                title="Delete this list"
              >
                <FiTrash2 size={12} />
                DELETE
              </ActionButton>
            </ActionButtons>
          </TableCell>
        </TableRow>
      );
    });
  };

  return (
    <Container>
      <HeaderSection>
        <Title>
          <FiMail />
          Mailing Lists
        </Title>
        <AddNewButton onClick={handleAddNew}>
          <FiPlus size={16} />
          ADD NEW
        </AddNewButton>
      </HeaderSection>
      
      <TableContainer>
        <Table>
          <TableHeader>
            <tr>
              <TableHeaderCell>Name</TableHeaderCell>
              <TableHeaderCell>Description</TableHeaderCell>
              <TableHeaderCell>Type</TableHeaderCell>
              <TableHeaderCell>Contacts</TableHeaderCell>
              <TableHeaderCell>Actions</TableHeaderCell>
            </tr>
          </TableHeader>
          <TableBody>
            {renderTableContent()}
          </TableBody>
        </Table>
      </TableContainer>
      
      <CreateNewListModal 
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />
      
      <ViewEmailListModal 
        isOpen={isViewModalOpen}
        onClose={() => {
          setIsViewModalOpen(false);
          setSelectedEmailList(null);
        }}
        onListUpdated={fetchEmailLists}
        emailList={selectedEmailList}
      />
    </Container>
  );
};

export default MailingListsTable; 