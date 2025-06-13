import React, { useEffect, useRef } from 'react';

const TradingViewIndicator = ({
  symbol = 'NASDAQ:AAPL',
  interval = 'D',
  studies = ['MACD@tv-basicstudies'],
  theme = 'dark', // default to dark mode
}) => {
  const containerRef = useRef(null);

  useEffect(() => {
    const createWidget = () => {
      if (!containerRef.current || !window.TradingView) return;
      new window.TradingView.widget({
        autosize: true,
        symbol,
        interval,
        timezone: 'exchange',
        theme,               // using 'dark' by default
        style: '1',
        toolbar_bg: theme === 'dark' ? '#131722' : '#f1f3f6',
        withdateranges: true,
        allow_symbol_change: true,
        studies,
        container_id: containerRef.current.id,
      });
    };

    if (typeof window !== 'undefined') {
      if (window.TradingView) {
        createWidget();
      } else {
        const script = document.createElement('script');
        script.src = 'https://s3.tradingview.com/tv.js';
        script.async = true;
        script.onload = createWidget;
        document.head.appendChild(script);
      }
    }
  }, [symbol, interval, studies, theme]);

  return (
    <div
      ref={containerRef}
      id={`tv_chart_${symbol.replace(/[:/]/g, '_')}`}
      style={{ width: '100%', height: '500px' }}
    />
  );
};

export default TradingViewIndicator;