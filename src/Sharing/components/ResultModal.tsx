import React, { useState, useEffect, useRef } from 'react';
import styled from 'styled-components';
import { CanvasData } from '../types';
import { drawResultToCanvas } from '../utils/canvasRenderer';
import { X, Share, Copy, AlertTriangle } from 'lucide-react';

// Styled components for the modal
const ModalOverlay = styled.div<{ $isOpen: boolean }>`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.75);
  display: ${(props) => (props.$isOpen ? 'flex' : 'none')};
  justify-content: center;
  align-items: center;
  z-index: 1000; // Ensure it's above other content
  backdrop-filter: blur(2px);
`;

const ModalContent = styled.div`
  background-color: ${(props) => props.theme.gridBackground || '#121212'};
  border-radius: 12px;
  width: 90%;
  max-width: 31.25rem; /* 500px -> rem */
  max-height: 90svh; /* Use smallest viewport height, fallback */
  /* max-height fallback for older browsers */
  @supports not (height: 1svh) {
    max-height: 90vh;
  }
  overflow-y: auto; /* Keep scroll for potentially tall image content */
  display: flex;
  flex-direction: column;
  align-items: center;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(168, 85, 247, 0.1);
  border: 1px solid #2D2D2D;
  position: relative; // For absolute close button

  /* --- Flexible Padding & Safe Area Handling --- */
  padding: clamp(1.25rem, 2vw + 0.75rem, 1.75rem); /* Approx 20px to 28px */
  /* Incorporate safe area insets using CSS variables (adjust var names if needed) */
  padding-top: calc(clamp(1.25rem, 2vw + 0.75rem, 1.75rem) + var(--safe-area-inset-top, 0px));
  padding-bottom: calc(clamp(1.25rem, 2vw + 0.75rem, 1.75rem) + var(--safe-area-inset-bottom, 0px));
  padding-left: calc(clamp(1.25rem, 2vw + 0.75rem, 1.75rem) + var(--safe-area-inset-left, 0px));
  padding-right: calc(clamp(1.25rem, 2vw + 0.75rem, 1.75rem) + var(--safe-area-inset-right, 0px));
`;

const ModalHeader = styled.div`
  width: 100%;
  text-align: center;
  /* Responsive margin */
  margin-bottom: clamp(1rem, 1.5vw + 0.5rem, 1.25rem); /* Approx 16px to 20px */
`;

const ModalTitle = styled.h2`
  margin: 0;
  color: ${(props) => props.theme.textColor || '#EAEAEA'};
  /* --- Flexible Font Size --- */
  font-size: clamp(1.25rem, 1.1rem + 0.75vw, 1.5rem); /* Approx 20px to 24px */
  line-height: 1.3;
`;

const CloseButton = styled.button`
  background: transparent;
  border: none;
  cursor: pointer;
  color: ${(props) => props.theme.textColor || '#EAEAEA'};
  opacity: 0.7;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.5rem; /* 8px -> rem */
  border-radius: 50%;
  transition: all 0.2s ease;
  position: absolute;
  top: 0.75rem; /* 12px -> rem */
  right: 0.75rem; /* 12px -> rem */
  z-index: 1;

  &:hover {
    opacity: 1;
    background-color: rgba(255, 255, 255, 0.05);
  }

  &:focus {
    outline: none;
    box-shadow: 0 0 0 0.125rem rgba(168, 85, 247, 0.4); /* 2px -> rem */
  }
`;

const ImageContainer = styled.div`
  width: 100%;
  display: flex;
  justify-content: center;
  /* Responsive margin */
  margin: clamp(0.5rem, 1vw, 0.75rem) 0 clamp(1rem, 2vw + 0.5rem, 1.5rem); /* Approx 8px/16px top, 16px/24px bottom */
  padding: 0;

  img {
    max-width: 100%;
    /* Limit image height relative to viewport */
    max-height: 60svh; /* Use smallest viewport height */
    /* Fallback for older browsers */
    @supports not (height: 1svh) {
      max-height: 60vh;
    }
    object-fit: contain;
    display: block; // Prevent extra space below image
  }
`;

const ButtonsContainer = styled.div`
  display: flex;
  justify-content: center;
  /* Responsive gap */
  gap: clamp(0.75rem, 1vw + 0.5rem, 1rem); /* Approx 12px to 16px */
  /* Responsive margin */
  margin-top: clamp(1rem, 1.5vw + 0.5rem, 1.25rem); /* Approx 16px to 20px */
  width: 100%;
  flex-wrap: wrap; // Allow buttons to wrap on very narrow screens
`;

const ActionButton = styled.button<{ disabled?: boolean; $variant?: 'primary' | 'secondary' }>`
  /* --- Flexible Padding & Font Size --- */
  padding: clamp(0.6rem, 1vw + 0.4rem, 0.75rem) clamp(1rem, 1.5vw + 0.5rem, 1.25rem); /* Vert/Horiz padding */
  font-size: clamp(0.875rem, 0.8rem + 0.3vw, 1rem); /* Approx 14px to 16px */

  border-radius: 8px;
  background-color: ${(props) => props.$variant === 'primary' ? 'rgba(168, 85, 247, 0.15)' : '#1E1E1E'};
  color: ${(props) => props.$variant === 'primary' ? '#A855F7' : props.theme.textColor || '#EAEAEA'};
  border: 1px solid ${(props) => props.$variant === 'primary' ? '#A855F7' : '#2D2D2D'};
  font-weight: 500;
  cursor: ${(props) => (props.disabled ? 'not-allowed' : 'pointer')};
  opacity: ${(props) => (props.disabled ? 0.6 : 1)};
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem; /* 8px -> rem */
  flex: 1 1 auto; /* Allow shrinking and growing, base auto width */
  min-width: 120px; // Prevent buttons becoming too small
  max-width: 11.25rem; /* 180px -> rem */

  &:hover:not(:disabled) {
    background-color: ${(props) => props.$variant === 'primary' ? 'rgba(168, 85, 247, 0.25)' : '#2D2D2D'};
  }

  &:focus {
    outline: none;
    box-shadow: 0 0 0 0.125rem rgba(168, 85, 247, 0.4); /* 2px -> rem */
  }

  svg {
    width: 1.125rem; /* 18px -> rem */
    height: 1.125rem; /* 18px -> rem */
    flex-shrink: 0; // Prevent icon squishing
  }
`;

const StatusContainer = styled.div`
  /* Responsive padding */
  padding: clamp(1rem, 2vw + 0.5rem, 1.5rem); /* Approx 16px to 24px */
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  /* Responsive gap */
  gap: clamp(0.5rem, 1vw + 0.25rem, 0.75rem); /* Approx 8px to 12px */
  width: 100%; // Take full width for centering
  min-height: 100px; // Ensure status messages have some space
`;

const LoadingMessage = styled(StatusContainer)`
  color: ${(props) => props.theme.textColor || '#EAEAEA'};
`;

const ErrorMessage = styled(StatusContainer)`
  color: #EF4444; // Consider using theme variable if available

  svg {
    width: 2rem; /* 32px -> rem */
    height: 2rem; /* 32px -> rem */
    margin-bottom: 0.25rem; // Add small space below icon
  }
`;

// --- React Component --- (No logical changes, only styles updated)
interface ResultModalProps {
  isOpen: boolean;
  onClose: () => void;
  canvasData: CanvasData;
}

export const ResultModal: React.FC<ResultModalProps> = ({
  isOpen,
  onClose,
  canvasData
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [imageBlob, setImageBlob] = useState<Blob | null>(null);
  // Removed hasRetried state as it wasn't used

  const imageUrlRef = useRef<string | null>(null);

  // Validate data integrity (No changes here)
  useEffect(() => {
    const validateCanvasData = () => {
      const requiredFields = [
        { field: 'currentStage', value: canvasData?.currentStage },
        { field: 'elapsedTime', value: canvasData?.elapsedTime },
        { field: 'gridData', value: !!(canvasData?.gridData && canvasData.gridData.length > 0) },
        { field: 'completedWords', value: canvasData?.completedWords instanceof Map },
        { field: 'theme', value: !!canvasData?.theme }
      ];
      const missingFields = requiredFields
      .filter(({ value, field }) => value === undefined || value === null || (typeof value === 'number' && value <= 0 && field !== 'currentStage') )
        .map(({ field }) => field);

      if (missingFields.length > 0) {
        console.warn('[ResultModal] Missing required data for canvas generation:', missingFields);
      } else {
        console.log('[ResultModal] Canvas data validated successfully.');
      }
    };

    if (isOpen && canvasData) {
      validateCanvasData();
    }
  }, [isOpen, canvasData]);

  // Effect to generate the canvas image (No changes here)
  useEffect(() => {
    if (!isOpen) {
      return;
    }
    console.log('[ResultModal] Received canvasData:', {
      currentStage: canvasData.currentStage,
      elapsedTime: canvasData.elapsedTime,
      completedWordsCount: canvasData.completedWords.size,
      puzzleNumber: canvasData.puzzleNumber,
      puzzleThemeName: canvasData.puzzleThemeName,
      hasGridData: !!canvasData.gridData && !!canvasData.gridData.length,
      hasTheme: !!canvasData.theme
    });

    if (imageUrlRef.current) {
      URL.revokeObjectURL(imageUrlRef.current);
      imageUrlRef.current = null;
    }
    setIsLoading(true);
    setError(null);
    setImageUrl(null);
    setImageBlob(null);
    const canvas = document.createElement('canvas');

    const generateImage = async () => {
      try {
        const blob = await drawResultToCanvas(canvas, canvasData);
        if (blob) {
          const url = URL.createObjectURL(blob);
          imageUrlRef.current = url;
          setImageUrl(url);
          setImageBlob(blob);
        } else {
          setError('Failed to generate image data (blob is null).');
        }
      } catch (err) {
        console.error("Error during canvas drawing:", err); // Log the actual error
        setError(`Failed to generate image: ${err instanceof Error ? err.message : 'Unknown error'}`);
      } finally {
        setIsLoading(false); // Ensure loading is always set to false
      }
    };

    generateImage();

    return () => {
      if (imageUrlRef.current) {
        URL.revokeObjectURL(imageUrlRef.current);
        imageUrlRef.current = null;
      }
    };
  }, [isOpen, canvasData]);

  // Handle modal close (No changes here)
  const handleClose = () => {
    onClose();
  };

  // Handle share button click (No changes here)
  const handleShare = async () => {
    if (!imageBlob || !navigator.share) {
      alert('Sorry, sharing is not supported or image is not ready.');
      return;
    }

    const file = new File([imageBlob], 'crossword-result.png', { type: 'image/png' });
    const shareData: ShareData = {
        title: 'My Crossword Result',
        text: `I completed the "${canvasData.puzzleThemeName || 'Daily'}" crossword!`,
        files: [file]
    };


    if (navigator.canShare && navigator.canShare({ files: [file] })) {
        try {
            await navigator.share(shareData);
            console.log('Shared successfully');
        } catch (err) {
            if (err instanceof Error && err.name !== 'AbortError') {
                console.error('Error sharing:', err);
                // Fallback or specific error handling
                 try { // Attempt text only if file share fails
                    await navigator.share({ title: shareData.title, text: shareData.text });
                } catch (textErr) {
                     if (textErr instanceof Error && textErr.name !== 'AbortError') {
                        console.error('Error sharing text only:', textErr);
                        alert('Sharing failed. Please try again.');
                     }
                }
            }
        }
    } else {
        // Fallback for browsers that claim support but can't share the specific data
        try {
           await navigator.share({ title: shareData.title, text: shareData.text });
        } catch (textErr) {
           if (textErr instanceof Error && textErr.name !== 'AbortError') {
              console.error('Error sharing text fallback:', textErr);
              alert('Sharing files not supported, and text sharing failed.');
           }
        }
    }
};

  // Handle copy button click (No changes here, relies on Clipboard API support)
  const handleCopy = async () => {
    if (!imageBlob) {
        alert('Image is not ready to copy.');
        return;
    }

    // Check for ClipboardItem support specifically
    if (typeof ClipboardItem === "undefined") {
        alert('Sorry, copying images to the clipboard is not supported by your browser.');
        return;
    }

    try {
        const clipboardItem = new ClipboardItem({ 'image/png': imageBlob });
        await navigator.clipboard.write([clipboardItem]);
        alert('Result image copied to clipboard!'); // Provide user feedback
    } catch (err) {
        console.error('Error copying to clipboard:', err);
        alert('Failed to copy image. Your browser might not support this feature or require specific permissions.');
    }
};

  return (
    <ModalOverlay $isOpen={isOpen} onClick={handleClose}>
      {/* Add role="dialog" and aria-modal="true" for accessibility */}
      <ModalContent
         onClick={(e) => e.stopPropagation()}
         role="dialog"
         aria-modal="true"
         aria-labelledby="result-modal-title" // Link title for screen readers
      >
        <ModalHeader>
          {/* Add id for aria-labelledby */}
          <ModalTitle id="result-modal-title">
            Come Back Tomorrow!
          </ModalTitle>
          <CloseButton onClick={handleClose} aria-label="Close results modal">
            <X size={20} /> {/* Keep size prop for icon */}
          </CloseButton>
        </ModalHeader>

        {isLoading ? (
          <LoadingMessage>
            <div>Generating your result...</div>
            {/* Optionally add a spinner here */}
          </LoadingMessage>
        ) : error ? (
          <ErrorMessage>
            <AlertTriangle aria-hidden="true" />
            <div>{error}</div>
             {/* Optionally add a retry button here */}
          </ErrorMessage>
        ) : imageUrl ? (
          <ImageContainer>
            <img src={imageUrl} alt="Crossword puzzle result summary" />
          </ImageContainer>
        ) : null}

        {!isLoading && !error && imageUrl && (
          <ButtonsContainer>
            <ActionButton
              onClick={handleShare}
              disabled={!imageBlob || !navigator.share} // Also disable if share API not present
              aria-label="Share Result Image"
            >
              <Share size={18} /> {/* Keep size prop */}
              Share
            </ActionButton>
            <ActionButton
              onClick={handleCopy}
              // Disable if ClipboardItem isn't supported (though check happens on click too)
              disabled={!imageBlob || typeof ClipboardItem === "undefined"}
              aria-label="Copy Result Image to Clipboard"
            >
              <Copy size={18} /> {/* Keep size prop */}
              Copy
            </ActionButton>
          </ButtonsContainer>
        )}
      </ModalContent>
    </ModalOverlay>
  );
};

export default ResultModal;