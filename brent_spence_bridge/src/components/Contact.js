import React from 'react';

const Contact = () => {
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
      
      <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <h1 style={{ 
          fontSize: '2.5rem', 
          color: '#2c3e50', 
          marginBottom: '1rem',
          fontWeight: '600'
        }}>
          Contact Us
        </h1>
        <p style={{ 
          fontSize: '1.2rem', 
          color: '#7f8c8d',
          maxWidth: '600px',
          margin: '0 auto'
        }}>
          Get in touch with our team for questions, collaboration opportunities, or technical support.
        </p>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        gap: '2rem',
        marginBottom: '3rem'
      }}>
        
        {/* Contact Information */}
        <div style={{
          padding: '2rem',
          backgroundColor: '#f8f9fa',
          borderRadius: '12px',
          border: '1px solid #e9ecef'
        }}>
          <h3 style={{ 
            fontSize: '1.5rem', 
            color: '#2c3e50', 
            marginBottom: '1.5rem',
            fontWeight: '600'
          }}>
            Contact Information
          </h3>
          
          <div style={{ marginBottom: '1rem' }}>
            <h4 style={{ fontWeight: '600', color: '#34495e', marginBottom: '0.5rem' }}>
              University of Cincinnati Infrastructure Institute (UCII)
            </h4>
            <p style={{ color: '#7f8c8d', margin: '0' }}>
              College of Engineering and Applied Science<br />
              University of Cincinnati<br />
              Cincinnati, OH 45221
            </p>
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <h4 style={{ fontWeight: '600', color: '#34495e', marginBottom: '0.5rem' }}>
              Email
            </h4>
            <p style={{ color: '#3498db', margin: '0' }}>
              <a href="mailto:uii@uc.edu" style={{ color: '#3498db', textDecoration: 'none' }}>
                uii@uc.edu
              </a>
            </p>
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <h4 style={{ fontWeight: '600', color: '#34495e', marginBottom: '0.5rem' }}>
              Phone
            </h4>
            <p style={{ color: '#7f8c8d', margin: '0' }}>
              (513) 556-0000
            </p>
          </div>
        </div>

        {/* Project Team */}
        <div style={{
          padding: '2rem',
          backgroundColor: '#f8f9fa',
          borderRadius: '12px',
          border: '1px solid #e9ecef'
        }}>
          <h3 style={{ 
            fontSize: '1.5rem', 
            color: '#2c3e50', 
            marginBottom: '1.5rem',
            fontWeight: '600'
          }}>
            Project Team
          </h3>
          
          <div style={{ marginBottom: '1rem' }}>
            <h4 style={{ fontWeight: '600', color: '#34495e', marginBottom: '0.5rem' }}>
              Principal Investigators
            </h4>
            <p style={{ color: '#7f8c8d', margin: '0' }}>
              Dr. [Principal Investigator Name]<br />
              Civil Engineering Department<br />
              University of Cincinnati
            </p>
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <h4 style={{ fontWeight: '600', color: '#34495e', marginBottom: '0.5rem' }}>
              Research Team
            </h4>
            <p style={{ color: '#7f8c8d', margin: '0' }}>
              Graduate Students<br />
              Undergraduate Researchers<br />
              Technical Staff
            </p>
          </div>
        </div>

        {/* Office Hours */}
        <div style={{
          padding: '2rem',
          backgroundColor: '#f8f9fa',
          borderRadius: '12px',
          border: '1px solid #e9ecef'
        }}>
          <h3 style={{ 
            fontSize: '1.5rem', 
            color: '#2c3e50', 
            marginBottom: '1.5rem',
            fontWeight: '600'
          }}>
            Office Hours
          </h3>
          
          <div style={{ marginBottom: '1rem' }}>
            <h4 style={{ fontWeight: '600', color: '#34495e', marginBottom: '0.5rem' }}>
              General Inquiries
            </h4>
            <p style={{ color: '#7f8c8d', margin: '0' }}>
              Monday - Friday<br />
              8:00 AM - 5:00 PM EST
            </p>
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <h4 style={{ fontWeight: '600', color: '#34495e', marginBottom: '0.5rem' }}>
              Technical Support
            </h4>
            <p style={{ color: '#7f8c8d', margin: '0' }}>
              Available during<br />
              business hours
            </p>
          </div>
        </div>
      </div>

      {/* Contact Form */}
      <div style={{
        padding: '2rem',
        backgroundColor: 'white',
        borderRadius: '12px',
        border: '1px solid #e9ecef',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
      }}>
        <h3 style={{ 
          fontSize: '1.5rem', 
          color: '#2c3e50', 
          marginBottom: '1.5rem',
          fontWeight: '600'
        }}>
          Send us a Message
        </h3>
        
        <form style={{ display: 'grid', gap: '1rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <input
              type="text"
              placeholder="First Name"
              style={{
                padding: '0.75rem',
                border: '1px solid #ddd',
                borderRadius: '6px',
                fontSize: '1rem'
              }}
            />
            <input
              type="text"
              placeholder="Last Name"
              style={{
                padding: '0.75rem',
                border: '1px solid #ddd',
                borderRadius: '6px',
                fontSize: '1rem'
              }}
            />
          </div>
          
          <input
            type="email"
            placeholder="Email Address"
            style={{
              padding: '0.75rem',
              border: '1px solid #ddd',
              borderRadius: '6px',
              fontSize: '1rem'
            }}
          />
          
          <input
            type="text"
            placeholder="Subject"
            style={{
              padding: '0.75rem',
              border: '1px solid #ddd',
              borderRadius: '6px',
              fontSize: '1rem'
            }}
          />
          
          <textarea
            placeholder="Your Message"
            rows="5"
            style={{
              padding: '0.75rem',
              border: '1px solid #ddd',
              borderRadius: '6px',
              fontSize: '1rem',
              resize: 'vertical'
            }}
          ></textarea>
          
          <button
            type="submit"
            style={{
              padding: '0.75rem 2rem',
              backgroundColor: '#3498db',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              fontSize: '1rem',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'background-color 0.3s',
              maxWidth: '200px'
            }}
            onMouseOver={(e) => e.target.style.backgroundColor = '#2980b9'}
            onMouseOut={(e) => e.target.style.backgroundColor = '#3498db'}
          >
            Send Message
          </button>
        </form>
      </div>
    </div>
  );
};

export default Contact;
