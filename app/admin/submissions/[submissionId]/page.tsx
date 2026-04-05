import AuthRequired from '@/components/auth/AuthRequired'
import SubmissionViewer from './SubmissionViewer'

interface SubmissionPageProps {
  params: {
    submissionId: string
  }
}

export default function SubmissionDetailPage({ params }: SubmissionPageProps) {
  return (
    <AuthRequired featureName="View Submission">
      <SubmissionViewer submissionId={params.submissionId} />
    </AuthRequired>
  )
}

