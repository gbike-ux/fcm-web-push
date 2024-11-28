export const EVENT_NOTIFICATIONS = {
    AcademyVerifyView_VIEW: '아카데미 인증 화면 조회',
    Appmenu_select: '앱 메뉴 선택',
    cardNotRegistered_VIEW: '카드 미등록 화면 조회'
} as const;

export type EventType = keyof typeof EVENT_NOTIFICATIONS;

export interface NotificationPayload {
    title: string;
    body: string;
    imageUrl?: string;
    clickAction?: string;
    translations?: {
        [key: string]: {
            title: string;
            body: string;
        }
    };
    data?: Record<string, string>;
}

export interface Schedule {
    type: 'once' | 'daily' | 'weekly' | 'monthly';
    startDate: string;
    endDate?: string;
    daysOfWeek?: number[];
    time?: string;
}

export interface Target {
    all: boolean;
    ios: boolean;
    android: boolean;
}

export interface AutomationHistory {
    id: string;
    timestamp: Date;
    success: boolean;
    error?: string;
    recipients?: number;
}

export interface AutomationStats {
    sent: number;
    success: number;
    failure: number;
    clicks: number;
    conversions: number;
}

export interface AutomationRule {
    id?: string;
    name: string;
    eventType: EventType;
    notification: NotificationPayload;
    schedule?: Schedule;
    target: Target;
    enabled: boolean;
    archived?: boolean;
    createdAt: Date;
    updatedAt: Date;
    lastTriggered?: Date;
    createdBy?: {
        id: string;
        email: string;
        name: string;
    };
    stats?: AutomationStats;
    history?: AutomationHistory[];
} 