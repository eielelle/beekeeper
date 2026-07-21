import { bee } from "@lucide/lab"
import { Icon } from "lucide-react"

export default function Logo() {
  return (
    <span className="flex items-center gap-2 bg-primary p-1">
      <Icon iconNode={bee} size={16} />{" "}
      <span className="font-semibold">beekeeper</span>
    </span>
  )
}
