import React, { useState } from 'react';
import './Styles/DownloadConfirmationModal.css';

interface DownloadConfirmationModalProps {
  onDownload: (filename: string, description: string) => void;
  onCancel: () => void;
}

const DownloadConfirmationModal: React.FC<DownloadConfirmationModalProps> = ({
  onDownload,
  onCancel
}) => {
  const [filename, setFilename] = useState('avatar-recording');
  const [description, setDescription] = useState('');

  const handleDownloadClick = () => {
    if (filename.trim() !== '') {
      onDownload(filename.trim(), description.trim());
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal">
        <h2>Save Your Recording</h2>

        <input
          type="text"
          value={filename}
          onChange={(e) => setFilename(e.target.value)}
          placeholder="Enter video name"
        />

        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Enter description (optional)"
          rows={4}
          style={{ marginTop: '10px', width: '100%' }}
        />

        <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', marginTop: '15px' }}>
          <button onClick={handleDownloadClick}>Continue</button>
          <button onClick={onCancel}>Cancel</button>
        </div>
      </div>
    </div>
  );
};

export default DownloadConfirmationModal;
