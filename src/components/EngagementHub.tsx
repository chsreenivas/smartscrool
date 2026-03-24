import React, { useState, useEffect } from 'react';
import { Line } from 'react-chartjs-2';
import './EngagementHub.css';

const EngagementHub = () => {
    const [streak, setStreak] = useState(0);
    const [progress, setProgress] = useState([]);

    // Simulating fetching user progress from an API
    useEffect(() => {
        const fetchProgress = async () => {
            // This should be replaced with actual API call
            const userProgress = await new Promise(resolve => setTimeout(() => resolve([5, 10, 15, 20]), 1000));
            setProgress(userProgress);
        };
        fetchProgress();
    }, []);

    const handleEngagement = () => {
        setStreak(streak + 1);
        // Logic to track engagement, e.g., storing in a database
    };

    const data = {
        labels: progress.map((_, index) => `Week ${index + 1}`),
        datasets: [{
            label: 'Progress Over Time',
            data: progress,
            fill: false,
            borderColor: 'rgba(75, 192, 192, 1)',
            tension: 0.1,
        }],
    };

    return (
        <div className="engagement-hub">
            <h1>Student Engagement Hub</h1>
            <div className="streak-tracker">
                <h2>Your Streak: {streak}</h2>
                <button onClick={handleEngagement}>Engage</button>
            </div>
            <div className="progress-visualization">
                <h2>Progress Visualization</h2>
                <Line data={data} />
            </div>
        </div>
    );
};

export default EngagementHub;