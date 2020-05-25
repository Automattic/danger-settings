import {warn, danger} from "danger";

export async function checkMilestone() {
  // Warn if the issue doesn't have a milestone (PRs are issues too)
  const issue = await danger.github.api.issues.get(danger.github.thisPR);
  if (issue.data.milestone == null) {
    warn("PR is not assigned to a milestone.");
  }
};

// Not exactly sure why, but in order for the multiple files + import setup to
// work we need to split the export of this function and its declaration as the
// default export. I'm guessing it has to do with how TypeScript resolves
// these?
export default checkMilestone
