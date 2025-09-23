# CRM Pro - Advanced Customer Relationship Management

A modern, responsive CRM application built with React, featuring a comprehensive navigation system and advanced contact management capabilities.

## 🚀 Features

### Navigation System
- **Responsive Design**: Optimized for mobile, tablet, and desktop
- **Mobile**: Bottom navigation bar with 5 icons + labels
- **Tablet**: Left sidebar with collapsible functionality
- **Desktop**: Left sidebar with hover tooltips when collapsed
- **Theme Support**: Light and dark mode with persistent preferences

### Core Pages

#### 1. **Inbox** (`/inbox`)
- New contacts that need categorization
- Smart priority scoring based on completeness and recency
- Quick categorization buttons
- Bulk contact management with spam protection

#### 2. **Last Interactions** (`/interactions`)
- Shows recent contact activity (last 30 days)
- Auto-refreshes every 60 seconds
- Sorted by interaction recency
- Quick action buttons for follow-ups

#### 3. **Search** (`/search`)
- Advanced contact search by name, company, role, email, phone
- Real-time search with debouncing
- Detailed contact profiles with full information
- Obsidian notes integration

#### 4. **Keep in Touch** (`/keep-in-touch`)
- Automated follow-up reminders
- Frequency-based scheduling (Weekly, Monthly, Quarterly, etc.)
- Snooze functionality
- Priority indicators based on overdue status
- Mark as done with interaction tracking

#### 5. **Trash** (`/trash`)
- Review contacts marked as spam or skip
- Category-based filtering (Skip, WhatsApp Group Contact, System)
- Restore functionality with category selection
- Permanent deletion with associated data cleanup

## 🛠️ Technical Stack

### Frontend
- **React 18** with functional components and hooks
- **React Router v6** for client-side routing
- **Styled Components** for CSS-in-JS styling
- **React Hot Toast** for notifications
- **React Modal** for modal dialogs
- **React Icons (Feather Icons)** for consistent iconography

### Database Integration
- **Supabase** for backend services
- **PostgreSQL** database with advanced querying
- **Real-time subscriptions** for live updates
- **Row Level Security (RLS)** for data protection

### Design System
- **Color Palette**:
  - Primary: Blue (#3B82F6 light, #60A5FA dark)
  - Secondary: Emerald (#10B981 light, #34D399 dark)
  - Error: Red (#EF4444 light, #F87171 dark)
  - Neutrals: Carefully selected for accessibility
- **Typography**: Inter font family for modern readability
- **Responsive Breakpoints**: Mobile (<768px), Tablet (768-1024px), Desktop (>1024px)

## 🚀 Getting Started

### Prerequisites
- Node.js >= 20.18.1
- Yarn package manager
- Supabase account and project setup

### Installation

1. **Install dependencies**:
   ```bash
   yarn install
   ```

2. **Environment setup**:
   - Ensure your Supabase configuration is set up in `src/lib/supabaseClient.js`
   - Configure any environment variables as needed

3. **Development server**:
   ```bash
   # Start the new CRM development server
   yarn new-crm:dev

   # Or start without auto-opening browser
   yarn new-crm:start
   ```

4. **Production build**:
   ```bash
   yarn new-crm:build
   ```

### Available Scripts

- `yarn new-crm:start` - Start development server on port 3001
- `yarn new-crm:dev` - Start development server and open browser
- `yarn new-crm:build` - Create production build

## 📱 Responsive Design

### Mobile (< 768px)
- Bottom navigation bar with 5 main sections
- Touch-optimized interface
- Swipe gestures support
- Full-screen modal experiences

### Tablet (768px - 1024px)
- Left sidebar navigation
- Collapsible menu for more content space
- Touch and mouse interaction support
- Optimal layout for both portrait and landscape

### Desktop (> 1024px)
- Left sidebar with collapse/expand functionality
- Hover tooltips when collapsed
- Keyboard shortcuts support
- Multi-column layouts for efficiency

## 🎨 Theme System

### Light Mode
- Clean, professional appearance
- High contrast for accessibility
- Optimized for office environments

### Dark Mode
- Reduced eye strain for extended use
- Modern aesthetic
- Battery saving for OLED devices

Theme preference is automatically saved and restored across sessions.

## 🗄️ Database Schema

The application works with the following key tables:

### Core Tables
- `contacts` - Main contact records
- `contact_emails` - Email addresses for contacts
- `contact_mobiles` - Phone numbers for contacts
- `contact_companies` - Company relationships
- `contact_tags` - Contact categorization
- `contact_cities` - Location information

### Activity Tables
- `interactions` - Contact interaction history
- `keep_in_touch` - Follow-up scheduling
- `emails` - Email communications
- `meetings` - Meeting records

### Utility Tables
- `emails_spam` - Spam email filtering
- `whatsapp_spam` - WhatsApp spam filtering

## 🔧 Configuration

### Navigation Configuration
Navigation items are configured in `src/components/NewNavigation.js`:

```javascript
const navigationItems = [
  {
    id: 'inbox',
    label: 'Inbox',
    icon: FiInbox,
    path: '/inbox',
    description: 'New contacts to categorize'
  },
  // ... more items
];
```

### Theme Configuration
Theme colors are defined in the styled components and can be customized throughout the application.

### Route Configuration
Routes are managed in `src/NewCRMApp.js` using React Router:

```javascript
<Routes>
  <Route path="/" element={<Navigate to="/search" replace />} />
  <Route path="/inbox" element={<InboxPage theme={theme} />} />
  <Route path="/interactions" element={<StandaloneInteractions theme={theme} />} />
  // ... more routes
</Routes>
```

## 📊 Features Deep Dive

### Smart Contact Prioritization
The Inbox page uses a sophisticated scoring algorithm:
- Recent interactions (+3 points for last 7 days)
- Profile completeness (job role, company, contact info)
- Data freshness and quality indicators

### Advanced Search
- Real-time search with 300ms debouncing
- Multi-field searching (name, company, role, email, phone)
- Search history with localStorage persistence
- Intelligent result ranking

### Follow-up Management
- Automated scheduling based on frequency settings
- Visual priority indicators (Critical, High, Medium, Due, Soon)
- Snooze functionality with customizable durations
- Integration with interaction tracking

### Data Integrity
- Comprehensive deletion workflows with user confirmation
- Spam list management to prevent re-importing unwanted contacts
- Associated data cleanup (interactions, emails, notes, etc.)
- Backup and recovery considerations

## 🔒 Security

- Row Level Security (RLS) enforced at database level
- Client-side data validation
- Secure API endpoints
- No sensitive data in localStorage
- HTTPS-only in production

## 🚀 Performance

- Code splitting for optimal loading
- Lazy loading of components
- Efficient re-rendering with React.memo
- Debounced search queries
- Optimized database queries with proper indexing

## 📈 Analytics & Monitoring

- Error boundary implementation
- Performance monitoring hooks
- User interaction tracking (where appropriate)
- Database query optimization

## 🤝 Integration Points

### Obsidian Notes
- Direct integration with Obsidian vault
- Advanced URI protocol for note creation
- Automatic filename generation

### External Systems
- Prepared for HubSpot integration
- Email system integration
- WhatsApp Business API ready

## 🔄 Data Migration

The system includes utilities for:
- Contact deduplication
- Data validation and cleanup
- Bulk import/export operations
- Schema migration support

## 📝 Development Guidelines

### Code Style
- Functional components with hooks
- Styled Components for styling
- Consistent naming conventions
- Comprehensive error handling

### Component Structure
```
src/
├── components/          # Reusable UI components
├── pages/              # Page-level components
├── lib/                # Utilities and configurations
├── hooks/              # Custom React hooks (future)
└── utils/              # Helper functions (future)
```

## 🐛 Troubleshooting

### Common Issues

1. **Navigation not working**: Check React Router basename configuration
2. **Supabase connection errors**: Verify environment variables and network connectivity
3. **Theme not persisting**: Check localStorage permissions
4. **Mobile layout issues**: Verify viewport meta tag and CSS media queries

### Debug Mode
Enable debug logging by setting localStorage item:
```javascript
localStorage.setItem('crm-debug', 'true');
```

## 🚦 Deployment

### Production Build
```bash
yarn new-crm:build
```

### Deployment Targets
- Netlify (recommended)
- Vercel
- Traditional hosting with SPA support
- Docker containerization ready

### Environment Variables
Ensure proper configuration for:
- Supabase URL and keys
- API endpoints
- Feature flags

## 🎯 Future Roadmap

### Planned Features
- [ ] Advanced filtering and sorting
- [ ] Bulk operations interface
- [ ] Custom field support
- [ ] Advanced reporting dashboard
- [ ] Mobile app (React Native)
- [ ] Offline mode with sync
- [ ] Advanced analytics
- [ ] Team collaboration features
- [ ] API rate limiting and caching
- [ ] Automated testing suite

### Technical Improvements
- [ ] Progressive Web App (PWA) support
- [ ] Service Worker implementation
- [ ] Advanced error boundary reporting
- [ ] Performance monitoring dashboard
- [ ] Accessibility audit and improvements
- [ ] Internationalization (i18n) support

## 📄 License

This project is proprietary software. All rights reserved.

## 👥 Support

For technical support or feature requests:
1. Check the troubleshooting section
2. Review the codebase documentation
3. Contact the development team

---

**Built with ❤️ using modern web technologies for optimal user experience across all devices.**