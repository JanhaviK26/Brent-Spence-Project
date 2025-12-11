import React, { useState, useEffect } from 'react';
import { 
  Box, FormControl, InputLabel, Select, MenuItem, Button, Typography, 
  Alert, CircularProgress, Chip, Dialog, DialogTitle, DialogContent, 
  DialogActions, FormControlLabel, Switch 
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import Plot from 'react-plotly.js';
import axios from 'axios';

const Chart = ({ compact = false, pier = 1 }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [batteryData, setBatteryData] = useState({ timestamps: [], battv: [] });
  const [strainData, setStrainData] = useState({});
  const [selectedStrain, setSelectedStrain] = useState('Strain(1)');
  const [predictions, setPredictions] = useState({
    battery: null,
    strains: {}
  });
  const [anomalyData, setAnomalyData] = useState(null);
  const [dateDialogOpen, setDateDialogOpen] = useState(false);
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [filteredBatteryData, setFilteredBatteryData] = useState({ timestamps: [], battv: [] });
  const [filteredStrainData, setFilteredStrainData] = useState({});
  const [batteryPlotType, setBatteryPlotType] = useState('battery');
  const [strainPlotType, setStrainPlotType] = useState('strain');
  const [selectedPlotType, setSelectedPlotType] = useState('battery');
  const [selectedSensors, setSelectedSensors] = useState([]);
  const [selectedUnits, setSelectedUnits] = useState('english');
  const [correctionFactorK1, setCorrectionFactorK1] = useState('2.2');
  const [correctionFactorK2, setCorrectionFactorK2] = useState('2.2');
  const [plotDialogOpen, setPlotDialogOpen] = useState(false);
  
  // Battery calibration (zeros from first filtered point when date filter is applied)
  const [isBatteryCalibrated, setIsBatteryCalibrated] = useState(false);
  const [calibratedBatteryData, setCalibratedBatteryData] = useState({ timestamps: [], battv: [] });

  // Strain zeroing (calibration) flag
  const [isStrainCalibrated, setIsStrainCalibrated] = useState(false);

  const strainOptions = Array.from({ length: 17 }, (_, i) => `Strain(${i + 1})`);

  // Load existing data on component mount
  useEffect(() => {
    const loadExistingData = async () => {
      try {
        const plotResponse = await axios.get(`/api/plot-data?pier=${pier}`);
        if (!plotResponse.data.error) {
          // Load battery data if available
          if (plotResponse.data.timestamps && plotResponse.data.battv) {
            const newBatteryData = {
              timestamps: plotResponse.data.timestamps,
              battv: plotResponse.data.battv
            };
            setBatteryData(newBatteryData);
            setFilteredBatteryData(newBatteryData); // Also set filtered data immediately
            console.log(`Loaded ${newBatteryData.timestamps.length} battery data points`);
          }
          
          // Load strain data if available
          if (plotResponse.data.strains) {
            const newStrainData = plotResponse.data.strains;
            setStrainData(newStrainData);
            setFilteredStrainData(newStrainData);
            
            // Auto-select strain gauges with actual data
            const availableStrains = [];
            for (const strainType of strainOptions) {
              if (newStrainData[strainType] && newStrainData[strainType].length > 0) {
                availableStrains.push(strainType);
                if (!selectedStrain) {
                  setSelectedStrain(strainType);
                  console.log(`Auto-selected strain ${strainType} with ${newStrainData[strainType].length} data points`);
                }
              }
            }
            
            // Auto-select first few strain gauges for plotting
            if (availableStrains.length > 0 && selectedSensors.length === 0) {
              const strainsToSelect = availableStrains.slice(0, 3); // Select first 3 strain gauges
              setSelectedSensors(strainsToSelect);
              console.log(`Auto-selected strain sensors: ${strainsToSelect.join(', ')}`);
            }
          }
        }
      } catch (err) {
        console.log('No existing data found or error loading data:', err.message);
      }
    };
    
    loadExistingData();
  }, [pier]);

  // Auto-filter data when dates or source data changes
  useEffect(() => {
    filterDataByDate();
  }, [startDate, endDate, batteryData, strainData]);

  const convertTimestampsToDate = (timestamps) => {
    if (!timestamps || timestamps.length === 0) {
      console.log('No timestamps provided to convertTimestampsToDate');
      return [];
    }
    
    console.log('Converting timestamps. First few:', timestamps.slice(0, 3));
    
    const dates = timestamps.map(ts => {
      let timestamp = ts;
      
      // Check if timestamp is in seconds (Unix epoch) or milliseconds
      if (ts < 4102444800) {
        timestamp = ts * 1000;
      } else if (ts > 4102444800000) {
        const testDate = new Date(ts);
        if (testDate.getFullYear() < 1970 || testDate.getFullYear() > 2050) {
          timestamp = ts / 1000;
        } else {
          timestamp = ts;
        }
      } else {
        timestamp = ts;
      }
      
      const date = new Date(timestamp);
      return date;
    });
    
    return dates;
  };

  // Filter data by date range
  const filterDataByDate = () => {
    console.log('Filtering data by date range:', { startDate, endDate });
    
    // Reset calibration when filter changes
    setIsBatteryCalibrated(false);
    setCalibratedBatteryData({ timestamps: [], battv: [] });
    
    if (!startDate || !endDate) {
      setFilteredBatteryData(batteryData);
      setFilteredStrainData(strainData);
      return;
    }

    // Convert to full-day local range
    const startOfDay = new Date(startDate);
    startOfDay.setHours(0, 0, 0, 0);
    const startTimestamp = startOfDay.getTime() / 1000;
    
    const endOfDay = new Date(endDate);
    endOfDay.setHours(23, 59, 59, 999);
    const endTimestamp = endOfDay.getTime() / 1000;
    
    console.log('Date range in timestamps:', { startTimestamp, endTimestamp });

    // Filter battery data
    const filteredBattery = {
      timestamps: [],
      battv: []
    };

    batteryData.timestamps.forEach((timestamp, index) => {
      const normalizedTimestamp = timestamp > 4102444800 ? timestamp / 1000 : timestamp;
      if (normalizedTimestamp >= startTimestamp && normalizedTimestamp <= endTimestamp) {
        filteredBattery.timestamps.push(timestamp);
        filteredBattery.battv.push(batteryData.battv[index]);
      }
    });

    console.log('Filtered battery data:', filteredBattery.timestamps.length, 'points');
    console.log('Total battery data:', batteryData.timestamps.length, 'points');
    setFilteredBatteryData(filteredBattery);

    // Show success message with filter results
    const startDateStr = startOfDay.toLocaleDateString();
    const endDateStr = endOfDay.toLocaleDateString();
    setSuccess(`Date filter applied: ${filteredBattery.timestamps.length} data points from ${startDateStr} to ${endDateStr}`);
    setTimeout(() => setSuccess(null), 5000);

    // Filter strain data using battery timestamps
    const filteredStrain = {};
    Object.keys(strainData).forEach(strainType => {
      filteredStrain[strainType] = [];
    });

    batteryData.timestamps.forEach((timestamp, index) => {
      const normalizedTimestamp = timestamp > 4102444800 ? timestamp / 1000 : timestamp;
      if (normalizedTimestamp >= startTimestamp && normalizedTimestamp <= endTimestamp) {
        Object.keys(strainData).forEach(strainType => {
          if (strainData[strainType] && strainData[strainType][index] !== undefined) {
            filteredStrain[strainType].push(strainData[strainType][index]);
          }
        });
      }
    });

    console.log('Filtered strain data:', Object.keys(filteredStrain).length, 'strain types');
    setFilteredStrainData(filteredStrain);
  };

  const clearDateFilter = () => {
    setStartDate(null);
    setEndDate(null);
    setFilteredBatteryData(batteryData);
    setFilteredStrainData(strainData);
    
    // Reset calibration when clearing filter
    setIsBatteryCalibrated(false);
    setCalibratedBatteryData({ timestamps: [], battv: [] });
    
    setSuccess(`Date filter cleared. Showing all ${batteryData.timestamps.length} data points.`);
    setTimeout(() => setSuccess(null), 3000);
  };

  // Apply battery calibration - zeros from FIRST FILTERED DATA POINT (start date)
  const handleApplyBatteryCalibration = () => {
    if (!filteredBatteryData.battv || !filteredBatteryData.battv.length) {
      setError('No battery data available to calibrate');
      return;
    }
    
    // Use the FIRST value in filtered data as calibration baseline
    const calibrationValue = filteredBatteryData.battv[0];
    
    if (calibrationValue === undefined || calibrationValue === null) {
      setError('Invalid calibration point - first data point is null');
      return;
    }
    
    const newCalibratedData = {
      timestamps: [...filteredBatteryData.timestamps],
      battv: filteredBatteryData.battv.map(value => 
        (value !== undefined && value !== null) ? value - calibrationValue : value
      )
    };
    
    setCalibratedBatteryData(newCalibratedData);
    setIsBatteryCalibrated(true);
    
    const calibDate = new Date(filteredBatteryData.timestamps[0] > 4102444800 ? 
      filteredBatteryData.timestamps[0] : filteredBatteryData.timestamps[0] * 1000);
    setSuccess(`Battery calibration applied! Zeroed from ${calibDate.toLocaleString()} (Baseline: ${calibrationValue.toFixed(3)}V)`);
    setTimeout(() => setSuccess(null), 5000);
  };

  // Reset battery calibration
  const handleResetBatteryCalibration = () => {
    setIsBatteryCalibrated(false);
    setCalibratedBatteryData({ timestamps: [], battv: [] });
    setSuccess('Battery calibration reset to original data');
    setTimeout(() => setSuccess(null), 3000);
  };

  const fetchPredictions = async (type, data) => {
    try {
      if (!data || (Array.isArray(data) && data.length === 0)) return;

      const response = await axios.get('/api/predict');
      if (type === 'battery') {
        setPredictions(prev => ({
          ...prev,
          battery: response.data.battery
        }));
      } else if (type === 'strain') {
        setPredictions(prev => ({
          ...prev,
          strains: response.data.strains
        }));
      }
    } catch (err) {
      console.error('Error fetching predictions:', err);
    }
  };

  // Sensor selection handlers
  const handleSensorSelect = (sensor) => {
    if (!selectedSensors.includes(sensor)) {
      setSelectedSensors([...selectedSensors, sensor]);
    }
  };

  const handleSensorDeselect = (sensor) => {
    setSelectedSensors(selectedSensors.filter(s => s !== sensor));
  };

  const clearSelectedSensors = () => {
    setSelectedSensors([]);
  };

  // Check if plotting conditions are met
  const canShowPlot = () => {
    if (selectedPlotType === 'strain' && selectedSensors.length === 0) {
      return false;
    }
    return true;
  };

  // Helper – do any selected sensors have any strain data?
  const hasStrainDataForSelectedSensors = selectedSensors.some(sensor => {
    const arr = filteredStrainData[sensor] || strainData[sensor];
    return Array.isArray(arr) && arr.length > 0;
  });

  // Get message for why plotting is not available
  const getPlotMessage = () => {
    if (selectedPlotType === 'strain' && selectedSensors.length === 0) {
      return 'Please select strain sensors to plot.';
    }
    
    if (selectedPlotType === 'battery' && filteredBatteryData.timestamps.length === 0) {
      return 'No battery data available. Please upload data to begin.';
    }
    
    if (selectedPlotType === 'strain' && !hasStrainDataForSelectedSensors) {
      return 'No strain data available for selected sensors.';
    }
    
    return 'No data available.';
  };

  // Export data as CSV
  const handleExportData = async () => {
    try {
      setLoading(true);
      
      if (selectedPlotType === 'strain' && selectedSensors.length === 0) {
        setError('Please select strain sensors to export.');
        return;
      }

      const exportParams = {
        plotType: selectedPlotType,
        selectedSensors: selectedPlotType === 'strain' ? selectedSensors.join(',') : null
      };

      if (startDate && endDate) {
        const startOfDay = new Date(startDate);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(endDate);
        endOfDay.setHours(23, 59, 59, 999);
        
        const formatLocalDate = (date) => {
          const year = date.getFullYear();
          const month = String(date.getMonth() + 1).padStart(2, '0');
          const day = String(date.getDate()).padStart(2, '0');
          const hours = String(date.getHours()).padStart(2, '0');
          const minutes = String(date.getMinutes()).padStart(2, '0');
          const seconds = String(date.getSeconds()).padStart(2, '0');
          return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
        };
        
        exportParams.startDate = formatLocalDate(startOfDay);
        exportParams.endDate = formatLocalDate(endOfDay);
      }

      const response = await axios.get('/api/export-filtered-data', {
        params: exportParams
      });

      if (response.data.error) {
        setError(response.data.error);
        return;
      }

      const csvContent = response.data.csv;
      const filename = response.data.filename || `filtered_data_${selectedPlotType}_${new Date().toISOString().split('T')[0]}.csv`;
      
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', filename);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      setSuccess('Filtered data exported successfully!');
    } catch (err) {
      setError('Failed to export data: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleStrainChange = async (event) => {
    const newStrainType = event.target.value;
    setSelectedStrain(newStrainType);
    
    if (strainData[newStrainType]?.length > 0) {
      try {
        const anomalyResponse = await axios.get(`/api/detect-anomalies?strain_type=${newStrainType}`);
        setAnomalyData(anomalyResponse.data);
      } catch (err) {
        console.error('Error fetching anomalies:', err);
      }
    }
  };

  // Adjust chart size and button size for compact mode
  const chartWidth = compact ? 900 : 1100;
  const chartHeight = compact ? 500 : 600;
  const buttonSize = compact ? 'small' : 'medium';

  // Use calibrated data if calibration is active, otherwise use filtered data (battery)
  const displayBatteryData = isBatteryCalibrated ? calibratedBatteryData : filteredBatteryData;

  const batteryPlotConfig = {
    data: [{
      type: 'scattergl',
      mode: 'lines+markers',
      x: convertTimestampsToDate(displayBatteryData.timestamps || []),
      y: displayBatteryData.battv || [],
      line: { color: '#1976d2', width: 2 },
      marker: { size: 4, color: '#1976d2' },
      name: 'Battery Voltage'
    }],
    layout: {
      title: isBatteryCalibrated ? 'Battery Voltage vs Time (Calibrated)' : 'Battery Voltage vs Time',
      xaxis: { 
        title: 'Timestamp (Date)',
        type: 'date',
        tickangle: -45,
        autorange: true
      },
      yaxis: { 
        title: isBatteryCalibrated ? 'Battery Voltage (V) - Calibrated' : 'Battery Voltage (V)',
        autorange: true
      },
      autosize: true,
      width: chartWidth,
      height: chartHeight,
      margin: { l: 80, r: 40, t: 60, b: 100 },
      showlegend: true,
      legend: { x: 0, y: 1.1, orientation: 'h' }
    },
    config: {
      responsive: true,
      displayModeBar: true,
      modeBarButtonsToRemove: ['pan2d', 'lasso2d']
    }
  };

  const strainPlotConfig = {
    data: selectedSensors.map((sensor, index) => {
      const colors = ['#1f77b4', '#ff7f0e', '#2ca02c', '#d62728', '#9467bd', '#8c564b', '#e377c2', '#7f7f7f', '#bcbd22', '#17becf'];

      const rawStrain = filteredStrainData[sensor] || [];

      // Zeroing: subtract first value if enabled
      let yValues = rawStrain;
      if (isStrainCalibrated && rawStrain.length > 0) {
        const baseline = rawStrain.find(v => v !== null && v !== undefined);
        if (baseline !== undefined) {
          yValues = rawStrain.map(v =>
            v !== null && v !== undefined ? v - baseline : null
          );
        }
      }

      return {
        type: 'scattergl',
        mode: 'lines',
        x: convertTimestampsToDate(filteredBatteryData.timestamps || []),
        y: yValues,
        line: { color: colors[index % colors.length], width: 2 },
        name: sensor
      };
    }),
    layout: {
      title: selectedSensors.length === 1 
        ? `${selectedSensors[0]} vs Time${isStrainCalibrated ? ' (Zeroed)' : ''}`
        : `${selectedSensors.length} Strain Gauges vs Time${isStrainCalibrated ? ' (Zeroed)' : ''}`,
      xaxis: { 
        title: 'Timestamp (Date)',
        type: 'date',
        tickangle: -45,
        autorange: true
      },
      yaxis: { 
        title: isStrainCalibrated ? 'Strain (Microstrain, Zeroed)' : 'Strain (Microstrain)',
        autorange: true
      },
      autosize: true,
      width: chartWidth,
      height: chartHeight,
      margin: { l: 80, r: 40, t: 60, b: 100 },
      showlegend: true,
      legend: { x: 0, y: 1.1, orientation: 'h' }
    },
    config: {
      responsive: true,
      displayModeBar: true,
      modeBarButtonsToRemove: ['pan2d', 'lasso2d']
    }
  };

  const renderPredictionInfo = (predictionData) => {
    if (!predictionData || predictionData.error) {
      return (
        <Typography color="text.secondary" sx={{ mt: 2 }}>
          {predictionData?.error || 'No prediction data available'}
        </Typography>
      );
    }

    return (
      <Box sx={{ mt: 2, p: 2, bgcolor: 'background.paper', borderRadius: 1, boxShadow: 1 }}>
        {/* Metrics Circles */}
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-around', 
          alignItems: 'center',
          mb: 4,
          mt: 2,
          gap: 4
        }}>
          {/* R² Score Circle */}
          <Box sx={{ 
            position: 'relative', 
            display: 'inline-flex',
            flexDirection: 'column',
            alignItems: 'center',
            flex: 1
          }}>
            <Box sx={{ position: 'relative', display: 'inline-flex' }}>
              <CircularProgress
                variant="determinate"
                value={Math.max(0, Math.min(100, predictionData.r2_score * 100))}
                size={120}
                thickness={3}
                sx={{
                  color: '#4CAF50',
                  '& .MuiCircularProgress-circle': {
                    strokeLinecap: 'round',
                  },
                }}
              />
              <Box
                sx={{
                  top: 0,
                  left: 0,
                  bottom: 0,
                  right: 0,
                  position: 'absolute',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Typography
                  variant="h4"
                  component="div"
                  sx={{
                    fontWeight: 'bold',
                    color: '#2E7D32'
                  }}
                >
                  {(predictionData.r2_score * 100).toFixed(0)}%
                </Typography>
                <Typography
                  variant="subtitle1"
                  sx={{
                    color: 'text.secondary',
                    mt: 0.5
                  }}
                >
                  R² Score
                </Typography>
              </Box>
            </Box>
          </Box>

          {/* RMSE Circle */}
          <Box sx={{ 
            position: 'relative', 
            display: 'inline-flex',
            flexDirection: 'column',
            alignItems: 'center',
            flex: 1
          }}>
            <Box sx={{ position: 'relative', display: 'inline-flex' }}>
              <CircularProgress
                variant="determinate"
                value={Math.max(0, Math.min(100, 100 - (predictionData.rmse * 10)))}
                size={120}
                thickness={3}
                sx={{
                  color: '#2196F3',
                  '& .MuiCircularProgress-circle': {
                    strokeLinecap: 'round',
                  },
                }}
              />
              <Box
                sx={{
                  top: 0,
                  left: 0,
                  bottom: 0,
                  right: 0,
                  position: 'absolute',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Typography
                  variant="h4"
                  component="div"
                  sx={{
                    fontWeight: 'bold',
                    color: '#1565C0'
                  }}
                >
                  {predictionData.rmse.toFixed(2)}
                </Typography>
                <Typography
                  variant="subtitle1"
                  sx={{
                    color: 'text.secondary',
                    mt: 0.5
                  }}
                >
                  RMSE
                </Typography>
              </Box>
            </Box>
          </Box>
        </Box>

        {/* Future Predictions */}
        <Box sx={{ 
          mt: 3, 
          pt: 3, 
          borderTop: '1px solid',
          borderColor: 'divider'
        }}>
          <Typography variant="h6" gutterBottom sx={{ color: 'text.secondary' }}>
            Predicted Values
          </Typography>
          <Box sx={{ 
            display: 'flex', 
            gap: 2, 
            mt: 2,
            justifyContent: 'space-around',
            overflowX: 'auto',
            pb: 2
          }}>
            {predictionData.future_predictions.map((pred, idx) => (
              <Box key={idx} sx={{ 
                p: 2, 
                bgcolor: 'action.hover', 
                borderRadius: 2,
                minWidth: 100,
                flex: '0 0 auto',
                textAlign: 'center',
                boxShadow: 1
              }}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Step {idx + 1}
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: 'medium' }}>
                  {pred.toFixed(3)}
                </Typography>
              </Box>
            ))}
          </Box>
        </Box>
      </Box>
    );
  };

  const renderAnomalyInfo = () => {
    if (!anomalyData || anomalyData.anomaly_dates.length === 0) {
      return (
        <Typography color="text.secondary" sx={{ mt: 2 }}>
          No anomalies detected
        </Typography>
      );
    }

    return (
      <Box sx={{ mt: 2, p: 2, bgcolor: 'background.paper', borderRadius: 1, boxShadow: 1 }}>
        <Typography variant="h6" gutterBottom>
          Anomaly Detection Results
        </Typography>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          {anomalyData.total_anomaly_days || anomalyData.anomaly_dates.length} days with unusual strain patterns detected:
        </Typography>
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 1 }}>
          {anomalyData.anomaly_dates.map((date, index) => (
            <Chip
              key={index}
              label={date}
              color="error"
              variant="outlined"
              size="small"
            />
          ))}
        </Box>
      </Box>
    );
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      {/* Bridge Rendering Image - Outside main container */}
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        mt: '62px',
        mb: 3,
        px: 2
      }}>
        <img 
          src="/new_bridge_rendering.png"
          alt="Brent Bridge Rendering" 
          style={{
            maxWidth: '100%',
            width: '90%',
            height: 'auto',
            maxHeight: '350px',
            borderRadius: '12px',
            boxShadow: '0 6px 12px rgba(0,0,0,0.15)'
          }}
        />
      </Box>

      {/* Main Data Visualization Container */}
      <Box sx={{ 
        p: compact ? 1 : 3, 
        maxWidth: compact ? 900 : 1200, 
        mx: 'auto',
        mt: 0,
        minHeight: 'auto',
        paddingBottom: '40px'
      }}>

        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          mb: 3,
          flexWrap: 'wrap',
          gap: 2
        }}>
          <Typography variant={compact ? 'h5' : 'h4'} gutterBottom sx={{ flex: 1, minWidth: 0 }}>
            Data Visualization
          </Typography>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mt: 2, mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert severity="success" sx={{ mt: 2, mb: 2 }} onClose={() => setSuccess(null)}>
            {success}
          </Alert>
        )}

        {loading && (
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            mb: 2,
            justifyContent: 'center',
            p: 3
          }}>
            <CircularProgress size={24} sx={{ mr: 1 }} />
            <Typography>
              Processing...
            </Typography>
          </Box>
        )}

        <Box sx={{ 
          p: 3, 
          border: '1px solid #e0e0e0', 
          borderRadius: 1,
          mb: 3,
          bgcolor: 'background.paper'
        }}>
          <Typography variant="h6" gutterBottom>
            Data Visualization Controls
          </Typography>
            
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle1" gutterBottom>
              Plot Type
            </Typography>
            <Box sx={{ display: 'flex', gap: 4, alignItems: 'center', flexWrap: 'wrap' }}>
              <FormControl sx={{ minWidth: 200 }}>
                <Select
                  value={selectedPlotType}
                  onChange={(e) => setSelectedPlotType(e.target.value)}
                  disabled={loading}
                  size={buttonSize}
                >
                  <MenuItem value="battery">Battery Plot</MenuItem>
                  <MenuItem value="strain">Strain Plot</MenuItem>
                </Select>
              </FormControl>
              
              <Box sx={{ display: 'flex', gap: 2 }}>
                <Button 
                  variant="contained" 
                  color="primary"
                  onClick={() => setDateDialogOpen(true)}
                  disabled={loading}
                  size={buttonSize}
                  sx={{ 
                    backgroundColor: '#1976d2',
                    color: 'white',
                    '&:hover': {
                      backgroundColor: '#1565c0'
                    },
                    minWidth: 'fit-content'
                  }}
                >
                  Filter by Dates
                </Button>
                
                {(startDate || endDate) && (
                  <Button 
                    variant="outlined" 
                    onClick={clearDateFilter}
                    disabled={loading}
                    color="secondary"
                    size={buttonSize}
                    sx={{ minWidth: 'fit-content' }}
                  >
                    Clear Filter
                  </Button>
                )}
              </Box>
            </Box>
          </Box>
            
          {/* Sensors Section */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle1" gutterBottom>
              Sensors
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
              {/* Available Sensors List */}
              <Box sx={{ flex: 1 }}>
                <Typography variant="body2" gutterBottom>
                  Available Sensors:
                </Typography>
                <Box sx={{ 
                  border: '1px solid #ccc', 
                  borderRadius: 1, 
                  height: 120, 
                  overflowY: 'auto',
                  bgcolor: 'background.paper',
                  p: 1
                }}>
                  {strainOptions.map((sensor) => (
                    <Box 
                      key={sensor}
                      sx={{ 
                        p: 0.5, 
                        cursor: 'pointer',
                        '&:hover': { bgcolor: 'action.hover' },
                        borderRadius: 0.5
                      }}
                      onClick={() => handleSensorSelect(sensor)}
                    >
                      {sensor}
                    </Box>
                  ))}
                </Box>
              </Box>
              
              {/* Selected Sensors */}
              <Box sx={{ flex: 1 }}>
                <Typography variant="body2" gutterBottom>
                  Selected:
                </Typography>
                <Box sx={{ 
                  border: '1px solid #ccc', 
                  borderRadius: 1, 
                  height: 120, 
                  overflowY: 'auto',
                  bgcolor: 'background.paper',
                  p: 1
                }}>
                  {selectedSensors.map((sensor) => (
                    <Box 
                      key={sensor}
                      sx={{ 
                        p: 0.5, 
                        cursor: 'pointer',
                        '&:hover': { bgcolor: 'action.hover' },
                        borderRadius: 0.5,
                        bgcolor: 'primary.light',
                        color: 'white'
                      }}
                      onClick={() => handleSensorDeselect(sensor)}
                    >
                      {sensor}
                    </Box>
                  ))}
                </Box>
                <Button 
                  variant="outlined" 
                  size="small" 
                  onClick={clearSelectedSensors}
                  sx={{ mt: 1 }}
                >
                  Clear List
                </Button>
              </Box>
            </Box>
          </Box>
            
          {/* Units and Configuration */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle1" gutterBottom>
              Configuration
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
              <FormControl sx={{ minWidth: 120 }}>
                <InputLabel>Units</InputLabel>
                <Select
                  value={selectedUnits}
                  onChange={(e) => setSelectedUnits(e.target.value)}
                  label="Units"
                  size={buttonSize}
                >
                  <MenuItem value="english">English</MenuItem>
                  <MenuItem value="metric">Metric</MenuItem>
                  <MenuItem value="si">SI</MenuItem>
                </Select>
              </FormControl>
              
              <FormControl sx={{ minWidth: 200 }}>
                <InputLabel>Correction Factor K1</InputLabel>
                <Select
                  value={correctionFactorK1}
                  onChange={(e) => setCorrectionFactorK1(e.target.value)}
                  label="Correction Factor K1"
                  size={buttonSize}
                >
                  <MenuItem value="2.2">2.2</MenuItem>
                  <MenuItem value="1.8">1.8</MenuItem>
                  <MenuItem value="2.5">2.5</MenuItem>
                </Select>
              </FormControl>
              
              <FormControl sx={{ minWidth: 200 }}>
                <InputLabel>Correction Factor K2</InputLabel>
                <Select
                  value={correctionFactorK2}
                  onChange={(e) => setCorrectionFactorK2(e.target.value)}
                  label="Correction Factor K2"
                  size={buttonSize}
                >
                  <MenuItem value="2.2">2.2</MenuItem>
                  <MenuItem value="1.8">1.8</MenuItem>
                  <MenuItem value="2.5">2.5</MenuItem>
                </Select>
              </FormControl>

              {/* Strain zeroing toggle */}
              <FormControlLabel
                control={
                  <Switch
                    checked={isStrainCalibrated}
                    onChange={(e) => setIsStrainCalibrated(e.target.checked)}
                  />
                }
                label="Zero strain (subtract first value)"
                sx={{ ml: 2 }}
              />
            </Box>
          </Box>
            
          {/* Plot and Export Buttons */}
          <Box sx={{ mb: 3, textAlign: 'center', display: 'flex', gap: 2, justifyContent: 'center' }}>
            <Button 
              variant="contained" 
              onClick={() => setPlotDialogOpen(true)}
              disabled={loading || !canShowPlot()}
              size="large"
              sx={{ 
                minWidth: 200,
                backgroundColor: '#1976d2',
                color: 'white',
                '&:hover': {
                  backgroundColor: '#1565c0'
                }
              }}
            >
              Plot
            </Button>
            <Button 
              variant="outlined" 
              onClick={handleExportData}
              disabled={loading}
              size="large"
              sx={{ 
                minWidth: 200,
                borderColor: '#4caf50',
                color: '#4caf50',
                '&:hover': {
                  borderColor: '#388e3c',
                  color: '#388e3c',
                  backgroundColor: 'rgba(76, 175, 80, 0.04)'
                }
              }}
            >
              Export Data
            </Button>
          </Box>
        </Box>

        {/* Plot Dialog */}
        <Dialog 
          open={plotDialogOpen} 
          onClose={() => setPlotDialogOpen(false)}
          maxWidth="xl"
          fullWidth
        >
          <DialogTitle>
            {selectedPlotType === 'battery' ? 'Battery Data Plot' : 'Strain Data Plot'}
          </DialogTitle>
          <DialogContent>
            {/* Battery Calibration Panel - Simple Apply/Reset buttons (NO DROPDOWN) */}
            {selectedPlotType === 'battery' && filteredBatteryData.timestamps.length > 0 && startDate && endDate && (
              <Box sx={{ 
                p: 2, 
                mb: 3, 
                border: '2px solid #1976d2', 
                borderRadius: 2,
                bgcolor: 'background.paper'
              }}>
                <Typography variant="h6" gutterBottom sx={{ color: '#1976d2' }}>
                  Battery Calibration / Zeroing {isBatteryCalibrated && <Chip label="Active" color="primary" size="small" sx={{ ml: 1 }} />}
                </Typography>
                
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Calibration will zero the battery data from the first data point at your selected start date: <strong>{startDate.toLocaleDateString()}</strong>
                </Typography>
                
                <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
                  {!isBatteryCalibrated ? (
                    <Button 
                      variant="contained" 
                      onClick={handleApplyBatteryCalibration}
                      sx={{ minWidth: 150 }}
                    >
                      Apply Calibration
                    </Button>
                  ) : (
                    <Button 
                      variant="outlined" 
                      color="secondary"
                      onClick={handleResetBatteryCalibration}
                      sx={{ minWidth: 150 }}
                    >
                      Reset Calibration
                    </Button>
                  )}
                </Box>
              </Box>
            )}

            <Box sx={{ pt: 2 }}>
              {selectedPlotType === 'battery' ? (
                // Battery Plot Display
                canShowPlot() && filteredBatteryData.timestamps.length > 0 ? (
                  <Box>
                    <Plot
                      data={batteryPlotConfig.data}
                      layout={batteryPlotConfig.layout}
                      config={batteryPlotConfig.config}
                      style={{ width: '100%', height: '100%' }}
                    />
                    {predictions.battery && renderPredictionInfo(predictions.battery)}
                  </Box>
                ) : (
                  <Box sx={{ 
                    p: 3, 
                    textAlign: 'center', 
                    color: 'text.secondary',
                    bgcolor: 'action.hover',
                    borderRadius: 1
                  }}>
                    <Typography>
                      {getPlotMessage()}
                    </Typography>
                  </Box>
                )
              ) : (
                // Strain Plot Display
                canShowPlot() && hasStrainDataForSelectedSensors ? (
                  <Box>
                    <Plot
                      data={strainPlotConfig.data}
                      layout={strainPlotConfig.layout}
                      config={strainPlotConfig.config}
                      style={{ width: '100%', height: '100%' }}
                    />
                    {predictions.strains[selectedStrain] && (
                      <Box sx={{ mt: 3 }}>
                        <Typography variant="h6" gutterBottom>
                          Prediction Metrics
                        </Typography>
                        {renderPredictionInfo(predictions.strains[selectedStrain])}
                      </Box>
                    )}
                    {anomalyData && (
                      <Box sx={{ mt: 3 }}>
                        <Typography variant="h6" gutterBottom>
                          Anomaly Detection
                        </Typography>
                        {renderAnomalyInfo()}
                      </Box>
                    )}
                  </Box>
                ) : (
                  <Box sx={{ 
                    p: 3, 
                    textAlign: 'center', 
                    color: 'text.secondary',
                    bgcolor: 'action.hover',
                    borderRadius: 1
                  }}>
                    <Typography>
                      {getPlotMessage()}
                    </Typography>
                  </Box>
                )
              )}
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setPlotDialogOpen(false)} size={buttonSize}>
              Close
            </Button>
          </DialogActions>
        </Dialog>

        {/* Date Filter Dialog */}
        <Dialog open={dateDialogOpen} onClose={() => setDateDialogOpen(false)}>
          <DialogTitle>Filter Data by Date Range</DialogTitle>
          <DialogContent>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                Data will be filtered from 12:00 AM of the start date to 11:59 PM of the end date.
              </Typography>
              <DatePicker
                label="Start Date"
                value={startDate}
                onChange={(newValue) => setStartDate(newValue)}
                slotProps={{ textField: { fullWidth: true } }}
                size={buttonSize}
              />
              <DatePicker
                label="End Date"
                value={endDate}
                onChange={(newValue) => setEndDate(newValue)}
                slotProps={{ textField: { fullWidth: true } }}
                size={buttonSize}
              />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDateDialogOpen(false)} size={buttonSize}>Cancel</Button>
            <Button 
              onClick={() => {
                filterDataByDate();
                setDateDialogOpen(false);
              }} 
              variant="contained" 
              size={buttonSize}
            >
              Apply Filter
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </LocalizationProvider>
  );
};

export default Chart;