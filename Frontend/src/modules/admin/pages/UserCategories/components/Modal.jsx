import React, { useRef } from "react";
import { createPortal } from "react-dom";
import { FiX } from "react-icons/fi";

const Modal = ({ isOpen, onClose, title, children, size = "md" }) => {
  const mouseDownTarget = useRef(null);

  if (!isOpen) return null;

  const sizeClasses = {
    sm: "max-w-md",
    md: "max-w-2xl",
    lg: "max-w-4xl",
    xl: "max-w-6xl",
  };

  const handleMouseDown = (e) => {
    mouseDownTarget.current = e.target;
  };

  const handleMouseUp = (e) => {
    if (e.target === e.currentTarget && mouseDownTarget.current === e.currentTarget) {
      onClose();
    }
  };

  return createPortal(
    <div
      style={{ backgroundColor: "rgba(0,0,0,0.45)" }}
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
    >
      <div className={`bg-white rounded-2xl shadow-2xl w-full ${sizeClasses[size]} max-h-[90vh] overflow-hidden flex flex-col`}>
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-white">
          <h2 className="text-xl font-bold text-gray-900">{title}</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <FiX className="w-5 h-5" />
          </button>
        </div>
        <div className="overflow-y-auto flex-1 p-6">{children}</div>
      </div>
    </div>,
    document.body
  );
};

export default Modal;

