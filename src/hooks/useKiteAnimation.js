import { useEffect, useRef, useState } from "react";
import { Animated, Dimensions } from "react-native";

const { width: screenWidth, height: screenHeight } = Dimensions.get("window");
const kiteSize = 42;
const topZoneHeight = screenHeight / 3;

const selectKiteSprite = (fromX, fromY, toX, toY) => {
  const dx = toX - fromX;
  const dy = toY - fromY;
  const angleRad = Math.atan2(dx, -dy);
  let angleDeg = (angleRad * 180) / Math.PI;
  while (angleDeg > 180) angleDeg -= 360;
  while (angleDeg < -180) angleDeg += 360;

  const absAngle = Math.abs(angleDeg);
  const deviationFromVertical = Math.min(absAngle, 180 - absAngle);

  if (deviationFromVertical <= 10) return "vertical";
  const movingRight = angleDeg > 0;
  if (deviationFromVertical <= 45)
    return movingRight ? "slightRight" : "slightLeft";
  return movingRight ? "fullRight" : "fullLeft";
};

/**
 * Hook for managing kite animation with drift and touch interaction.
 */
export default function useKiteAnimation() {
  const kitePos = useRef(new Animated.ValueXY({ x: 0, y: 0 })).current;
  const currentPos = useRef({ x: 0, y: 0 });
  const targetPos = useRef({ x: 0, y: 0 });
  const [kiteSprite, setKiteSprite] = useState("vertical");
  const driftTimeout = useRef(null);
  const currentAnimation = useRef(null);
  const isTouching = useRef(false);

  const scheduleDrift = () => {
    if (isTouching.current) return;

    const targetX = Math.max(
      12,
      Math.min(screenWidth - kiteSize - 12, Math.random() * screenWidth),
    );
    const targetY = Math.max(
      12,
      Math.min(topZoneHeight - kiteSize - 12, Math.random() * topZoneHeight),
    );

    targetPos.current = { x: targetX, y: targetY };
    const sprite = selectKiteSprite(
      currentPos.current.x,
      currentPos.current.y,
      targetX,
      targetY,
    );
    setKiteSprite(sprite);

    if (currentAnimation.current) currentAnimation.current.stop();

    currentAnimation.current = Animated.timing(kitePos, {
      toValue: { x: targetX, y: targetY },
      duration: 12000,
      useNativeDriver: true,
    });

    currentAnimation.current.start(({ finished }) => {
      if (finished) {
        currentPos.current = { x: targetX, y: targetY };
        if (!isTouching.current) {
          driftTimeout.current = setTimeout(scheduleDrift, 2000);
        }
      }
    });
  };

  useEffect(() => {
    const startX = screenWidth * 0.65;
    const startY = topZoneHeight * 0.35;
    kitePos.setValue({ x: startX, y: startY });
    currentPos.current = { x: startX, y: startY };
    targetPos.current = { x: startX, y: startY };
    scheduleDrift();

    return () => {
      if (driftTimeout.current) clearTimeout(driftTimeout.current);
      if (currentAnimation.current) currentAnimation.current.stop();
    };
  }, []);

  const handleTopZoneTouch = (event) => {
    const { locationX, locationY } = event.nativeEvent;
    const targetX = Math.max(
      12,
      Math.min(screenWidth - kiteSize - 12, locationX - kiteSize / 2),
    );
    const targetY = Math.max(
      12,
      Math.min(topZoneHeight - kiteSize - 12, locationY - kiteSize / 2),
    );

    targetPos.current = { x: targetX, y: targetY };
    const sprite = selectKiteSprite(
      currentPos.current.x,
      currentPos.current.y,
      targetX,
      targetY,
    );
    setKiteSprite(sprite);

    if (currentAnimation.current) currentAnimation.current.stop();

    const distance = Math.sqrt(
      Math.pow(targetX - currentPos.current.x, 2) +
        Math.pow(targetY - currentPos.current.y, 2),
    );
    const duration = Math.max(6000, distance * 30);

    currentAnimation.current = Animated.timing(kitePos, {
      toValue: { x: targetX, y: targetY },
      duration: duration,
      useNativeDriver: true,
    });

    currentAnimation.current.start(({ finished }) => {
      if (finished) currentPos.current = { x: targetX, y: targetY };
    });

    currentPos.current = {
      x: currentPos.current.x + (targetX - currentPos.current.x) * 0.15,
      y: currentPos.current.y + (targetY - currentPos.current.y) * 0.15,
    };
  };

  const handleTouchStart = (event) => {
    isTouching.current = true;
    if (driftTimeout.current) {
      clearTimeout(driftTimeout.current);
      driftTimeout.current = null;
    }
    if (currentAnimation.current) currentAnimation.current.stop();
    handleTopZoneTouch(event);
  };

  const handleTouchEnd = () => {
    isTouching.current = false;
    driftTimeout.current = setTimeout(() => scheduleDrift(), 1000);
  };

  return {
    kitePos,
    kiteSprite,
    handleTouchStart,
    handleTopZoneTouch,
    handleTouchEnd,
  };
}
