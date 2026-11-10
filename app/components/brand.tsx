import { Icon } from "./ui-icon";

export function Brand() {
  return (
    <div className="brand">
      <span className="brand-mark"><Icon name="brand" size={23} /></span>
      <span>Doctor Tracker</span>
    </div>
  );
}
