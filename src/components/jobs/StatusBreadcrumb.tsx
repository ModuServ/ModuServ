type StatusHistoryItem = {
  id: number;
  jobId: string;
  status: string;
  changedAt: string;
  changedBy: string;
};

type Props = {
  history: StatusHistoryItem[];
  currentStatus: string;
};

const STATUS_FLOW = [
  "New",
  "In Diagnosis",
  "Awaiting Repair",
  "In Progress",
  "Post Repair Device Check",
  "Pending Postage",
  "Ready For Collection",
  "Ready For Collection Unsuccessful",
  "Awaiting Customer Reply",
  "Awaiting Parts",
];

export function StatusBreadcrumb({ history, currentStatus }: Props) {
  return (
    <div className="status-breadcrumb-card">
      <div className="status-breadcrumb-wrapper">
        <div className="status-breadcrumb-track">
          {STATUS_FLOW.map((status, index) => {
            const historyItem = history.find((item) => item.status === status);
            const isCompleted = !!historyItem;
            const isCurrent = currentStatus === status;

            return (
              <div key={status} className="status-step">
                <div
                  className={[
                    "status-step__node",
                    isCompleted ? "status-step__node--completed" : "",
                    isCurrent ? "status-step__node--current" : "",
                  ].join(" ").trim()}
                  title={
                    historyItem
                      ? `${historyItem.changedBy} \u00b7 ${new Date(historyItem.changedAt).toLocaleString()}`
                      : status
                  }
                >
                  {isCompleted ? "?" : index + 1}
                </div>

                <div className="status-step__meta">
                  <div className="status-step__label">{status}</div>
                  {historyItem ? (
                    <div className="status-step__time">
                      {new Date(historyItem.changedAt).toLocaleString()}
                    </div>
                  ) : (
                    <div className="status-step__time">Pending</div>
                  )}
                </div>

                {index < STATUS_FLOW.length - 1 ? (
                  <div className="status-step__line" />
                ) : null}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
