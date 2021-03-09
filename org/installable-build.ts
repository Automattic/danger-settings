import { Status } from "github-webhook-event-types";
import fetch from "node-fetch";
import * as path from "path";
import * as url from "url";

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
import { DangerDSLType } from "../node_modules/danger/distribution/dsl/DangerDSL";
declare var danger: DangerDSLType;
export declare function warn(message: string): void;

const CIRCLECI_TOKEN: string | undefined = process.env["CIRCLECI_TOKEN"];
const PERIL_BOT_USER_ID: number = parseInt(
  process.env["PERIL_BOT_USER_ID"] || '10',
  10
);
// This is a list of the CircleCI statuses to process
const HOLD_CONTEXTS: string[] = ["ci/circleci: Installable Build/Hold"];
const INSTALLABLE_BUILD_CONTEXTS: string[] = [
  "ci/circleci: Installable Build",
  "ci/circleci: Test Android on Device",
];

export async function installableBuild(status: Status) {
  if (status.state == "pending" && HOLD_CONTEXTS.includes(status.context)) {
    await markStatusAsSuccess(status);
    await createOrUpdateComment(
      status,
      `You can trigger an installable build for these changes by visiting CircleCI [here](${status.target_url}).`
    );
  } else if (
    status.state == "success" &&
    INSTALLABLE_BUILD_CONTEXTS.includes(status.context)
  ) {
    const commentBody = await getDownloadCommentText(status);
    if (commentBody === undefined) {
      return console.log(
        `Could not find a comment.json or .apk file for the installable build.`
      );
    }
    await createOrUpdateComment(status, commentBody);
  } else {
    return console.log(
      `Not a status we want to process for installable builds - got '${status.context}' (${status.state})`
    );
  }
}

async function markStatusAsSuccess(status: any) {
  console.log(`Updating ${status.context} state to be success`);

  const owner = status.repository.owner.login;
  const repo = status.repository.name;

  const api = danger.github.api;
  await api.repos.createStatus({
    owner: owner,
    repo: repo,
    context: status.context,
    description: status.description,
    sha: status.sha,
    state: "success",
    target_url: status.target_url,
  });
}

async function getPRsWithStatus(status: any) {
  const api = danger.github.api;

  // See https://github.com/maintainers/early-access-feedback/issues/114 for more context on getting a PR from a SHA
  const repoString = status.repository.full_name;
  const searchResponse = await api.search.issuesAndPullRequests({
    q: `${status.commit.sha} type:pr is:open repo:${repoString}`,
  });

  // https://developer.github.com/v3/search/#search-issues
  const prsWithCommit = searchResponse.data.items.map(
    (i: any) => i.number
  ) as number[];
  if (prsWithCommit.length === 0) {
    console.log(`No open PR found for this commit ${status.commit.sha}`);
    return [];
  }
  return prsWithCommit;
}

export async function createOrUpdateComment(status: any, message: string) {
  const api = danger.github.api;
  const owner = status.repository.owner.login;
  const repo = status.repository.name;

  // Add a prefix to our comment so we can easily find/update it later.
  const commentPrefix = "<!--- Installable Build Comment --->";
  const commentBody = `${commentPrefix}\n${message}`;

  // Since a commit can be on more than one PR, find all PRs that have this commit
  const prsWithStatus = await getPRsWithStatus(status);
  for (const number of prsWithStatus) {
    const pull = await api.pulls.get({ owner, repo, number });
    if (pull.data.head.sha !== status.commit.sha) {
      console.log(
        `${status.commit.sha} is not the latest commit on PR ${number}, skipping comment`
      );
      continue;
    }

    const allComments = await api.issues.listComments({ owner, repo, number });

    const existingComment = allComments.data.find(
      (comment) =>
        comment.user.id === PERIL_BOT_USER_ID &&
        comment.body.includes(commentPrefix)
    );
    let commentResult;
    if (existingComment !== undefined) {
      commentResult = await api.issues.updateComment({
        owner,
        repo,
        comment_id: existingComment.id,
        body: commentBody,
      });
    } else {
      commentResult = await api.issues.createComment({
        owner,
        repo,
        number,
        body: commentBody,
      });
    }

    console.log(
      `Installable build comment posted to ${commentResult.data.html_url}`
    );
  }
}

async function circleCIArtifacts(status: any): Promise<any[]> {
  // CircleCI URLs look like https://circleci.com/gh/:org/:repo/12345?some=query'
  // We need to extract the build number
  const urlPath = url.parse(status.target_url).pathname; // Gives the /gh/:org/:repo/12345 portion

  // urlPath is `string | null`, and we can't use it as `null` when parsing it
  if (urlPath === null) {
    return []
  }
  const buildNumber = parseInt(path.parse(urlPath).base);

  const owner = status.repository.owner.login;
  const repo = status.repository.name;

  if (CIRCLECI_TOKEN === undefined) {
    // TODO: probably should throw here
    return []
  }

  const artifactsUrl = `https://circleci.com/api/v1.1/project/gh/${owner}/${repo}/${buildNumber}/artifacts?circle-token=${CIRCLECI_TOKEN as string}`;

  const res = await fetch(artifactsUrl);
  if (res.ok) {
    return res.json();
  }
  return [];
}

async function getDownloadCommentText(status: any) {
  const artifacts = await circleCIArtifacts(status);

  const commentJsonArtifact = artifacts.find((artifact) =>
    artifact.path.endsWith("comment.json")
  );
  // TODO: probably should throw here if the token is not available
  if (commentJsonArtifact && CIRCLECI_TOKEN !== undefined) {
    // Download the JSON file so we can get the comment text
    const commentJsonArtifactUrl = `${commentJsonArtifact.url}?circle-token=${CIRCLECI_TOKEN as string}`;
    const res = await fetch(commentJsonArtifactUrl);
    if (res.ok) {
      const comment = await res.json();
      return comment.body;
    } else {
      console.log(
        `Error while trying to download comment.json: ${res.statusText}`
      );
    }
  }

  const apkArtifact = artifacts.find((artifact) =>
    artifact.path.endsWith(".apk")
  );
  if (apkArtifact) {
    return `You can test the changes on this Pull Request by downloading the APK [here](${apkArtifact.url}).`;
  }
  return undefined;
}

// Not exactly sure why, but in order for the multiple files + import setup to
// work we need to split the export of this function and its declaration as the
// default export. I'm guessing it has to do with how TypeScript resolves
// these?
export default installableBuild;
