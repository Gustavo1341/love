
import React, { useState, useEffect } from 'react';

export default function TimeCounter({ startDate, customPhrase }) {
  const [timeLeft, setTimeLeft] = useState({
    years: 0,
    months: 0,
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0
  });

  useEffect(() => {
    if (!startDate) return;

    const calculateTime = () => {
      const start = new Date(startDate);
      const now = new Date();
      
      let years = now.getFullYear() - start.getFullYear();
      let months = now.getMonth() - start.getMonth();
      let days = now.getDate() - start.getDate();
      let hours = now.getHours() - start.getHours();
      let minutes = now.getMinutes() - start.getMinutes();
      let seconds = now.getSeconds() - start.getSeconds();

      // Adjust for negative values by "borrowing" from larger units
      if (seconds < 0) {
        seconds += 60;
        minutes--;
      }
      if (minutes < 0) {
        minutes += 60;
        hours--;
      }
      if (hours < 0) {
        hours += 24;
        days--;
      }
      if (days < 0) {
        // Get number of days in the previous month relative to `now`
        // Month 0 is January, so `now.getMonth()` gives current month.
        // `new Date(year, month, 0)` gets the last day of the *previous* month.
        const daysInPrevMonth = new Date(now.getFullYear(), now.getMonth(), 0).getDate();
        days += daysInPrevMonth;
        months--;
      }
      if (months < 0) {
        months += 12;
        years--;
      }

      setTimeLeft({ years, months, days, hours, minutes, seconds });
    };

    calculateTime(); // Initial calculation
    const interval = setInterval(calculateTime, 1000); // Update every second
    
    // Cleanup interval on component unmount or startDate change
    return () => clearInterval(interval);
  }, [startDate]); // Rerun effect if startDate changes

  if (!startDate) {
    return (
      <div className="text-center">
        <p className="text-white/70 text-lg">Configure a data do relacionamento no Dashboard</p>
      </div>
    );
  }

  return (
    <div className="text-center text-white font-light">
      <h2 className="text-2xl mb-4">Juntos</h2>
      <div className="text-lg md:text-xl mb-1">
        {timeLeft.years} {timeLeft.years === 1 ? 'ano' : 'anos'}, {timeLeft.months} {timeLeft.months === 1 ? 'mês' : 'meses'}, {timeLeft.days} dias
      </div>
      <div className="text-base md:text-lg text-white/80">
        {timeLeft.hours} horas, {timeLeft.minutes} minutos e {String(timeLeft.seconds).padStart(2, '0')} segundos
      </div>
      {customPhrase && (
        <div className="mt-6">
          <hr className="border-white/20 w-24 mx-auto mb-4" />
          <p className="text-base text-white/90 italic">"{customPhrase}"</p>
        </div>
      )}
    </div>
  );
}
