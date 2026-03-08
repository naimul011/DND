import { useEffect } from 'react';
import { useRouter } from 'next/router';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/dnd');
  }, [router]);

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#1C1C1E',
      color: 'rgba(255,255,255,0.5)',
      fontSize: '14px',
    }}>
      Loading...
    </div>
  );
}
