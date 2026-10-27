import { Button, Card } from "@aragon/gov-ui-kit";
import { PleaseWaitSpinner } from "@/components/please-wait";

export function ProposalLoadState({ error }: { error?: Error | null }) {
  return (
    <Card className="w-full p-6">
      {error ? (
        <div className="flex flex-col items-start gap-y-3" role="alert">
          <p className="text-lg text-neutral-800">Unable to load this proposal</p>
          <p className="text-sm text-neutral-500">The network is currently unavailable. Please try again.</p>
          <Button size="sm" variant="secondary" onClick={() => window.location.reload()}>
            Try again
          </Button>
        </div>
      ) : (
        <div className="py-3" role="status">
          <PleaseWaitSpinner fullMessage="Loading proposal..." />
        </div>
      )}
    </Card>
  );
}
