import { useNavigate } from "react-router-dom";
import { JobForm } from "../../../components/jobs/JobForm";
import { useJobs } from "../../../context/JobsContext";

export default function JobCreate() {
  const { createJob } = useJobs();
  const navigate = useNavigate();

  return (
    <section className="jobs-page">
      <div className="jobs-header">
        <div>
          <h1 className="jobs-title">Create Job</h1>
          <p className="jobs-subtitle">Create a new repair job record</p>
        </div>
      </div>

      <JobForm
        submitLabel="Create Job"
        onSubmit={(values) => {
          const newJob = createJob(values);
          navigate(`/jobs/${newJob.id}`);
        }}
      />
    </section>
  );
}




