import React from 'react';
import Layout from '../components/layout/Layout';
import NotificationsList from '../components/contacts/NotificationsList';

const NewContacts = () => {
  return (
    <Layout>
      <h1>New Contacts</h1>
      <NotificationsList />
    </Layout>
  );
};

export default NewContacts;