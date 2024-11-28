import express from 'express';
import type { Request, Response } from 'express';
import * as admin from 'firebase-admin';
import path from 'path';
import dotenv from 'dotenv';
import { EventType, EVENT_NOTIFICATIONS } from './types/events';

dotenv.config();

const app = express();
app.use(express.json());
app.use(express.static('public'));

// Firebase Admin 초기화
const serviceAccount = require('../serviceAccountKey.json');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

// FCM 토큰 유효성 검사
const isValidFCMToken = (token: string) => {
  return typeof token === 'string' && token.length > 20;
};

// 통합 알림 전송 엔드포인트
app.post('/send-notification', async (req: Request, res: Response) => {
  try {
    const { title, body, imageUrl, data, token, tokens, platform } = req.body;

    // 기본 메시지 구조
    const baseMessage = {
      notification: {
        title,
        body,
        ...(imageUrl ? { imageUrl } : {})
      },
      data: {
        ...data,
        timestamp: new Date().toISOString(),
        ...(data?.link ? { link: data.link } : {})
      }
    };

    let response;

    // 단일 토큰으로 전송
    if (token) {
      if (!isValidFCMToken(token)) {
        res.status(400).json({ success: false, error: '유효하지 않은 토큰입니다' });
        return;
      }

      const message: admin.messaging.Message = {
        ...baseMessage,
        token,
      };

      response = await admin.messaging().send(message);
      console.log('단일 토큰 알림 전송 성공:', response);
      
      res.json({ success: true, messageId: response });
    }
    // 다중 토큰으로 전송
    else if (tokens && tokens.length > 0) {
      const validTokens = tokens.filter(isValidFCMToken);
      if (validTokens.length === 0) {
        res.status(400).json({ success: false, error: '유효한 토큰이 없습니다' });
        return;
      }

      const message: admin.messaging.MulticastMessage = {
        ...baseMessage,
        tokens: validTokens,
      };

      response = await admin.messaging().sendEachForMulticast(message);
      console.log('다중 토큰 알림 전송 결과:', response);
      
      res.json({ 
        success: true, 
        results: {
          success: response.successCount,
          failure: response.failureCount,
          responses: response.responses,
          totalTokens: tokens.length,
          validTokens: validTokens.length
        }
      });
    }
    // 플랫폼별 전송
    else if (platform) {
      if (!['ios', 'android', 'all'].includes(platform)) {
        res.status(400).json({ success: false, error: '유효하지 않은 플랫폼입니다' });
        return;
      }

      const condition = platform === 'ios' ? "'ios' in topics" : 
                       platform === 'android' ? "'android' in topics" : 
                       "'all' in topics";

      const message: admin.messaging.Message = {
        ...baseMessage,
        condition,
      };

      response = await admin.messaging().send(message);
      console.log('플랫폼별 알림 전송 성공:', response);
      
      res.json({ success: true, messageId: response });
    }
    else {
      res.status(400).json({ success: false, error: '토큰 또는 플랫폼 정보가 필요합니다' });
    }
  } catch (error: any) {
    console.error('알림 전송 실패:', error);
    res.status(500).json({ 
      success: false, 
      error: error.errorInfo?.message || error.message || '알림 전송 실패'
    });
  }
});

// 이벤트 자동화 등록
app.post('/event-automation', async (req: Request, res: Response) => {
  try {
    const { eventType, notification } = req.body;
    
    if (!eventType || !notification) {
      res.status(400).json({ success: false, error: '이벤트 타입과 알림 정보가 필요합니다' });
      return;
    }

    if (!notification.title || !notification.body) {
      res.status(400).json({ success: false, error: '알림의 제목과 내용이 필요합니다' });
      return;
    }

    // 이벤트 타입 검증
    if (!Object.keys(EVENT_NOTIFICATIONS).includes(eventType)) {
      res.status(400).json({ success: false, error: '유효하지 않은 이벤트 타입입니다' });
      return;
    }

    // 이벤트 자동화 규칙을 데이터베이스에 저장
    const db = admin.firestore();
    await db.collection('event-automations').doc(eventType).set({
      eventType,
      notification,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    console.log('이벤트 자동화 규칙 등록 성공:', eventType);
    
    res.json({ 
      success: true,
      automation: {
        eventType,
        notification
      }
    });
  } catch (error) {
    console.error('자동화 규칙 등록 실패:', error);
    res.status(500).json({ success: false, error: '자동화 규칙 등록 실패' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`서버가 포트 ${PORT}에서 실행 중입니다`);
});