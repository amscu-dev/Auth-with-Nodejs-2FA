import React from "react";
import SessionItem from "./SessionItem";
import client from "@/api/index";
import SessionItemSkeleton from "./SessionItemSkeleton";
interface CurrentSessionCardProps {}

const CurrentSessionCard: React.FC<CurrentSessionCardProps> = () => {
  const { data, isLoading } = client.Session.GetAll.useQuery();
  const currentSession = data?.data.sessions.filter(
    (session) => session.isCurrent
  )[0];

  if (isLoading) {
    return <SessionItemSkeleton />;
  }
  if (!currentSession) {
    return;
  }
  return (
    <SessionItem
      isCurrent={currentSession.isCurrent}
      browser={currentSession.userAgent.browser}
      os={currentSession.userAgent.os}
      platform={currentSession.userAgent.platform}
      version={currentSession.userAgent.version}
      userId={currentSession.userId}
      _id={currentSession._id}
    />
  );
};

export default CurrentSessionCard;
