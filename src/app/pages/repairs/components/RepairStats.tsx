import "./RepairStats.css";
import { ClipboardCheck, Wrench } from "lucide-react";

type Props = {
  total: number;
  inProgress: number;
  postRepair: number;
  ready: number;
};

export default function RepairStats({
  total,
  inProgress,
  postRepair,
  ready,
}: Props) {
  return (
    <div className="ms-repair-stats">
      <article className="ms-repair-stats__card">
        <div className="ms-repair-stats__icon">
          <Wrench size={18} />
        </div>
        <div>
          <span>Total Repairs</span>
          <strong>{total}</strong>
        </div>
      </article>

      <article className="ms-repair-stats__card">
        <div className="ms-repair-stats__icon">
          <Wrench size={18} />
        </div>
        <div>
          <span>In Progress</span>
          <strong>{inProgress}</strong>
        </div>
      </article>

      <article className="ms-repair-stats__card">
        <div className="ms-repair-stats__icon">
          <ClipboardCheck size={18} />
        </div>
        <div>
          <span>Post Repair Check</span>
          <strong>{postRepair}</strong>
        </div>
      </article>

      <article className="ms-repair-stats__card">
        <div className="ms-repair-stats__icon">
          <ClipboardCheck size={18} />
        </div>
        <div>
          <span>Ready For Collection</span>
          <strong>{ready}</strong>
        </div>
      </article>
    </div>
  );
}
