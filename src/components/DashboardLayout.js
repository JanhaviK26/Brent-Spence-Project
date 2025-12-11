import React, { useState } from 'react';
import { Link } from 'react-router-dom';

const DashboardLayout = () => {
  const [hoveredLink, setHoveredLink] = useState(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const navLinks = [
    { to: '/', label: 'Home' },
    { to: '/about', label: 'About', dropdown: true }, // Indicate dropdown
    { to: '/resources', label: 'Resources' },
    { to: '/data', label: 'Data' },
    { to: '/other', label: 'Other' },
    { to: '/moreinfo', label: 'More Info' },
    { to: '/contact', label: 'Contact Us'}
  ];

  const aboutDropdownItems = [
    { to: '/about/team', label: 'Our Team' },
    { to: '/about/mission', label: 'Our Mission' },
    { to: '/about/history', label: 'History' }
  ];

  return (
    <div style={styles.header}>
      <Link to="/" style={styles.logoLink}>
        <img
          src="/brentspence.png"
          alt="Brent Spence Logo"
          style={{ height: '40px', width: 'auto' }}
        />
      </Link>

      <nav style={{ display: 'flex', gap: '1rem', position: 'relative' }}>
        {navLinks.map((link, index) => (
          <div
            key={index}
            style={{ position: 'relative' }}
            onMouseEnter={() => {
              setHoveredLink(index);
              if (link.dropdown) setDropdownOpen(true);
            }}
            onMouseLeave={() => {
              setHoveredLink(null);
              if (link.dropdown) setDropdownOpen(false);
            }}
          >
            <Link
              to={link.to}
              style={{
                ...linkStyle,
                color: hoveredLink === index ? '#FFD700' : 'white'
              }}
            >
              {link.label}
            </Link>

            {link.dropdown && dropdownOpen && hoveredLink === index && (
              <div style={styles.dropdown}>
                {aboutDropdownItems.map((item, idx) => (
                  <Link
                    key={idx}
                    to={item.to}
                    style={styles.dropdownItem}
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            )}
          </div>
        ))}
      </nav>
    </div>
  );
};

const styles = {
  header: {   //So this is the header, thats the big dark blue box on the top that has all stuff about Home, ABout and the BSB Main ICON
    height: '60px',
    backgroundColor: '#353849',
    color: 'white',
    display: 'flex',
    alignItems: 'center',
    padding: '0 2rem',
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100%',
    zIndex: 1000,
    boxShadow: '0 2px 5px rgba(0, 0, 0, 1)'
  },
  logoLink: {
    display: 'flex',
    alignItems: 'center',
    marginRight: '2rem',
    textDecoration: 'none'
  },
  dropdown: {
    position: 'absolute',
    top: '100%',
    left: 0,
    backgroundColor: '#444',
    boxShadow: '0 4px 8px rgba(0,0,0,0.3)',
    borderRadius: '4px',
    overflow: 'hidden',
    minWidth: '160px',
    zIndex: 1001
  },
  dropdownItem: {
    display: 'block',
    padding: '10px 16px',
    color: 'white',
    textDecoration: 'none',
    whiteSpace: 'nowrap',
    transition: 'background 0.2s ease',
  },
};

const linkStyle = {
  textDecoration: 'none',
  fontSize: '1rem',
  transition: 'color 0.3s ease'
};

export default DashboardLayout;