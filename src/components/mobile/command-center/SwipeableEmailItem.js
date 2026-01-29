import React, { useState, useRef } from 'react';
import styled from 'styled-components';
import { useSwipeable } from 'react-swipeable';
import { FaArchive, FaReply, FaTrash, FaClock } from 'react-icons/fa';

/**
 * SwipeableEmailItem - Email item with swipe actions
 *
 * Swipe left: Archive (red background)
 * Swipe right: Reply (blue background)
 */
const SwipeableEmailItem = ({
  children,
  onArchive,
  onReply,
  onDelete,
  onSnooze,
  theme = 'dark',
}) => {
  const [offset, setOffset] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const containerRef = useRef(null);

  const SWIPE_THRESHOLD = 80; // Minimum swipe to trigger action
  const MAX_SWIPE = 120; // Maximum visual swipe distance

  const handlers = useSwipeable({
    onSwiping: (e) => {
      if (isAnimating) return;

      // Limit the swipe distance
      const newOffset = Math.max(-MAX_SWIPE, Math.min(MAX_SWIPE, e.deltaX));
      setOffset(newOffset);
    },
    onSwipedLeft: (e) => {
      if (Math.abs(e.deltaX) > SWIPE_THRESHOLD) {
        // Trigger archive
        setIsAnimating(true);
        setOffset(-MAX_SWIPE);
        setTimeout(() => {
          onArchive?.();
          setOffset(0);
          setIsAnimating(false);
        }, 200);
      } else {
        // Snap back
        setOffset(0);
      }
    },
    onSwipedRight: (e) => {
      if (Math.abs(e.deltaX) > SWIPE_THRESHOLD) {
        // Trigger reply
        setIsAnimating(true);
        setOffset(MAX_SWIPE);
        setTimeout(() => {
          onReply?.();
          setOffset(0);
          setIsAnimating(false);
        }, 200);
      } else {
        // Snap back
        setOffset(0);
      }
    },
    onSwiped: () => {
      // Reset if not triggered
      if (!isAnimating && Math.abs(offset) < SWIPE_THRESHOLD) {
        setOffset(0);
      }
    },
    trackMouse: false,
    trackTouch: true,
    delta: 10,
    preventScrollOnSwipe: true,
  });

  // Calculate action visibility based on swipe direction
  const showLeftAction = offset < -10; // Swiping left = archive
  const showRightAction = offset > 10; // Swiping right = reply
  const actionOpacity = Math.min(1, Math.abs(offset) / SWIPE_THRESHOLD);

  return (
    <Container ref={containerRef}>
      {/* Left action (Reply) - shown when swiping right */}
      <ActionBackground
        $side="left"
        $visible={showRightAction}
        style={{ opacity: actionOpacity }}
      >
        <ActionContent $color="#3B82F6">
          <FaReply size={20} />
          <ActionLabel>Reply</ActionLabel>
        </ActionContent>
      </ActionBackground>

      {/* Right action (Archive) - shown when swiping left */}
      <ActionBackground
        $side="right"
        $visible={showLeftAction}
        style={{ opacity: actionOpacity }}
      >
        <ActionContent $color="#EF4444">
          <FaArchive size={20} />
          <ActionLabel>Archive</ActionLabel>
        </ActionContent>
      </ActionBackground>

      {/* Main content */}
      <SwipeableContent
        {...handlers}
        style={{
          transform: `translateX(${offset}px)`,
          transition: isAnimating || offset === 0 ? 'transform 0.2s ease-out' : 'none',
        }}
        theme={theme}
      >
        {children}
      </SwipeableContent>
    </Container>
  );
};

// Styled Components
const Container = styled.div`
  position: relative;
  overflow: hidden;
`;

const ActionBackground = styled.div`
  position: absolute;
  top: 0;
  bottom: 0;
  width: 120px;
  display: flex;
  align-items: center;
  justify-content: ${props => props.$side === 'left' ? 'flex-start' : 'flex-end'};
  ${props => props.$side === 'left' ? 'left: 0;' : 'right: 0;'}
  opacity: ${props => props.$visible ? 1 : 0};
  transition: opacity 0.1s ease;
`;

const ActionContent = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  width: 80px;
  height: 100%;
  background: ${props => props.$color};
  color: white;
`;

const ActionLabel = styled.span`
  font-size: 11px;
  font-weight: 600;
`;

const SwipeableContent = styled.div`
  position: relative;
  background: ${props => props.theme === 'light' ? '#FFFFFF' : '#111827'};
  z-index: 1;
  touch-action: pan-y;
`;

export default SwipeableEmailItem;
