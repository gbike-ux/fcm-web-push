export type EventType = 
  | 'AcademyVerifyView_VIEW'
  | 'Appmenu_select'
  | 'cardNotRegistered_VIEW';

export interface NotificationEvent {
  eventType: EventType;
  title: string;
  body: string;
  imageUrl?: string;
  platform?: 'all' | 'ios' | 'android';
}

export const EVENT_NOTIFICATIONS: Record<EventType, Omit<NotificationEvent, 'eventType'>> = {
  'AcademyVerifyView_VIEW': {
    title: '학원 인증이 필요합니다',
    body: '학원 인증을 완료하고 더 많은 기능을 사용해보세요',
    imageUrl: '/images/academy-verify.png'
  },
  'Appmenu_select': {
    title: '메뉴 선택',
    body: '새로운 메뉴가 선택되었습니다',
    imageUrl: '/images/menu-select.png'
  },
  'cardNotRegistered_VIEW': {
    title: '카드 등록이 필요합니다',
    body: '결제 카드를 등록하고 서비스를 이용해보세요',
    imageUrl: '/images/card-register.png'
  }
}; 