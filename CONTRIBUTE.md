# Contributing Guide

Welcome! This project follows a clean, organized structure using **React with TypeScript** and follows modern frontend architecture patterns. To maintain clarity, consistency, and scalability, please follow the rules and guidelines outlined below before contributing.

> ✨ Tip: When unsure, refer to a similar component or file and follow its structure and conventions.

---

## 🔧 Project Structure

```
src/
├── components/       # Reusable UI components
│   ├── TVChart/     # TradingView chart components
│   ├── common/      # Shared UI elements
│   └── layout/      # Layout components
├── store/           # Redux store configuration
│   ├── slices/      # Redux toolkit slices
│   └── hooks/       # Custom Redux hooks
├── services/        # API and external service integrations
├── utils/           # Helper functions and utilities
├── types/           # TypeScript type definitions
└── pages/           # Main application pages/routes
```

---

## 🎨 Component Layer (`src/components/`)

- Each component must be in its own directory
- Component directories should include:
  - Main component file (index.tsx)
  - Styles file (index.css)
  - Types file (types.ts) if needed
  - Tests file (*.test.tsx)
- Component conventions:
  - Use **PascalCase** for component names
  - Use **functional components** with hooks
  - Implement proper TypeScript interfaces
  - Include JSDoc comments for complex components

---

## 📦 Store Layer (`src/store/`)

- Uses Redux Toolkit for state management
- Organized in slices for different domains
- Conventions:
  - Keep slices focused and minimal
  - Use proper TypeScript types for state
  - Implement selectors for data access
  - Use RTK Query for API integrations

---

## 🔌 Services Layer (`src/services/`)

- Contains API integration logic
- Each service should:
  - Have its own file
  - Use TypeScript interfaces
  - Implement error handling
  - Use axios or fetch consistently

---

## 🛠 Utils Layer (`src/utils/`)

- Contains shared helper functions
- Each utility file should:
  - Be focused on a specific domain
  - Be fully typed with TypeScript
  - Include proper documentation
  - Be pure functions when possible

---

## ✅ General Coding Guidelines

- ✅ Use **camelCase** for variables and functions
- ✅ Use **PascalCase** for components and interfaces
- ✅ Use **TypeScript** for all new code
- ✅ Include proper type definitions
- ✅ Write unit tests for components
- ✅ Use proper CSS naming conventions
- ✅ Follow ESLint and Prettier configurations
- ✅ Implement responsive design practices
- ✅ Use CSS modules or styled-components for styling
- ✅ Keep components small and focused

---

## 🎨 Styling Guidelines

- Use Tailwind CSS for styling
- Follow mobile-first approach
- Keep styles modular and reusable
- Use CSS variables for theming
- Implement dark/light theme support

---

## 📈 Chart Components

When working with chart components:
- Follow TradingView Lightweight Charts API guidelines
- Implement proper theme switching
- Handle resize events efficiently
- Implement proper cleanup in useEffect

Example usage:
```tsx
import { ChartComponent } from 'components/TVChart';

const MyChart = () => {
  return (
    <ChartComponent
      theme="light"
      symbol="AAPL"
      interval="1D"
    />
  );
};
```

---

## 🧪 Testing

- Write tests using React Testing Library
- Test component rendering
- Test user interactions
- Test Redux state changes
- Test API integrations

Example test:
```tsx
import { render, screen } from '@testing-library/react';
import { MyComponent } from './MyComponent';

test('renders component correctly', () => {
  render(<MyComponent />);
  expect(screen.getByText('Expected Text')).toBeInTheDocument();
});
```

---

## 🚀 Getting Started

1. Clone the repository
2. Install dependencies: `npm install`
3. Start development server: `npm run dev`
4. Run tests: `npm test`
5. Build: `npm run build`