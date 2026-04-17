import "./RepairHeader.css";

type Props = {
  selectedRole: string;
};

export default function RepairHeader({ selectedRole }: Props) {
  return (
    <div className="ms-repair-header">
      <div>
        <h1>Repair Tracking</h1>
        <p>Track live repair progress, notes, status transitions, and post-repair checks.</p>
        <span className="ms-repair-header__role">
          Current active role: <strong>{selectedRole}</strong>
        </span>
      </div>
    </div>
  );
}
