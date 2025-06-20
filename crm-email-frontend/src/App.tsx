import { useState } from 'react'
import { Mail, List, Send, Settings } from 'lucide-react'
import { CreateEmailList } from './components/CreateEmailList'
import { CreateEmailListPage } from './pages/CreateEmailListPage'
import './App.css'

type Page = 'create-list' | 'create-list-advanced' | 'manage-lists' | 'send-campaign' | 'settings'

function App() {
  const [currentPage, setCurrentPage] = useState<Page>('create-list')

  const navigation = [
    { id: 'create-list', name: 'Create List (Simple)', icon: List },
    { id: 'create-list-advanced', name: 'Create List (Advanced)', icon: List },
    { id: 'manage-lists', name: 'Manage Lists', icon: Mail },
    { id: 'send-campaign', name: 'Send Email', icon: Send },
    { id: 'settings', name: 'Settings', icon: Settings },
  ] as const

  const renderPage = () => {
    switch (currentPage) {
      case 'create-list':
        return <CreateEmailList />
      case 'create-list-advanced':
        return <CreateEmailListPage />
      case 'manage-lists':
        return <div className="p-8 text-center text-matrix-text-dim font-matrix">List management coming soon...</div>
      case 'send-campaign':
        return <div className="p-8 text-center text-matrix-text-dim font-matrix">Campaign sending coming soon...</div>
      case 'settings':
        return <div className="p-8 text-center text-matrix-text-dim font-matrix">Settings coming soon...</div>
      default:
        return <CreateEmailList />
    }
  }

  return (
    <div className="min-h-screen bg-matrix-black font-matrix">
      {/* Header */}
      <header className="bg-matrix-black shadow-matrix border-b border-matrix-green">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-matrix-green rounded-none flex items-center justify-center border border-matrix-green-dark shadow-matrix">
                <Mail className="w-5 h-5 text-matrix-black" />
              </div>
              <h1 className="text-xl font-bold text-matrix-green font-matrix tracking-wider">
                CRM Email Marketing
              </h1>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="text-sm text-matrix-green font-matrix tracking-wide">
                Mass Email Sending System
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside className="w-64 bg-matrix-black shadow-matrix-lg min-h-screen border-r border-matrix-green">
          <nav className="p-4">
            <ul className="space-y-2">
              {navigation.map((item) => {
                const Icon = item.icon
                return (
                  <li key={item.id}>
                    <button
                      onClick={() => setCurrentPage(item.id)}
                      className={`w-full flex items-center space-x-3 px-3 py-2 text-left transition-all duration-300 font-matrix tracking-wide border ${
                        currentPage === item.id
                          ? 'bg-matrix-green text-matrix-black font-medium border-matrix-green shadow-matrix'
                          : 'text-matrix-green hover:bg-matrix-dark hover:text-matrix-green-light border-matrix-gray hover:border-matrix-green hover:shadow-matrix'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                      <span>{item.name}</span>
                    </button>
                  </li>
                )
              })}
            </ul>
          </nav>

          {/* Quick stats */}
          <div className="p-4 border-t border-matrix-green mt-8">
            <h3 className="text-sm font-medium text-matrix-green mb-3 font-matrix tracking-wider">
              Quick Stats
            </h3>
            <div className="space-y-2 text-sm text-matrix-text-dim font-matrix">
              <div className="flex justify-between">
                <span>Lists created:</span>
                <span className="font-medium text-matrix-green">0</span>
              </div>
              <div className="flex justify-between">
                <span>Emails sent:</span>
                <span className="font-medium text-matrix-green">0</span>
              </div>
              <div className="flex justify-between">
                <span>Open rate:</span>
                <span className="font-medium text-matrix-green">0%</span>
              </div>
            </div>
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 bg-matrix-black">
          {renderPage()}
        </main>
      </div>
    </div>
  )
}

export default App
