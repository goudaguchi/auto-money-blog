'use client';

import { useRef, useCallback, useEffect } from 'react';
import type { BiometricData } from './types';

export function useBiometricLogger() {
  const startTimeRef = useRef<number>(Date.now());
  const firstInteractionTimeRef = useRef<number | null>(null);
  const decisionTimeRef = useRef<number | null>(null);
  const hoverStartTimesRef = useRef<{ [choiceId: string]: number }>({});
  const hoverDurationsRef = useRef<{ [choiceId: string]: number }>({});
  const clickCountRef = useRef<number>(0);
  const mouseDistanceRef = useRef<number>(0);
  const lastMousePositionRef = useRef<{ x: number; y: number } | null>(null);

  // マウス移動距離を追跡
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (lastMousePositionRef.current) {
        const dx = e.clientX - lastMousePositionRef.current.x;
        const dy = e.clientY - lastMousePositionRef.current.y;
        mouseDistanceRef.current += Math.sqrt(dx * dx + dy * dy);
      }
      lastMousePositionRef.current = { x: e.clientX, y: e.clientY };
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const reset = useCallback(() => {
    startTimeRef.current = Date.now();
    firstInteractionTimeRef.current = null;
    decisionTimeRef.current = null;
    hoverStartTimesRef.current = {};
    hoverDurationsRef.current = {};
    clickCountRef.current = 0;
    mouseDistanceRef.current = 0;
    lastMousePositionRef.current = null;
  }, []);

  const recordFirstInteraction = useCallback(() => {
    if (firstInteractionTimeRef.current === null) {
      firstInteractionTimeRef.current = Date.now();
    }
  }, []);

  const recordHoverStart = useCallback((choiceId: string) => {
    recordFirstInteraction();
    hoverStartTimesRef.current[choiceId] = Date.now();
  }, [recordFirstInteraction]);

  const recordHoverEnd = useCallback((choiceId: string) => {
    const startTime = hoverStartTimesRef.current[choiceId];
    if (startTime) {
      const duration = Date.now() - startTime;
      hoverDurationsRef.current[choiceId] = 
        (hoverDurationsRef.current[choiceId] || 0) + duration;
    }
  }, []);

  const recordClick = useCallback(() => {
    recordFirstInteraction();
    clickCountRef.current += 1;
  }, [recordFirstInteraction]);

  const recordDecision = useCallback((choiceId: string) => {
    recordHoverEnd(choiceId);
    decisionTimeRef.current = Date.now();
  }, [recordHoverEnd]);

  const getBiometricData = useCallback((): BiometricData => {
    const now = Date.now();
    return {
      timeToFirstInteraction: firstInteractionTimeRef.current
        ? firstInteractionTimeRef.current - startTimeRef.current
        : now - startTimeRef.current,
      timeToDecision: decisionTimeRef.current
        ? decisionTimeRef.current - startTimeRef.current
        : now - startTimeRef.current,
      hoverDuration: { ...hoverDurationsRef.current },
      clickCount: clickCountRef.current,
      mouseDistance: mouseDistanceRef.current,
    };
  }, []);

  return {
    reset,
    recordHoverStart,
    recordHoverEnd,
    recordClick,
    recordDecision,
    getBiometricData,
  };
}

