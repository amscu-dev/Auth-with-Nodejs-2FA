import React from "react";
import SessionItem from "./SessionItem";
import client from "@/services/index";
import SessionItemSkeleton from "./SessionItemSkeleton";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { FaRegFolderOpen } from "react-icons/fa6";
interface OtherSessionsCardProps {}

const OtherSessionsCard: React.FC<OtherSessionsCardProps> = () => {
  // SERVICES
  const { data, isLoading } = client.Session.GetAll.useQuery();

  const currentSession = data?.data.sessions.filter(
    (session) => !session.isCurrent
  );

  if (isLoading) {
    return (
      <div>
        <SessionItemSkeleton />
        <SessionItemSkeleton />
        <SessionItemSkeleton />
      </div>
    );
  }
  if (!currentSession || currentSession.length === 0) {
    return (
      <Empty>
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <FaRegFolderOpen />
          </EmptyMedia>
          <EmptyTitle className="font-mono text-sm">
            No Other Active Sessions
          </EmptyTitle>
          <EmptyDescription className="font-mono text-xs">
            You don&apos;t have any other active sessions at the moment.
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  return (
    <div className="basis-0 flex-grow overflow-y-auto min-h-0">
      {currentSession.map((session) => (
        <SessionItem
          key={session._id}
          isCurrent={session.isCurrent}
          browser={session.userAgent.browser}
          os={session.userAgent.os}
          platform={session.userAgent.platform}
          version={session.userAgent.version}
          userId={session.userId}
          _id={session._id}
        />
      ))}
    </div>
  );
};

export default OtherSessionsCard;
