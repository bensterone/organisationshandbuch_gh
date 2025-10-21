import React, { useEffect, useRef } from 'react';
import clsx from 'clsx';
import '../../styles/magnetic.css';
import { enableMagneticEffect } from '../../utils/magneticEffect';

/**
 * Premium Button (magnetic + ripple + focus animation)
 * ---------------------------------------------------
 * Props:
 * - variant: 'primary' | 'secondary' | 'danger' | 'ghost'
 * - size: 'sm' | 'md' | 'lg'
 * - className: additional tailwind classes
 * - disabled: boolean
 * - onClick: function
 * - children: node
 */

const Button = ({
  variant = 'primary',
  size = 'md',
  className = '',
  disabled = false,
  onClick,
  children,
  ...props
}) => {
  const btnRef = useRef(null);

  useEffect(() => {
    enableMagneticEffect();
  }, []);

  // 💧 Ripple animation on click
  const handleClick = (e) => {
    if (disabled) return;
    const button = btnRef.current;
    const ripple = document.createElement('span');
    ripple.className = 'ripple';
    const rect = button.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const x = e.clientX - rect.left - size / 2;
    const y = e.clientY - rect.top - size / 2;
    ripple.style.width = ripple.style.height = `${size}px`;
    ripple.style.left = `${x}px`;
    ripple.style.top = `${y}px`;
    button.appendChild(ripple);
    setTimeout(() => ripple.remove(), 600);

    if (onClick) onClick(e);
  };

  const baseStyles =
    'magnetic-button relative font-medium rounded-md transition-all duration-200 overflow-hidden inline-flex items-center justify-center select-none focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed';

  const sizeStyles = {
    sm: 'px-2.5 py-1 text-sm',
    md: 'px-3.5 py-1.5 text-sm',
    lg: 'px-4 py-2 text-base',
  }[size];

  const variantStyles = {
    primary:
      'bg-blue-600 text-white border border-blue-700 hover:bg-blue-700 focus:ring-4 focus:ring-blue-200',
    secondary:
      'bg-gray-100 text-gray-700 border border-gray-300 hover:bg-gray-200 focus:ring-4 focus:ring-gray-200',
    danger:
      'bg-red-600 text-white border border-red-700 hover:bg-red-700 focus:ring-4 focus:ring-red-200',
    ghost:
      'bg-transparent text-gray-700 border border-transparent hover:bg-gray-50 focus:ring-4 focus:ring-gray-100',
  }[variant];

  return (
    <button
      ref={btnRef}
      type="button"
      disabled={disabled}
      onClick={handleClick}
      data-variant={variant}
      className={clsx(baseStyles, sizeStyles, variantStyles, className)}
      {...props}
    >
      {children}
      <span className="magnetic-glow" />
    </button>
  );
};

export default Button;
