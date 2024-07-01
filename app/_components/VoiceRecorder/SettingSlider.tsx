import React from "react";

interface SettingsSliderProps {
  label: string;
  min: number;
  max: number;
  step: number;
  value: number;
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

const SettingsSlider: React.FC<SettingsSliderProps> = ({ label, min, max, step, value, onChange }) => {
  return (
    <label>
      {label}
      <input type="range" min={min} max={max} step={step} value={value} onChange={onChange} />
      {value}
    </label>
  );
};

export default SettingsSlider;
