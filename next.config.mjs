/** @type {import('next').NextConfig} */
const nextConfig = {
  // LAN IP가 바뀌어도 개발 리소스에 접근할 수 있도록 사설 IPv4 대역을 허용
  allowedDevOrigins: ['10.*.*.*', '192.168.*.*'],
  // 개발 모드 구석 Next 버튼 숨김 (에러 오버레이는 유지)
  devIndicators: false,
};

export default nextConfig;
