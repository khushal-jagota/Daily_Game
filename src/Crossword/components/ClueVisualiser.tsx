import React from 'react';
import styled from 'styled-components';
import { Direction } from '../types';

// Styled components
const ClueContainer = styled.div`
  padding: 16px;
  background-color: #f5f5f5;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  margin-bottom: 16px;
  cursor: pointer;
  
  &:hover {
    background-color: #e8e8e8;
  }
`;

const ClueHeader = styled.div`
  font-weight: bold;
  margin-bottom: 8px;
  color: #333;
  text-transform: capitalize;
`;

const ClueText = styled.div`
  font-size: 18px;
  color: #555;
`;

// Props interface
interface ClueVisualiserProps {
  direction: Direction;
  number: string;
  clueText: string;
  onClueClick?: (direction: Direction, number: string) => void;
}

/**
 * Component to display the currently active clue
 */
const ClueVisualiser: React.FC<ClueVisualiserProps> = ({ 
  direction, 
  number, 
  clueText,
  onClueClick 
}) => {
  const handleClick = () => {
    if (onClueClick) {
      onClueClick(direction, number);
    }
  };

  return (
    <ClueContainer onClick={handleClick}>
      <ClueHeader>{`${direction} ${number}`}</ClueHeader>
      <ClueText>{clueText}</ClueText>
    </ClueContainer>
  );
};

export default ClueVisualiser; 