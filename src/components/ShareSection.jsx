import { Share2 } from "lucide-react";

const ShareSection = () => {
  const handleShare = async () => {
    const shareData = {
      title: "My Website",
      text: "Check this out!",
      url: window.location.href,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData); // opens native apps list
      } else {
        // fallback (copy link)
        await navigator.clipboard.writeText(shareData.url);
        alert("Link copied to clipboard!");
      }
    } catch (err) {
      console.error("Error sharing:", err);
    }
  };

  return (
    <div className="relative z-10 max-w-5xl mx-auto mt-8 pt-5 flex flex-col items-center gap-2 text-xs  ">
      <span className="text-white/35">Share to your Near & Dear</span>

      <button
        onClick={handleShare}
        className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition"
      >
        <Share2 className="w-4 h-4" />
        Share
      </button>
    </div>
  );
};

export default ShareSection;