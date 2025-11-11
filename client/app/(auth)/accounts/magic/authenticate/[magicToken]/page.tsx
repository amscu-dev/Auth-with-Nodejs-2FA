import MagicLinkAuthenticateCard from "./_components/MagicLinkAuthenticateCard";

interface MagicLinkAuthenticatePageProps {}

const MagicLinkAuthenticatePage: React.FC<
  MagicLinkAuthenticatePageProps
> = () => {
  return (
    <div className="w-full h-full flex items-center justify-center px-2 bg-black">
      <MagicLinkAuthenticateCard />
    </div>
  );
};

export default MagicLinkAuthenticatePage;
