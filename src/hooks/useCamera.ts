import { useRef, useState, useCallback, useEffect } from 'react';
import { CameraView, CameraType, useCameraPermissions, useMicrophonePermissions } from 'expo-camera';

interface UseCameraReturn {
  cameraRef: React.RefObject<CameraView | null>;
  hasPermission: boolean | null;
  isReady: boolean;
  facing: CameraType;
  requestPermission: () => Promise<boolean>;
  toggleFacing: () => void;
}

export function useCamera(): UseCameraReturn {
  const cameraRef = useRef<CameraView>(null);
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [microphonePermission, requestMicrophonePermission] = useMicrophonePermissions();
  const [isReady, setIsReady] = useState(false);
  const [facing, setFacing] = useState<CameraType>('back');

  const hasPermission =
    cameraPermission?.granted === true && microphonePermission?.granted === true
      ? true
      : cameraPermission?.granted === false || microphonePermission?.granted === false
      ? false
      : null;

  const requestPermission = useCallback(async () => {
    const cameraResult = await requestCameraPermission();
    const micResult = await requestMicrophonePermission();

    const hasAll = cameraResult.granted && micResult.granted;
    return hasAll;
  }, [requestCameraPermission, requestMicrophonePermission]);

  const toggleFacing = useCallback(() => {
    setFacing((prev) => (prev === 'back' ? 'front' : 'back'));
  }, []);

  useEffect(() => {
    if (hasPermission) {
      setIsReady(true);
    }
  }, [hasPermission]);

  return {
    cameraRef,
    hasPermission,
    isReady,
    facing,
    requestPermission,
    toggleFacing,
  };
}
