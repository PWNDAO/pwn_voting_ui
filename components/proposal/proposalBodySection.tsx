import { Button, Card, CardCollapsible, DocumentParser, Heading } from "@aragon/gov-ui-kit";
import classNames from "classnames";

interface IBodySectionProps {
  body: string;
  isLoading?: boolean;
  onRetry?: () => void;
}

export const BodySection: React.FC<IBodySectionProps> = (props) => {
  const { body, isLoading = false, onRetry } = props;

  if (!body.trim() || body.trim() === "<p></p>") {
    return (
      <Card className="flex flex-col gap-y-3 p-6 shadow-neutral">
        <Heading size="h2">Proposal description</Heading>
        <p className="text-base leading-relaxed text-neutral-500" role="status">
          {isLoading
            ? "The original proposal text is being retrieved. You can already review the voting results and actions below."
            : "The original proposal text is currently unavailable. Voting results and on-chain actions are preserved below."}
        </p>
        {!isLoading && onRetry && (
          <Button size="sm" variant="secondary" onClick={onRetry} className="self-start">
            Try loading original text
          </Button>
        )}
      </Card>
    );
  }

  return (
    <CardCollapsible
      buttonLabelClosed="Expand description"
      buttonLabelOpened="Read less"
      collapsedSize="md"
      className="w-full shadow-neutral"
    >
      <div className="flex flex-col gap-y-4">
        <Heading size="h2">Proposal description</Heading>
        <hr className="border-neutral-100" />
        <DocumentParser document={body} className={proseClasses} />
      </div>
    </CardCollapsible>
  );
};

// Temporary until exported prose has been fixed
const proseClasses = classNames(
  "prose-p:text-base prose-p:md:text-lg", //prose-p
  //"prose-a:text-primary-500",
  // "prose-a:text-primary-400 prose-a:no-underline prose-a:hover:text-primary-500 prose-a:active:text-primary-800", // prose-a
  "prose-strong:text-neutral-800",
  // "prose-strong:text-base prose-strong:md:text-lg prose-strong:text-neutral-500", // prose-strong
  "prose-em:text-neutral-800", // em
  // "prose-em:text-base prose-em:md:text-lg prose-em:text-neutral-500", //em
  "prose-blockquote:border prose-blockquote:border-neutral-200 prose-blockquote:bg-neutral-50 prose-blockquote:prose-p-10 prose-blockquote:shadow-md", // blockquote
  "prose-pre:bg-neutral-900 prose-pre:text-neutral-50", //pre
  "prose-code:bg-neutral-900 prose-code:text-neutral-50 prose-code:text-sm prose-code:py-1 prose-code:px-1 prose-code:rounded prose-code:font-normal", //code
  "prose-img:overflow-hidden prose-img: prose-img:shadow-md", // img
  "prose-video:overflow-hidden prose-video: prose-video:shadow-md", // video
  "prose-hr:mt-10 prose-hr:border-neutral-200", // hr
  "prose-lead:text-neutral-600",
  "prose-headings:text-neutral-800 prose-headings:leading-tight text-neutral-500 prose-headings:font-normal"
);
