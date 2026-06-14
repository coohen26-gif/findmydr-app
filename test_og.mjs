import { ImageResponse } from 'next/og';

try {
  const r = new ImageResponse(
    React.createElement('div', { style: { width: 200, height: 200, background: 'red', display: 'flex', color: 'white', fontSize: 40 } }, 'HELLO'),
    { width: 200, height: 200 }
  );
  const buf = await r.arrayBuffer();
  console.log('OK type:', typeof r, 'size:', buf.byteLength);
} catch (e) {
  console.error('ERR:', e?.message || e);
  console.error('Stack:', e?.stack);
}
