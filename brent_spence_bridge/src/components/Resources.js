// components/Resources.jsx
import React from 'react';

const Resources = () => {
  const resources = [
    {
      title: 'CR1000Xe Data Logger',
      description: 'Campbell Scientific CR1000Xe data logger used for collecting sensor data from the bridge monitoring system. Features high-precision measurements and reliable data collection.',
      image: '/CR1000Xe.png',
      category: 'Hardware'
    },
    {
      title: 'Bridge Health Monitoring',
      description: 'Comprehensive guide to structural health monitoring techniques and methodologies used in civil infrastructure assessment.',
      image: '/brentspenceblackhealth.png',
      category: 'Documentation'
    },
    {
      title: 'Data Analysis Tools',
      description: 'Advanced analytics and machine learning tools for processing and analyzing bridge sensor data for structural integrity assessment.',
      image: '/ceas.png',
      category: 'Software'
    },
    {
      title: 'Sensor Technology',
      description: 'Overview of various sensor technologies including strain gauges, accelerometers, and environmental sensors used in bridge monitoring.',
      image: '/cr1000.jpg',
      category: 'Technology'
    },
    {
      title: 'Project Reports',
      description: 'Technical reports and research papers documenting the Brent Spence Bridge monitoring project progress and findings.',
      image: '/brentspence.png',
      category: 'Research'
    },
    {
      title: 'Training Materials',
      description: 'Educational resources and training materials for engineers and technicians working with bridge monitoring systems.',
      image: '/logo1.png',
      category: 'Education'
    }
  ];

  const categories = ['All', 'Hardware', 'Software', 'Documentation', 'Technology', 'Research', 'Education'];

  return (
    <div style={{
      padding: '1rem',
      paddingTop: '6rem', // Keep top padding to clear dashboard header
      minHeight: '100vh',
      backgroundColor: '#f8f9fa'
    }}>
      <div style={{
        maxWidth: '1400px', // Increase max width
        margin: '0 auto'
      }}>
        
        {/* Header Section */}
        <div style={{ 
          textAlign: 'center', 
          marginBottom: '3rem',
          paddingTop: '2rem'
        }}>
          <h1 style={{ 
            fontSize: '2.5rem', 
            color: '#2c3e50', 
            marginBottom: '1rem',
            fontWeight: '600'
          }}>
            Resources & Documentation
          </h1>
          <p style={{ 
            fontSize: '1.2rem', 
            color: '#7f8c8d',
            maxWidth: '700px',
            margin: '0 auto',
            lineHeight: '1.6'
          }}>
            Access technical documentation, hardware specifications, software tools, and educational materials related to the Brent Spence Bridge monitoring project.
          </p>
        </div>

        {/* Category Filter */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          gap: '1rem',
          marginBottom: '3rem',
          flexWrap: 'wrap'
        }}>
          {categories.map((category) => (
            <button
              key={category}
              style={{
                padding: '0.5rem 1.5rem',
                backgroundColor: category === 'All' ? '#3498db' : 'white',
                color: category === 'All' ? 'white' : '#2c3e50',
                border: '1px solid #e9ecef',
                borderRadius: '25px',
                cursor: 'pointer',
                fontSize: '0.9rem',
                fontWeight: '500',
                transition: 'all 0.3s ease'
              }}
              onMouseOver={(e) => {
                if (category !== 'All') {
                  e.target.style.backgroundColor = '#f8f9fa';
                  e.target.style.borderColor = '#3498db';
                }
              }}
              onMouseOut={(e) => {
                if (category !== 'All') {
                  e.target.style.backgroundColor = 'white';
                  e.target.style.borderColor = '#e9ecef';
                }
              }}
            >
              {category}
            </button>
          ))}
        </div>

        {/* Resources Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
          gap: '2rem'
        }}>
          {resources.map((item, index) => (
            <div
              key={index}
              style={{
                backgroundColor: 'white',
                borderRadius: '12px',
                border: '1px solid #e9ecef',
                overflow: 'hidden',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                transition: 'all 0.3s ease',
                cursor: 'pointer'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.transform = 'translateY(-5px)';
                e.currentTarget.style.boxShadow = '0 8px 25px rgba(0,0,0,0.15)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
              }}
            >
              <div style={{
                height: '200px',
                overflow: 'hidden',
                backgroundColor: '#f8f9fa'
              }}>
                <img 
                  src={item.image} 
                  alt={item.title} 
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover'
                  }}
                  onError={(e) => {
                    e.target.style.display = 'none';
                    e.target.nextSibling.style.display = 'flex';
                  }}
                />
                <div style={{
                  display: 'none',
                  width: '100%',
                  height: '100%',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: '#e9ecef',
                  color: '#7f8c8d',
                  fontSize: '3rem'
                }}>
                  📄
                </div>
              </div>
              
              <div style={{ padding: '1.5rem' }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '0.5rem'
                }}>
                  <span style={{
                    backgroundColor: '#e3f2fd',
                    color: '#1976d2',
                    padding: '0.25rem 0.75rem',
                    borderRadius: '12px',
                    fontSize: '0.8rem',
                    fontWeight: '500'
                  }}>
                    {item.category}
                  </span>
                </div>
                
                <h3 style={{
                  fontSize: '1.3rem',
                  color: '#2c3e50',
                  marginBottom: '0.75rem',
                  fontWeight: '600',
                  lineHeight: '1.3'
                }}>
                  {item.title}
                </h3>
                
                <p style={{
                  color: '#7f8c8d',
                  lineHeight: '1.5',
                  marginBottom: '1rem'
                }}>
                  {item.description}
                </p>
                
                <button style={{
                  backgroundColor: '#3498db',
                  color: 'white',
                  border: 'none',
                  padding: '0.5rem 1rem',
                  borderRadius: '6px',
                  fontSize: '0.9rem',
                  fontWeight: '500',
                  cursor: 'pointer',
                  transition: 'background-color 0.3s'
                }}
                onMouseOver={(e) => e.target.style.backgroundColor = '#2980b9'}
                onMouseOut={(e) => e.target.style.backgroundColor = '#3498db'}
                >
                  View Details
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Additional Resources Section */}
        <div style={{
          marginTop: '4rem',
          padding: '2rem',
          backgroundColor: 'white',
          borderRadius: '12px',
          border: '1px solid #e9ecef'
        }}>
          <h2 style={{
            fontSize: '1.8rem',
            color: '#2c3e50',
            marginBottom: '1.5rem',
            fontWeight: '600',
            textAlign: 'center'
          }}>
            Additional Resources
          </h2>
          
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '1.5rem'
          }}>
            <div style={{ textAlign: 'center' }}>
              <h4 style={{ color: '#34495e', marginBottom: '0.5rem' }}>Technical Support</h4>
              <p style={{ color: '#7f8c8d', fontSize: '0.9rem' }}>
                Get help with system setup and troubleshooting
              </p>
            </div>
            <div style={{ textAlign: 'center' }}>
              <h4 style={{ color: '#34495e', marginBottom: '0.5rem' }}>API Documentation</h4>
              <p style={{ color: '#7f8c8d', fontSize: '0.9rem' }}>
                Access our REST API for data integration
              </p>
            </div>
            <div style={{ textAlign: 'center' }}>
              <h4 style={{ color: '#34495e', marginBottom: '0.5rem' }}>User Manuals</h4>
              <p style={{ color: '#7f8c8d', fontSize: '0.9rem' }}>
                Comprehensive guides for system operation
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Resources;

