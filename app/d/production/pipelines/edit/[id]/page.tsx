// app/pipelines/edit/[id]/page.tsx
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { ProductionPipelineForm } from "@/forms/production-pipeline"

interface EditPipelinePageProps {
  params: Promise<{
    id: string
  }>
}

export default async function EditPipelinePage({
  params,
}: EditPipelinePageProps) {
  const { id } = await params

  return (
    <div className="space-y-4">
      <Card className="border-t-4 border-t-primary">
        <CardHeader>
          <CardTitle>Edit Pipeline</CardTitle>
          <CardDescription>
            Update the details and sequence steps of your pipeline
          </CardDescription>
        </CardHeader>
      </Card>

      <Card>
        <CardContent>
          <ProductionPipelineForm editId={id} />
        </CardContent>
      </Card>
    </div>
  )
}
