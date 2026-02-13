import React from 'react';
import {
  PageContainer,
  MainContent,
} from '../../pages/CommandCenterPage.styles';
import DesktopHeader from './layout/DesktopHeader';
import DesktopLeftPanel from './layout/DesktopLeftPanel';
import DesktopCenterPanel from './layout/DesktopCenterPanel';
import DesktopRightPanel from './layout/DesktopRightPanel';

const DesktopLayout = ({
  theme,
  tabs,
  // Hook objects (identity-stable)
  dealsHook,
  introductionsHook,
  kitHook,
  calendarHook,
  whatsAppHook,
  dataIntegrityHook,
  emailActionsHook,
  rightPanelHook,
  contextContactsHook,
  notesHook,
  agentChatHook,
  todoistHook,
  chatHook,
  emailCompose,
  quickEditModal,
  profileImageModal,
  // Bundles
  emailThreads,
  localState,
  localHandlers,
  modalState,
}) => {
  return (
    <PageContainer theme={theme}>
      <DesktopHeader
        theme={theme}
        tabs={tabs}
        activeTab={localState.activeTab}
        setActiveTab={localState.setActiveTab}
      />
      <MainContent>
        <DesktopLeftPanel
          theme={theme}
          emailThreads={emailThreads}
          localState={localState}
          localHandlers={localHandlers}
          whatsAppHook={whatsAppHook}
          calendarHook={calendarHook}
          dealsHook={dealsHook}
          kitHook={kitHook}
          introductionsHook={introductionsHook}
          contextContactsHook={contextContactsHook}
          emailCompose={emailCompose}
          rightPanelHook={rightPanelHook}
          notesHook={notesHook}
        />
        <DesktopCenterPanel
          theme={theme}
          emailThreads={emailThreads}
          localState={localState}
          localHandlers={localHandlers}
          whatsAppHook={whatsAppHook}
          calendarHook={calendarHook}
          dealsHook={dealsHook}
          kitHook={kitHook}
          introductionsHook={introductionsHook}
          emailActionsHook={emailActionsHook}
          emailCompose={emailCompose}
          rightPanelHook={rightPanelHook}
          contextContactsHook={contextContactsHook}
          dataIntegrityHook={dataIntegrityHook}
          profileImageModal={profileImageModal}
          modalState={modalState}
          notesHook={notesHook}
        />
        <DesktopRightPanel
          theme={theme}
          emailThreads={emailThreads}
          localState={localState}
          localHandlers={localHandlers}
          whatsAppHook={whatsAppHook}
          calendarHook={calendarHook}
          dealsHook={dealsHook}
          kitHook={kitHook}
          introductionsHook={introductionsHook}
          dataIntegrityHook={dataIntegrityHook}
          rightPanelHook={rightPanelHook}
          chatHook={chatHook}
          agentChatHook={agentChatHook}
          emailCompose={emailCompose}
          quickEditModal={quickEditModal}
          profileImageModal={profileImageModal}
          modalState={modalState}
        />
      </MainContent>
    </PageContainer>
  );
};

export default DesktopLayout;
