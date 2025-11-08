import * as Lucide from "lucide-react"

function toPascal(name: string) {
  return name
    .split(/[-_ ]+/g)
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
    .join("")
}

export function IconFromName({ icon, size = 14 }: { icon?: string; size?: number }) {
  const key = icon ? toPascal(icon) : ""
  const Cmp = (Lucide as Record<string, any>)[key] ?? Lucide.Tag
  return <Cmp size={size} />
}