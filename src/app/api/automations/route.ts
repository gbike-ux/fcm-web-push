import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// GET: 자동화 목록 조회
export async function GET() {
    const session = await getServerSession(authOptions);
    
    if (!session) {
        return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });
    }

    try {
        const response = await fetch(process.env.NEXT_PUBLIC_GET_AUTOMATIONS_URL!, {
            headers: {
                'Authorization': `Bearer ${session.user.email}`,
            },
        });
        
        if (!response.ok) {
            throw new Error('Failed to fetch automations');
        }

        const data = await response.json();
        return NextResponse.json(data);
    } catch (error) {
        console.error('Error fetching automations:', error);
        return NextResponse.json(
            { error: 'Failed to fetch automations' },
            { status: 500 }
        );
    }
}

// POST: 새로운 자동화 등록
export async function POST(request: Request) {
    const session = await getServerSession(authOptions);
    
    if (!session) {
        return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });
    }

    try {
        const data = await request.json();
        const response = await fetch(process.env.NEXT_PUBLIC_CREATE_AUTOMATION_URL!, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${session.user.email}`,
            },
            body: JSON.stringify({
                ...data,
                createdBy: {
                    email: session.user.email,
                    name: session.user.name,
                },
            }),
        });

        if (!response.ok) {
            throw new Error('Failed to create automation');
        }

        const result = await response.json();
        return NextResponse.json(result);
    } catch (error) {
        console.error('Error creating automation:', error);
        return NextResponse.json(
            { error: 'Failed to create automation' },
            { status: 500 }
        );
    }
}

// PATCH: 자동화 상태 업데이트
export async function PATCH(request: Request) {
    const session = await getServerSession(authOptions);
    
    if (!session) {
        return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });
    }

    try {
        const { id, isActive } = await request.json();
        const response = await fetch(process.env.NEXT_PUBLIC_TOGGLE_AUTOMATION_URL!, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${session.user.email}`,
            },
            body: JSON.stringify({
                id,
                enabled: isActive,
                updatedBy: {
                    email: session.user.email,
                    name: session.user.name,
                },
            }),
        });

        if (!response.ok) {
            throw new Error('Failed to update automation');
        }

        const result = await response.json();
        return NextResponse.json(result);
    } catch (error) {
        console.error('Error updating automation:', error);
        return NextResponse.json(
            { error: 'Failed to update automation' },
            { status: 500 }
        );
    }
}

// DELETE: 자동화 삭제
export async function DELETE(request: Request) {
    const session = await getServerSession(authOptions);
    
    if (!session) {
        return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });
    }

    try {
        const { id } = await request.json();
        const response = await fetch(process.env.NEXT_PUBLIC_DELETE_AUTOMATION_URL!, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${session.user.email}`,
            },
            body: JSON.stringify({
                id,
                deletedBy: {
                    email: session.user.email,
                    name: session.user.name,
                },
            }),
        });

        if (!response.ok) {
            throw new Error('Failed to delete automation');
        }

        const result = await response.json();
        return NextResponse.json(result);
    } catch (error) {
        console.error('Error deleting automation:', error);
        return NextResponse.json(
            { error: 'Failed to delete automation' },
            { status: 500 }
        );
    }
} 