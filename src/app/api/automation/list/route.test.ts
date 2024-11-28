import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { GET } from './route';
import { db } from '@/lib/firebase-admin';
import { AutomationRule } from '@/types/events';

// Mock next-auth
jest.mock('next-auth', () => ({
    getServerSession: jest.fn(),
}));

// Mock firebase-admin
jest.mock('@/lib/firebase-admin', () => ({
    db: {
        collection: jest.fn(),
    },
}));

describe('Automation List API', () => {
    const mockSession = {
        user: {
            email: 'test@example.com',
            name: 'Test User',
        },
    };

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
        },
    ] as AutomationRule[];

    beforeEach(() => {
        jest.clearAllMocks();
        (getServerSession as jest.Mock).mockResolvedValue(mockSession);
    });

    it('returns 401 if not authenticated', async () => {
        (getServerSession as jest.Mock).mockResolvedValue(null);

        const request = new NextRequest('http://localhost:3000/api/automation/list');
        const response = await GET(request);
        const data = await response.json();

        expect(response.status).toBe(401);
        expect(data).toEqual({
            success: false,
            error: '인증이 필요합니다.',
        });
    });

    it('returns filtered automations', async () => {
        const mockWhere = jest.fn().mockReturnThis();
        const mockOrderBy = jest.fn().mockReturnThis();
        const mockGet = jest.fn().mockResolvedValue({
            docs: mockAutomations.map(automation => ({
                id: automation.id,
                data: () => automation,
                exists: true,
            })),
        });

        const mockQuery = {
            where: mockWhere,
            orderBy: mockOrderBy,
            get: mockGet,
        };

        (db.collection as jest.Mock).mockReturnValue(mockQuery);

        const request = new NextRequest(
            'http://localhost:3000/api/automation/list?status=active&platform=ios&search=test'
        );
        const response = await GET(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        expect(data.automations).toHaveLength(2);
        expect(mockWhere).toHaveBeenCalledWith('enabled', '==', true);
        expect(mockWhere).toHaveBeenCalledWith('archived', '==', false);
        expect(mockWhere).toHaveBeenCalledWith('target.ios', '==', true);
        expect(mockOrderBy).toHaveBeenCalledWith('createdAt', 'desc');
    });

    it('handles database errors', async () => {
        (db.collection as jest.Mock).mockImplementation(() => {
            throw new Error('Database error');
        });

        const request = new NextRequest('http://localhost:3000/api/automation/list');
        const response = await GET(request);
        const data = await response.json();

        expect(response.status).toBe(500);
        expect(data).toEqual({
            success: false,
            error: '자동화 목록 조회 중 오류가 발생했습니다.',
        });
    });

    it('applies search filter correctly', async () => {
        const mockWhere = jest.fn().mockReturnThis();
        const mockOrderBy = jest.fn().mockReturnThis();
        const mockGet = jest.fn().mockResolvedValue({
            docs: mockAutomations.filter(a => a.name === 'Test Automation 1').map(automation => ({
                id: automation.id,
                data: () => automation,
                exists: true,
            })),
        });

        const mockQuery = {
            where: mockWhere,
            orderBy: mockOrderBy,
            get: mockGet,
        };

        (db.collection as jest.Mock).mockReturnValue(mockQuery);

        const request = new NextRequest(
            'http://localhost:3000/api/automation/list?search=Test Automation 1'
        );
        const response = await GET(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        expect(data.automations.length).toBe(1);
        expect(data.automations[0].name).toBe('Test Automation 1');
        expect(mockOrderBy).toHaveBeenCalledWith('createdAt', 'desc');
    });

    it('applies sorting correctly', async () => {
        const mockWhere = jest.fn().mockReturnThis();
        const mockOrderBy = jest.fn().mockReturnThis();
        const mockGet = jest.fn().mockResolvedValue({
            docs: mockAutomations.map(automation => ({
                id: automation.id,
                data: () => automation,
                exists: true,
            })),
        });

        const mockQuery = {
            where: mockWhere,
            orderBy: mockOrderBy,
            get: mockGet,
        };

        (db.collection as jest.Mock).mockReturnValue(mockQuery);

        const request = new NextRequest(
            'http://localhost:3000/api/automation/list?sort=name&order=asc'
        );
        const response = await GET(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        expect(mockOrderBy).toHaveBeenCalledWith('name', 'asc');
    });
}); 