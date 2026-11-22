import './globals.css';

export const metadata = {
  title: 'ZantaxiRide Admin',
  description: 'Mobile admin dashboard for ZantaxiRide prices, tours and safari packages',
  themeColor: '#f4f1ea',
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  viewportFit: 'cover',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
