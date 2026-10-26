'use client';
import { useCallback, useEffect, useState } from 'react';

export type CurrentLocation = { latitude: number; longitude: number };

export function useCurrentLocation() {
  const [location, setLocation] = useState<CurrentLocation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const locate = useCallback(() => {
    if (!navigator.geolocation) {
      setError('이 브라우저에서는 현재 위치를 사용할 수 없어요.');
      setLoading(false);
      return;
    }
    setLoading(true);
    setError('');
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        setLocation({ latitude: coords.latitude, longitude: coords.longitude });
        setLoading(false);
      },
      () => {
        setError('현재 위치를 확인할 수 없어요. 위치 권한을 확인해 주세요.');
        setLoading(false);
      },
      { maximumAge: 60_000, timeout: 10_000 },
    );
  }, []);

  useEffect(() => { locate(); }, [locate]);

  return { location, loading, error, locate };
}
