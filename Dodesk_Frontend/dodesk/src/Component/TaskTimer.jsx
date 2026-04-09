export default function TaskTimer({ taskId }) {
  const [running, setRunning] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const interval = useRef(null);

  const start = async () => {
    await api.post(`/tasks/${taskId}/timer/start`);
    setRunning(true);
    interval.current = setInterval(() => setElapsed(e => e + 1), 1000);
  };

  const stop = async () => {
    await api.patch(`/tasks/${taskId}/timer/stop`);
    clearInterval(interval.current);
    setRunning(false);
  };

  const fmt = s => `${String(Math.floor(s/3600)).padStart(2,'0')}:${
    String(Math.floor(s%3600/60)).padStart(2,'0')}:${
    String(s%60).padStart(2,'0')}`;

  return (
    <div className="timer">
      <span className="timer-display">{fmt(elapsed)}</span>
      <button onClick={running ? stop : start}>
        {running ? 'Stop' : 'Start'}
      </button>
    </div>
  );
}