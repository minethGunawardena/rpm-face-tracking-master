import React, { useState, useEffect } from 'react';
import Supabase from '../../Components/Connections/supabaseClient';
import './VirtualParentRecordings.css';

interface Recording {
  id: string;
  video_name: string;
  video_url: string;
  description?: string;
  created_at: string;
}

const VirtualParentRecordings: React.FC = () => {
  const [currentVideo, setCurrentVideo] = useState<string>('');
  const [recordings, setRecordings] = useState<Recording[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchRecordings = async () => {
      try {
        const { data, error } = await Supabase
          .from('videos')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) throw error;
        setRecordings(data || []);
      } catch (err) {
        console.error('Error loading videos:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchRecordings();
  }, []);

  return (
    <div className="recordings-container">
      <div className="video-player-container">
        {currentVideo ? (
          <video controls src={currentVideo} className="main-video-player" />
        ) : (
          <div className="video-placeholder">
            <p>Select a recording to play</p>
          </div>
        )}
      </div>

      <div className="recordings-scroll-container">
        <h2>Your Recordings</h2>
        {loading ? (
          <div className="loading">Loading...</div>
        ) : (
          <div className="square-items-container">
            {recordings.map((recording) => (
              <div
                key={recording.id}
                className={`square-item ${currentVideo === recording.video_url ? 'active' : ''}`}
                onClick={() => setCurrentVideo(recording.video_url)}
              >
                <div className="square-content">
                  <div className="play-icon">▶</div>
                  <h3>{recording.video_name}</h3>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default VirtualParentRecordings;