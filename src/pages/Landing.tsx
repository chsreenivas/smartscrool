import React from 'react';
import './Landing.css';

const Landing = () => {
  return (
    <div className="landing">
      <h1>Smart Scroll - Educational Platform for Districts</h1>
      <div className="stats">
        <div className="stat">
          <h2>100+</h2>
          <p>Schools Partnered</p>
        </div>
        <div className="stat">
          <h2>5000+</h2>
          <p>Students Enrolled</p>
        </div>
        <div className="stat">
          <h2>50+</h2>
          <p>Courses Offered</p>
        </div>
      </div>
      <div className="cta">
        <button className="cta-button">Get Started</button>
        <button className="cta-button">Learn More</button>
      </div>
    </div>
  );
};

export default Landing;