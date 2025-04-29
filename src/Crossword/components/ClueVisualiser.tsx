import React from 'react';
import styled from 'styled-components';
import { Direction } from '../types';

// Styled components
const ClueContainer = styled.div`
  padding: 0.75rem 1rem;
  background-color: transparent;
  border-radius: 8px;
  width: 100%;
  cursor: pointer;
  text-align: left;
  
  &:hover {
    background-color: rgba(0, 0, 0, 0.03);
  }

  @media (min-width: 769px) {
    max-width: 50%;
    margin-left: auto;
    margin-right: auto;
  }
`;

const ClueHeader = styled.div`
  font-weight: 600;
  margin-bottom: 0.25rem;
  color: ${props => props.theme.numberColor || '#666'};
  text-transform: capitalize;
  font-family: system-ui, sans-serif;
  font-size: 0.9rem;
`;

const ClueText = styled.div`
  font-size: 1.1rem;
  color: ${props => props.theme.textColor || '#333'};
  font-family: system-ui, sans-serif;
  line-height: 1.4;
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