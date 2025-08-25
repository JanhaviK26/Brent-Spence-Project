import React, { useState, useEffect } from 'react';
import { Box, FormControl, InputLabel, Select, MenuItem, Button, Typography, Alert, CircularProgress, Grid, Chip, Dialog, DialogTitle, DialogContent, DialogActions, TextField } from '@mui/material';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import Plot from 'react-plotly.js';
import axios from 'axios';

const Chart = ({ compact = false }) => {
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
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [filteredBatteryData, setFilteredBatteryData] = useState({ timestamps: [], battv: [] });
  const [filteredStrainData, setFilteredStrainData] = useState({});

  const strainOptions = Array.from({ length: 17 }, (_, i) => `Strain(${i + 1})`);

  // Load existing data on component mount
  useEffect(() => {
    const loadExistingData = async () => {
      try {
        const plotResponse = await axios.get('http://localhost:5001/plot-data');
        if (!plotResponse.data.error) {
          // Load battery data if available
          if (plotResponse.data.timestamps && plotResponse.data.battv) {
            const newBatteryData = {
              timestamps: plotResponse.data.timestamps,
              battv: plotResponse.data.battv
            };
            setBatteryData(newBatteryData);
            setFilteredBatteryData(newBatteryData);
          }
          
          // Load strain data if available
          if (plotResponse.data.strains) {
            const newStrainData = plotResponse.data.strains;
            setStrainData(newStrainData);
            setFilteredStrainData(newStrainData);
            
            // Auto-select first strain gauge with actual data
            for (const strainType of strainOptions) {
              if (newStrainData[strainType] && newStrainData[strainType].length > 0) {
                setSelectedStrain(strainType);
                console.log(`Auto-selected strain ${strainType} with ${newStrainData[strainType].length} data points`);
                break;
              }
            }
          }
        }
      } catch (err) {
        console.log('No existing data found or error loading data:', err.message);
      }
    };
    
    loadExistingData();
  }, []);

  // Filter data by date and time range
  const filterDataByDateAndTime = () => {
    if (!startDate || !endDate) {
      setFilteredBatteryData(batteryData);
      setFilteredStrainData(strainData);
      return;
    }

    // Combine date and time
    let startDateTime = new Date(startDate);
    let endDateTime = new Date(endDate);
    
    if (startTime) {
      const [hours, minutes] = startTime.split(':');
      startDateTime.setHours(parseInt(hours), parseInt(minutes), 0);
    }
    if (endTime) {
      const [hours, minutes] = endTime.split(':');
      endDateTime.setHours(parseInt(hours), parseInt(minutes), 59);
    }

    const startTimestamp = startDateTime.getTime() / 1000;
    const endTimestamp = endDateTime.getTime() / 1000;

    // Filter battery data
    const filteredBattery = {
      timestamps: [],
      battv: []
    };

    batteryData.timestamps.forEach((timestamp, index) => {
      if (timestamp >= startTimestamp && timestamp <= endTimestamp) {
        filteredBattery.timestamps.push(timestamp);
        filteredBattery.battv.push(batteryData.battv[index]);
      }
    });

    setFilteredBatteryData(filteredBattery);

    // Filter strain data
    const filteredStrain = {};
    Object.keys(strainData).forEach(strainType => {
      filteredStrain[strainType] = [];
      strainData[strainType].forEach((value, index) => {
        if (batteryData.timestamps[index] >= startTimestamp && batteryData.timestamps[index] <= endTimestamp) {
          filteredStrain[strainType].push(value);
        }
      });
    });

    setFilteredStrainData(filteredStrain);
    setDateDialogOpen(false);
  };

  const clearDateAndTimeFilter = () => {
    setStartDate('');
    setEndDate('');
    setStartTime('');
    setEndTime('');
    setFilteredBatteryData(batteryData);
    setFilteredStrainData(strainData);
  };

  const fetchPredictions = async (type, data) => {
    try {
      if (!data || (Array.isArray(data) && data.length === 0)) return;

      const response = await axios.get('http://localhost:5001/predict');
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

  const handleBatteryFileSelect = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    if (!file.name.endsWith('.csv')) {
      setError('Please upload a CSV file');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', 'battv');

      const response = await axios.post('http://localhost:5001/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      if (response.data.error) {
        setError(response.data.error);
      } else {
        setSuccess(`Battery data processed successfully: ${response.data.success_count} rows processed`);
        const plotResponse = await axios.get('http://localhost:5001/plot-data');
        if (!plotResponse.data.error) {
          const newBatteryData = {
            timestamps: plotResponse.data.timestamps,
            battv: plotResponse.data.battv
          };
          setBatteryData(newBatteryData);
          setFilteredBatteryData(newBatteryData);
          await fetchPredictions('battery', plotResponse.data.battv);
        }
      }
    } catch (err) {
      setError('Failed to upload battery data: ' + (err.response?.data?.error || err.message));
    } finally {
      setLoading(false);
      event.target.value = null;
    }
  };

  const handleStrainFileSelect = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    if (!file.name.endsWith('.csv')) {
      setError('Please upload a CSV file');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', 'strain');

      const response = await axios.post('http://localhost:5001/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data.error) {
        setError(response.data.error);
      } else {
        setSuccess(`Strain data processed successfully: ${response.data.success_count} rows processed`);
        const plotResponse = await axios.get('http://localhost:5001/plot-data');
        if (!plotResponse.data.error) {
          const newStrainData = plotResponse.data.strains;
          setStrainData(newStrainData);
          setFilteredStrainData(newStrainData);
          
          // Auto-select first strain gauge with actual data
          let strainWithData = selectedStrain;
          for (const strainType of strainOptions) {
            if (newStrainData[strainType] && newStrainData[strainType].length > 0) {
              strainWithData = strainType;
              setSelectedStrain(strainType);
              console.log(`Auto-selected strain ${strainType} with ${newStrainData[strainType].length} data points`);
              break;
            }
          }
          
          await fetchPredictions('strain', newStrainData[strainWithData]);
          
          try {
            const anomalyResponse = await axios.get(`http://localhost:5001/detect-anomalies?strain_type=${selectedStrain}`);
            setAnomalyData(anomalyResponse.data);
          } catch (anomalyErr) {
            console.error('Error fetching anomalies:', anomalyErr);
          }
        }
      }
    } catch (err) {
      setError('Failed to upload strain data: ' + (err.response?.data?.error || err.message));
    } finally {
      setLoading(false);
      event.target.value = null;
    }
  };

  const handleStrainChange = async (event) => {
    const newStrainType = event.target.value;
    setSelectedStrain(newStrainType);
    
    if (strainData[newStrainType]?.length > 0) {
      try {
        const anomalyResponse = await axios.get(`http://localhost:5001/detect-anomalies?strain_type=${newStrainType}`);
        setAnomalyData(anomalyResponse.data);
      } catch (err) {
        console.error('Error fetching anomalies:', err);
      }
    }
  };

  const formatTimestamps = (timestamps) => {
    return timestamps.map(ts => new Date(ts * 1000));
  };

  // Adjust chart size and button size for compact mode
  const chartWidth = compact ? 400 : 500;
  const chartHeight = compact ? 220 : 300;
  const buttonSize = compact ? 'small' : 'medium';

  const batteryPlotConfig = {
    data: [{
      type: 'scattergl',
      mode: 'lines',
      name: 'Battery Voltage',
      x: filteredBatteryData.timestamps.length > 0 ? formatTimestamps(filteredBatteryData.timestamps) : [],
      y: filteredBatteryData.battv,
      line: {
        color: 'rgb(75, 192, 192)',
        width: 2
      }
    }],
    layout: {
      title: 'Battery Voltage vs Time',
      width: chartWidth,
      height: chartHeight,
      margin: { l: 50, r: 20, t: 40, b: 40 },
      xaxis: {
        title: 'Time',
        type: 'date',
        tickformat: '%m/%d/%Y %H:%M'
      },
      yaxis: {
        title: 'Voltage'
      },
      showlegend: false,
      hovermode: 'closest'
    },
    config: {
      responsive: true,
      displayModeBar: true,
      displaylogo: false,
      modeBarButtonsToRemove: ['lasso2d', 'select2d']
    }
  };

  const strainPlotConfig = {
    data: [
      {
        type: 'scattergl',
        mode: 'lines',
        name: selectedStrain,
        x: batteryData.timestamps.length > 0 ? formatTimestamps(batteryData.timestamps) : [],
        y: filteredStrainData[selectedStrain] || [],
        line: {
          color: 'rgb(53, 162, 235)',
          width: 2
        }
      },
      ...(anomalyData?.is_anomaly.length > 0 ? [{
        type: 'scatter',
        mode: 'markers',
        name: 'Anomalies',
        x: anomalyData.is_anomaly.map((isAnomaly, i) => 
          isAnomaly ? new Date(filteredBatteryData.timestamps[i] * 1000) : null
        ).filter(x => x !== null),
        y: anomalyData.is_anomaly.map((isAnomaly, i) => 
          isAnomaly ? filteredStrainData[selectedStrain][i] : null
        ).filter(x => x !== null),
        marker: {
          color: 'red',
          size: 8,
          symbol: 'circle'
        }
      }] : [])
    ],
    layout: {
      title: `${selectedStrain} vs Time`,
      width: chartWidth,
      height: chartHeight,
      margin: { l: 50, r: 20, t: 40, b: 40 },
      xaxis: {
        title: 'Time',
        type: 'date',
        tickformat: '%m/%d/%Y %H:%M'
      },
      yaxis: {
        title: 'Strain'
      },
      showlegend: true,
      hovermode: 'closest'
    },
    config: {
      responsive: true,
      displayModeBar: true,
      displaylogo: false,
      modeBarButtonsToRemove: ['lasso2d', 'select2d']
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
                  color: '#4CAF50', // Green color
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
                    color: '#2E7D32' // Darker green
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
                  color: '#2196F3', // Blue color
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
                    color: '#1565C0' // Darker blue
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
            pb: 2  // Add padding bottom to account for potential scrollbar
          }}>
            {predictionData.future_predictions.map((pred, idx) => (
              <Box key={idx} sx={{ 
                p: 2, 
                bgcolor: 'action.hover', 
                borderRadius: 2,
                minWidth: 100,
                flex: '0 0 auto',  // Prevent shrinking and growing
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
          Days with unusual strain patterns:
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
        <Typography variant="body2" sx={{ mt: 2, color: 'text.secondary' }}>
          Reconstruction Error Threshold: {anomalyData.threshold?.toFixed(4)}
        </Typography>
      </Box>
    );
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      {/* Bridge Rendering Image - Outside main container */}
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        mt: '62px', // Tight spacing for dashboard header
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
        mt: 0, // No top margin needed since image is outside
        minHeight: 'auto', // Allow natural height for scrolling
        paddingBottom: '40px' // Add bottom padding for better scrolling
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
          
          <Box sx={{ 
            display: 'flex', 
            gap: 2, 
            flexWrap: 'wrap',
            alignItems: 'center'
          }}>
            <Button 
              variant="contained" 
              color="primary"
              onClick={() => {
                console.log('Dates button clicked!');
                setDateDialogOpen(true);
              }}
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
              Filter by Date & Time
            </Button>
            <Button 
              variant="outlined" 
              onClick={() => console.log('Test button clicked!')}
              color="secondary"
              size={buttonSize}
              sx={{ minWidth: 'fit-content' }}
            >
              Test Button
            </Button>
            {(startDate !== '' || endDate !== '' || startTime !== '' || endTime !== '') && (
              <Button 
                variant="outlined" 
                onClick={clearDateAndTimeFilter}
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

        {error && (
          <Alert severity="error" sx={{ mt: 2, mb: 2 }}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert severity="success" sx={{ mt: 2, mb: 2 }}>
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

        <Grid container spacing={4}>
          {/* Left Column - Battery Data */}
          <Grid item xs={12} md={6}>
            <Box sx={{ 
              p: 2, 
              border: '1px solid #e0e0e0', 
              borderRadius: 1,
              height: '100%',
              bgcolor: loading ? 'action.hover' : 'background.paper'
            }}>
              <Typography variant="h6" gutterBottom>
                Battery Data
              </Typography>
              
              <Box sx={{ mb: 3 }}>
                <input
                  accept=".csv"
                  style={{ display: 'none' }}
                  id="battery-file-upload"
                  type="file"
                  onChange={handleBatteryFileSelect}
                  disabled={loading}
                />
                <label htmlFor="battery-file-upload">
                  <Button 
                    variant="contained" 
                    component="span" 
                    disabled={loading}
                    size={buttonSize}
                  >
                    Upload Battery Data
                  </Button>
                </label>
              </Box>

              {batteryData.timestamps.length > 0 ? (
                <Box>
                  <Plot
                    data={batteryPlotConfig.data}
                    layout={batteryPlotConfig.layout}
                    config={batteryPlotConfig.config}
                    width={chartWidth}
                    height={chartHeight}
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
                    No battery data available. Please upload data to begin.
                  </Typography>
                </Box>
              )}
            </Box>
          </Grid>

          {/* Right Column - Strain Data */}
          <Grid item xs={12} md={6}>
            <Box sx={{ 
              p: 2, 
              border: '1px solid #e0e0e0', 
              borderRadius: 1,
              height: '100%',
              bgcolor: loading ? 'action.hover' : 'background.paper'
            }}>
              <Typography variant="h6" gutterBottom>
                Strain Data
              </Typography>

              <Box sx={{ display: 'flex', gap: 2, mb: 3, alignItems: 'center' }}>
                <FormControl sx={{ minWidth: 120 }}>
                  <InputLabel>Strain Type</InputLabel>
                  <Select
                    value={selectedStrain}
                    onChange={handleStrainChange}
                    label="Strain Type"
                    disabled={loading}
                    size={buttonSize}
                  >
                    {strainOptions.map((strain) => (
                      <MenuItem key={strain} value={strain}>
                        {strain}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <Box>
                  <input
                    accept=".csv"
                    style={{ display: 'none' }}
                    id="strain-file-upload"
                    type="file"
                    onChange={handleStrainFileSelect}
                    disabled={loading}
                  />
                  <label htmlFor="strain-file-upload">
                    <Button 
                      variant="contained" 
                      component="span" 
                      disabled={loading}
                      size={buttonSize}
                    >
                      Upload Strain Data
                    </Button>
                  </label>
                </Box>
              </Box>

              {strainData[selectedStrain]?.length > 0 ? (
                <Box>
                  <Plot
                    data={strainPlotConfig.data}
                    layout={strainPlotConfig.layout}
                    config={strainPlotConfig.config}
                    width={chartWidth}
                    height={chartHeight}
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
                    No strain data available. Please upload data to begin.
                  </Typography>
                </Box>
              )}
            </Box>
          </Grid>
        </Grid>

        {/* Date & Time Filter Dialog */}
        <Dialog open={dateDialogOpen} onClose={() => setDateDialogOpen(false)}>
          <DialogTitle>Filter Data by Date & Time Range</DialogTitle>
          <DialogContent>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
              <Typography variant="subtitle2" color="text.secondary">Start Date & Time</Typography>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <TextField
                  label="Start Date"
                  type="date"
                  value={startDate ? startDate.toISOString().slice(0, 10) : ''}
                  onChange={(e) => setStartDate(e.target.value ? new Date(e.target.value) : null)}
                  InputLabelProps={{
                    shrink: true,
                  }}
                  size={buttonSize}
                />
                <TextField
                  label="Start Time"
                  type="time"
                  value={startTime ? startTime.toISOString().slice(11, 16) : ''}
                  onChange={(e) => setStartTime(e.target.value ? new Date(`${startDate} ${e.target.value}`) : null)}
                  InputLabelProps={{
                    shrink: true,
                  }}
                  inputProps={{
                    step: 300, // 5 min intervals
                  }}
                  size={buttonSize}
                />
              </Box>
              
              <Typography variant="subtitle2" color="text.secondary" sx={{ mt: 2 }}>End Date & Time</Typography>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <TextField
                  label="End Date"
                  type="date"
                  value={endDate ? endDate.toISOString().slice(0, 10) : ''}
                  onChange={(e) => setEndDate(e.target.value ? new Date(e.target.value) : null)}
                  InputLabelProps={{
                    shrink: true,
                  }}
                  size={buttonSize}
                />
                <TextField
                  label="End Time"
                  type="time"
                  value={endTime ? endTime.toISOString().slice(11, 16) : ''}
                  onChange={(e) => setEndTime(e.target.value ? new Date(`${endDate} ${e.target.value}`) : null)}
                  InputLabelProps={{
                    shrink: true,
                  }}
                  inputProps={{
                    step: 300, // 5 min intervals
                  }}
                  size={buttonSize}
                />
              </Box>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDateDialogOpen(false)} size={buttonSize}>Cancel</Button>
            <Button onClick={filterDataByDateAndTime} variant="contained" size={buttonSize}>
              Apply Filter
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </LocalizationProvider>
  );
};

export default Chart; 