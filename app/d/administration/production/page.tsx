import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import Link from "next/link"

export default function Page() {
  return (
    <div>
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-sm font-semibold">Production Areas</h1>
        <Link href={"#"}>
          <Button>
            <Plus /> Add Area
          </Button>
        </Link>
      </div>

      <div className="flex items-center justify-between gap-4">
        <h1 className="text-sm font-semibold">Production Lines</h1>
        <Link href={"#"}>
          <Button>
            <Plus /> Add Line
          </Button>
        </Link>
      </div>
    </div>
  )
}
