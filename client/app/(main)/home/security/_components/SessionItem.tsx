import React from "react";
import { FaChrome } from "react-icons/fa";
import { FaSafari } from "react-icons/fa";
import { FaFirefox } from "react-icons/fa";
import { FaBrave } from "react-icons/fa6";
import { FaEdge } from "react-icons/fa";
import { CgBrowser } from "react-icons/cg";
import { Button } from "@/components/ui/button";
import client from "@/api/index";
import { toast } from "sonner";
import { Loader } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

const browserIcons: Record<string, React.ElementType> = {
  Chrome: FaChrome,
  Safari: FaSafari,
  Firefox: FaFirefox,
  Brave: FaBrave,
  Edge: FaEdge,
};

interface SessionItemProps {
  isCurrent: boolean;
  browser: string;
  os: string;
  platform: string;
  version: string;
  userId: string;
  _id: string;
}

const SessionItem: React.FC<SessionItemProps> = ({
  isCurrent,
  browser,
  os,
  platform,
  version,
  _id,
}) => {
  const { mutate: removeSession, isPending: isRemovingSession } =
    client.Session.RemoveSession.useMutation();

  const queryClient = useQueryClient();
  const Icon = browserIcons[browser] || CgBrowser;

  // DISABED STATE
  const disabledState = isRemovingSession;
  const handleRemoveSession = async () => {
    await removeSession(
      { id: _id },
      {
        onSuccess: () => {
          toast.success("Session removed successfully.");
          queryClient.invalidateQueries({ queryKey: ["sessions"] });
        },
      }
    );
  };
  return (
    <div key={_id} className="flex p-2 pl-0">
      <div className="w-10 aspect-square bg-slate-200 flex items-center justify-center rounded-[10px] mr-2">
        <Icon className="text-2xl" />
      </div>
      <div className="mr-6">
        <p className="text-sm">
          <strong>Browser:</strong>{" "}
          <span className="font-mono text-muted-foreground/80">
            {browser} {version}
          </span>
        </p>
        <p className="text-sm">
          <strong>OS:</strong>{" "}
          <span className="font-mono text-muted-foreground/80">
            {os} ({platform})
          </span>
        </p>
      </div>
      <div className="flex items-center justify-center">
        {isCurrent ? (
          <span className="text-sm font-semibold text-green-600">
            🟢 Active
          </span>
        ) : (
          <Button
            className=""
            disabled={disabledState}
            onClick={handleRemoveSession}
          >
            {disabledState ? <Loader className="animate-spin" /> : "Logout"}
          </Button>
        )}
      </div>
    </div>
  );
};

export default SessionItem;
