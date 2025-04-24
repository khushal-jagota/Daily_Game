import React, { useState, useEffect, useRef } from 'react';
import styled from 'styled-components';
import { CanvasData } from '../types';
import { drawResultToCanvas } from '../utils/canvasRenderer';
import { X, Share, Copy, Award, AlertTriangle } from 'lucide-react';

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
  z-index: 1000;
  backdrop-filter: blur(2px);
`;

const ModalContent = styled.div`
  background-color: ${(props) => props.theme.gridBackground || '#121212'};
  border-radius: 12px;
  padding: 28px;
  width: 90%;
  max-width: 500px;
  max-height: 90vh;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  align-items: center;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(168, 85, 247, 0.1);
  border: 1px solid #2D2D2D;
`;

const ModalHeader = styled.div`
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  position: relative;
`;

const ModalTitle = styled.h2`
  margin: 0;
  color: ${(props) => props.theme.textColor || '#EAEAEA'};
  font-size: 1.5rem;
  display: flex;
  align-items: center;
  gap: 12px;
  
  svg {
    color: #1E1E1E;
  }
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
  padding: 8px;
  border-radius: 50%;
  transition: all 0.2s ease;
  
  &:hover {
    opacity: 1;
    background-color: rgba(255, 255, 255, 0.05);
  }
  
  &:focus {
    outline: none;
    box-shadow: 0 0 0 2px rgba(168, 85, 247, 0.4);
  }
`;

const Divider = styled.div`
  width: 100%;
  height: 1px;
  background-color: #2D2D2D;
  margin: 8px 0 20px;
`;

const ImageContainer = styled.div`
  width: 100%;
  display: flex;
  justify-content: center;
  margin: 16px 0 24px;
  padding: 16px;
  background-color: #1E1E1E;
  border-radius: 8px;
  border: 1px solid #2D2D2D;
  
  img {
    max-width: 100%;
    max-height: 60vh;
    object-fit: contain;
    border-radius: 4px;
  }
`;

const ButtonsContainer = styled.div`
  display: flex;
  justify-content: center;
  gap: 16px;
  margin-top: 20px;
  width: 100%;
`;

const ActionButton = styled.button<{ disabled?: boolean; $variant?: 'primary' | 'secondary' }>`
  padding: 12px 20px;
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
  gap: 8px;
  flex: 1;
  max-width: 180px;
  
  &:hover:not(:disabled) {
    background-color: ${(props) => props.$variant === 'primary' ? 'rgba(168, 85, 247, 0.25)' : '#2D2D2D'};
  }
  
  &:focus {
    outline: none;
    box-shadow: 0 0 0 2px rgba(168, 85, 247, 0.4);
  }
  
  svg {
    width: 18px;
    height: 18px;
  }
`;

const StatusContainer = styled.div`
  padding: 24px;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
`;

const LoadingMessage = styled(StatusContainer)`
  color: ${(props) => props.theme.textColor || '#EAEAEA'};
`;

const ErrorMessage = styled(StatusContainer)`
  color: #EF4444;
  
  svg {
    width: 32px;
    height: 32px;
  }
`;

const SuccessMessage = styled(StatusContainer)`
  color: #10B981;
  font-weight: 500;
`;

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
  // State for image generation and sharing
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [imageBlob, setImageBlob] = useState<Blob | null>(null);
  const [hasRetried, setHasRetried] = useState(false);
  const [shareSuccess, setShareSuccess] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);

  // Use a ref to track the current imageUrl for cleanup
  const imageUrlRef = useRef<string | null>(null);

    // Validate data integrity once when component mounts
    useEffect(() => {
      const validateCanvasData = () => {
        // Use optional chaining for safer access
        const requiredFields = [
          { field: 'currentStage', value: canvasData?.currentStage },
          { field: 'elapsedTime', value: canvasData?.elapsedTime },
          { field: 'gridData', value: !!(canvasData?.gridData && canvasData.gridData.length > 0) },
          { field: 'completedWords', value: canvasData?.completedWords instanceof Map },
          { field: 'theme', value: !!canvasData?.theme }
        ];
    
        // Filter based on undefined/null, or potentially 0 for numeric fields if needed
        const missingFields = requiredFields
        .filter(({ value, field }) => value === undefined || value === null || (typeof value === 'number' && value <= 0 && field !== 'currentStage') ) // Example: Check number > 0, 
          .map(({ field }) => field);
    
        if (missingFields.length > 0) {
          console.warn('[ResultModal] Missing required data for canvas generation:', missingFields);
        } else {
          console.log('[ResultModal] Canvas data validated successfully.'); // Optional success log
        }
      };
    
      // *** ADD CHECK FOR isOpen and canvasData ***
      // Only validate when the modal is open AND we have received the canvasData prop
      if (isOpen && canvasData) {
        validateCanvasData();
      }
    // *** DEPEND ON isOpen AS WELL ***
    }, [isOpen, canvasData]); // Run validation when modal opens or data changes WHILE open

  // Effect to generate the canvas image when the modal is opened
  useEffect(() => {
    // Only generate the image when the modal is opened
    if (!isOpen) {
      return;
    }

    // Verify data availability for debugging purposes
    console.log('[ResultModal] Received canvasData:', {
      currentStage: canvasData.currentStage,
      elapsedTime: canvasData.elapsedTime,
      completedWordsCount: canvasData.completedWords.size,
      puzzleNumber: canvasData.puzzleNumber,
      puzzleThemeName: canvasData.puzzleThemeName,
      hasGridData: !!canvasData.gridData && !!canvasData.gridData.length,
      hasTheme: !!canvasData.theme
    });

    // Cleanup previous imageUrl if it exists
    if (imageUrlRef.current) {
      URL.revokeObjectURL(imageUrlRef.current);
      imageUrlRef.current = null;
    }

    // Reset state when the modal opens
    setIsLoading(true);
    setError(null);
    setImageUrl(null);
    setImageBlob(null);
    
    // Create an offscreen canvas
    const canvas = document.createElement('canvas');
    
    // Generate the image asynchronously
    const generateImage = async () => {
      try {
        // Call the drawResultToCanvas function to render the canvas
        const blob = await drawResultToCanvas(canvas, canvasData);
        
        // Handle success
        if (blob) {
          // Create object URL from the blob
          const url = URL.createObjectURL(blob);
          
          // Store the URL in the ref for cleanup
          imageUrlRef.current = url;
          
          setImageUrl(url);
          setImageBlob(blob);
          setIsLoading(false);
        } else {
          // Handle failure
          setError('Failed to generate image.');
          setIsLoading(false);
        }
      } catch (err) {
        // Handle unexpected errors
        setError(`Failed to generate image: ${err instanceof Error ? err.message : 'Unknown error'}`);
        setIsLoading(false);
      }
    };
    
    // Start the image generation process
    generateImage();
    
    // Cleanup function to prevent memory leaks
    return () => {
      if (imageUrlRef.current) {
        URL.revokeObjectURL(imageUrlRef.current);
        imageUrlRef.current = null;
      }
    };
  }, [isOpen, canvasData]);

  // Handle modal close
  const handleClose = () => {
    onClose();
  };

  // Handle share button click
  const handleShare = async () => {
    if (!imageBlob) return;
    
    // Reset any previous status messages
    setShareSuccess(false);
    setCopySuccess(false);
    
    // Create a file from the blob
    const file = new File([imageBlob], 'crossword-result.png', {
      type: 'image/png'
    });
    
    // Check if the share API is available and supports sharing files
    if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
      try {
        // Try to share both text and image
        await navigator.share({
          title: 'My Crossword Result',
          text: `I completed the "${canvasData.puzzleThemeName}" crossword!`,
          files: [file]
        });
        
        // Show success message
        setShareSuccess(true);
        setTimeout(() => setShareSuccess(false), 3000);
      } catch (err) {
        // Ignore AbortError (user cancelled share)
        if (err instanceof Error && err.name !== 'AbortError') {
          console.error('Error sharing result:', err);
          
          // Fall back to text-only sharing if file sharing failed
          try {
            await navigator.share({
              title: 'My Crossword Result',
              text: `I completed the "${canvasData.puzzleThemeName}" crossword!`
            });
            
            // Show success message
            setShareSuccess(true);
            setTimeout(() => setShareSuccess(false), 3000);
          } catch (textErr) {
            // Ignore AbortError (user cancelled share)
            if (textErr instanceof Error && textErr.name !== 'AbortError') {
              console.error('Error sharing text result:', textErr);
            }
          }
        }
      }
    } else {
      // Fallback if Web Share API is not available
      alert('Sorry, sharing is not supported on this device/browser.');
    }
  };

  // Handle copy button click
  const handleCopy = async () => {
    if (!imageBlob) return;
    
    // Reset any previous status messages
    setShareSuccess(false);
    setCopySuccess(false);
    
    // Try to copy the image to clipboard
    try {
      // Check if Clipboard API supports writing
      if (navigator.clipboard && navigator.clipboard.write) {
        // Create a clipboard item from the blob
        const clipboardItem = new ClipboardItem({
          'image/png': imageBlob
        });
        
        // Write the clipboard item
        await navigator.clipboard.write([clipboardItem]);
        
        // Show success message
        setCopySuccess(true);
        setTimeout(() => setCopySuccess(false), 3000);
      } else {
        // Fallback if Clipboard API is not available
        alert('Sorry, copying to clipboard is not supported on this device/browser.');
      }
    } catch (err) {
      console.error('Error copying to clipboard:', err);
    }
  };

  // Render the modal content
  return (
    <ModalOverlay $isOpen={isOpen} onClick={handleClose}>
      <ModalContent onClick={(e) => e.stopPropagation()}>
        <ModalHeader>
          <ModalTitle>
            <Award />
            Come Back Tomorrow!
          </ModalTitle>
          <CloseButton onClick={handleClose} aria-label="Close">
            <X size={20} />
          </CloseButton>
        </ModalHeader>
        
        <Divider />
        
        {/* Show loading, error, or image */}
        {isLoading ? (
          <LoadingMessage>
            <div>Generating your result...</div>
          </LoadingMessage>
        ) : error ? (
          <ErrorMessage>
            <AlertTriangle />
            <div>{error}</div>
          </ErrorMessage>
        ) : imageUrl ? (
          <ImageContainer>
            <img src={imageUrl} alt="Crossword result" />
          </ImageContainer>
        ) : null}
        
        {/* Display success messages */}
        {shareSuccess && <SuccessMessage>Shared successfully!</SuccessMessage>}
        {copySuccess && <SuccessMessage>Copied to clipboard!</SuccessMessage>}
        
        {/* Show buttons if image is available */}
        {!isLoading && !error && imageUrl && (
          <ButtonsContainer>
            <ActionButton 
              onClick={handleShare} 
              disabled={!imageBlob}
              aria-label="Share Result"
            >
              <Share size={18} />
              Share
            </ActionButton>
            <ActionButton 
              onClick={handleCopy} 
              disabled={!imageBlob}
              aria-label="Copy to Clipboard"
            >
              <Copy size={18} />
              Copy
            </ActionButton>
          </ButtonsContainer>
        )}
      </ModalContent>
    </ModalOverlay>
  );
};

export default ResultModal; 