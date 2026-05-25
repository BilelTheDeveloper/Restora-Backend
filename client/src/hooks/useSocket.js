import { useEffect, useRef, useCallback } from 'react';
import { io } from 'socket.io-client';
import { getAccessToken } from '../store/authStore';

const SOCKET_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';

let _socket = null;

export function getSocket() { return _socket; }

export function useSocket(restaurantId, handlers = {}) {
  const socketRef = useRef(null);
  const handlersRef = useRef(handlers);
  handlersRef.current = handlers;

  useEffect(() => {
    if (!restaurantId) return;

    if (!_socket || !_socket.connected) {
      _socket = io(SOCKET_URL, {
        auth: { token: getAccessToken() },
        transports: ['websocket'],
        reconnection: true,
        reconnectionDelay: 1000,
      });
    }
    socketRef.current = _socket;

    _socket.emit('join-restaurant', restaurantId);

    const bound = {};
    for (const [event, handler] of Object.entries(handlersRef.current)) {
      const fn = (...args) => handler(...args);
      bound[event] = fn;
      _socket.on(event, fn);
    }

    return () => {
      for (const [event, fn] of Object.entries(bound)) {
        _socket?.off(event, fn);
      }
    };
  }, [restaurantId]);

  const emit = useCallback((event, data) => {
    _socket?.emit(event, data);
  }, []);

  return { socket: socketRef.current, emit };
}
