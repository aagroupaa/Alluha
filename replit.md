# Overview

Allura is a multi-niche forum application built with React/TypeScript frontend and Express.js backend. The platform supports categorized discussions with features like post creation, commenting, real-time notifications, and user reputation systems. The application is designed for professional communities with integrated Replit authentication.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
- **Framework**: React 18 with TypeScript, using Vite as the build tool
- **Routing**: Wouter for lightweight client-side routing
- **State Management**: TanStack Query (React Query) for server state management and caching
- **UI Components**: Radix UI primitives with shadcn/ui component library
- **Styling**: Tailwind CSS with CSS custom properties for theming
- **Rich Text Editor**: TipTap for post and comment content creation
- **Real-time Communication**: WebSocket connection for live notifications and updates

## Backend Architecture
- **Framework**: Express.js with TypeScript
- **Database**: PostgreSQL with Drizzle ORM for type-safe database operations
- **Authentication**: Replit OpenID Connect (OIDC) integration with Passport.js
- **Session Management**: Express session with PostgreSQL session store
- **WebSocket Server**: Built-in WebSocket server for real-time features
- **File Structure**: Modular approach with separate routing, storage, and authentication layers

## Database Design
- **Users Table**: Stores user profiles with reputation system
- **Categories Table**: Forum categories with post/member counts and customizable icons/colors
- **Posts Table**: Forum posts with content, metadata, and category relationships
- **Comments Table**: Hierarchical comment system with parent-child relationships
- **Engagement Tables**: Separate tables for post likes, comment likes, and notifications
- **Reports Table**: Content moderation system for user reports
- **Sessions Table**: Secure session storage for authentication persistence

## Authentication & Authorization
- **Provider**: Replit OIDC for seamless integration with Replit environment
- **Session Strategy**: Server-side sessions with PostgreSQL storage
- **Security**: HTTP-only cookies, CSRF protection, and secure session configuration
- **User Management**: Automatic user creation/updates from OIDC claims

## Real-time Features
- **WebSocket Integration**: Custom WebSocket provider for live updates
- **Notification System**: Real-time notifications for likes, comments, and mentions
- **Connection Management**: Automatic reconnection with exponential backoff
- **Message Broadcasting**: Targeted notifications to specific users

## API Design
- **RESTful Endpoints**: Standard CRUD operations for posts, comments, and categories
- **Error Handling**: Centralized error middleware with consistent response format
- **Request Validation**: Zod schema validation for type safety
- **Response Caching**: Query-based caching with React Query on frontend

# External Dependencies

## Database & ORM
- **Neon Database**: Serverless PostgreSQL database hosting
- **Drizzle ORM**: Type-safe database operations and migrations
- **Connection Pooling**: Neon serverless connection pooling for scalability

## Authentication
- **Replit OIDC**: OpenID Connect integration for user authentication
- **Passport.js**: Authentication middleware for Express
- **OpenID Client**: OIDC client library for token management

## UI & Styling
- **Radix UI**: Headless UI components for accessibility and customization
- **Tailwind CSS**: Utility-first CSS framework
- **Shadcn/ui**: Pre-built component library built on Radix UI
- **Lucide React**: Icon library for consistent iconography

## Development Tools
- **Vite**: Fast development server and build tool
- **TypeScript**: Type safety across frontend and backend
- **ESBuild**: Fast JavaScript bundler for production builds
- **React Query Devtools**: Development tools for debugging queries

## Real-time & Communication
- **WebSocket (ws)**: WebSocket library for real-time communication
- **TanStack Query**: Server state management and synchronization

## Form & Validation
- **React Hook Form**: Form state management and validation
- **Zod**: Runtime type checking and schema validation
- **Hookform Resolvers**: Integration between React Hook Form and Zod

## Date & Time
- **date-fns**: Modern date utility library for formatting and manipulation