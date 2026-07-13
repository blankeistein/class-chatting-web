# Dokumen Desain Sistem - Class Chatting Web

## 1. Overview

**Class Chatting Web** adalah platform manajemen konten edukasi berbasis web yang mendukung multiple aplikasi mobile. Platform ini menyediakan sistem manajemen buku digital, video pembelajaran, kode aktivasi, dan manajemen pengguna dengan integrasi Firebase untuk autentikasi dan penyimpanan data.

### 1.1 Tujuan Sistem

- Menyediakan backend dan admin panel untuk multiple aplikasi mobile edukasi
- Mengelola konten digital (buku dan video) dengan sistem aktivasi berbasis kode
- Integrasi seamless dengan Firebase untuk autentikasi dan real-time database
- Mendukung multiple aplikasi dengan konten yang berbeda-beda

### 1.2 Target Pengguna

- **Admin**: Mengelola seluruh sistem, pengguna, dan konten
- **Staff**: Mengelola konten dan pengguna
- **Teacher**: Mengelola video dan melihat data siswa
- **User/Student**: Mengakses konten yang telah diaktivasi

## 2. Teknologi Stack

### 2.1 Backend
- **Framework**: Laravel 12.x (PHP 8.3)
- **Database**: MySQL
- **Authentication**: Laravel Auth + Firebase Authentication
- **Queue**: Database Queue Driver
- **Cache**: Database Cache Driver
- **API Documentation**: Scramble (OpenAPI)

### 2.2 Frontend
- **Framework**: React 19 dengan TypeScript
- **SPA Framework**: Inertia.js v2
- **UI Library**: Material Tailwind React, Tailwind CSS v3
- **State Management**: Zustand
- **Icons**: Lucide React
- **Charting**: Recharts
- **Routing**: Ziggy (Laravel route helpers for JavaScript)

### 2.3 External Services
- **Firebase**: Authentication, Firestore, Cloud Storage, Realtime Database
- **Google Cloud Firestore**: Manajemen dokumen Firebase
- **Sentry**: Error tracking dan monitoring
- **HLS Streaming**: External HLS service untuk video streaming

### 2.4 Development Tools
- **Package Manager**: NPM/Bun, Composer
- **Build Tool**: Vite
- **Code Formatter**: Laravel Pint
- **Testing**: Pest (PHP)
- **Laravel Dev Tools**: Laravel Boost, Laravel Pail, Laravel Sail

## 3. Arsitektur Sistem

### 3.1 Pola Arsitektur

```
┌─────────────────────────────────────────────────────────────┐
│                       Client Layer                          │
│  (React + Inertia.js + Firebase SDK)                       │
└────────────┬──────────────────────────────────┬─────────────┘
             │                                  │
             │ Inertia Requests                 │ REST API
             │                                  │
┌────────────▼──────────────────────────────────▼─────────────┐
│                   Application Layer                         │
│        (Laravel Controllers + Middleware)                   │
├─────────────────────────────────────────────────────────────┤
│                   Business Logic Layer                      │
│      (Models, Services, Form Requests, Enums)              │
├─────────────────────────────────────────────────────────────┤
│                   Data Layer                                │
│  MySQL Database  │  Firebase  │  Cloud Storage             │
└─────────────────────────────────────────────────────────────┘
```

### 3.2 Routing Architecture

#### Web Routes (Inertia.js)
- `/` - Landing page
- `/login` - Authentication
- `/user/*` - User dashboard dan konten
- `/teacher/*` - Teacher dashboard
- `/admin/*` - Admin panel (protected)
- `/admin/apps/*` - App-specific management

#### API Routes (REST)
- `/api/v1/*` - Legacy API (backward compatibility)
- `/api/v2/*` - Modern API dengan Firebase authentication
- `/private-api/{api_key}/*` - Internal API untuk integrasi
- `/api/firebase/*` - Firebase webhook handlers

## 4. Database Schema

### 4.1 Core Tables

#### Users
```sql
- id (PK)
- firebase_uid (unique, nullable)
- username (unique, nullable)
- name
- email (unique)
- email_verified_at
- password
- avatar
- phone
- role (enum: admin, staff, teacher, student, user)
- is_active (boolean)
- remember_token
- timestamps
- soft_deletes
```

#### Books
```sql
- id (PK)
- uuid (unique)
- title
- type (enum: materi, penilaian)
- cover_url
- tags (json)
- url
- version
- timestamps
- soft_deletes
```

#### Videos
```sql
- id (PK)
- uuid (unique)
- title
- description
- thumbnail_url
- url (HLS stream URL)
- tags (json)
- uploaded_by (FK: users)
- duration
- timestamps
- soft_deletes
```

#### Activation Codes
```sql
- id (PK)
- code (unique)
- user_id (FK: users.firebase_uid, nullable)
- type (string, untuk kategorisasi)
- tier (enum: bronze, silver, gold, platinum)
- times_activated (integer)
- max_activated (integer, nullable untuk unlimited)
- activated_at (datetime, nullable)
- activated_in (FK: activation_items, nullable)
- created_by (FK: users)
- is_active (boolean)
- timestamps
- soft_deletes
```

### 4.2 Relationship Tables

#### User Books (Many-to-Many)
```sql
- id (PK)
- user_id (FK: users)
- book_id (FK: books)
- timestamps
```

#### Activation Items (Polymorphic)
```sql
- id (PK)
- activation_code_id (FK: activation_codes)
- model_type (morphable)
- model_id (morphable)
- timestamps
```

#### Book Integrations
```sql
- id (PK)
- book_id (FK: books)
- app_name (string)
- firebase_collection (string)
- firebase_document_id (string)
- metadata (json)
- timestamps
```

### 4.3 Supporting Tables

#### Regions
- Provinces
- Regencies (Kabupaten/Kota)
- Districts (Kecamatan)
- Villages (Kelurahan/Desa)

#### Schools
```sql
- id (PK)
- code (unique)
- old_code
- npsn
- name
- bentuk_pendidikan
- status
- province_id (FK)
- regency_id (FK)
- district_id (FK)
- village_id (FK)
- address
- rt, rw, postcode
- latitude, longitude
- timestamps
```

#### User Metadata (Key-Value Store)
```sql
- id (PK)
- user_id (FK: users)
- key
- value (text)
- timestamps
```

#### Video Views (Analytics)
```sql
- id (PK)
- video_id (FK: videos)
- user_id (FK: users, nullable)
- firebase_uid (nullable)
- watched_duration (integer, seconds)
- completed (boolean)
- timestamps
```

#### Settings (Key-Value Config)
```sql
- id (PK)
- key (unique)
- value (text)
- type (string)
- description
- timestamps
```

### 4.4 Database Indexes

**Performance Indexes:**
- `users`: firebase_uid, email, username, role
- `books`: uuid, type
- `videos`: uuid
- `activation_codes`: code, user_id, tier, is_active
- `schools`: code, npsn, province_id, regency_id, district_id
- `user_books`: user_id, book_id
- `video_views`: video_id, user_id, firebase_uid

## 5. Fitur Utama

### 5.1 Autentikasi & Autorisasi

#### Autentikasi
- **Login tradisional**: Email & password dengan Laravel Auth
- **Firebase Google Sign-In**: OAuth via Firebase untuk mobile apps
- **Firebase ID Token**: Bearer token authentication untuk API v2
- **Email verification**: Laravel built-in email verification
- **Password reset**: Laravel built-in password reset flow

#### Autorisasi (Role-Based)
- **Admin**: Full access ke semua fitur
- **Staff**: Manajemen users dan content
- **Teacher**: Manajemen video dan view students
- **User/Student**: Access konten yang diaktivasi

#### Middleware
- `AdminMiddleware`: Cek role admin/staff
- `EnsureFirebaseIdToken`: Validasi Firebase ID token untuk API
- `EnsureFirebaseWebhookSecret`: Validasi Firebase webhook
- `EnsurePrivateApiKey`: Validasi private API key

### 5.2 Manajemen Konten

#### Buku Digital
- Upload dan manajemen buku (PDF/EPUB)
- Kategorisasi: Materi dan Penilaian
- Tagging untuk filtering
- Versioning untuk update konten
- UUID-based identification untuk cross-platform support
- Integration dengan Firebase Firestore per aplikasi
- Bulk operations (import, export, delete)

#### Video Pembelajaran
- Upload video dengan processing async
- HLS streaming integration untuk adaptive bitrate
- Thumbnail management
- Tagging dan kategorisasi
- View analytics per video
- Job monitoring untuk video processing
- Duration tracking

#### Kode Aktivasi
- Generate kode aktivasi dengan tier system (Bronze, Silver, Gold, Platinum)
- Polymorphic relationship: bisa untuk Book atau Video
- Multi-activation support (max_activated)
- Per-user activation tracking
- Bulk generation dan export
- Activation history dan analytics
- Toggle active/inactive

### 5.3 Multiple Apps Management

Platform mendukung 4 aplikasi berbeda:
1. **Class Chatting**
2. **Anak Indonesia Menghafal**
3. **Class Chatting For Kids**
4. **Class Chatting Layar Lebar**

#### Per-App Features
- Dedicated Firebase collection per app
- Book items management dengan Firestore
- Category management
- Lock/unlock content
- Reordering content (drag & drop)
- Settings per aplikasi
- Real-time Database (RTDB) view

#### Integration Pattern
```
Laravel MySQL ←→ BookIntegration ←→ Firebase Firestore
   (Book)            (Mapping)          (App Data)
```

### 5.4 Manajemen Pengguna

#### Admin Features
- CRUD users dengan role assignment
- Bulk delete users
- View user's activated books
- User activation history
- Search dan filtering (name, email, username, firebase_uid, role)
- Soft delete support

#### User Metadata System
- Flexible key-value storage
- Helper methods: `getMeta()`, `setMeta()`
- Per-user customization tanpa schema changes

### 5.5 Regional & School Data

#### Indonesian Regional Data
- 4-level hierarchy: Province → Regency → District → Village
- API endpoints untuk mobile apps
- Cascading dropdown support
- Search functionality

#### School Database
- Import dari CSV/Excel
- NPSN (Nomor Pokok Sekolah Nasional) tracking
- Geo-coordinates support
- School type dan status
- Full regional integration
- Bulk operations

### 5.6 Notifikasi

#### Database Notifications
- User notifications
- Mark as read/unread
- Mark all as read
- Delete notifications
- Notification count badge

### 5.7 API & Integration

#### Public API (v1, v2)
- Book activation
- Activation level check
- Video view tracking
- Regional data access
- School data access

#### Private API
- Internal service integration
- API key authentication
- Custom endpoints untuk tools

#### Firebase Webhooks
- User creation webhook
- Video HLS URL update
- Real-time sync dengan Firebase

#### API Documentation
- Auto-generated via Scramble
- Interactive UI di `/docs/api`
- OpenAPI 3.0 JSON export
- AI/LLM-friendly documentation

## 6. Firebase Integration

### 6.1 Services Used

#### Firebase Authentication
- Google Sign-In provider
- Custom token generation di Laravel
- UID sync dengan MySQL users table

#### Cloud Firestore
- Book content per aplikasi
- Hierarchical data structure
- Real-time updates
- Collection per app

#### Realtime Database (RTDB)
- Legacy data support
- Real-time sync untuk beberapa features

#### Cloud Storage
- Book files (PDF/EPUB)
- Video files (sebelum HLS processing)
- User avatars
- Thumbnails

### 6.2 Data Sync Pattern

```
Mobile App → Firebase Auth → Laravel API
                  ↓              ↓
            Firestore ←→ MySQL (BookIntegration)
                              ↓
                         Queue Jobs
```

### 6.3 Firebase Admin SDK
- Server-side Firebase operations
- User management
- Token verification
- Firestore CRUD operations

## 7. Security

### 7.1 Authentication Security
- Password hashing dengan bcrypt (12 rounds)
- Firebase ID token validation
- Webhook secret verification
- API key untuk private endpoints
- Rate limiting pada auth endpoints

### 7.2 Authorization
- Role-based access control (RBAC)
- Route-level middleware protection
- Method-level authorization checks
- Firebase UID verification

### 7.3 Data Protection
- Soft deletes untuk sensitive data
- SQL injection protection via Eloquent ORM
- XSS protection via Blade/React escaping
- CSRF protection untuk web routes
- API throttling (60-1000 req/min depending on endpoint)

### 7.4 File Upload Security
- File type validation
- Size limits
- Storage path randomization
- Public/private storage separation

### 7.5 Environment Security
- `.env` untuk sensitive config
- Firebase credentials file
- API keys dan secrets
- Sentry DSN untuk error tracking

## 8. Performance & Scalability

### 8.1 Database Optimization
- Strategic indexes pada high-traffic queries
- Eager loading untuk N+1 prevention
- Pagination untuk large datasets
- Database caching

### 8.2 Caching Strategy
- Database cache driver
- Settings cache via Artisan command
- Query result caching
- Route caching (production)

### 8.3 Queue System
- Async video processing
- Email notifications queue
- Long-running tasks offload
- Job monitoring

### 8.4 Asset Optimization
- Vite untuk bundling & minification
- Code splitting
- Lazy loading untuk large components
- CDN-ready static assets

### 8.5 API Performance
- Rate limiting per endpoint
- Pagination untuk list endpoints
- Selective field loading
- Response caching

## 9. Development Workflow

### 9.1 Local Development

#### Setup Commands
```bash
# Install dependencies
composer install
npm install

# Environment setup
cp .env.example .env
php artisan key:generate

# Database
php artisan migrate
php artisan db:seed

# Development server
composer run dev
# atau
php artisan serve & php artisan queue:listen & npm run dev
```

#### Firebase Setup
1. Download `firebase-credentials.json`
2. Set environment variables untuk Firebase config
3. Set webhook secret

### 9.2 Code Quality

#### Laravel Pint
```bash
vendor/bin/pint --dirty --format agent
```

#### Testing dengan Pest
```bash
php artisan test --compact
php artisan test --filter=TestName
```

### 9.3 Deployment

#### Build Process
```bash
# Production build
npm run build

# Pack for cPanel
composer run pack
# atau dengan vendor
composer run pack:vendor
```

#### Deployment Checklist
- Environment configuration
- Database migrations
- Queue worker setup
- Storage permissions
- Sentry configuration
- Firebase credentials

## 10. UI/UX Design

### 10.1 Design System

#### Tema
- **Primary**: Material Tailwind preset
- **Typography**: System fonts dengan Tailwind typography
- **Icons**: Lucide React icon set
- **Color Palette**: Tailwind default + custom colors

#### Responsive Breakpoints
- Mobile: < 640px
- Tablet: 640px - 1024px
- Desktop: > 1024px

### 10.2 Layout Structure

#### Admin Panel
```
┌─────────────────────────────────────────┐
│           Top Navigation Bar            │
├────────┬────────────────────────────────┤
│ Side   │                                │
│ bar    │      Main Content Area         │
│ Menu   │                                │
│        │                                │
└────────┴────────────────────────────────┘
```

#### User Dashboard
```
┌─────────────────────────────────────────┐
│           Header with Profile           │
├─────────────────────────────────────────┤
│                                         │
│       Card-based Content Grid           │
│                                         │
└─────────────────────────────────────────┘
```

### 10.3 Key UI Components

#### Admin Components
- DataTable dengan sorting, filtering, pagination
- Modal forms untuk CRUD operations
- Drag & drop untuk reordering
- File upload dengan preview
- Rich text editor untuk descriptions
- Chart components untuk analytics

#### User Components
- Book card grid
- Video player dengan HLS support
- Activation code input
- Profile management
- Notification center

### 10.4 User Flows

#### Aktivasi Buku Flow
```
Input Kode → Validasi → Cek Tier & Limit → 
Assign ke User → Sync Firebase → Success
```

#### Upload Video Flow
```
Pilih File → Upload → Create Job → 
Processing (Queue) → HLS Conversion → 
Update URL → Complete
```

## 11. Monitoring & Logging

### 11.1 Error Tracking
- **Sentry**: Real-time error tracking
- **Laravel Log**: File-based logging
- **Laravel Pail**: Real-time log viewing

### 11.2 Analytics
- Video view tracking
- User activation analytics
- Content usage statistics
- API usage metrics

### 11.3 Job Monitoring
- Queue job status tracking
- Failed job handling
- Retry mechanism
- Job completion notifications

## 12. API Documentation

### 12.1 Documentation Struktur

#### Auto-Generated Docs
- **Location**: `/docs/api`
- **Format**: OpenAPI 3.0
- **Tool**: Scramble package

#### API Versioning
- **v1**: Legacy API (backward compatibility)
- **v2**: Modern API dengan Firebase auth
- **Private**: Internal API dengan API key

### 12.2 API Response Format

#### Success Response
```json
{
  "success": true,
  "data": { ... },
  "message": "Success message"
}
```

#### Error Response
```json
{
  "success": false,
  "message": "Error message",
  "errors": { ... }
}
```

### 12.3 Rate Limiting

| Endpoint Type | Rate Limit |
|---------------|------------|
| Auth | 60/min |
| Book Activation | 60/min |
| General API | 120/min |
| Firebase Webhook | 1000/min |
| V2 API | 500/min |

## 13. Testing Strategy

### 13.1 Testing Layers

#### Unit Tests
- Model methods
- Helper functions
- Enum behaviors
- Service classes

#### Feature Tests
- API endpoints
- Authentication flows
- CRUD operations
- Authorization checks
- File uploads
- Queue jobs

### 13.2 Testing Tools
- **Pest**: Test framework
- **Laravel Factories**: Test data generation
- **Database Seeding**: Test data setup
- **HTTP Testing**: API testing

### 13.3 Test Coverage Goals
- Critical paths: 100%
- Business logic: 80%+
- Controllers: 70%+
- Overall: 60%+

## 14. Future Enhancements

### 14.1 Planned Features
- [ ] Advanced analytics dashboard
- [ ] Content recommendation engine
- [ ] Multi-language support (i18n)
- [ ] Progressive Web App (PWA) support
- [ ] Offline mode untuk mobile apps
- [ ] Advanced search dengan Elasticsearch
- [ ] Real-time collaboration features
- [ ] Gamification system
- [ ] Certificate generation

### 14.2 Technical Improvements
- [ ] GraphQL API layer
- [ ] WebSocket untuk real-time features
- [ ] Redis untuk caching & sessions
- [ ] CDN integration
- [ ] Kubernetes deployment
- [ ] Microservices migration untuk scalability
- [ ] AI-powered content tagging
- [ ] Automated testing CI/CD

### 14.3 Integration Opportunities
- [ ] LMS platforms (Moodle, Canvas)
- [ ] Payment gateways (untuk premium content)
- [ ] Video conferencing (Zoom, Google Meet)
- [ ] Social media sharing
- [ ] Analytics platforms (Google Analytics, Mixpanel)
- [ ] Email marketing tools
- [ ] SMS notifications

## 15. Maintenance & Support

### 15.1 Regular Maintenance
- Database backup automation
- Log rotation dan cleanup
- Security updates
- Dependency updates
- Performance monitoring
- Failed job cleanup

### 15.2 Support Channels
- Admin email configuration untuk notifikasi
- Sentry alerts untuk critical errors
- Laravel Pail untuk real-time debugging
- Laravel Boost tools untuk development

### 15.3 Documentation Maintenance
- API documentation regeneration
- Changelog updates
- Developer guides
- User manuals

## 16. Referensi

### 16.1 External Documentation
- [Laravel 12](https://laravel.com/docs/12.x)
- [Inertia.js v2](https://inertiajs.com)
- [React 19](https://react.dev)
- [Firebase](https://firebase.google.com/docs)
- [Tailwind CSS](https://tailwindcss.com)
- [Material Tailwind](https://www.material-tailwind.com/docs/v3/)

### 16.2 Project Documentation
- `API_DOCUMENTATION.md`: API reference
- `AGENTS.md`: Laravel Boost guidelines
- `openapi.json`: OpenAPI specification
- `.env.example`: Environment configuration reference

### 16.3 Tools & Resources
- Laravel Boost MCP server
- Scramble API documentation generator
- Laravel Pint code formatter
- Pest testing framework

---

**Dokumen Version**: 1.0  
**Last Updated**: 2 Juli 2026  
**Maintained By**: Development Team
