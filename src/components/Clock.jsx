import React, { useState, useEffect } from 'react';

const Clock = () => {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatDate = (date) => {
    const options = {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    };
    return date.toLocaleDateString('en-US', options);
  };

  const formatTime = (date) => {
    const options = {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    };
    return date.toLocaleTimeString('en-US', options);
  };

  return (
    <div className="clock-container">
      <div className="clock-time">{formatTime(currentTime)}</div>
      <div className="clock-date">{formatDate(currentTime)}</div>
      <div className="data-updated">Data: 30 October 2025</div>
    </div>
  );
};

export default Clock;
