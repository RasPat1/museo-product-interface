import { RouterProvider } from 'react-router';
import { router } from './routes';
import { CurationProvider } from './context/CurationContext';

export default function App() {
  return (
    <CurationProvider>
      <RouterProvider router={router} />
    </CurationProvider>
  );
}
