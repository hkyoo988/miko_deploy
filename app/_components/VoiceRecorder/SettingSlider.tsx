import React from "react";
import styles from "../../styles/SettingsSlider.module.css";

interface SettingsSliderProps {
  label: string;
  min: number;
  max: number;
  step: number;
  value: number;
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

const SettingsSlider: React.FC<SettingsSliderProps> = ({
  label,
  min,
  max,
  step,
  value,
  onChange,
}) => {
  return (
    <div className={styles.sliderWrapper}>
      <label className={styles.sliderLabel}>{label}</label>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={onChange}
        className={styles.slider}
      />
      <span className={styles.sliderValue}>{value.toFixed(2)}</span>
    </div>
  );
};

export default SettingsSlider;
