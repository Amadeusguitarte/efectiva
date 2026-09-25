import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { iniciales } from "@/lib/formato";
import { cn } from "cn";

export function AvatarEquipo({
  nombre,
  avatarUrl,
  className,
}: {
  nombre: string;
  avatarUrl?: string | null;
  className?: string;
}) {
  return (
    <Avatar className={cn("size-6", className)} title={nombre}>
      {avatarUrl ? <AvatarImage src={avatarUrl} alt="" referrerPolicy="no-referrer" /> : null}
      <AvatarFallback className="bg-primary/10 text-[10px] font-semibold text-primary">
        {iniciales(nombre)}
      </AvatarFallback>
    </Avatar>
  );
}
