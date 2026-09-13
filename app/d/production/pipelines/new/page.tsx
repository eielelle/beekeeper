"use client"

import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { ProductionPipelineForm } from "@/forms/production-pipeline"

export default function Page() {
  return (
    <div className="space-y-4">
      <Card className="border-t-4 border-t-primary">
        <CardHeader>
          <CardTitle>Add New Pipeline</CardTitle>
          <CardDescription>
            Enter the details to create a new pipeline
          </CardDescription>
        </CardHeader>
      </Card>
      <ProductionPipelineForm />
    </div>
  )
}
