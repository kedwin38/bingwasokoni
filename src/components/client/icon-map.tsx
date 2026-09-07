import { Wifi, Phone, MessageSquare, Gift, Package as PackageIcon } from "lucide-react";

export function CategoryIcon({ icon, size = 16 }: { icon: string | null; size?: number }) {
  switch (icon) {
    case "wifi":
      return <Wifi size={size} />;
    case "phone":
      return <Phone size={size} />;
    case "message-square":
      return <MessageSquare size={size} />;
    case "gift":
      return <Gift size={size} />;
    default:
      return <PackageIcon size={size} />;
  }
}
