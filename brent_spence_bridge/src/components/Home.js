import React from 'react';

const Home = () => {
  const backgroundStyle = {
    backgroundImage: 'url("/cinci-set.png")',
    backgroundSize: 'cover',
    backgroundRepeat: 'no-repeat',
    backgroundPosition: 'center',
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    padding: '5%',
    color: '#fff',
    textShadow: '1px 1px 3px rgba(0,0,0,0.6)',
    position: 'relative'
  };

  const topTextStyle = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center', 
  };

  const logoContainerStyle = {
    position: 'absolute',
    bottom: '20px',
    right: '20px',
    display: 'flex',
    gap: '1.5rem',
  };

  // Style for Logo 1
  const logo1Style = {
    width: '90px',      // Slightly larger
    height: '80px',
    filter: 'drop-shadow(2px 4px 6px black)',  // Add shadow
    borderRadius: '10px', // Rounded corners
  };

  // Style for Logo 2
  const logo2Style = {
    width: '330px',      // Smaller size
    height: 'auto',

  };

    const logo3Style = {
    width: '140px',      // Slightly larger
    height: '80px',
    filter: 'drop-shadow(2px 4px 6px black)',  // Add shadow
    borderRadius: '10px', // Rounded corners
  };


  const centerlogo = {
    marginTop: '120px',
    width: '70%'

  }

  return (
    <div style={backgroundStyle}>
      <div style={topTextStyle}>
        <img style={centerlogo}src="/brentspence1.png" alt="Brent Spence Logo"></img>


      </div>
      

      <div style={logoContainerStyle}>
        <img src="/logo1.png" alt="Logo 1" style={logo1Style} />
        <img src="/logo2.png" alt="Logo 2" style={logo2Style} />
        <img src="/logo3.png" alt="Logo 3" style={logo3Style} />
      </div>
    </div>
  );
};

export default Home;