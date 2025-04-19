import React from 'react';
import './/Styles/SaveConfirmationModal.css';

interface SaveConfirmationModalProps {
  onConfirm: () => void;
  onCancel: () => void;
}

const SaveConfirmationModal: React.FC<SaveConfirmationModalProps> = ({ onConfirm, onCancel }) => {
  return (
    <div className="modal-overlay">
      <div className="modal">
        <h2>Do you want to save the recording?</h2>
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <button onClick={onConfirm}>Save</button>
          <button onClick={onCancel}>Cancel</button>
        </div>
      </div>
    </div>
  );
};

export default SaveConfirmationModal;
