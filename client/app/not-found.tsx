import BackgroundGradient from "@/components/background/BackgroundGradient";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import Image from "next/image";
import Link from "next/link";
import React from "react";

const NotFoundPage = () => {
  return (
    <div className="w-full h-full flex items-center justify-center px-6">
      <BackgroundGradient />
      <Card className="w-full max-w-xl">
        <Empty className="p-8 md:p-8 md:pt-0">
          <EmptyHeader>
            <EmptyMedia className="relative bg-transparent w-64 aspect-square">
              <Image
                fill
                src="/404-image.svg"
                alt="404 logo"
                className="object-contain"
              />
            </EmptyMedia>
            <EmptyTitle className="text-2xl font-semibold tracking-wider flex items-center justify-center gap-4">
              Page not found
            </EmptyTitle>
            <EmptyDescription>
              Sorry, the page you are looking for cannot be found. Please check
              the URL or try navigating back to the homepage.
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button asChild className="w-full max-w-52">
              <Link href="/">Go back to home page</Link>
            </Button>
          </EmptyContent>
        </Empty>
      </Card>
    </div>
  );
};

export default NotFoundPage;
