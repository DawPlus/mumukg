/** @type {import('next').NextConfig} */
const nextConfig = {
  // LAN IP(폰/다른 PC)로 dev 접속 시 /_next/hmr 등 개발 리소스 허용
  allowedDevOrigins: ['10.150.201.123', '192.168.0.16', '10.150.201.143'],
  // 개발 모드 구석 Next 버튼 숨김 (에러 오버레이는 유지)
  devIndicators: false,
};

export default nextConfig;
