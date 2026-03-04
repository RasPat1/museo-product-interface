import { createBrowserRouter } from 'react-router';
import { Home } from './pages/Home';
import { Exhibits } from './pages/Exhibits';
import { CalendarPage } from './pages/CalendarPage';

export const router = createBrowserRouter([
  {
    path: '/',
    Component: Home,
  },
  {
    path: '/exhibits',
    Component: Exhibits,
  },
  {
    path: '/calendar',
    Component: CalendarPage,
  },
]);
