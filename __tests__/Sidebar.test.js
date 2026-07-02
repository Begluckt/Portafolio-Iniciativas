import { render, screen } from '@testing-library/react';
import Sidebar from '../app/components/Sidebar';

// Mock Next.js router
jest.mock('next/navigation', () => ({
  usePathname: () => '/',
  useRouter: () => ({
    push: jest.fn(),
  }),
}));

describe('Sidebar Component', () => {
  it('renders correctly', () => {
    render(<Sidebar />);
    
    // Verifica que los enlaces principales estén presentes
    expect(screen.getByText('Portafolio')).toBeInTheDocument();
    expect(screen.getByText('Cerrar Sesión')).toBeInTheDocument();
  });
});
