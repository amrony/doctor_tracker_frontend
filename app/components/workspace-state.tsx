import { Icon } from "./ui-icon";

export function WorkspaceState({ icon, title, description }: {
  icon: "doctors" | "patients" | "error";
  title: string;
  description: string;
}) {
  return (
    <section className="workspace-state">
      <span className="module-icon"><Icon name={icon} size={24} /></span>
      <h2>{title}</h2>
      <p>{description}</p>
    </section>
  );
}
