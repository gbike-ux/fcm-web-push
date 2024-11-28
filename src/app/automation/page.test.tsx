import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/ui/use-toast';
import AutomationPage from './page';

// Mocks
jest.mock('next/navigation', () => ({
    useRouter: jest.fn(),
}));

jest.mock('@/components/ui/use-toast', () => ({
    useToast: jest.fn(),
}));

const mockAutomations = [
    {
        id: '1',
        name: 'Test Automation 1',
        eventType: 'AcademyVerifyView_VIEW',
        enabled: true,
        archived: false,
        target: { all: true, ios: true, android: true },
        createdAt: new Date(),
        updatedAt: new Date(),
        stats: {
            sent: 100,
            success: 90,
            failure: 10,
        },
    },
    {
        id: '2',
        name: 'Test Automation 2',
        eventType: 'Appmenu_select',
        enabled: false,
        archived: false,
        target: { all: false, ios: true, android: false },
        createdAt: new Date(),
        updatedAt: new Date(),
        stats: {
            sent: 50,
            success: 45,
            failure: 5,
        },
    },
];

describe('AutomationPage', () => {
    const mockRouter = {
        push: jest.fn(),
        refresh: jest.fn(),
    };

    const mockToast = {
        toast: jest.fn(),
    };

    beforeEach(() => {
        global.fetch = jest.fn(() =>
            Promise.resolve({
                ok: true,
                json: () => Promise.resolve({ success: true, automations: mockAutomations }),
            })
        ) as jest.Mock;

        (useRouter as jest.Mock).mockReturnValue(mockRouter);
        (useToast as jest.Mock).mockReturnValue(mockToast);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('renders automation list', async () => {
        render(<AutomationPage />);

        await waitFor(() => {
            expect(screen.getByText('Test Automation 1')).toBeInTheDocument();
            expect(screen.getByText('Test Automation 2')).toBeInTheDocument();
        });
    });

    it('toggles automation status', async () => {
        render(<AutomationPage />);

        await waitFor(() => {
            expect(screen.getByText('Test Automation 1')).toBeInTheDocument();
        });

        const toggleButton = screen.getByRole('switch', { checked: true });
        fireEvent.click(toggleButton);

        await waitFor(() => {
            expect(global.fetch).toHaveBeenCalledWith(
                '/api/automation/1/toggle',
                expect.objectContaining({
                    method: 'POST',
                    body: JSON.stringify({ enabled: false }),
                })
            );
        });
    });

    it('archives automation', async () => {
        render(<AutomationPage />);

        await waitFor(() => {
            expect(screen.getByText('Test Automation 1')).toBeInTheDocument();
        });

        const buttons = screen.getAllByRole('button');
        const archiveButton = buttons.find(button => 
            button.querySelector('svg.lucide-archive')
        );
        expect(archiveButton).toBeInTheDocument();
        fireEvent.click(archiveButton!);

        await waitFor(() => {
            expect(global.fetch).toHaveBeenCalledWith(
                '/api/automation/1/archive',
                expect.objectContaining({
                    method: 'POST',
                })
            );
        });
    });

    it('deletes automation', async () => {
        window.confirm = jest.fn(() => true);
        render(<AutomationPage />);

        await waitFor(() => {
            expect(screen.getByText('Test Automation 1')).toBeInTheDocument();
        });

        const buttons = screen.getAllByRole('button');
        const deleteButton = buttons.find(button => 
            button.querySelector('svg.lucide-trash2')
        );
        expect(deleteButton).toBeInTheDocument();
        fireEvent.click(deleteButton!);

        await waitFor(() => {
            expect(window.confirm).toHaveBeenCalled();
            expect(global.fetch).toHaveBeenCalledWith(
                '/api/automation/1',
                expect.objectContaining({
                    method: 'DELETE',
                })
            );
        });
    });

    it('filters automations', async () => {
        render(<AutomationPage />);

        await waitFor(() => {
            expect(screen.getByText('Test Automation 1')).toBeInTheDocument();
        });

        const searchInput = screen.getByPlaceholderText('자동화 이름 또는 이벤트');
        fireEvent.change(searchInput, { target: { value: 'Test Automation 1' } });

        await waitFor(() => {
            const lastCall = (global.fetch as jest.Mock).mock.calls.slice(-1)[0];
            expect(lastCall[0]).toContain('search=Test+Automation+1');
        });
    });
}); 