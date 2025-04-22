import React, { useState, useEffect, useRef } from 'react';
import {
  LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip, Legend,
  ResponsiveContainer, ReferenceArea
} from 'recharts';

function TemperatureContent() {
  const [originalData, setOriginalData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [refAreaLeft, setRefAreaLeft] = useState('');
  const [refAreaRight, setRefAreaRight] = useState('');
  const [zoomStart, setZoomStart] = useState(null);
  const [zoomEnd, setZoomEnd] = useState(null);
  const chartRef = useRef(null);
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);
  const [isPanning, setIsPanning] = useState(false);
  const [lastPanPoint, setLastPanPoint] = useState(null);
  const [isZooming, setIsZooming] = useState(false);

  const MIN_ZOOM_RANGE_MS = 8 * 60 * 60 * 1000; 

  useEffect(() => {
    const fetchData = async () => {
      const tempRes = await fetch('http://localhost:5000/temperature-data');

      const temperatureData = await tempRes.json();
      console.log("temperature data", temperatureData);

      const tempMap = new Map();
      const combined = [];
        temperatureData.forEach(item => {
        const hour = new Date(item.timestamp).setMinutes(0, 0, 0);
        tempMap.set(hour, item.value || item.temp);

        if (tempMap.has(hour)) {
          combined.push({
            name: hour,
            Temp1: item.temperature,
          });
        }
      });

      console.log("combined data", combined);

      setOriginalData(combined);
      setFilteredData(combined);
      
      setInitialLoadComplete(true);
    };

    fetchData();
  }, []);

  useEffect(() => {
    if (initialLoadComplete && originalData.length > 0) {
      const initialZoomPercentage = 0.3; 
      const dataLength = originalData.length;
      
      const start = originalData[Math.floor(dataLength * (1 - initialZoomPercentage))].name;
      const end = originalData[dataLength - 1].name;
      
      const initialZoomedData = originalData.filter(d => d.name >= start && d.name <= end);
      
      setFilteredData(initialZoomedData);
      setZoomStart(start);
      setZoomEnd(end);
      
      setInitialLoadComplete(false);
    }
  }, [initialLoadComplete, originalData]);

  useEffect(() => {
    const wheelZoom = (e) => {
      e.preventDefault();
      if (e.deltaY > 0) {
        handleZoomOut();
      } else if (zoomStart && zoomEnd) {
        handleZoomIn();
      }
    };

    const handleMouseDown = (e) => {
      if (!refAreaLeft && !isZooming && zoomStart && zoomEnd) {
        setIsPanning(true);
        setLastPanPoint({ x: e.clientX });
      }
    };

    const handleMouseMove = (e) => {
      if (isPanning && lastPanPoint) {
        const deltaX = e.clientX - lastPanPoint.x;
        setLastPanPoint({ x: e.clientX });
        
        const currentRange = zoomEnd - zoomStart;
        const msPerPixel = currentRange / chartRef.current.clientWidth;
        const panAmount = deltaX * msPerPixel * 2; 
        
        panBy(panAmount);
      }
    };

    const handleMouseUp = () => {
      if (isPanning) {
        setIsPanning(false);
        setLastPanPoint(null);
      }
    };

    const handleMouseLeave = () => {
      if (isPanning) {
        setIsPanning(false);
        setLastPanPoint(null);
      }
    };

    const chartContainer = chartRef.current;
    if (chartContainer) {
      chartContainer.addEventListener('wheel', wheelZoom, { passive: false });
      chartContainer.addEventListener('mousedown', handleMouseDown);
      chartContainer.addEventListener('mousemove', handleMouseMove);
      chartContainer.addEventListener('mouseup', handleMouseUp);
      chartContainer.addEventListener('mouseleave', handleMouseLeave);

      return () => {
        chartContainer.removeEventListener('wheel', wheelZoom);
        chartContainer.removeEventListener('mousedown', handleMouseDown);
        chartContainer.removeEventListener('mousemove', handleMouseMove);
        chartContainer.removeEventListener('mouseup', handleMouseUp);
        chartContainer.removeEventListener('mouseleave', handleMouseLeave);
      };
    }
  }, [chartRef, originalData, zoomStart, zoomEnd, isPanning, lastPanPoint, filteredData, isZooming, refAreaLeft]);

  const handleZoomIn = () => {
    if (!zoomStart || !zoomEnd) return;

    const zoomRange = zoomEnd - zoomStart;
    
    if (zoomRange <= MIN_ZOOM_RANGE_MS) {
      return;
    }
    
    const zoomFactor = 0.05; 
    
    const newZoomStart = zoomStart + zoomRange * zoomFactor;
    const newZoomEnd = zoomEnd - zoomRange * zoomFactor;
    
    if (newZoomEnd - newZoomStart < MIN_ZOOM_RANGE_MS) {
      const midPoint = (zoomStart + zoomEnd) / 2;
      const halfMinRange = MIN_ZOOM_RANGE_MS / 2;
      
      const adjustedStart = midPoint - halfMinRange;
      const adjustedEnd = midPoint + halfMinRange;
      
      const newZoomData = originalData.filter(d => d.name >= adjustedStart && d.name <= adjustedEnd);
      
      if (newZoomData.length > 1) {
        setFilteredData(newZoomData);
        setZoomStart(adjustedStart);
        setZoomEnd(adjustedEnd);
      }
    } else {
      const newZoomData = originalData.filter(d => d.name >= newZoomStart && d.name <= newZoomEnd);
      
      if (newZoomData.length > 1) {
        setFilteredData(newZoomData);
        setZoomStart(newZoomStart);
        setZoomEnd(newZoomEnd);
      }
    }
  };

  const handleZoomOut = () => {
    if (!zoomStart || !zoomEnd) return;

    const currentRange = zoomEnd - zoomStart;
    const expandFactor = 0.1; 
    const expand = currentRange * expandFactor;

    const newStart = Math.max(zoomStart - expand, originalData[0]?.name || 0);
    const newEnd = Math.min(zoomEnd + expand, originalData[originalData.length - 1]?.name || Infinity);

    const newZoomData = originalData.filter(d => d.name >= newStart && d.name <= newEnd);

    if (newZoomData.length > originalData.length * 0.98) {
      setFilteredData(originalData);
      setZoomStart(originalData[0]?.name);
      setZoomEnd(originalData[originalData.length - 1]?.name);
    } else {
      setFilteredData(newZoomData);
      setZoomStart(newStart);
      setZoomEnd(newEnd);
    }
  };

  const panBy = (amount) => {
    if (!zoomStart || !zoomEnd) return;
    
    const newStart = zoomStart - amount;
    const newEnd = zoomEnd - amount;
    
    if (newStart < originalData[0]?.name) {
      const offset = originalData[0].name - newStart;
      setZoomStart(originalData[0].name);
      setZoomEnd(newEnd + offset);
    } else if (newEnd > originalData[originalData.length - 1]?.name) {
      const offset = newEnd - originalData[originalData.length - 1].name;
      setZoomStart(newStart - offset);
      setZoomEnd(originalData[originalData.length - 1].name);
    } else {
      setZoomStart(newStart);
      setZoomEnd(newEnd);
    }
    
    const newZoomData = originalData.filter(d => d.name >= newStart && d.name <= newEnd);
    setFilteredData(newZoomData);
  };

  const zoom = () => {
    setIsZooming(false);
    
    if (!refAreaLeft || !refAreaRight || refAreaLeft === refAreaRight) {
      setRefAreaLeft('');
      setRefAreaRight('');
      return;
    }

    let [from, to] = [refAreaLeft, refAreaRight];
    if (from > to) [from, to] = [to, from];

    if (to - from < MIN_ZOOM_RANGE_MS) {
      const midPoint = (from + to) / 2;
      const halfMinRange = MIN_ZOOM_RANGE_MS / 2;
      
      from = midPoint - halfMinRange;
      to = midPoint + halfMinRange;
    }

    const zoomedData = originalData.filter(d => d.name >= from && d.name <= to);

    if (zoomedData.length < 2) {
      setRefAreaLeft('');
      setRefAreaRight('');
      return;
    }

    setFilteredData(zoomedData);
    setZoomStart(from);
    setZoomEnd(to);
    setRefAreaLeft('');
    setRefAreaRight('');
  };

  const resetZoom = () => {
    setFilteredData(originalData);
    setZoomStart(originalData[0]?.name);
    setZoomEnd(originalData[originalData.length - 1]?.name);
    setRefAreaLeft('');
    setRefAreaRight('');
  };

  const formatHour = (tick) => {
    const date = new Date(tick);
    return date.getHours().toString().padStart(2, '0') + ':00';
  };

  return (
    <>
      <div style={{ marginBottom: 10 }}>
        <button onClick={handleZoomOut} style={{ margin: '0 10px' }}>Zoom Out</button>
        <button onClick={resetZoom} style={{ margin: '0 10px' }}>Reset View</button>
      </div>
      <div 
        ref={chartRef} 
        style={{ 
          backgroundColor: 'beige', 
          padding: '15px',
          cursor: isPanning ? 'grabbing' : (refAreaLeft ? 'crosshair' : 'grab')
        }}
      >
        <ResponsiveContainer width="100%" height={400}>
          <LineChart
            data={filteredData}
            onMouseDown={e => {
              if (!isPanning) {
                setIsZooming(true);
                e && setRefAreaLeft(e.activeLabel);
              }
            }}
            onMouseMove={e => e && refAreaLeft && isZooming && setRefAreaRight(e.activeLabel)}
            onMouseUp={zoom}
          >
            <CartesianGrid strokeDasharray="" />
            <XAxis
              dataKey="name"
              type="category"
              domain={['dataMin', 'dataMax']}
              tickFormatter={formatHour}
              minTickGap={30}
              tick={{
                fontSize: 10,
                fontWeight: "600",
                angle: -70,
                textAnchor: 'end'
              }}
              label={{ value: 'Time', position: 'insideBottomRight', offset: -20 }}
            />
            <YAxis
              yAxisId="left"
              domain={[0, 'dataMax']}
              label={{ value: 'Temp1 (°C)', angle: -90, position: 'insideLeft' }}
            />
            {/* <YAxis
              yAxisId="right"
              orientation="right"
              domain={[0, 'dataMax']}
              label={{ value: 'Temp2 (°C)', angle: 90, position: 'insideRight' }}
            /> */}
            <Tooltip labelFormatter={value => new Date(value).toLocaleString()} />
            <Legend />
            <Line yAxisId="left" type="monotone" dataKey="Temp1" stroke="#8884d8" dot={false} />
            {/* <Line yAxisId="right" type="monotone" dataKey="Temp2" stroke="#82ca9d" dot={false} /> */}
            {refAreaLeft && refAreaRight && (
              <ReferenceArea x1={refAreaLeft} x2={refAreaRight} strokeOpacity={0.3} />
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </>
  );
}

export default TemperatureContent;