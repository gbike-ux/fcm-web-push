import { NextResponse } from 'next/server';

const EVENT_TYPES = [
    { id: 'crm_update', label: 'CRM 업데이트' },
    { id: 'analytics_alert', label: '분석 알림' },
    { id: 'system_alert', label: '시스템 알림' },
];

export async function GET() {
    return NextResponse.json(EVENT_TYPES);
} 