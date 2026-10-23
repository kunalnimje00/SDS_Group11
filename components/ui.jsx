import { ArrowUpRight, CircleAlert, Info, UtensilsCrossed } from "lucide-react";
import { labelStatus } from "@/lib/format";

export function DemoNotice({ children = "Preview mode · sample content only. No live cafe or account data is connected." }) {
  return (
    <div className="demo-notice" role="note">
      <Info size={15} aria-hidden="true" />
      <span>{children}</span>
    </div>
  );
}

export function PageHeading({ eyebrow, title, description, action }) {
  return (
    <div className="page-heading">
      <div>
        {eyebrow && <p className="eyebrow">{eyebrow}</p>}
        <h1>{title}</h1>
        {description && <p className="page-description">{description}</p>}
      </div>
      {action && <div className="page-heading-action">{action}</div>}
    </div>
  );
}

export function SectionHeading({ title, action, className = "" }) {
  return (
    <div className={`section-heading ${className}`}>
      <h2>{title}</h2>
      {action}
    </div>
  );
}

export function StatusPill({ status, children }) {
  const value = status || "pending";
  return (
    <span className={`status-pill status-${value}`} aria-label={`Status: ${labelStatus(value)}`}>
      {children || labelStatus(value)}
    </span>
  );
}

export function FoodPlaceholder({ name, index = 0, small = false }) {
  const shortName = (name || "Menu item")
    .split(" ")
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
  return (
    <div
      className={`food-placeholder food-tone-${index % 5}${small ? " food-placeholder-small" : ""}`}
      aria-label={`Illustrative placeholder for ${name}`}
      role="img"
    >
      <span className="food-placeholder-orbit" />
      <span className="food-placeholder-mark">
        <UtensilsCrossed size={small ? 17 : 23} strokeWidth={1.6} aria-hidden="true" />
      </span>
      <span className="food-placeholder-initials">{shortName}</span>
    </div>
  );
}

export function EmptyState({ icon: Icon = CircleAlert, title, description, action }) {
  return (
    <div className="empty-state">
      <div className="empty-state-icon">
        <Icon size={22} aria-hidden="true" />
      </div>
      <h2>{title}</h2>
      {description && <p>{description}</p>}
      {action && <div className="empty-state-action">{action}</div>}
    </div>
  );
}

export function TextLink({ href, children }) {
  return (
    <a className="text-link" href={href}>
      {children}
      <ArrowUpRight size={15} aria-hidden="true" />
    </a>
  );
}
