import {warn, danger} from "danger";

export async function checkLabel() {
  const labels = danger.github.issue.labels;

  // Warn if the issue doesn't have any labels (PRs are issues too)
  if (danger.github.issue.labels.length == 0) {
    warn("PR is missing at least one label.");
  }
};

// Not exactly sure why, but in order for the multiple files + import setup to
// work we need to split the export of this function and its declaration as the
// default export. I'm guessing it has to do with how TypeScript resolves
// these?
export default checkLabel
