import { Flame } from "lucide-react";
import {
  FaInstagram,
  FaFacebook,
  FaYoutube,
  FaXTwitter,
} from "react-icons/fa6";
import { useTranslation } from "react-i18next";

export function Footer() {
  const { t } = useTranslation();

  const sections = [
    {
      title: t("footer.company_title"),
      links: t("footer.company_links", { returnObjects: true }) as string[],
    },
    {
      title: t("footer.partners_title"),
      links: t("footer.partners_links", { returnObjects: true }) as string[],
    },
    {
      title: t("footer.legal_title"),
      links: t("footer.legal_links", { returnObjects: true }) as string[],
    },
  ];

  return (
    <footer className="bg-[#0F172A] text-white">
      <div className="max-w-7xl mx-auto px-6 py-16">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-10 mb-12">
          {/* Brand */}
          <div className="col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "linear-gradient(135deg, #FF4500, #FF6B35)" }}>
                <Flame className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold">Savour</span>
            </div>
            <p className="text-gray-400 text-sm leading-relaxed mb-5 max-w-xs">
              {t("footer.about_savour")}
            </p>
            <div className="flex gap-3">
              {[FaXTwitter, FaInstagram, FaFacebook, FaYoutube].map((Icon, i) => (
                <a key={i} href="#" className="w-9 h-9 rounded-xl bg-white/10 hover:bg-[#FF4500]/30 flex items-center justify-center transition-colors">
                  <Icon className="w-4 h-4 text-gray-300" />
                </a>
              ))}
            </div>
          </div>

          {/* Links */}
          {sections.map((section) => (
            <div key={section.title}>
              <h4 className="text-sm font-semibold text-white mb-4">{section.title}</h4>
              <ul className="space-y-2.5">
                {section.links.map((link) => (
                  <li key={link}>
                    <a href="#" className="text-sm text-gray-400 hover:text-[#FF6B35] transition-colors">
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-gray-500 text-sm">
            {t("footer.copyright")}
          </p>
          <div className="flex gap-6">
            <span className="text-gray-500 text-sm">{t("footer.language")}</span>
            <span className="text-gray-500 text-sm">{t("footer.currency")}</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
