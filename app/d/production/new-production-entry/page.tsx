import { Separator } from "@/components/ui/separator"
import { ProductionForm } from "@/forms/production.form"

export default function Page() {
  return (
    <section>
      <h1 className="font-semibold">New Production Entry</h1>
      <p className="text-xs">
        Please fill out the form below to record the details of a new production
        run. Only production runs from today and yesterday were allowed.
      </p>

      <Separator className="my-4" />

      <ProductionForm />
    </section>
  )
}
