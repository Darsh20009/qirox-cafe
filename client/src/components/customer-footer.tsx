import { useTranslation } from "react-i18next";

export function CustomerFooter() {
  const { t } = useTranslation();
  
  return (
    <footer className="bg-muted/30 py-8 border-t mb-16">
      <div className="container px-4 flex flex-col items-center gap-6">
        <a 
          href="https://qr.saudibusiness.gov.sa/viewcr?nCrNumber=9AhyCS491ZPTmJxSxD96YA==" 
          target="_blank" 
          rel="noreferrer" 
          className="flex flex-col items-center gap-2 hover:scale-110 transition-transform text-center"
        >
          <img 
            src="https://assets.zid.store/themes/f9f0914d-3c58-493b-bd83-260ed3cb4e82/business_center.png" 
            loading="lazy" 
            alt="Saudi Business Center Certification" 
            className="h-12 w-auto object-contain" 
          />
          <div className="text-xs text-muted-foreground font-semibold">{t("legal.cr")}</div>
        </a>
        <div className="flex flex-col items-center gap-1">
          <div className="text-sm font-bold text-primary">{t("legal.vat")}</div>
        </div>
        <div className="text-[10px] text-muted-foreground/60 text-center">
          &copy; {new Date().getFullYear()} CLUNY CAFE. {t("legal.rights")}
        </div>
      </div>
    </footer>
  );
}
