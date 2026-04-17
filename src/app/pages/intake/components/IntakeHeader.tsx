import "./IntakeHeader.css";

type Props = {
  selectedRole: string;
};

export default function IntakeHeader({ selectedRole }: Props) {
  return (
    <div className="ms-intake-header">
      <div>
        <h1>Customer Intake</h1>
        <p>Create a new connected job intake record.</p>
        <span className="ms-intake-header__role">
          Current active role: <strong>{selectedRole}</strong>
        </span>
      </div>
    </div>
  );
}
