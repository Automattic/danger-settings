// Danger ignores Danger's imports at runtime and actually would give a build
// failure if we tried to use them here and then import this file. What authors
// should do, instead, is simply assume it's there.
//
// See https://danger.systems/js/usage/extending-danger.html#writing-your-plugin
//
// In order to write tests for these files, though, we need to define
// interfaces for the Danger functionalities we'll use. These don't affect
// runtime and do provide better dev-time typing experience.
//
// A richer example of this can be found here:
// https://github.com/orta/danger-plugin-yarn/blob/5e906e57331b952afced3f6e773ed6c68d5898c0/src/index.ts#L1-L8
import { DangerDSLType } from "../../node_modules/danger/distribution/dsl/DangerDSL"
declare var danger: DangerDSLType
export declare function warn(message: string): void

export async function checkMilestone() {
  // Create consts for everything we need from `danger` object as soon as possible
  // so it's not dropped during await operation
  const githubLabels = danger.github.issue.labels;
  const targetsDevelop = danger.github.pr.base.ref == "develop";
  const targetsRelease = danger.github.pr.base.ref.startsWith("release/");
  const currentPR = await danger.github.api.pulls.get(danger.github.thisPR);

  // Skip for draft PRs
  if (currentPR.data.draft) {
    return;
  }

  if (githubLabels.length != 0) {
    // Skip for PRs with "Releases" label
    const releases = githubLabels.some(label => label.name.includes("Releases"));
    if (releases) {
      return;
    }

    // Skip for PRs for wip features unless the PR is against "develop" or "release/x.x" branches
    const wipFeature = githubLabels.some(label => label.name.includes("Part of a WIP Feature"));
    if (!targetsDevelop && !targetsRelease && wipFeature) {
      return;
    }
  }

  // Warn if the PR doesn't have a milestone
  if (currentPR.data.milestone == null) {
    warn("PR is not assigned to a milestone.");
  }
};

// Not exactly sure why, but in order for the multiple files + import setup to
// work we need to split the export of this function and its declaration as the
// default export. I'm guessing it has to do with how TypeScript resolves
// these?
export default checkMilestone
