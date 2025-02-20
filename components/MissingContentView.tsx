import { Button, IllustrationHuman } from "@aragon/gov-ui-kit";
import { type ReactNode } from "react";
import NextImage from "next/image";

export const MissingContentView = ({
  children,
  callToAction,
  onClick,
  img,
  isLoading,
}: {
  children: ReactNode;
  callToAction?: string;
  onClick?: () => any;
  img?: string;
  isLoading?: boolean;
}) => {
  if (!callToAction) {
    return (
      <div className="w-full">
        <p className="text-md text-neutral-400">{children}</p>
        {img ? <NextImage className="mx-auto my-8 max-w-96" unoptimized={true} width={200} height={100} src={img} alt="Missing content" /> : <Illustration />}
      </div>
    );
  }

  return (
    <div className="w-full">
      <p className="text-md text-neutral-400">{children}</p>
      {img ? <NextImage className="mx-auto my-8 max-w-96" unoptimized={true} width={200} height={100} src={img} alt="Missing content" /> : <Illustration />}
      <div className="flex justify-center">
        <Button size="md" variant="secondary" isLoading={!!isLoading} onClick={onClick ? onClick : () => {}}>
          <span>{callToAction}</span>
        </Button>
      </div>
    </div>
  );
};

function Illustration() {
  return <IllustrationHuman className="mx-auto my-8 max-w-96" body="VOTING" expression="SMILE_WINK" hairs="CURLY" />;
}
