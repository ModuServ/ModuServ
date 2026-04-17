import "./SiteSwitcher.css";
import { ChevronDown, MapPin } from "lucide-react";
import { useState } from "react";
import { useSite } from "../../../context/SiteContext";
import { useRolePermissions } from "../../hooks/useRolePermissions";

export default function SiteSwitcher() {
  const { canAccessSiteSwitcher = true } = useRolePermissions();
  const { sites, selectedSite, selectedSiteId, setSelectedSiteId } = useSite();
  const [open, setOpen] = useState(false);

  if (!canAccessSiteSwitcher) {
    return null;
  }

  return (
    <div className="ms-site-switcher">
      <button
        type="button"
        className="ms-site-switcher__toggle"
        onClick={() => setOpen((prev) => !prev)}
      >
        <span className="ms-site-switcher__left">
          <MapPin size={16} />
          <span>{selectedSite.name}</span>
        </span>
        <ChevronDown size={16} className={open ? "is-open" : ""} />
      </button>

      {open ? (
        <div className="ms-site-switcher__menu">
          {sites.map((site) => (
            <button
              key={site.id}
              type="button"
              className={`ms-site-switcher__item ${selectedSiteId === site.id ? "is-active" : ""}`}
              onClick={() => {
                setSelectedSiteId(site.id);
                setOpen(false);
              }}
            >
              {site.name}
              {selectedSiteId === site.id ? " · Active" : ""}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
