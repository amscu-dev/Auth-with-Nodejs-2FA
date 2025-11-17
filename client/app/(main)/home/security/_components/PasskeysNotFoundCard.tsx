import { GrFingerPrint } from "react-icons/gr";
import { MdImportantDevices } from "react-icons/md";
import { AiOutlineSafetyCertificate } from "react-icons/ai";
import Image from "next/image";
import PasskeyAddButton from "./PasskeyAddButton";
interface PasskeysNotFoundCardProps {
  refetchPasskeys: () => void;
}

const PasskeysNotFoundCard: React.FC<PasskeysNotFoundCardProps> = ({
  refetchPasskeys,
}) => {
  return (
    <div className="flex flex-col items-center justify-center  gap-6">
      <div className="place-self-center relative w-1/4 aspect-square">
        <Image fill alt="passkey not found logo" src="/passkey-image.svg" />
      </div>
      <div className="flex flex-col gap-3">
        <div className="grid grid-cols-[min-content_max-content] gap-y-1 gap-x-2">
          <span className="place-self-center">
            <GrFingerPrint className="text-xl text-muted-foreground/90" />
          </span>

          <p className="text-sm font-semibold tracking-tighter text-muted-foreground/90 justify-self-start place-self-center">
            Log in without password
          </p>
          <p className="col-start-2 font-normal text-muted-foreground/60 text-xs">
            Instead of a password, log in using your face or fingerprint.
          </p>
        </div>
        <div className="grid grid-cols-[min-content_max-content] gap-y-1 gap-x-2">
          <span className="place-self-center">
            <MdImportantDevices className="text-xl text-muted-foreground/90" />
          </span>
          <p className="text-sm font-semibold tracking-tighter text-muted-foreground/90 justify-self-start place-self-center">
            Works on all of your devices
          </p>
          <p className="col-start-2 font-normal text-muted-foreground/60 text-xs">
            Use your passkeys to log in from any synced device.
          </p>
        </div>
        <div className="grid grid-cols-[min-content_max-content] gap-y-1 gap-x-2">
          <span className="place-self-center">
            <AiOutlineSafetyCertificate className="text-xl text-muted-foreground/90" />
          </span>
          <p className="text-sm font-semibold tracking-tighter text-muted-foreground/90 justify-self-start place-self-center">
            Keep your account safer
          </p>
          <p className="col-start-2 font-normal text-muted-foreground/60 text-xs">
            Get better protection from online attacks like pishing.
          </p>
        </div>
      </div>
      <PasskeyAddButton
        buttonClass="w-full"
        refetchPasskeys={refetchPasskeys}
      />
    </div>
  );
};

export default PasskeysNotFoundCard;
