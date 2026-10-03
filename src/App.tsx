// src/App.tsx
// Router + responsive AppShell. Check (the home route) loads eagerly so the
// core flow paints instantly; every other page is code-split with React.lazy
// so heavy deps (e.g. Recharts on Radar) only download when visited.
import { lazy } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AppShell, navItems } from './layouts/AppShell';
import CheckPage from './pages/CheckPage';

const CallCoachPage = lazy(() => import('./pages/CallCoachPage'));
const LearnPage = lazy(() => import('./pages/LearnPage'));
const FamilyPage = lazy(() => import('./pages/FamilyPage'));
const RadarPage = lazy(() => import('./pages/RadarPage'));
const SafetyCardPage = lazy(() => import('./pages/SafetyCardPage'));
const ReportPage = lazy(() => import('./pages/ReportPage'));
const AboutPage = lazy(() => import('./pages/AboutPage'));

export { navItems };

export default function App() {
  return (
    <BrowserRouter>
        <Routes>
          <Route element={<AppShell />}>
            <Route index element={<CheckPage />} />
            <Route path="call-coach" element={<CallCoachPage />} />
            <Route path="learn" element={<LearnPage />} />
            <Route path="family" element={<FamilyPage />} />
            <Route path="radar" element={<RadarPage />} />
            <Route path="safety-card" element={<SafetyCardPage />} />
            <Route path="report" element={<ReportPage />} />
            <Route path="about" element={<AboutPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
    </BrowserRouter>
  );
}

