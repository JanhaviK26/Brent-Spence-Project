import React from 'react';

const About = () => {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      margin: '1rem',
      marginTop: '6rem', // Keep top margin to clear dashboard header
      gap: '2rem',
      minHeight: '600px',
      maxWidth: '1400px', // Increase max width
      marginLeft: 'auto',
      marginRight: 'auto'
    }}>
      
      {/* Header Section */}
      <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
        <h1 style={{ 
          fontSize: '2.5rem', 
          color: '#2c3e50', 
          marginBottom: '1rem',
          fontWeight: '600'
        }}>
          About the Brent Spence Bridge Project
        </h1>
        <p style={{ 
          fontSize: '1.2rem', 
          color: '#7f8c8d',
          maxWidth: '800px',
          margin: '0 auto',
          lineHeight: '1.6'
        }}>
          A comprehensive health monitoring system for one of the most critical infrastructure assets in the Ohio-Kentucky region.
        </p>
      </div>

      {/* Main Content Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '3fr 1fr', // Adjust ratio to give more space to content
        gap: '2rem',
        alignItems: 'start'
      }}>
        
        {/* Left Side Content */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          
          {/* Project Overview */}
          <div style={{
            padding: '2rem',
            backgroundColor: '#f8f9fa',
            borderRadius: '12px',
            border: '1px solid #e9ecef'
          }}>
            <h2 style={{ 
              fontSize: '1.8rem', 
              color: '#2c3e50', 
              marginBottom: '1rem',
              fontWeight: '600'
            }}>
              Project Overview
            </h2>
            <p style={{ 
              color: '#34495e', 
              lineHeight: '1.6',
              marginBottom: '1rem'
            }}>
              The Brent Spence Bridge is a critical piece of infrastructure carrying the I-71/75 interstate over
              the Ohio River between Ohio and Kentucky, connecting downtown Cincinnati and southwestern
              Ohio with Covington and northern Kentucky.
            </p>
            <p style={{ 
              color: '#34495e', 
              lineHeight: '1.6'
            }}>
              Under this project, the existing Brent Spence Bridge, which is a multi-lane, double-decker through truss design, 
              will be augmented with a new companion bridge, the Brent Spence Companion Bridge (BSB). 
              This project will provide a much needed increase in capacity and support increased economic development 
              in the Ohio/Kentucky interstate region.
            </p>
          </div>

          {/* UCII Information */}
          <div style={{
            padding: '2rem',
            backgroundColor: '#f8f9fa',
            borderRadius: '12px',
            border: '1px solid #e9ecef'
          }}>
            <h2 style={{ 
              fontSize: '1.8rem', 
              color: '#2c3e50', 
              marginBottom: '1rem',
              fontWeight: '600'
            }}>
              University of Cincinnati Infrastructure Institute (UCII)
            </h2>
            <p style={{ 
              color: '#34495e', 
              lineHeight: '1.6',
              marginBottom: '1rem'
            }}>
              The University of Cincinnati Infrastructure Institute (UCII), formed in 1989, is focused on the development 
              of nondestructive testing and evaluation technologies for the purposes of condition assessment and health 
              monitoring of civil infrastructure systems.
            </p>
            <p style={{ 
              color: '#34495e', 
              lineHeight: '1.6'
            }}>
              UCII consists of an integrated, multi-disciplinary team of Civil, Electrical, Computer, Mechanical, 
              and Materials engineers from a broad cross-section of the faculty at the University of Cincinnati's 
              College of Engineering and Applied Science.
            </p>
          </div>

          {/* Project Goals */}
          <div style={{
            padding: '2rem',
            backgroundColor: '#f8f9fa',
            borderRadius: '12px',
            border: '1px solid #e9ecef'
          }}>
            <h2 style={{ 
              fontSize: '1.8rem', 
              color: '#2c3e50', 
              marginBottom: '1rem',
              fontWeight: '600'
            }}>
              Project Goals
            </h2>
            <ul style={{ 
              color: '#34495e', 
              lineHeight: '1.6',
              paddingLeft: '1.5rem'
            }}>
              <li style={{ marginBottom: '0.5rem' }}>
                Validate analytical modeling studies through field measurements
              </li>
              <li style={{ marginBottom: '0.5rem' }}>
                Obtain preliminary data on critical locations for member capacity analysis
              </li>
              <li style={{ marginBottom: '0.5rem' }}>
                Debug field operations and installation methods
              </li>
              <li style={{ marginBottom: '0.5rem' }}>
                Provide continuous health monitoring for structural integrity
              </li>
            </ul>
          </div>
        </div>

        {/* Right Side Map Container */}
        <div style={{
          position: 'sticky',
          top: '2rem'
        }}>
          <div style={{
            padding: '1rem',
            backgroundColor: 'white',
            borderRadius: '12px',
            border: '1px solid #e9ecef',
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
          }}>
            <h3 style={{ 
              fontSize: '1.3rem', 
              color: '#2c3e50', 
              marginBottom: '1rem',
              fontWeight: '600',
              textAlign: 'center'
            }}>
              Bridge Location
            </h3>
            <div style={{
              width: '100%',
              height: '400px',
              border: '2px solid #e9ecef',
              borderRadius: '8px',
              overflow: 'hidden',
            }}>
              <iframe
                title="Brent Spence Bridge Map"
                width="100%"
                height="100%"
                frameBorder="0"
                style={{ border: 0 }}
                loading="lazy"
                allowFullScreen
                referrerPolicy="no-referrer-when-downgrade"
                src="https://www.google.com/maps?q=Brent+Spence+Bridge,+Cincinnati,+OH&output=embed"
              ></iframe>
            </div>
            <p style={{ 
              fontSize: '0.9rem', 
              color: '#7f8c8d', 
              textAlign: 'center',
              marginTop: '0.5rem'
            }}>
              Brent Spence Bridge<br />
              Cincinnati, OH to Covington, KY
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default About;
