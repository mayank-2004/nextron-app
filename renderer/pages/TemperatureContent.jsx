import React, { useState, useEffect, useRef } from 'react';
import {
  LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer
} from 'recharts';

const ChartDropdown = ({ onSelect }) => {
  const [selectedOption, setSelectedOption] = useState("12Hrs");

  const handleOptionChange = (e) => {
    const value = e.target.value;
    setSelectedOption(value);
    onSelect(value);
  };

  return (
    <div style={{ marginBottom: "15px", color: "white" }}>
      <label style={{ marginRight: "10px" }}>Select the Range:</label>
      <select
        value={selectedOption}
        onChange={handleOptionChange}
        style={{
          padding: '8px 16px',
          outline: 'none',
          backgroundColor: '#4CAF50',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer'
        }}
      >
        <option value="12Hrs">Last 12 Hours</option>
        <option value="24Hrs">Last 24 Hours</option>
        <option value="All">All Data</option>
      </select>
    </div>
  );
};

function TemperatureContent() {
  const [originalData, setOriginalData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [viewStart, setViewStart] = useState(0);
  const [viewEnd, setViewEnd] = useState(100);
  const [yDomain, setYDomain] = useState([0, 'auto']);
  const [animate, setAnimate] = useState(true);
  const [timeRange, setTimeRange] = useState('12Hrs');
  const chartRef = useRef(null);
  const isPanning = useRef(false);
  const panStartX = useRef(0);
  const isTouchZooming = useRef(false);
  const pinchStartDist = useRef(0);

  useEffect(() => {
    const fetchData = async () => {
      const temperatureData = await window.ipc.invoke('get-data');
      const temperatureData1 = await window.ipc.invoke('get-data1');

      console.log("Fetched Data:", temperatureData, temperatureData1);

      if (!Array.isArray(temperatureData) || !Array.isArray(temperatureData1)) {
        console.error('Invalid data format received:', temperatureData, temperatureData1);
        return;
      }

      const combined = temperatureData.map((item, index) => {
        const correspondingItem = temperatureData1[index] || {};
        return {
          name: item.timestamp,
          Temp1: item.value || item.temp || item.temperature,
          Temp2: correspondingItem?.value || correspondingItem?.temperature || correspondingItem?.temp || null
        };
      });

      setOriginalData(combined);
    };

    fetchData();
  }, []);

  useEffect(() => {
    if (originalData.length === 0) return;

    const now = new Date();
    const rangeHours = timeRange === '24Hrs' ? 24 : 12;
    const rangeStart = new Date(now.getTime() - rangeHours * 60 * 60 * 1000);

    let filtered = originalData
      .map(item => {
        if (!item.name) return null;
        const parsedDate = new Date(item.name.replace(' ', 'T'));
        if (isNaN(parsedDate.getTime())) return null;
        return {
          ...item,
          _parsedDate: parsedDate,
          name: parsedDate.toISOString()
        };
      })
      .filter(item => item !== null);

    if (timeRange !== 'All') {
      filtered = filtered.filter(item => item._parsedDate >= rangeStart);
    }

    filtered.sort((a, b) => a._parsedDate - b._parsedDate);

    console.log("✅ Now:", now.toISOString());
    console.log("✅ rangeStart:", rangeStart.toISOString());
    console.log("✅ Filtered data count:", filtered.length);

    // Option 1 fallback: show last 50 entries if no data in selected range
    if (filtered.length === 0) {
      console.warn("⚠️ No data found in selected range. Showing recent fallback data.");

      filtered = originalData
        .map(item => {
          const parsedDate = new Date(item.name.replace(' ', 'T'));
          return {
            ...item,
            _parsedDate: parsedDate,
            name: parsedDate.toISOString()
          };
        })
        .filter(item => !isNaN(item._parsedDate))
        .sort((a, b) => a._parsedDate - b._parsedDate)
        .slice(-50); // last 50 entries
    }

    setFilteredData(filtered);
    setViewStart(0);
    setViewEnd(filtered.length);
    updateYDomain(filtered, 0, filtered.length);
  }, [originalData, timeRange]);

  useEffect(() => {
    updateYDomain(filteredData, viewStart, viewEnd);
  }, [viewStart, viewEnd]);

  const updateYDomain = (data, start, end) => {
    const visible = data.slice(start, end);
    const yValues = visible.flatMap(d => [d.Temp1, d.Temp2]).filter(v => v != null);
    if (yValues.length > 0) {
      const minY = Math.min(...yValues);
      const maxY = Math.max(...yValues);
      setYDomain([Math.floor(minY) - 1, Math.ceil(maxY) + 1]);
    } else {
      setYDomain([0, 'auto']);
    }
  };

  const formatTime = (tick) => {
    const date = new Date(tick);
    return date.toLocaleTimeString();
  };

  const zoom = (direction, centerIndex = (viewStart + viewEnd) / 2) => {
    const range = viewEnd - viewStart;
    if (range <= 2 && direction === 'in') return;

    const zoomAmount = Math.max(Math.floor(range * 0.2), 1);
    let newRange = direction === 'in' ? range - zoomAmount : range + zoomAmount;
    newRange = Math.max(2, Math.min(filteredData.length, newRange));

    let newStart = Math.max(0, Math.floor(centerIndex - newRange / 2));
    let newEnd = newStart + newRange;

    if (newEnd > filteredData.length) {
      newEnd = filteredData.length;
      newStart = Math.max(0, newEnd - newRange);
    }

    setAnimate(true);
    setViewStart(newStart);
    setViewEnd(newEnd);
  };

  const handleWheel = (e) => {
    if (!chartRef.current) return;
    const container = chartRef.current.container;
    const rect = container.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const totalVisiblePoints = viewEnd - viewStart;
    const cursorRatio = mouseX / rect.width;
    const cursorIndex = viewStart + Math.floor(totalVisiblePoints * cursorRatio);
    if (e.deltaY < 0) zoom('in', cursorIndex);
    else zoom('out', cursorIndex);
  };

  const getDistance = (touches) => {
    const [a, b] = touches;
    return Math.sqrt(Math.pow(a.clientX - b.clientX, 2) + Math.pow(a.clientY - b.clientY, 2));
  };

  const handleTouchStart = (e) => {
    if (e.touches.length === 2) {
      pinchStartDist.current = getDistance(e.touches);
      isTouchZooming.current = true;
    }
  };

  const handleTouchMove = (e) => {
    if (isTouchZooming.current && e.touches.length === 2) {
      const newDist = getDistance(e.touches);
      const delta = newDist - pinchStartDist.current;
      if (Math.abs(delta) > 10) {
        const container = chartRef.current.container;
        const rect = container.getBoundingClientRect();
        const centerX = (e.touches[0].clientX + e.touches[1].clientX) / 2 - rect.left;
        const totalVisiblePoints = viewEnd - viewStart;
        const cursorRatio = centerX / rect.width;
        const cursorIndex = viewStart + Math.floor(totalVisiblePoints * cursorRatio);
        zoom(delta > 0 ? 'in' : 'out', cursorIndex);
        pinchStartDist.current = newDist;
      }
    }
  };

  const handleTouchEnd = () => {
    isTouchZooming.current = false;
  };

  const handleDoubleClick = (e) => {
    const clickedPayload = e?.activePayload?.[0];
    if (clickedPayload && clickedPayload.payload) {
      const clickedTimestamp = new Date(clickedPayload.payload.name);
      const targetIndex = filteredData.findIndex(d =>
        new Date(d.name).getTime() === clickedTimestamp.getTime()
      );
      if (targetIndex !== -1) zoom('in', targetIndex);
    } else {
      setViewStart(0);
      setViewEnd(filteredData.length);
      updateYDomain(filteredData, 0, filteredData.length);
    }
  };

  const handleMouseDown = (e) => {
    isPanning.current = true;
    panStartX.current = e.clientX;
  };

  const handleMouseMove = (e) => {
    if (!isPanning.current) return;
    const dx = e.clientX - panStartX.current;
    const threshold = 20;
    const range = viewEnd - viewStart;
    if (Math.abs(dx) > threshold) {
      const shift = dx > 0 ? -1 : 1;
      const newStart = Math.max(0, viewStart + shift);
      const newEnd = Math.min(filteredData.length, newStart + range);
      setViewStart(newStart);
      setViewEnd(newEnd);
      panStartX.current = e.clientX;
      updateYDomain(filteredData, newStart, newEnd);
    }
  };

  const handleMouseUp = () => {
    isPanning.current = false;
  };

  const visibleData = filteredData.slice(viewStart, viewEnd);

  return (
    <div
      style={{ backgroundColor: 'black', padding: '15px' }}
      onWheel={handleWheel}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onDoubleClick={handleDoubleClick}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <ChartDropdown onSelect={setTimeRange} />

      <button
        onClick={() => {
          setViewStart(0);
          setViewEnd(filteredData.length);
          setYDomain(['auto', 'auto']);
        }}
        style={{
          marginBottom: '10px',
          padding: '8px 16px',
          backgroundColor: '#4CAF50',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer'
        }}
      >
        Reset Zoom
      </button>

      <ResponsiveContainer width="100%" height={500}>
        <LineChart data={visibleData} onDoubleClick={handleDoubleClick} ref={chartRef}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="name"
            tickFormatter={formatTime}
            minTickGap={30}
            tick={{ fontSize: 10, fontWeight: '600', angle: -25, textAnchor: 'end' }}
            label={{ value: 'Time', position: 'insideBottomRight', offset: -20 }}
          />
          <YAxis
            domain={yDomain}
            label={{ value: 'Temperature (°C)', angle: -90, position: 'insideLeft' }}
          />
          <Tooltip labelFormatter={(value) => new Date(value).toLocaleTimeString()} />
          <Legend />
          <Line type="monotone" dataKey="Temp1" stroke="red" dot={false} animationDuration={animate ? 1000 : 0} isAnimationActive={animate} />
          <Line type="monotone" dataKey="Temp2" stroke="blue" dot={false} animationDuration={animate ? 1000 : 0} isAnimationActive={animate} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export default TemperatureContent;
