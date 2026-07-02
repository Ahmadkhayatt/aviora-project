"use client"

import React, { useState, useEffect, useRef, type ReactNode } from "react";
import { cn } from "@/shared/utils/class-utils";

export interface ModalProps {
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly children: ReactNode;
  readonly title?: string;
  readonly description?: string;
  readonly className?: string;
  readonly closeOnOverlayClick?: boolean;
  readonly closeOnEscape?: boolean;
}

export function Modal({
  isOpen,
  onClose,
  children,
  title,
  description,
  closeOnOverlayClick = true,
  closeOnEscape = true,
}: ModalProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
      setIsExiting(false);
      document.body.style.overflow = 'hidden';
    } else {
      setIsExiting(true);
      setTimeout(() => {
        setIsVisible(false);
        setIsExiting(false);
        document.body.style.overflow = '';
      }, 200);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!closeOnEscape) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onClose, closeOnEscape]);

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (closeOnOverlayClick && e.target === modalRef.current) {
      onClose();
    }
  };

  if (!isVisible && !isExiting) return null;

  return (
    <div
      ref={modalRef}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={handleOverlayClick}
    >
      <div
        className={cn(
          "relative w-full max-h-[90vh] overflow-auto rounded-2xl border border-gold-200 bg-white shadow-2xl",
          "max-w-2xl mx-4 p-6",
          isExiting && "animate-out fade-out zoom-out-95",
          !isExiting && "animate-in fade-in zoom-in-95"
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {(title || description) && (
          <div className="mb-6">
            {title && (
              <h2 className="text-2xl font-serif font-bold text-charcoal-950">
                {title}
              </h2>
            )}
            {description && (
              <p className="text-charcoal-600 mt-2">
                {description}
              </p>
            )}
          </div>
        )}
        {children}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-full p-2 text-charcoal-500 hover:bg-gold-50 hover:text-gold-600 transition-colors"
          aria-label="Close modal"
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}