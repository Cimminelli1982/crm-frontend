import React from 'react';
import Layout from '../components/layout/Layout';
import RecentContactsList from '../components/contacts/RecentContactsList';

const Contacts = () => {
  return (
    <Layout>
      <h1>Contacts</h1>
      <RecentContactsList />
    </Layout>
  );
};

export default Contacts;
