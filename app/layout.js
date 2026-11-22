import './globals.css';

export const metadata = {
  title: 'ZantaxiRide Admin',
  description: 'Mobile admin dashboard for ZantaxiRide prices, tours and safari packages',
  viewport: 'width=device-width, initial-scale=1, maximum-scale=1, viewport-fit=cover',
  themeColor: '#0b1220',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
