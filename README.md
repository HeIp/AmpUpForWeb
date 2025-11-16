# AmpUp For Web

A React-based web application for managing EV chargers with the AmpUp API.

## Getting Started

### Prerequisites
- Node.js (v14 or higher)
- npm

### Installation

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm run dev
```

The application will be available at `http://localhost:5173`

### Building for Production

```bash
npm run build
```

### Features

- User authentication with AmpUp API
- Responsive login interface
- Session management with token storage
- Dashboard displaying session information
- Tailwind CSS for styling
- Icon components using lucide-react

### Architecture

- **Vite**: Fast build tool and dev server
- **React 18**: UI framework
- **Tailwind CSS**: Utility-first CSS framework
- **lucide-react**: Icon library

### Environment

The app connects to `https://main.ampupapis.com/login` for authentication.
Theres no web app for AmpUp charges - This is my solution
