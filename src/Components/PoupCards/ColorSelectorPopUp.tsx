import React, { useState } from 'react';
import './Styles/ColorSelectorpopupStyles.css';

interface ColorSelectorPopupProps {
  initialColor: string;
  onConfirm: (color: string) => void;
  onCancel: () => void;
}

const presetColors = [
  "#ffffff", "#000000", "#e4caed", "#f28b82", "#fbbc04", "#fff475", "#ccff90", "#a7ffeb", "#cbf0f8", "#d7aefb"
];

const ColorSelectorPopup: React.FC<ColorSelectorPopupProps> = ({
  initialColor,
  onConfirm,
  onCancel
}) => {
  const [selectedColor, setSelectedColor] = useState(initialColor);

  return (
    <div className="color-popup-overlay">
      <div className="color-popup">
        <h3>Select Avatar Background Color</h3>

        <div className="preset-colors">
          {presetColors.map((color) => (
            <div
              key={color}
              className={`color-swatch ${selectedColor === color ? 'selected' : ''}`}
              style={{ backgroundColor: color }}
              onClick={() => setSelectedColor(color)}
            />
          ))}
        </div>

        <input
          type="color"
          value={selectedColor}
          onChange={(e) => setSelectedColor(e.target.value)}
        />

        <div className="color-popup-buttons">
          <button onClick={() => onConfirm(selectedColor)}>Confirm</button>
          <button onClick={onCancel}>Cancel</button>
        </div>
      </div>
    </div>
  );
};

export default ColorSelectorPopup;
