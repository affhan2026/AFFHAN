"use client";

import { Footer } from "@/components/ui/footer";

function InstagramIcon() {
  return (
    <svg
      aria-hidden="true"
      className="h-5 w-5"
      fill="none"
      viewBox="0 0 24 24"
    >
      <defs>
        <linearGradient id="instagram-gradient" x1="4" x2="20" y1="20" y2="4">
          <stop stopColor="#feda75" />
          <stop offset="0.32" stopColor="#fa7e1e" />
          <stop offset="0.62" stopColor="#d62976" />
          <stop offset="1" stopColor="#4f5bd5" />
        </linearGradient>
      </defs>
      <rect height="17" rx="5" stroke="url(#instagram-gradient)" strokeWidth="2" width="17" x="3.5" y="3.5" />
      <circle cx="12" cy="12" r="3.6" stroke="url(#instagram-gradient)" strokeWidth="2" />
      <circle cx="17" cy="7" fill="#d62976" r="1.2" />
    </svg>
  );
}

function LinkedinIcon() {
  return (
    <svg
      aria-hidden="true"
      className="h-5 w-5"
      fill="#0A66C2"
      viewBox="0 0 24 24"
    >
      <path d="M19 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2ZM8.34 18H5.67v-8.6h2.67V18ZM7 8.23a1.55 1.55 0 1 1 0-3.1 1.55 1.55 0 0 1 0 3.1ZM18.33 18h-2.66v-4.18c0-1-.02-2.28-1.39-2.28-1.39 0-1.6 1.08-1.6 2.2V18h-2.66v-8.6h2.55v1.18h.04c.36-.68 1.23-1.39 2.52-1.39 2.69 0 3.2 1.77 3.2 4.08V18Z" />
    </svg>
  );
}

function YouTubeIcon() {
  return (
    <svg
      aria-hidden="true"
      className="h-5 w-5"
      fill="none"
      viewBox="0 0 24 24"
    >
      <path d="M21.58 7.19a2.74 2.74 0 0 0-1.93-1.94C17.95 4.8 12 4.8 12 4.8s-5.95 0-7.65.45a2.74 2.74 0 0 0-1.93 1.94A28.5 28.5 0 0 0 2 12a28.5 28.5 0 0 0 .42 4.81 2.74 2.74 0 0 0 1.93 1.94c1.7.45 7.65.45 7.65.45s5.95 0 7.65-.45a2.74 2.74 0 0 0 1.93-1.94A28.5 28.5 0 0 0 22 12a28.5 28.5 0 0 0-.42-4.81Z" fill="#FF0000" />
      <path d="m10.2 15.2 5.2-3.2-5.2-3.2v6.4Z" fill="white" />
    </svg>
  );
}

function FacebookIcon() {
  return (
    <svg
      aria-hidden="true"
      className="h-5 w-5"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle cx="12" cy="12" fill="#1877F2" r="10" />
      <path d="M14.64 12.58h-1.74V19h-2.66v-6.42H8.9v-2.26h1.34V8.86c0-1.11.53-2.86 2.86-2.86l2.1.01v2.34h-1.52c-.25 0-.78.13-.78.85v1.12h2.25l-.51 2.26Z" fill="white" />
    </svg>
  );
}

function ChevronIcon() {
  return (
    <span aria-hidden="true" className="text-[#3cd5f7] font-bold text-base">
      ›
    </span>
  );
}

const usefulLinks = [
  { label: "Home", href: "/#home" },
  { label: "Explore Products", href: "/categories" },
  { label: "About Us", href: "/about" },
  { label: "Contact Us", href: "/contact" },
  { label: "Privacy Policy", href: "/privacy-policy" },
  { label: "Terms & Conditions", href: "/terms-conditions" },
];

const socialLinks = [
  { label: "Free Consultation", href: "#", icon: <ChevronIcon /> },
  { label: "Product Sourcing", href: "#", icon: <ChevronIcon /> },
  { label: "Freight Forwarding", href: "#", icon: <ChevronIcon /> },
  { label: "End to End Service", href: "#", icon: <ChevronIcon /> },
];

export function FooterSection() {
  const handleNewsletterSubscribe = async () => {
    await new Promise((resolve) => {
      window.setTimeout(resolve, 700);
    });

    return true;
  };

  return (
    <section id="contact" className="flex w-full lg:snap-start flex-col bg-[#245B6D]">
      <Footer
        logoSrc="/images/logo.png"
        companyName="AFFHAN GROUP"
        description="Affhan group is an import and export sourcing company valued by its clients and partners in the industry for its high end professional expertise and services. It is headquartered in Guangzhou with offices in China, London, India, Singapore, Malaysia, France and Dubai."
        companyEmail="enquiry@affhan.com"
        usefulLinksTitle="QUICK LINKS"
        usefulLinks={usefulLinks}
        socialTitle="SERVICES"
        socialLinks={socialLinks}
        contactTitle="AFFHAN INTERNATIONAL PVT LTD"
              contactLines={
                <>
                  <p>
                    No.69/46, Appavoo Tower, West Madha Church Road Near by Harbour
                    Gate No : 3, Royapuram, Chennai - 600 013
                  </p>
                  <p className="mt-4">TAMIL NADU, INDIA</p>
                  <p className="mt-4">
                    <span className="font-semibold text-[#3cd5f7]">Office:</span>{" "}
                    044 - 4743 2777
                  </p>
                  <p className="mt-4">
                    <span className="font-semibold text-[#3cd5f7]">Email:</span>{" "}
                    info@affhan.com
                  </p>
                </>
              }
              onSubscribe={handleNewsletterSubscribe}
              className="border-t border-white/10"
            />

      <div className="border-t border-white/10 bg-[#19414e]">
        <div className="mx-auto flex w-full max-w-[1440px] flex-col gap-3 px-6 py-4 text-xs text-slate-200/80 sm:flex-row sm:items-center sm:justify-between sm:px-8 lg:px-14">
          <p>Copyright &copy; 2026 Affhan. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <a
              href="https://www.instagram.com/affhanshipping?utm_source=ig_web_button_share_sheet&igsh=ZDNlZDc0MzIxNw=="
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Instagram"
              className="transition-transform hover:scale-110"
            >
              <InstagramIcon />
            </a>
            <a
              href="https://youtube.com/@affhanshipping?si=MZiXp-zFFDKqVy9e"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="YouTube"
              className="transition-transform hover:scale-110"
            >
              <YouTubeIcon />
            </a>
            <a
              href="https://www.linkedin.com/company/affhan-shipping/"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="LinkedIn"
              className="transition-transform hover:scale-110"
            >
              <LinkedinIcon />
            </a>
            <a
              href="https://www.facebook.com/affhaninternational/"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Facebook"
              className="transition-transform hover:scale-110"
            >
              <FacebookIcon />
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
