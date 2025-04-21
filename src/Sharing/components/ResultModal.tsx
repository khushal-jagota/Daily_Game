import React, { useState, useEffect, useRef } from 'react';
import styled from 'styled-components';
import { CanvasData } from '../types';
import { drawResultToCanvas } from '../utils/canvasRenderer';

// Styled components for the modal
const ModalOverlay = styled.div<{ $isOpen: boolean }>`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.6);
  display: ${(props) => (props.$isOpen ? 'flex' : 'none')};
  justify-content: center;
  align-items: center;
  z-index: 1000;
`;

const ModalContent = styled.div`
  background-color: ${(props) => props.theme.gridBackground};
  border-radius: 8px;
  padding: 20px;
  width: 90%;
  max-width: 500px;
  max-height: 90vh;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  align-items: center;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.2);
`;

const ModalHeader = styled.div`
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
`;

const ModalTitle = styled.h2`
  margin: 0;
  color: ${(props) => props.theme.textColor};
  font-size: 1.5rem;
`;

const CloseButton = styled.button`
  background: transparent;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: ${(props) => props.theme.textColor};
  opacity: 0.7;
  &:hover {
    opacity: 1;
  }
`;

const ImageContainer = styled.div`
  width: 100%;
  display: flex;
  justify-content: center;
  margin-bottom: 20px;
  img {
    max-width: 100%;
    max-height: 60vh;
    object-fit: contain;
  }
`;

const ButtonsContainer = styled.div`
  display: flex;
  justify-content: center;
  gap: 15px;
  margin-top: 10px;
`;

const ActionButton = styled.button<{ disabled?: boolean }>`
  padding: 10px 20px;
  border-radius: 4px;
  background-color: ${(props) => props.theme.completionStage3Background};
  color: white;
  border: none;
  font-weight: bold;
  cursor: ${(props) => (props.disabled ? 'not-allowed' : 'pointer')};
  opacity: ${(props) => (props.disabled ? 0.6 : 1)};
  transition: background-color 0.3s;
  
  &:hover:not(:disabled) {
    background-color: ${(props) => props.theme.completionStage2Background};
  }
`;

const LoadingMessage = styled.div`
  padding: 30px;
  text-align: center;
  font-weight: bold;
  color: ${(props) => props.theme.textColor};
`;

const ErrorMessage = styled.div`
  padding: 20px;
  text-align: center;
  color: red;
`;

const SuccessMessage = styled.div`
  padding: 20px;
  text-align: center;
  color: green;
  font-weight: bold;
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
  }, [isOpen, canvasData]); // Only depend on isOpen and canvasData, NOT on state variables

  // We want to handle the error
  useEffect(() => {
    // If error, automatically try one more time
    if (error && !hasRetried) {
      setHasRetried(true);
      setIsLoading(true);
      setError(null);
    }
  }, [error, hasRetried]);

  // Close modal handler
  const handleClose = () => {
    onClose();
  };

  // Implement share functionality
  const handleShare = async () => {
    // Reset states
    setError(null);
    setShareSuccess(false);
    
    // Check if we have a blob to share
    if (!imageBlob) {
      setError('No image available to share.');
      return;
    }

    try {
      // Check if Web Share API is available
      if (!navigator.share) {
        // Provide fallback or error message for unsupported browsers
        setError('Share functionality is not supported in this browser.');
        return;
      }
      
      // Create a File from the Blob for sharing
      // Use a dynamic filename based on puzzle info if available
      const puzzleNumber = canvasData.puzzleNumber || '1';
      const puzzleTheme = canvasData.puzzleThemeName || 'Sales';
      const fileName = `Crossle-${puzzleNumber}-${puzzleTheme}.png`;
      
      const file = new File([imageBlob], fileName, { type: 'image/png' });
      
      // Prepare share data with text
      const shareText = `Check out my Crossle result! I completed puzzle #${puzzleNumber} - ${puzzleTheme}`;
      const shareTitle = `Crossle #${puzzleNumber} - ${puzzleTheme}`;
      
      // Check if the browser supports file sharing
      // @ts-ignore - TypeScript might not recognize the canShare method
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        // Full share with file
        await navigator.share({
          title: shareTitle,
          text: shareText,
          files: [file]
        });
      } else {
        // Fallback to text-only sharing
        await navigator.share({
          title: shareTitle,
          text: shareText
        });
      }
      
      // Set success state
      setShareSuccess(true);
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setShareSuccess(false);
      }, 3000);
      
    } catch (error) {
      // User cancelled or share failed
      if (error instanceof Error && error.name !== 'AbortError') {
        setError(`Failed to share: ${error.message}`);
      }
      // We don't set an error for AbortError as it's a user-initiated cancellation
    }
  };

  const handleDownload = () => {
    // Will be implemented in step 6.9
  };

  return (
    <ModalOverlay $isOpen={isOpen} onClick={handleClose}>
      <ModalContent onClick={(e) => e.stopPropagation()}>
        <ModalHeader>
          <ModalTitle>Game Result</ModalTitle>
          <CloseButton onClick={handleClose}>×</CloseButton>
        </ModalHeader>

        <ImageContainer>
          {isLoading && (
            <LoadingMessage>Generating your result image...</LoadingMessage>
          )}
          
          {error && (
            <ErrorMessage>
              Failed to generate image: {error}
            </ErrorMessage>
          )}
          
          {!isLoading && !error && imageUrl && (
            <img src={imageUrl} alt="Crossword Result Preview" />
          )}
          
          {!isLoading && !error && !imageUrl && (
            <LoadingMessage>No image available</LoadingMessage>
          )}
        </ImageContainer>

        {shareSuccess && (
          <SuccessMessage>Successfully shared!</SuccessMessage>
        )}

        <ButtonsContainer>
          <ActionButton 
            onClick={handleShare} 
            disabled={isLoading || !!error || !imageBlob}
          >
            Share
          </ActionButton>
          <ActionButton 
            onClick={handleDownload} 
            disabled={isLoading || !!error || !imageBlob}
          >
            Download
          </ActionButton>
        </ButtonsContainer>
      </ModalContent>
    </ModalOverlay>
  );
};

export default ResultModal; 