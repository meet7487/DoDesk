import { useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';

export default function useNotifications(userId) {
  const [notifications, setNotifications] = useState([]);
  const wsRef = useRef(null);

  useEffect(() => {
    if (!userId) return;
    // Replace with your API base URL
    const ws = new WebSocket(`ws://localhost:8000/notifications/ws/${userId}`);
    wsRef.current = ws;

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      setNotifications(prev => [data, ...prev]);
      toast(data.message, { icon: '🔔' });  // react-hot-toast
    };

    ws.onclose = () => {
      // Reconnect after 3 s if unexpectedly closed
      setTimeout(() => wsRef.current?.reconnect?.(), 3000);
    };

    return () => ws.close();
  }, [userId]);

  return { notifications, setNotifications };
}