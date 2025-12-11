import React from 'react';
// import '../styles/Other.css';

const Other = () => {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'row',
      margin: '3rem',
      gap: '2rem',
      maxHeight: '100%',
            // Give some height so centering works well
      alignItems: 'center',     // Vertically center all children inside this container
      overflowY: 'auto'
    }}>



<div class="image-text-list">

  <div class="image-text-item">
    <img src="geokon4000.jpg" alt="Geokon 4000"/>
    <div class="text">
      <h3>Geokon 4000</h3>
      <p>Used to monitor strain changes on concrete or rock surface using anchors grouted into boreholes.</p>
      <p></p>
      <p>How it works: Strains are measured using the vibrating wire principle: a length of steel wire is tensioned between two mounting blocks that are welded to the steel surface being studied.</p>
      <p>
        Deformations (i.e., strain changes) of the surface will cause the two mounting blocks to move relative to one another, thus altering the tension in the steel wire. The tension in the wire is measured by plucking the wire and measuring its resonant frequency of vibration. The wire is plucked, and its resonant frequency measured, by means of an electromagnetic coil positioned next to the wire. 
      </p>
    </div>
  </div>

  <div class="image-text-item">
    <img src="avw200.jpg" alt="Geokon 4000"/>
    <div class="text">
      <h3>AVW 200</h3>
      <p>
        The AVW200 module supports measurements from vibrating-wire strain gauges, pressure
        transducers, piezometers, tiltmeters, crackmeters, and load cells. These sensors are widely used
        in structural, hydrological, and geotechnical applications due to their stability, accuracy, and
        durability. 
      </p>
      <p>The AVW200 can accommodate up to two vibrating-wire transducers. More sensors
        can be measured by using multiplexers
      </p>
      
    </div>
  </div>


  <div class="image-text-item">
    <img src="cr1000.jpg" alt="cr 1000"/>
    <div class="text">
      <h3>CR 1000Xe</h3>
      <p>
        The CR1000Xe provides measurement and control for a wide variety of applications. 
        Its reliability and ruggedness make it an excellent choice for remote environmental applications including stations for hydrology and meteorology (HydroMet), 
        solar resource assessment and monitoring (SRA/SRM), dams and mines (geotech), and broad research objectives for environmental systems.​
      </p>
      <p>
        ​The CR1000Xe is a low-powered device that measures analog and digital sensors, processes and stores measurements, and adapts to any communications link. It stores data and programs in non-volatile flash memory.
      </p>
      
    </div>
  </div>

  

  

</div>





        





    
</div>



  );
};

export default Other;