import React from 'react';
import '../styles/MoreInfo.css';


const MoreInfo = () => {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'row',

      gap: '2rem',
      maxHeight: '100%',
            // Give some height so centering works well
      alignItems: 'center',     // Vertically center all children inside this container
      overflowY: 'auto'
    }}>



    <div className="default">
        <h1>University of Cincinnati Infrastructure Institute (UCII)</h1>
        <div className="rows2">
            <img src="/ceas.png" alt="ceas logo" className="ceas-logo"></img>
            <p className="uci-info">The University of Cincinnati Infrastructure Institute (UCII), formed in 1989, is focused on the development of nondestructive testing and evaluation technologies for the purposes of condition assessment and health 
                monitoring of civil infrastructure systems. UCII consists of an integrated, multi-disciplinary team of Civil, Electrical, Computer, Mechanical, and Materials engineers from a broad cross-section of 
                the faculty at the University of Cincinnati's College of Engineering.
            </p>
        </div>

        <div className="rows2">
            <img src="/brentspenceblackhealth.png" alt="BSB Logo" className="brlogo"></img>
            <p className="uci-info">
                The Brent Spence bridge is a critical piece of infrastructure carrying the I-71/75 interstate over
                the Ohio River between Ohio and Kentucky and connecting downtown Cincinnati and southwestern
                Ohio with Covington and northern Kentucky. Under this project, the existing Brent Spence Bridge, which
                is a multi-lane, double-decker through truss design, will be augmented with a new companion bridge,
                the Brent Spence Companion Bridge (BSB). It is anticipated that all interstate traffic will be carried by the
                new BSB, and all local traffic will be carried on the existing Brent Spence Bridge. This project will provide
                a much needed increase in capacity; support increased economic development in the Ohio/Kentucky
                interstate region; and support the flow of goods and services along the heavily used I-71/75 interstate.
                The entire project also includes reconstruction of a total 6 miles along the I-71/75 corridor (1 mile to the
                north in OH and 5 miles to the south in KY) as well as retrofits to the existing Brent Spence Bridge.
            </p>
        </div>

        <div className="rows2">
            <img src="/bsbcorrido.jpg" alt="BSB Project Corridor" className="bsb-corridor"></img>
        </div>

        <div className="rows3">
            <h3>The data obtained from this monitoring will be used for several purposes: </h3>
            <br></br>
            <li>validate (by comparison of theoretical estimates from modeling and actual field measurements) 
                the results obtained from the analytical modeling studies upon which the sensor suite and testing plan designs were based, 
            </li>
            <br/>
            <li>
                obtain preliminary data on some of the critical locations to initiate the procedures for data post-processing and analysis for member capacity, etc., and 
            </li>
            <br/>
            <li>
                debug field operations specific to the site, installation methods, access issues, provide information for data system calibration, etc.
            </li>
            <br/>
        </div>

         <div className="rows3">
            <h4>
                Once the BSB has been built and placed into service, UCII will provide regular data collection from the sensors installed on the bridge, archival of data in a database with past collected data, and secure, user-friendly access to the collected data on a custom website for a period of 1 year. In addition, methods will be investigated in an effort to post-process and visualize data on the website in order to achieve a more user-friendly presentation of the data and data trends. Maintenance of the system, including data loggers, multiplexers, central server for database and website needs will also be provided by UCII. This year of service monitoring is not only important to track any initial and unexpected structural defects that may arise (i.e., as per traditional reliability theory and having been found in practice on other monumental bridges in Ohio), but also it helps to identify quantitatively the redline bounds of “normal” service behavior that can be used for alarming purposes by the health monitoring system for the bridge.
            </h4>
            <br/>
        </div>       
        
    </div>









  

  






        





    
</div>



  );
};

export default MoreInfo;