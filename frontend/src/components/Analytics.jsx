import React, { useState, useEffect } from 'react'
import './Analytics.css'

const Analytics = ({ user }) => {
  const [selectedTimeframe, setSelectedTimeframe] = useState('6 Months')
  const [gfrData, setGfrData] = useState([])
  const [filteredData, setFilteredData] = useState([])

  // GFR data - initially empty, would come from API in real app
  const sampleGfrData = []

  useEffect(() => {
    setGfrData(sampleGfrData)
    filterDataByTimeframe('6 Months', sampleGfrData)
  }, [])

  const filterDataByTimeframe = (timeframe, data = gfrData) => {
    const now = new Date()
    let filteredData = []

    switch (timeframe) {
      case '3 Months':
        const threeMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 3, now.getDate())
        filteredData = data.filter(item => new Date(item.date) >= threeMonthsAgo)
        break
      case '6 Months':
        const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 6, now.getDate())
        filteredData = data.filter(item => new Date(item.date) >= sixMonthsAgo)
        break
      case '1 Year':
        const oneYearAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate())
        filteredData = data.filter(item => new Date(item.date) >= oneYearAgo)
        break
      case 'All Time':
        filteredData = data
        break
      default:
        filteredData = data
    }

    setFilteredData(filteredData)
  }

  const handleTimeframeChange = (timeframe) => {
    setSelectedTimeframe(timeframe)
    filterDataByTimeframe(timeframe)
  }

  const getStageInfo = (gfr) => {
    if (gfr >= 90) return { stage: 1, description: 'Normal or High', color: '#22c55e' }
    if (gfr >= 60) return { stage: 2, description: 'Mild', color: '#84cc16' }
    if (gfr >= 30) return { stage: 3, description: 'Moderate', color: '#f97316' }
    if (gfr >= 15) return { stage: 4, description: 'Severe', color: '#ef4444' }
    return { stage: 5, description: 'Kidney Failure', color: '#991b1b' }
  }

  const getTrendAnalysis = () => {
    if (filteredData.length < 2) return 'Insufficient data for trend analysis.'
    
    const firstReading = filteredData[0].gfr
    const lastReading = filteredData[filteredData.length - 1].gfr
    const difference = lastReading - firstReading

    if (difference > 5) {
      return 'Great work! Your results show an improving trend over the selected timeframe.'
    } else if (difference >= -5) {
      return 'Your kidney function appears stable, which is a positive sign. Keep up with your current plan.'
    } else {
      return 'Your results show a declining trend. It\'s a good idea to discuss these results with your doctor.'
    }
  }

  const getLatestReading = () => {
    if (filteredData.length === 0) return null
    const latest = filteredData[filteredData.length - 1]
    const stageInfo = getStageInfo(latest.gfr)
    return {
      ...latest,
      ...stageInfo
    }
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const latestReading = getLatestReading()

  return (
    <div className="analytics-page">
      <div className="analytics-header">
        <h1>Health Analytics</h1>
        <p>Track your kidney health trends over time</p>
      </div>

      <div className="analytics-content">
        {/* GFR Trend Chart Section */}
        <div className="chart-section">
          <div className="chart-header">
            <h2>Your GFR Trend Over Time</h2>
            <div className="timeframe-filters">
              {['3 Months', '6 Months', '1 Year', 'All Time'].map(timeframe => (
                <button
                  key={timeframe}
                  className={`timeframe-btn ${selectedTimeframe === timeframe ? 'active' : ''}`}
                  onClick={() => handleTimeframeChange(timeframe)}
                >
                  {timeframe}
                </button>
              ))}
            </div>
          </div>

          <div className="chart-container">
            <div className="chart-wrapper">
              {/* Y-axis label */}
              <div className="y-axis-label">GFR Level (mL/min/1.73m²)</div>
              
              {/* Chart area with CKD stage zones */}
              <div className="chart-area">
                {/* CKD Stage Background Zones */}
                <div className="ckd-zones">
                  <div className="zone zone-1" data-label="Stage 1: Normal (≥90)"></div>
                  <div className="zone zone-2" data-label="Stage 2: Mild (60-89)"></div>
                  <div className="zone zone-3" data-label="Stage 3: Moderate (30-59)"></div>
                  <div className="zone zone-4" data-label="Stage 4: Severe (15-29)"></div>
                  <div className="zone zone-5" data-label="Stage 5: Failure (<15)"></div>
                </div>

                {/* Y-axis ticks */}
                <div className="y-axis-ticks">
                  {[100, 90, 80, 70, 60, 50, 40, 30, 20, 15, 10].map(value => (
                    <div key={value} className="y-tick" style={{ bottom: `${(value / 100) * 100}%` }}>
                      {value}
                    </div>
                  ))}
                </div>

                {/* Data points and line */}
                <svg className="chart-svg" viewBox="0 0 800 400">
                  {/* Grid lines */}
                  {[90, 60, 30, 15].map(value => (
                    <line
                      key={value}
                      x1="0"
                      y1={400 - (value / 100) * 400}
                      x2="800"
                      y2={400 - (value / 100) * 400}
                      stroke="#e5e7eb"
                      strokeWidth="1"
                      strokeDasharray="5,5"
                    />
                  ))}

                  {/* Data line */}
                  {filteredData.length > 1 && (
                    <polyline
                      fill="none"
                      stroke="#2563eb"
                      strokeWidth="3"
                      points={filteredData.map((point, index) => {
                        const x = (index / (filteredData.length - 1)) * 750 + 25
                        const y = 400 - (point.gfr / 100) * 400
                        return `${x},${y}`
                      }).join(' ')}
                    />
                  )}

                  {/* Data points */}
                  {filteredData.map((point, index) => {
                    const x = (index / Math.max(filteredData.length - 1, 1)) * 750 + 25
                    const y = 400 - (point.gfr / 100) * 400
                    return (
                      <g key={index}>
                        <circle
                          cx={x}
                          cy={y}
                          r="6"
                          fill="#2563eb"
                          stroke="white"
                          strokeWidth="2"
                          className="data-point"
                        />
                        <title>{`${formatDate(point.date)}: ${point.gfr} mL/min/1.73m²`}</title>
                      </g>
                    )
                  })}
                </svg>

                {/* X-axis dates */}
                <div className="x-axis-dates">
                  {filteredData.map((point, index) => (
                    <div
                      key={index}
                      className="x-date"
                      style={{ left: `${(index / Math.max(filteredData.length - 1, 1)) * 100}%` }}
                    >
                      {formatDate(point.date)}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Interpretive Summary Section */}
        <div className="summary-section">
          <h2>What This Means for You</h2>
          
          {latestReading && (
            <div className="summary-content">
              <div className="latest-reading">
                <p>
                  Your most recent GFR reading on <strong>{formatDate(latestReading.date)}</strong> was{' '}
                  <strong>{latestReading.gfr} mL/min/1.73m²</strong>, which is in{' '}
                  <span className="stage-indicator" style={{ color: latestReading.color }}>
                    CKD Stage {latestReading.stage} ({latestReading.description})
                  </span>.
                </p>
              </div>

              <div className="trend-analysis">
                <p>{getTrendAnalysis()}</p>
              </div>

              <div className="educational-link">
                <a href="#" className="learn-more-link">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10"></circle>
                    <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
                    <line x1="12" y1="17" x2="12.01" y2="17"></line>
                  </svg>
                  What is GFR? Learn more about what these numbers mean.
                </a>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Analytics
