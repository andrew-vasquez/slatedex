import { useEffect, useState } from "react";
import { FiWifiOff } from "react-icons/fi";

export default function OfflineBanner() {
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    const goOffline = () => setIsOffline(true);
    const goOnline = () => setIsOffline(false);

    if (!navigator.onLine) setIsOffline(true);

    window.addEventListener("offline", goOffline);
    window.addEventListener("online", goOnline);
    return () => {
      window.removeEventListener("offline", goOffline);
      window.removeEventListener("online", goOnline);
    };
  }, []);

  if (!isOffline) return null;

  return (
    <div className="offline-banner" role="alert">
      <FiWifiOff size={13} />
      <span>You&apos;re offline — some features may be unavailable</span>
    </div>
  );
}
