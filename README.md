# Pokémon Team Builder

A modern, responsive web application for building and analyzing Pokémon teams across different game generations.

## Features

- **Game Selection**: Choose from 9 different Pokémon game generations
- **Team Building**: Build teams of up to 6 Pokémon with drag-and-drop or click-to-add
- **Type Analysis**: Real-time defensive coverage analysis showing team weaknesses and resistances
- **Responsive Design**: Works seamlessly on desktop, tablet, and mobile devices
- **Data Persistence**: Teams are automatically saved to local storage
- **Accessibility**: Full keyboard navigation and screen reader support

## Project Structure

The application is organized into logical modules for better maintainability:

```
src/
├── components/           # React components by feature
│   ├── game/            # Game selection components
│   ├── team/            # Team building components
│   └── ui/              # Reusable UI components
├── constants/           # Static data and configuration
├── data/               # Core data and API functions
├── hooks/              # Custom React hooks
├── utils/              # Utility functions
└── styles/             # CSS and styling
```

## Getting Started

1. Clone the repository
2. Install dependencies: `npm install`
3. Start the development server: `npm run dev`
4. Open your browser to `http://localhost:5173`

## Development

The codebase follows modern React patterns with:
- Functional components and hooks
- Custom hooks for complex state logic
- Separation of concerns with dedicated utility files
- Comprehensive documentation and comments
- Accessibility-first design principles

## Technology Stack

- **React 18** - Modern React with hooks
- **Vite** - Fast build tool and dev server
- **Tailwind CSS** - Utility-first CSS framework
- **@dnd-kit** - Modern drag and drop library
- **React Icons** - Icon library
- **ESLint** - Code linting and formatting

## Architecture Highlights

### Component Organization
Components are grouped by feature domain (game, team, ui) rather than by type, making the codebase easier to navigate and maintain.

### State Management
Uses React's built-in state management with custom hooks for complex logic, avoiding unnecessary complexity while maintaining clean separation of concerns.

### Data Layer
Separates constants, data, and utility functions into dedicated modules, making the code more testable and maintainable.

### Performance
Optimized for performance with proper use of React hooks, lazy loading, and efficient re-rendering patterns.

## Contributing

1. Follow the established project structure
2. Add proper JSDoc comments for new functions
3. Ensure accessibility compliance
4. Test on multiple screen sizes
5. Update documentation for significant changes

## License

This project is open source and available under the MIT License.
