import Image from "next/image";
import Link from "next/link";

const Footer = () => {
  return (
    <>
      <div className="container flex min-h-[72px] items-center justify-between border-t border-[#47a646] px-4 pb-3 pt-5 mt-10 lg:min-h-[72px] lg:px-0 lg:py-5">
        <Link href="/" className="flex items-center gap-2.5">
          <Image
            unoptimized
            src="/stocksnip-logo.png"
            alt="footer"
            width={128}
            height={128}
          />
        </Link>
        <div className="flex items-center gap-3">
          <Link href={"https://x.com/dillikahoon"} target="_blank">
            <Image
              unoptimized
              src="/img/x.svg"
              alt="twitter"
              width={15}
              height={15}
            />
          </Link>
          <Link href={"https://github.com/CPJ-N/stocksnip"} target="_blank">
            <Image
              unoptimized
              src={"/img/github-footer.svg"}
              alt="facebook"
              width={16}
              height={16}
            />{" "}
          </Link>
        </div>
      </div>
    </>
  );
};

export default Footer;
