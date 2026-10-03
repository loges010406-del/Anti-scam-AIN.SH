// src/main.tsx
//
// Application entry point and provider composition (tasks.md 6.3).
//
// Provider order (outermost -> innermost):
//   ErrorBoundary  -> catches render errors anywhere below, offers "return to
//                     Check" (R30.1). Outermost so it also guards the providers.
//   I18nProvider   -> language + t() for the whole tree (R22).
//   <App/>         -> BrowserRouter + Routes.
//
// Later tasks add more providers INSIDE I18nProvider and AROUND <App/>:
//   - PreferencesProvider (tasks.md — preferences/theme)
//   - FamilyProvider      (tasks.md 19.1)
//   - QuizProvider        (tasks.md 22.2)
// They are intentionally NOT imported yet because those modules don't exist.
// When they land, nest them here, e.g.:
//   <I18nProvider>
//     <PreferencesProvider>
//       <FamilyProvider>
//         <QuizProvider>
//           <App />
//         </QuizProvider>
//       </FamilyProvider>
//     </PreferencesProvider>
//   </I18nProvider>
//
// _Requirements: 22.1, 23.4, 30.1_

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import { I18nProvider } from './context/I18nProvider';
import { ErrorBoundary } from './components/common';
import './index.css';

const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error('Root element #root not found');
}

createRoot(rootElement).render(
  <StrictMode>
    <ErrorBoundary>
      <I18nProvider>
        {/* Later: PreferencesProvider / FamilyProvider / QuizProvider wrap <App/> here. */}
        <App />
      </I18nProvider>
    </ErrorBoundary>
  </StrictMode>,
);
